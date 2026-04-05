import { createCua } from '@langchain/langgraph-cua';
import { randomUUID } from 'node:crypto';
import type { CuaEnvironment, CuaEvent, CuaRecipe, CuaRunInput, CuaRunRecord } from './types.js';
import { config } from '../config.js';
import { runOpenAiComputerLoop } from './openaiComputerLoop.js';
import OpenAI from 'openai';
import { cuaRepository } from '../db/cuaRepository.js';
import { getActiveOpenAiApiKeyForUser } from '../auth/userLlmKeys.js';
import { getConnectionPolicyForUser } from '../security/secretBoundary.js';
import { getUserCuaSettings } from './userSettings.js';
import type { CuaUserSettings } from './types.js';

function nowIso(): string {
  return new Date().toISOString();
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return variables[key] ?? '';
  });
}

function sanitizeSteeringPreview(message: string): string {
  const text = String(message || '');
  // Avoid persisting likely OTP/passcode values in steering event previews.
  const redacted = text.replace(/\b\d{4,8}\b/g, '[redacted-code]');
  return redacted.slice(0, 300);
}

export class CuaRuntime {
  private runs = new Map<string, CuaRunRecord>();
  private recipes = new Map<string, CuaRecipe>();
  private settingsCache = new Map<string, { settings: CuaUserSettings; loadedAt: number }>();
  private steeringQueues = new Map<
    string,
    Array<{ message: string; mode: 'append' | 'replace_goal'; source: 'user' | 'agent'; timestamp: string }>
  >();

  private usesPostgres(): boolean {
    return config.persistence === 'postgres';
  }

  private async getPersistenceSettings(userId: string): Promise<CuaUserSettings> {
    const cached = this.settingsCache.get(userId);
    if (cached && Date.now() - cached.loadedAt < 60_000) {
      return cached.settings;
    }

    const settings = await getUserCuaSettings(userId);
    this.settingsCache.set(userId, { settings, loadedAt: Date.now() });
    return settings;
  }

  invalidateUserSettings(userId: string): void {
    this.settingsCache.delete(userId);
  }

  private async cleanupExpiredRunsForUser(userId: string): Promise<void> {
    if (!this.usesPostgres()) return;
    const settings = await this.getPersistenceSettings(userId);
    if (settings.runRetentionDays < 1) return;
    await cuaRepository.cleanupExpiredRuns(userId, settings.runRetentionDays);
  }

  private async persistRun(run: CuaRunRecord): Promise<void> {
    if (!this.usesPostgres()) return;
    const settings = await this.getPersistenceSettings(run.userId);
    const persistedRun: CuaRunRecord = {
      ...run,
      input: settings.zdrEnabled
        ? {
            task: '[REDACTED_BY_ZDR]',
            environment: run.input.environment,
            connectionId: run.input.connectionId,
          }
        : run.input,
      outputSummary: settings.persistRunOutput ? run.outputSummary : undefined,
      error: settings.persistRunOutput ? run.error : undefined,
      events: run.events,
    };
    await cuaRepository.upsertRun(persistedRun);
    if (new Set(['completed', 'failed', 'interrupted']).has(run.status)) {
      await this.cleanupExpiredRunsForUser(run.userId);
    }
  }

  private async persistRecipe(recipe: CuaRecipe): Promise<void> {
    if (!this.usesPostgres()) return;
    await cuaRepository.saveRecipe(recipe);
  }

  private shouldLogEvent(type: string): boolean {
    return new Set([
      'run_started',
      'run_completed',
      'run_failed',
      'run_blocked',
      'response_turn',
      'computer_call_requested',
      'computer_actions_executed',
      'page_diagnostics',
      'possible_render_or_bot_block',
      'connection_context_resolved',
      'connection_artifact_resolution_denied',
      'connection_auth_state_applied',
      'connection_secret_fill_applied',
      'clarification_required',
      'interrupt_handoff_required',
      'environment_overridden',
      'steering_queued',
      'steering_applied',
      'steering_rejected_terminal',
    ]).has(type);
  }

  private toLogPayload(type: string, payload: Record<string, unknown>): Record<string, unknown> {
    if (type === 'computer_call_requested') {
      return {
        turn: payload.turn,
        actionCount: payload.actionCount,
        summary: payload.summary,
      };
    }

    if (type === 'page_diagnostics' || type === 'possible_render_or_bot_block') {
      return {
        stage: payload.stage,
        turn: payload.turn,
        url: payload.url,
        title: payload.title,
        readyState: payload.readyState,
        bodyTextLength: payload.bodyTextLength,
        visibleNodeCount: payload.visibleNodeCount,
        blankLike: payload.blankLike,
        matchedHints: payload.matchedHints,
      };
    }

    if (type === 'response_turn') {
      const usage = (payload.usage || {}) as Record<string, unknown>;
      return {
        turn: payload.turn,
        status: payload.status,
        responseId: payload.responseId,
        usage: {
          input_tokens: usage.input_tokens,
          output_tokens: usage.output_tokens,
          total_tokens: usage.total_tokens,
        },
      };
    }

    if (type === 'run_failed') {
      return { error: payload.error };
    }

    if (type === 'run_started') {
      return {
        environment: payload.environment,
        authStateId: payload.authStateId,
        connectionId: payload.connectionId,
        connectionName: payload.connectionName,
        connectionBaseHost: payload.connectionBaseHost,
        engine: payload.engine,
        model: payload.model,
        correlationId: payload.correlationId,
      };
    }

    if (type === 'run_blocked') {
      return {
        reason: payload.reason,
        finalMessage: payload.finalMessage,
      };
    }

    if (type === 'connection_context_resolved') {
      return {
        turn: payload.turn,
        connectionId: payload.connectionId,
        connectionName: payload.connectionName,
        connectionBaseHost: payload.connectionBaseHost,
        url: payload.url,
        authStateAvailable: payload.authStateAvailable,
        availableSecretTypes: payload.availableSecretTypes,
        missingSecretTypes: payload.missingSecretTypes,
      };
    }

    if (type === 'connection_artifact_resolution_denied') {
      return {
        turn: payload.turn,
        connectionId: payload.connectionId,
        url: payload.url,
        error: payload.error,
      };
    }

    if (type === 'connection_auth_state_applied') {
      return {
        turn: payload.turn,
        connectionId: payload.connectionId,
        connectionName: payload.connectionName,
        connectionBaseHost: payload.connectionBaseHost,
        url: payload.url,
        authStateId: payload.authStateId,
        applied: payload.applied,
      };
    }

    if (type === 'connection_secret_fill_applied') {
      return {
        turn: payload.turn,
        connectionId: payload.connectionId,
        connectionName: payload.connectionName,
        connectionBaseHost: payload.connectionBaseHost,
        url: payload.url,
        filledTypes: payload.filledTypes,
        loginLike: payload.loginLike,
      };
    }

    return payload;
  }

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async awaitRun(
    runId: string,
    userId: string,
    options?: {
      waitSeconds?: number;
      pollIntervalMs?: number;
      sinceEventCount?: number;
    },
  ): Promise<{
    reason: 'signal' | 'timeout' | 'terminal' | 'not_found';
    waitedSeconds: number;
    run?: CuaRunRecord;
    signalEvent?: CuaEvent;
    nextSinceEventCount?: number;
  }> {
    const waitSeconds = Math.max(1, Math.min(options?.waitSeconds ?? 30, 300));
    const pollIntervalMs = Math.max(250, Math.min(options?.pollIntervalMs ?? 1000, 5000));
    const sinceEventCount = Math.max(0, options?.sinceEventCount ?? 0);
    const started = Date.now();

    while (true) {
      const run = await this.getRun(runId, userId);
      if (!run) {
        return {
          reason: 'not_found',
          waitedSeconds: (Date.now() - started) / 1000,
        };
      }

      const terminalStatuses = new Set(['completed', 'failed', 'interrupted']);
      if (terminalStatuses.has(run.status)) {
        return {
          reason: 'terminal',
          waitedSeconds: (Date.now() - started) / 1000,
          run,
          nextSinceEventCount: run.events.length,
        };
      }

      const newEvents = run.events.slice(sinceEventCount);
      const signalEvent = newEvents.find(
        (event) =>
          event.type === 'clarification_required' ||
          event.type === 'interrupt_handoff_required' ||
          event.type === 'run_failed',
      );

      if (signalEvent) {
        return {
          reason: 'signal',
          waitedSeconds: (Date.now() - started) / 1000,
          run,
          signalEvent,
          nextSinceEventCount: run.events.length,
        };
      }

      const elapsedMs = Date.now() - started;
      if (elapsedMs >= waitSeconds * 1000) {
        return {
          reason: 'timeout',
          waitedSeconds: elapsedMs / 1000,
          run,
          nextSinceEventCount: run.events.length,
        };
      }

      await this.sleep(pollIntervalMs);
    }
  }

  private isInterrupted(runId: string): boolean {
    return this.runs.get(runId)?.status === 'interrupted';
  }

  private consumeSteering(
    runId: string,
  ): Array<{ message: string; mode: 'append' | 'replace_goal'; source: 'user' | 'agent'; timestamp: string }> {
    const queue = this.steeringQueues.get(runId) || [];
    this.steeringQueues.set(runId, []);
    return queue;
  }

  private async resolveOwnedRun(runId: string, userId?: string): Promise<CuaRunRecord | undefined> {
    const inMemory = this.runs.get(runId);
    if (inMemory) {
      if (!userId || inMemory.userId === userId) {
        return inMemory;
      }
      return undefined;
    }

    if (!userId || !this.usesPostgres()) {
      return undefined;
    }

    const persisted = await cuaRepository.getRun(runId, userId);
    if (persisted) {
      this.runs.set(persisted.id, persisted);
    }
    return persisted;
  }

  private containsApprovalSignal(update: unknown): boolean {
    const text = JSON.stringify(update).toLowerCase();
    return text.includes('approve_action') || text.includes('approval_required') || text.includes('awaiting_approval');
  }

  private containsInterruptSignal(update: unknown): boolean {
    const text = JSON.stringify(update).toLowerCase();
    return text.includes('_interrupt') || text.includes('interrupt_requested') || text.includes('agent_interrupt');
  }

  async startRun(input: CuaRunInput, userId: string): Promise<CuaRunRecord> {
    const id = randomUUID();
    const timestamp = nowIso();

    const run: CuaRunRecord = {
      id,
      userId,
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

  async getRun(runId: string, userId: string): Promise<CuaRunRecord | undefined> {
    const inMemory = this.runs.get(runId);
    if (inMemory && inMemory.userId === userId) return inMemory;
    if (!this.usesPostgres()) return undefined;

    const persisted = await cuaRepository.getRun(runId, userId);
    if (persisted) {
      this.runs.set(persisted.id, persisted);
    }
    return persisted;
  }

  async listRuns(userId: string): Promise<CuaRunRecord[]> {
    if (this.usesPostgres()) {
      await this.cleanupExpiredRunsForUser(userId);
      const runs = await cuaRepository.listRuns(userId);
      for (const run of runs) {
        this.runs.set(run.id, run);
      }
      return runs;
    }
    return [...this.runs.values()].filter((run) => run.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async interruptRun(runId: string, reason: string, source: 'user' | 'agent' = 'user', userId?: string): Promise<CuaRunRecord | undefined> {
    const run = await this.resolveOwnedRun(runId, userId);
    if (!run) return undefined;

    const terminalStatuses = new Set(['completed', 'failed', 'interrupted']);
    if (terminalStatuses.has(run.status)) {
      this.pushEvent(run, 'interrupt_rejected_terminal', {
        reason,
        source,
        status: run.status,
      });
      await this.persistRun(run);
      return run;
    }

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

  async steerRun(
    runId: string,
    steeringMessage: string,
    mode: 'append' | 'replace_goal' = 'append',
    source: 'user' | 'agent' = 'agent',
    userId?: string,
  ): Promise<CuaRunRecord | undefined> {
    const run = await this.resolveOwnedRun(runId, userId);
    if (!run) return undefined;

    const terminalStatuses = new Set(['completed', 'failed', 'interrupted']);
    if (terminalStatuses.has(run.status)) {
      this.pushEvent(run, 'steering_rejected_terminal', {
        source,
        mode,
        status: run.status,
      });
      await this.persistRun(run);
      return run;
    }

    const queue = this.steeringQueues.get(runId) || [];
    queue.push({
      message: steeringMessage,
      mode,
      source,
      timestamp: nowIso(),
    });
    this.steeringQueues.set(runId, queue);

    this.pushEvent(run, 'steering_queued', {
      source,
      mode,
      queueDepth: queue.length,
      preview: sanitizeSteeringPreview(steeringMessage),
    });
    await this.persistRun(run);
    return run;
  }

  async approveAction(runId: string, approved: boolean, note?: string): Promise<CuaRunRecord | undefined> {
    const run = this.runs.get(runId);
    if (!run) return undefined;

    this.pushEvent(run, 'approval_rejected_disabled', {
      approved,
      note: note || '',
      reason: 'headless_mode_disables_credential_hitl',
    });
    run.updatedAt = nowIso();
    this.runs.set(run.id, run);
    await this.persistRun(run);
    return run;
  }

  async deleteRun(runId: string, userId: string): Promise<boolean> {
    const deleted = this.usesPostgres()
      ? await cuaRepository.deleteRun(runId, userId)
      : (() => {
          const run = this.runs.get(runId);
          if (!run || run.userId !== userId) return false;
          this.runs.delete(runId);
          return true;
        })();

    if (deleted) {
      this.runs.delete(runId);
      this.steeringQueues.delete(runId);
    }
    return deleted;
  }

  async saveRecipe(userId: string, name: string, promptTemplate: string, description?: string): Promise<CuaRecipe> {
    const recipe: CuaRecipe = {
      id: randomUUID(),
      userId,
      name,
      description,
      promptTemplate,
      createdAt: nowIso(),
    };
    this.recipes.set(recipe.id, recipe);
    await this.persistRecipe(recipe);
    return recipe;
  }

  async getRecipe(recipeId: string, userId: string): Promise<CuaRecipe | undefined> {
    const inMemory = this.recipes.get(recipeId);
    if (inMemory && inMemory.userId === userId) return inMemory;
    if (!this.usesPostgres()) return undefined;

    const persisted = await cuaRepository.getRecipe(recipeId, userId);
    if (persisted) {
      this.recipes.set(persisted.id, persisted);
    }
    return persisted;
  }

  async listRecipes(userId: string): Promise<CuaRecipe[]> {
    if (this.usesPostgres()) {
      const recipes = await cuaRepository.listRecipes(userId);
      for (const recipe of recipes) {
        this.recipes.set(recipe.id, recipe);
      }
      return recipes;
    }
    return [...this.recipes.values()].filter((recipe) => recipe.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async preflightModelAccess(userId: string): Promise<{ ok: boolean; engine: string; model: string; detail: string }> {
    if (config.cuaEngine !== 'openai-responses') {
      return {
        ok: true,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: 'Preflight check is currently implemented for openai-responses engine.',
      };
    }

    const openAiApiKey = await getActiveOpenAiApiKeyForUser(userId);
    if (!openAiApiKey) {
      return {
        ok: false,
        engine: config.cuaEngine,
        model: config.cuaModel,
        detail: 'No active OpenAI API key is configured for this user.',
      };
    }

    try {
      const client = new OpenAI({ apiKey: openAiApiKey });
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

  async runRecipe(userId: string, recipeId: string, variables: Record<string, string>, options?: { systemPrompt?: string; authStateId?: string; connectionId?: string; environment?: CuaEnvironment }): Promise<CuaRunRecord | undefined> {
    const recipe = await this.getRecipe(recipeId, userId);
    if (!recipe) return undefined;

    const task = applyTemplate(recipe.promptTemplate, variables);
    return await this.startRun({
      task,
      systemPrompt: options?.systemPrompt,
      authStateId: options?.authStateId,
      connectionId: options?.connectionId,
      environment: options?.environment,
    }, userId);
  }

  private async executeRun(runId: string, input: CuaRunInput): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    const connectionId = String(input.connectionId || '').trim();
    const connectionPolicy = connectionId ? await getConnectionPolicyForUser(run.userId, connectionId) : null;

    run.status = 'running';
    run.updatedAt = nowIso();
    this.pushEvent(run, 'run_started', {
      environment: input.environment || 'web',
      authStateId: input.authStateId || null,
      connectionId: connectionId || null,
      connectionName: connectionPolicy ? String(connectionPolicy.name || '') : null,
      connectionBaseHost: connectionPolicy ? String(connectionPolicy.base_host || '') : null,
      engine: config.cuaEngine,
      model: config.cuaModel,
      correlationId: input.correlationId || null,
    });
    await this.persistRun(run);

    try {
      if (config.cuaEngine === 'openai-responses') {
        const openAiApiKey = await getActiveOpenAiApiKeyForUser(run.userId);
        if (!openAiApiKey) {
          throw new Error('No active OpenAI API key is configured for this user.');
        }

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
          openAiApiKey,
          (targetRun, type, payload) => this.pushEvent(targetRun, type, payload),
          (id) => this.isInterrupted(id),
          (id) => this.consumeSteering(id),
        );

        if (result.blockedReason) {
          run.status = 'interrupted';
          run.outputSummary = result.finalMessage || `Run blocked: ${result.blockedReason}`;
          this.pushEvent(run, 'run_blocked', {
            reason: result.blockedReason,
            finalMessage: result.finalMessage || null,
          });
          this.runs.set(run.id, run);
          await this.persistRun(run);
          return;
        }

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
          this.pushEvent(run, 'clarification_required', {
            runId: run.id,
            action: 'call_cua_steer_run_or_cua_interrupt',
            message: 'Run needs clarification before continuing. In headless mode, use steering or interrupt; no credential approval handoff is supported.',
            reason: 'approval_signal_detected_but_disabled_in_headless',
          });
          this.runs.set(run.id, run);
          await this.persistRun(run);
          continue;
        }

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

    if (config.cuaLogEvents && this.shouldLogEvent(type)) {
      const line = {
        component: 'cua-runtime',
        runId: run.id,
        correlationId: run.input.correlationId || null,
        eventType: type,
        timestamp: event.timestamp,
        payload: this.toLogPayload(type, payload),
      };
      console.log(JSON.stringify(line));
    }

    if (this.usesPostgres()) {
      void this.getPersistenceSettings(run.userId).then((settings) => {
        if (!settings.persistRunEvents) return;
        return cuaRepository.appendEvent(run.id, event);
      });
    }
  }
}

export const cuaRuntime = new CuaRuntime();
