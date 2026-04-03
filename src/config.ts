import 'dotenv/config';

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function asString(value: string | undefined): string {
  return String(value || '').trim();
}

export const config = {
  port: asNumber(process.env.PORT, 8788),
  nodeEnv: asString(process.env.NODE_ENV || 'development'),
  mcpPath: process.env.MCP_PATH || '/mcp',
  frontendOrigin: asString(process.env.FRONTEND_ORIGIN || 'http://localhost:5173'),
  persistence: process.env.CUA_PERSISTENCE || 'memory',
  databaseUrl: process.env.DATABASE_URL || '',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  scrapybaraApiKey: process.env.SCRAPYBARA_API_KEY || '',
  cuaEngine: process.env.CUA_ENGINE || 'openai-responses',
  cuaModel: process.env.CUA_MODEL || 'gpt-5.4',
  cuaReasoningEffort: process.env.CUA_REASONING_EFFORT || 'low',
  cuaTextVerbosity: process.env.CUA_TEXT_VERBOSITY || 'low',
  cuaMaxTurns: asNumber(process.env.CUA_MAX_TURNS, 20),
  browserHeadless: asString(process.env.CUA_BROWSER_HEADLESS || 'true').toLowerCase() !== 'false',
  browserViewportWidth: asNumber(process.env.CUA_BROWSER_WIDTH, 1440),
  browserViewportHeight: asNumber(process.env.CUA_BROWSER_HEIGHT, 900),
  browserLocale: asString(process.env.CUA_BROWSER_LOCALE || 'en-US'),
  browserTimezone: asString(process.env.CUA_BROWSER_TIMEZONE || 'America/Chicago'),
  browserUserAgent: asString(process.env.CUA_BROWSER_USER_AGENT || ''),
  browserNavigationTimeoutMs: asNumber(process.env.CUA_BROWSER_NAV_TIMEOUT_MS, 15000),
  browserPostActionWaitMs: asNumber(process.env.CUA_BROWSER_POST_ACTION_WAIT_MS, 600),
  cuaLogEvents: asString(process.env.CUA_LOG_EVENTS || 'true').toLowerCase() !== 'false',
  cuaTimeoutHours: asNumber(process.env.CUA_TIMEOUT_HOURS, 1),
  exposeRecipeTools: asString(process.env.CUA_EXPOSE_RECIPE_TOOLS || 'false').toLowerCase() === 'true',
  enableAccountApi: asString(process.env.CUA_ENABLE_ACCOUNT_API || 'false').toLowerCase() === 'true',
  enableSecretApi: asString(process.env.CUA_ENABLE_SECRET_API || 'false').toLowerCase() === 'true',
  sessionCookieName: asString(process.env.SESSION_COOKIE_NAME || 'cua_session'),
  otpTtlMinutes: asNumber(process.env.OTP_TTL_MINUTES, 10),
  otpMaxAttempts: asNumber(process.env.OTP_MAX_ATTEMPTS, 5),
  sessionTtlDays: asNumber(process.env.SESSION_TTL_DAYS, 7),
  mcpAccessApiKey: asString(process.env.MCP_ACCESS_API_KEY),
  secretMasterKeyHex: asString(process.env.CUA_SECRET_MASTER_KEY),
};
