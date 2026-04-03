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
  frontendOrigin: asString(process.env.FRONTEND_ORIGIN || ''),
  persistence: process.env.CUA_PERSISTENCE || 'memory',
  databaseUrl: process.env.DATABASE_URL || '',
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
  enableAccountApi: asString(process.env.CUA_ENABLE_ACCOUNT_API || 'true').toLowerCase() !== 'false',
  enableSecretApi: asString(process.env.CUA_ENABLE_SECRET_API || 'true').toLowerCase() !== 'false',
  sessionCookieName: asString(process.env.SESSION_COOKIE_NAME || 'cua_session'),
  otpTtlMinutes: asNumber(process.env.OTP_TTL_MINUTES, 5),
  otpMaxAttempts: asNumber(process.env.OTP_MAX_ATTEMPTS, 3),
  sessionIdleTtlHours: asNumber(process.env.SESSION_IDLE_TTL_HOURS, 12),
  sessionAbsoluteTtlDays: asNumber(process.env.SESSION_ABSOLUTE_TTL_DAYS, 30),
  secretMasterKeyHex: asString(process.env.CUA_SECRET_MASTER_KEY),
  resendApiKey: asString(process.env.RESEND_API_KEY),
  resendFromEmail: asString(process.env.RESEND_FROM_EMAIL),
  resendFromName: asString(process.env.RESEND_FROM_NAME || 'CUA MCP'),
  authRequestWindowMinutes: asNumber(process.env.AUTH_REQUEST_WINDOW_MINUTES, 15),
  authRequestLimitPerEmail: asNumber(process.env.AUTH_REQUEST_LIMIT_PER_EMAIL, 3),
  authRequestLimitPerIp: asNumber(process.env.AUTH_REQUEST_LIMIT_PER_IP, 10),
  authVerifyWindowMinutes: asNumber(process.env.AUTH_VERIFY_WINDOW_MINUTES, 15),
  authVerifyLimitPerEmail: asNumber(process.env.AUTH_VERIFY_LIMIT_PER_EMAIL, 10),
  authVerifyLimitPerIp: asNumber(process.env.AUTH_VERIFY_LIMIT_PER_IP, 20),
  apiRateLimitWindowMinutes: asNumber(process.env.API_RATE_LIMIT_WINDOW_MINUTES, 15),
  apiRequestLimitPerIp: asNumber(process.env.API_REQUEST_LIMIT_PER_IP, 300),
  apiMutationLimitPerIp: asNumber(process.env.API_MUTATION_LIMIT_PER_IP, 120),
  apiMutationLimitPerUser: asNumber(process.env.API_MUTATION_LIMIT_PER_USER, 90),
};
