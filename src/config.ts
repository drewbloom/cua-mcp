import 'dotenv/config';

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  return fallback;
}

export const config = {
  port: asNumber(process.env.PORT, 8788),
  mcpPath: process.env.MCP_PATH || '/mcp',
  persistence: process.env.CUA_PERSISTENCE || 'memory',
  databaseUrl: process.env.DATABASE_URL || '',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  scrapybaraApiKey: process.env.SCRAPYBARA_API_KEY || '',
  cuaEngine: process.env.CUA_ENGINE || 'openai-responses',
  cuaModel: process.env.CUA_MODEL || 'gpt-5.4',
  cuaReasoningEffort: process.env.CUA_REASONING_EFFORT || 'low',
  cuaTextVerbosity: process.env.CUA_TEXT_VERBOSITY || 'low',
  cuaMaxTurns: asNumber(process.env.CUA_MAX_TURNS, 20),
  browserHeadless: asBoolean(process.env.CUA_BROWSER_HEADLESS, true),
  browserViewportWidth: asNumber(process.env.CUA_BROWSER_WIDTH, 1440),
  browserViewportHeight: asNumber(process.env.CUA_BROWSER_HEIGHT, 900),
  cuaTimeoutHours: asNumber(process.env.CUA_TIMEOUT_HOURS, 1),
  exposeRecipeTools: asBoolean(process.env.CUA_EXPOSE_RECIPE_TOOLS, false),
};
