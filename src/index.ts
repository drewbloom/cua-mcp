import { startHttpServer } from './mcp/server.js';
import { closePool, initPostgres } from './db/postgres.js';
import { config } from './config.js';
import { recoverPersistedCaptureSessions } from './security/authCapture.js';

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
  if (config.persistence === 'postgres') {
    await recoverPersistedCaptureSessions();
  }
  console.log('[startup] MCP endpoints require user-issued API keys backed by the database.');
  await startHttpServer();
}

main().catch((error) => {
  console.error('[startup] fatal error', error);
  process.exit(1);
});
