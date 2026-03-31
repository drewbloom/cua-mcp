import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from '../config.js';
import { registerCuaTools } from './registerTools.js';

function extractApiKey(request: import('node:http').IncomingMessage): string | null {
  const bearerHeader = String(request.headers.authorization || '').trim();
  if (bearerHeader.toLowerCase().startsWith('bearer ')) {
    const value = bearerHeader.slice(7).trim();
    if (value) return value;
  }

  const directHeader = String(request.headers['x-api-key'] || '').trim();
  if (directHeader) return directHeader;

  return null;
}

function isAuthorized(request: import('node:http').IncomingMessage): boolean {
  if (!config.mcpAccessApiKey) return false;

  const key = extractApiKey(request);
  if (!key) return false;
  return key === config.mcpAccessApiKey;
}

function writeUnauthorized(response: import('node:http').ServerResponse): void {
  response.writeHead(401, {
    'content-type': 'application/json',
    'www-authenticate': 'Bearer realm="cua-mcp", error="invalid_token", error_description="Missing or invalid API key"',
  }).end(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'MCP access requires MCP_ACCESS_API_KEY using Authorization: Bearer <key> or x-api-key header.',
    }),
  );
}

function createMcpServer(): McpServer {
  const server = new McpServer({
    name: 'cua-mcp',
    version: '0.1.0',
  });

  registerCuaTools(server);
  return server;
}

export async function startHttpServer(): Promise<void> {
  const httpServer = createServer(async (request, response) => {
    if (!request.url) {
      response.writeHead(400).end('Missing URL');
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);

    if (request.method === 'OPTIONS' && url.pathname === config.mcpPath) {
      response.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, mcp-session-id, authorization, x-api-key',
        'Access-Control-Expose-Headers': 'Mcp-Session-Id',
      });
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/') {
      response.writeHead(200, { 'content-type': 'application/json' }).end(
        JSON.stringify(
          {
            name: 'cua-mcp',
            version: '0.1.0',
            status: 'ok',
            mcpPath: config.mcpPath,
          },
          null,
          2,
        ),
      );
      return;
    }

    const methods = new Set(['POST', 'GET', 'DELETE']);
    const isRootMcpAlias = url.pathname === '/' && request.method !== 'GET';
    const isMcpRequest = (url.pathname === config.mcpPath || isRootMcpAlias) && request.method && methods.has(request.method);

    if (!isMcpRequest) {
      response.writeHead(404).end('Not Found');
      return;
    }

    if (!isAuthorized(request)) {
      writeUnauthorized(response);
      return;
    }

    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

    const mcpServer = createMcpServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    response.on('close', () => {
      void transport.close();
      void mcpServer.close();
    });

    try {
      await mcpServer.connect(transport);
      await transport.handleRequest(request, response);
    } catch (error) {
      console.error('[mcp] request failed', error);
      if (!response.headersSent) {
        response.writeHead(500).end('Internal server error');
      }
    }
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(config.port, () => {
      console.log(`[startup] cua-mcp listening at http://localhost:${config.port}${config.mcpPath}`);
      resolve();
    });
  });
}
