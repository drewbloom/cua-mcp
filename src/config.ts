import 'dotenv/config';

function asNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: asNumber(process.env.PORT, 8788),
  mcpPath: process.env.MCP_PATH || '/mcp',
  openAiApiKey: process.env.OPENAI_API_KEY || '',
  scrapybaraApiKey: process.env.SCRAPYBARA_API_KEY || '',
  cuaTimeoutHours: asNumber(process.env.CUA_TIMEOUT_HOURS, 1),
};
