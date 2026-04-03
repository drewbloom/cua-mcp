export type CuaEnvironment = 'web' | 'ubuntu' | 'windows';

export type CuaRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'interrupted';

export interface CuaRunInput {
  task: string;
  systemPrompt?: string;
  authStateId?: string;
  environment?: CuaEnvironment;
}

export interface CuaEvent {
  timestamp: string;
  type: string;
  payload: Record<string, unknown>;
}

export interface CuaRunRecord {
  id: string;
  status: CuaRunStatus;
  input: CuaRunInput;
  createdAt: string;
  updatedAt: string;
  outputSummary?: string;
  error?: string;
  events: CuaEvent[];
}

export interface CuaRecipe {
  id: string;
  name: string;
  description?: string;
  promptTemplate: string;
  createdAt: string;
}
