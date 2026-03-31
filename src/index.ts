import { startHttpServer } from './mcp/server.js';
import { closePool, initPostgres } from './db/postgres.js';
import { config } from './config.js';

function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    try {
      await closePool();
    } catch (error) {
      console.error('[shutdown] failed to close postgres pool', error);
    } finally {
      process.exit(0);
    }
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.on('uncaughtException', (error) => {
    console.error('[runtime] uncaught exception', error);
    void shutdown('uncaughtException');
  });

  process.on('unhandledRejection', (error) => {
    console.error('[runtime] unhandled rejection', error);
    void shutdown('unhandledRejection');
  });
}

async function main(): Promise<void> {
  registerShutdownHandlers();
  await initPostgres();
  if (config.requireApiKey && config.apiKeys.size === 0) {
    console.warn('[startup] API key auth is enabled but no keys are configured. MCP endpoints will reject all requests until CUA_API_KEYS is set.');
  }
  await startHttpServer();
}

main().catch((error) => {
  console.error('[startup] fatal error', error);
  process.exit(1);
});
