import { createCua } from '@langchain/langgraph-cua';
import { randomUUID } from 'node:crypto';
import type { CuaEnvironment, CuaEvent, CuaRecipe, CuaRunInput, CuaRunRecord } from './types.js';

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

  startRun(input: CuaRunInput): CuaRunRecord {
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
    void this.executeRun(id, input);
    return run;
  }

  getRun(runId: string): CuaRunRecord | undefined {
    return this.runs.get(runId);
  }

  listRuns(): CuaRunRecord[] {
    return [...this.runs.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  interruptRun(runId: string, reason: string): CuaRunRecord | undefined {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    this.pushEvent(run, 'interrupt_requested', { reason });
    run.status = 'interrupted';
    run.updatedAt = nowIso();
    this.runs.set(run.id, run);
    return run;
  }

  approveAction(runId: string, approved: boolean, note?: string): CuaRunRecord | undefined {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    this.pushEvent(run, 'approval_response', { approved, note: note || '' });
    run.updatedAt = nowIso();
    this.runs.set(run.id, run);
    return run;
  }

  saveRecipe(name: string, promptTemplate: string, description?: string): CuaRecipe {
    const recipe: CuaRecipe = {
      id: randomUUID(),
      name,
      description,
      promptTemplate,
      createdAt: nowIso(),
    };
    this.recipes.set(recipe.id, recipe);
    return recipe;
  }

  getRecipe(recipeId: string): CuaRecipe | undefined {
    return this.recipes.get(recipeId);
  }

  listRecipes(): CuaRecipe[] {
    return [...this.recipes.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  runRecipe(recipeId: string, variables: Record<string, string>, options?: { systemPrompt?: string; authStateId?: string; environment?: CuaEnvironment }): CuaRunRecord | undefined {
    const recipe = this.recipes.get(recipeId);
    if (!recipe) return undefined;

    const task = applyTemplate(recipe.promptTemplate, variables);
    return this.startRun({
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
    });

    try {
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

        const latest = this.runs.get(run.id);
        if (latest?.status === 'interrupted') {
          this.pushEvent(run, 'run_stopped_after_interrupt', {});
          this.runs.set(run.id, run);
          return;
        }
      }

      run.status = 'completed';
      run.outputSummary = finalSnapshot || 'Completed with no updates emitted.';
      run.updatedAt = nowIso();
      this.pushEvent(run, 'run_completed', {});
      this.runs.set(run.id, run);
    } catch (error) {
      run.status = 'failed';
      run.error = error instanceof Error ? error.message : String(error);
      run.updatedAt = nowIso();
      this.pushEvent(run, 'run_failed', { error: run.error });
      this.runs.set(run.id, run);
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
  }
}

export const cuaRuntime = new CuaRuntime();
