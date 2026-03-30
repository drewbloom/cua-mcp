import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from '../config.js';
import { registerCuaTools } from './registerTools.js';

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
        'Access-Control-Allow-Headers': 'content-type, mcp-session-id, authorization',
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
      await transport.handleRequest(request, response, {} as any);
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
