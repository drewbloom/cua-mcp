import { startHttpServer } from './mcp/server.js';

startHttpServer().catch((error) => {
  console.error('[startup] fatal error', error);
  process.exit(1);
});
