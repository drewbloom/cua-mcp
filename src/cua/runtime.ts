import { createCua } from '@langchain/langgraph-cua';
import { randomUUID } from 'node:crypto';
import type { CuaEnvironment, CuaEvent, CuaRecipe, CuaRunInput, CuaRunRecord } from './types.js';
import { config } from '../config.js';
import { runOpenAiComputerLoop } from './openaiComputerLoop.js';
import OpenAI from 'openai';
import { cuaRepository } from '../db/cuaRepository.js';

function nowIso(): string {
  return new Date().toISOString();
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return variables[key] ?? '';
  });
}

export class CuaRuntime {
  private runs = new Map<string, CuaRunRecord>();
  private recipes = new Map<string, CuaRecipe>();

  private usesPostgres(): boolean {
    return config.persistence === 'postgres';
  }

  private async persistRun(run: CuaRunRecord): Promise<void> {
    if (!this.usesPostgres()) return;
    await cuaRepository.upsertRun(run);
  }

  private async persistRecipe(recipe: CuaRecipe): Promise<void> {
    if (!this.usesPostgres()) return;
    await cuaRepository.saveRecipe(recipe);
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isInterrupted(runId: string): boolean {
    return this.runs.get(runId)?.status === 'interrupted';
  }

  private async waitForApprovalDecision(runId: string): Promise<'approved' | 'declined' | 'interrupted'> {
    while (true) {
      const current = this.runs.get(runId);
      if (!current) return 'interrupted';
      if (current.status === 'interrupted') return 'interrupted';
      if (current.status !== 'awaiting_approval') return 'approved';

      const lastApprovalEvent = [...current.events]
        .reverse()
        .find((event) => event.type === 'approval_response');

      if (lastApprovalEvent?.payload?.approved === false) {
        return 'declined';
      }
      if (lastApprovalEvent?.payload?.approved === true) {
        return 'approved';
      }

      await this.sleep(300);
    }
  }

  private containsApprovalSignal(update: unknown): boolean {
    const text = JSON.stringify(update).toLowerCase();
    return text.includes('approve_action') || text.includes('approval_required') || text.includes('awaiting_approval');
  }

  private containsInterruptSignal(update: unknown): boolean {
    const text = JSON.stringify(update).toLowerCase();
    return text.includes('_interrupt') || text.includes('interrupt_requested') || text.includes('agent_interrupt');
  }

  async startRun(input: CuaRunInput): Promise<CuaRunRecord> {
    const id = randomUUID();
    const timestamp = nowIso();

    const run: CuaRunRecord = {
      id,
      status: 'queued',
      input,
      createdAt: timestamp,
      updatedAt: timestamp,
      events: [],
    };

    this.runs.set(id, run);
    await this.persistRun(run);
    void this.executeRun(id, input);
    return run;
  }

  async getRun(runId: string): Promise<CuaRunRecord | undefined> {
    const inMemory = this.runs.get(runId);
    if (inMemory) return inMemory;
    if (!this.usesPostgres()) return undefined;

    const persisted = await cuaRepository.getRun(runId);
    if (persisted) {
      this.runs.set(persisted.id, persisted);
    }
    return persisted;
  }

  async listRuns(): Promise<CuaRunRecord[]> {
    if (this.usesPostgres()) {
      const runs = await cuaRepository.listRuns();
      for (const run of runs) {
        this.runs.set(run.id, run);
      }
      return runs;
    }
    return [...this.runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async interruptRun(runId: string, reason: string, source: 'user' | 'agent' = 'user'): Promise<CuaRunRecord | undefined> {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    this.pushEvent(run, 'interrupt_requested', { reason, source });
    this.pushEvent(run, 'interrupt_handoff_required', {
      runId,
      source,
      reason,
      action: 'user_or_agent_intervention_required',
    });
    run.status = 'interrupted';
    run.updatedAt = nowIso();
    this.runs.set(run.id, run);
    await this.persistRun(run);
    return run;
  }

  async approveAction(runId: string, approved: boolean, note?: string): Promise<CuaRunRecord | undefined> {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    this.pushEvent(run, 'approval_response', { approved, note: note || '' });
    if (approved && run.status === 'awaiting_approval') {
      run.status = 'running';
      this.pushEvent(run, 'approval_resumed', { runId });
    }
    if (!approved) {
      run.status = 'interrupted';
      this.pushEvent(run, 'approval_declined_interrupt', { runId, note: note || '' });
    }
    run.updatedAt = nowIso();
    this.runs.set(run.id, run);
    await this.persistRun(run);
    return run;
  }

  async saveRecipe(name: string, promptTemplate: string, description?: string): Promise<CuaRecipe> {
    const recipe: CuaRecipe = {
      id: randomUUID(),
      name,
      description,
      promptTemplate,
      createdAt: nowIso(),
    };
    this.recipes.set(recipe.id, recipe);
    await this.persistRecipe(recipe);
    return recipe;
  }

  async getRecipe(recipeId: string): Promise<CuaRecipe | undefined> {
    const inMemory = this.recipes.get(recipeId);
    if (inMemory) return inMemory;
    if (!this.usesPostgres()) return undefined;

    const persisted = await cuaRepository.getRecipe(recipeId);
    if (persisted) {
      this.recipes.set(persisted.id, persisted);
    }
    return persisted;
  }

  async listRecipes(): Promise<CuaRecipe[]> {
    if (this.usesPostgres()) {
      const recipes = await cuaRepository.listRecipes();
      for (const recipe of recipes) {
        this.recipes.set(recipe.id, recipe);
      }
      return recipes;
    }
    return [...this.recipes.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async preflightModelAccess(): Promise<{ ok: boolean; engine: string; model: string; detail: string }> {
    if (config.cuaEngine !== 'openai-responses') {
      return {
        ok: true,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: 'Preflight check is currently implemented for openai-responses engine.',
      };
    }

    if (!config.openAiApiKey) {
      return {
        ok: false,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: 'OPENAI_API_KEY is missing.',
      };
    }

    try {
      const client = new OpenAI({ apiKey: config.openAiApiKey });
      await client.responses.create({
        model: config.cuaModel,
        input: 'preflight ping',
        tools: [{ type: 'computer' }],
      } as any);

      return {
        ok: true,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: 'Model accepted a minimal Responses API request.',
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: message,
      };
    }
  }

  async runRecipe(recipeId: string, variables: Record<string, string>, options?: { systemPrompt?: string; authStateId?: string; environment?: CuaEnvironment }): Promise<CuaRunRecord | undefined> {
    const recipe = await this.getRecipe(recipeId);
    if (!recipe) return undefined;

    const task = applyTemplate(recipe.promptTemplate, variables);
    return await this.startRun({
      task,
      systemPrompt: options?.systemPrompt,
      authStateId: options?.authStateId,
      environment: options?.environment,
    });
  }

  private async executeRun(runId: string, input: CuaRunInput): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    run.status = 'running';
    run.updatedAt = nowIso();
    this.pushEvent(run, 'run_started', {
      environment: input.environment || 'web',
      authStateId: input.authStateId || null,
      engine: config.cuaEngine,
      model: config.cuaModel,
    });
    await this.persistRun(run);

    try {
      if (config.cuaEngine === 'openai-responses') {
        const requestedEnvironment = input.environment || 'web';
        if (requestedEnvironment !== 'web') {
          this.pushEvent(run, 'environment_overridden', {
            requestedEnvironment,
            effectiveEnvironment: 'web',
            reason: 'openai-responses engine currently supports web only',
          });
          input.environment = 'web';
        }

        const result = await runOpenAiComputerLoop(
          run,
          (targetRun, type, payload) => this.pushEvent(targetRun, type, payload),
          async (id) => this.waitForApprovalDecision(id),
          (id) => this.isInterrupted(id),
        );

        if (this.isInterrupted(run.id)) {
          this.pushEvent(run, 'run_stopped_after_interrupt', {});
          this.runs.set(run.id, run);
          return;
        }

        run.status = 'completed';
        run.outputSummary = result.finalMessage || 'Completed with no final assistant text.';
        run.updatedAt = nowIso();
        this.pushEvent(run, 'run_completed', { finalMessage: result.finalMessage || null });
        this.runs.set(run.id, run);
        await this.persistRun(run);
        return;
      }

      if (config.cuaModel !== 'computer-use-preview') {
        this.pushEvent(run, 'model_override_not_supported', {
          configuredModel: config.cuaModel,
          effectiveModel: 'computer-use-preview',
          reason: 'langgraph-cua currently hardcodes ChatOpenAI model to computer-use-preview',
        });
      }

      const graph = createCua({
        environment: input.environment || 'web',
        authStateId: input.authStateId,
        prompt: input.systemPrompt,
      });

      const messages = [
        {
          role: 'system' as const,
          content:
            input.systemPrompt ||
            'You are a careful computer-use assistant. Use minimal-risk actions and pause for user input when authentication or sensitive approval is required.',
        },
        { role: 'user' as const, content: input.task },
      ];

      const stream = await graph.stream(
        { messages },
        {
          streamMode: 'updates',
          subgraphs: true,
          recursionLimit: 100,
        },
      );

      let finalSnapshot = '';
      for await (const update of stream as AsyncIterable<unknown>) {
        finalSnapshot = JSON.stringify(update);
        this.pushEvent(run, 'cua_update', { update: update as Record<string, unknown> });

        if (this.containsInterruptSignal(update)) {
          await this.interruptRun(run.id, 'Agent emitted interrupt signal from CUA stream.', 'agent');
          return;
        }

        if (this.containsApprovalSignal(update)) {
          run.status = 'awaiting_approval';
          this.pushEvent(run, 'approval_handoff_required', {
            runId: run.id,
            action: 'call_cua_approve_action',
            message: 'Approval required before continuing this run.',
          });
          this.runs.set(run.id, run);
          await this.persistRun(run);
        }

        const latest = this.runs.get(run.id);
        if (latest?.status === 'interrupted') {
          this.pushEvent(run, 'run_stopped_after_interrupt', {});
          this.runs.set(run.id, run);
          return;
        }

        while (this.runs.get(run.id)?.status === 'awaiting_approval') {
          await this.sleep(350);
        }
      }

      run.status = 'completed';
      run.outputSummary = finalSnapshot || 'Completed with no updates emitted.';
      run.updatedAt = nowIso();
      this.pushEvent(run, 'run_completed', {});
      this.runs.set(run.id, run);
      await this.persistRun(run);
    } catch (error) {
      const rawError = error instanceof Error ? error.message : String(error);
      const modelAccessHint =
        rawError.toLowerCase().includes('model') && rawError.toLowerCase().includes('does not exist')
          ? ' CUA currently requires an OpenAI model that supports computer-use tool calls. Check CUA_MODEL access on this API key, or use a key/org with computer-use-preview enabled.'
          : '';

      run.status = 'failed';
      run.error = `${rawError}${modelAccessHint}`;
      run.updatedAt = nowIso();
      this.pushEvent(run, 'run_failed', { error: run.error });
      this.runs.set(run.id, run);
      await this.persistRun(run);
    }
  }

  private pushEvent(run: CuaRunRecord, type: string, payload: Record<string, unknown>): void {
    const event: CuaEvent = {
      timestamp: nowIso(),
      type,
      payload,
    };

    run.events.push(event);
    run.updatedAt = event.timestamp;
    if (this.usesPostgres()) {
      void cuaRepository.appendEvent(run.id, event);
    }
  }
}

export const cuaRuntime = new CuaRuntime();
