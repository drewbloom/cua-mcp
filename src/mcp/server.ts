import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from '../config.js';
import { registerCuaTools } from './registerTools.js';
import { handleApiRequest, handleFrontendRequest } from '../api/httpApi.js';
import { authenticateMcpApiKey, type McpAuthContext } from '../auth/mcpAuth.js';

function isLocalHost(hostname: string): boolean {
  const normalized = hostname.trim().toLowerCase();
  return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1';
}

function requestIsSecure(request: import('node:http').IncomingMessage): boolean {
  const forwardedProto = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
  if (forwardedProto) {
    return forwardedProto === 'https';
  }
  return Boolean((request.socket as { encrypted?: boolean }).encrypted);
}

function hasProxySignal(request: import('node:http').IncomingMessage): boolean {
  return Boolean(
    String(request.headers['x-forwarded-proto'] || '').trim() ||
    String(request.headers['x-forwarded-host'] || '').trim() ||
    String(request.headers['x-forwarded-for'] || '').trim(),
  );
}

function maybeEnforceHttps(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
  url: URL,
): boolean {
  if (config.nodeEnv !== 'production') return false;
  if (!hasProxySignal(request)) return false;
  if (requestIsSecure(request)) return false;
  if (isLocalHost(url.hostname)) return false;

  const secureUrl = `https://${url.host}${url.pathname}${url.search}`;
  if (request.method === 'GET' || request.method === 'HEAD') {
    response.writeHead(308, {
      location: secureUrl,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin',
    });
    response.end();
    return true;
  }

  response.writeHead(400, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'same-origin',
  }).end(
    JSON.stringify({
      error: 'HTTPS Required',
      message: 'This service requires HTTPS in production.',
    }),
  );
  return true;
}

function applyBaseSecurityHeaders(
  request: import('node:http').IncomingMessage,
  response: import('node:http').ServerResponse,
): void {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'same-origin');
  response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()');
  response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  response.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  if (config.nodeEnv === 'production' && requestIsSecure(request)) {
    response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
}

function getMcpCorsOrigin(request: import('node:http').IncomingMessage): string {
  const origin = String(request.headers.origin || '').trim();
  return origin || '*';
}

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

function getRequestIp(request: import('node:http').IncomingMessage): string {
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (forwarded) return forwarded;
  return request.socket.remoteAddress || 'unknown';
}

function getRequestCorrelationId(request: import('node:http').IncomingMessage): string {
  const incoming = String(request.headers['x-correlation-id'] || '').trim();
  if (incoming) return incoming.slice(0, 128);
  return randomUUID();
}

async function getAuthorizationContext(request: import('node:http').IncomingMessage): Promise<McpAuthContext | null> {
  const key = extractApiKey(request);
  if (!key) return null;
  return await authenticateMcpApiKey(key);
}

function writeUnauthorized(response: import('node:http').ServerResponse): void {
  response.writeHead(401, {
    'content-type': 'application/json',
    'www-authenticate': 'Bearer realm="cua-mcp", error="invalid_token", error_description="Missing or invalid API key"',
  }).end(
    JSON.stringify({
      error: 'Unauthorized',
      message: 'MCP access requires a valid user-issued API key using Authorization: Bearer <key> or x-api-key header.',
    }),
  );
}

function createMcpServer(authContext: McpAuthContext): McpServer {
  const server = new McpServer({
    name: 'cua-mcp',
    version: '0.1.0',
  });

  registerCuaTools(server, authContext);
  return server;
}

export async function startHttpServer(): Promise<void> {
  const httpServer = createServer(async (request, response) => {
    if (!request.url) {
      response.writeHead(400).end('Missing URL');
      return;
    }

    const url = new URL(request.url, `http://${request.headers.host ?? 'localhost'}`);
    const correlationId = getRequestCorrelationId(request);
    response.setHeader('X-Correlation-Id', correlationId);
    applyBaseSecurityHeaders(request, response);

    if (maybeEnforceHttps(request, response, url)) {
      return;
    }

    if (await handleApiRequest(request, response, url)) {
      return;
    }

    if (await handleFrontendRequest(request, response, url)) {
      return;
    }

    if (request.method === 'OPTIONS' && url.pathname === config.mcpPath) {
      const corsOrigin = getMcpCorsOrigin(request);
      response.writeHead(204, {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'content-type, mcp-session-id, authorization, x-api-key',
        'Access-Control-Expose-Headers': 'Mcp-Session-Id',
        Vary: 'Origin',
      });
      response.end();
      return;
    }

    if (request.method === 'GET' && url.pathname === '/health') {
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

    const authContext = await getAuthorizationContext(request);
    if (!authContext) {
      if (config.cuaLogEvents) {
        console.warn(
          JSON.stringify({
            component: 'mcp-server',
            eventType: 'mcp_auth_failed',
            timestamp: new Date().toISOString(),
            correlationId,
            method: String(request.method || 'UNKNOWN'),
            path: url.pathname,
            ip: getRequestIp(request),
            hasAuthorizationHeader: Boolean(String(request.headers.authorization || '').trim()),
            hasApiKeyHeader: Boolean(String(request.headers['x-api-key'] || '').trim()),
          }),
        );
      }
      writeUnauthorized(response);
      return;
    }

    authContext.requestId = correlationId;

    if (config.cuaLogEvents) {
      console.log(
        JSON.stringify({
          component: 'mcp-server',
          eventType: 'mcp_auth_succeeded',
          timestamp: new Date().toISOString(),
          correlationId,
          method: String(request.method || 'UNKNOWN'),
          path: url.pathname,
          userId: authContext.userId,
          apiKeyId: authContext.apiKeyId,
          allowedConnectionScopeCount: authContext.allowedConnectionIds.length,
        }),
      );
    }

    response.setHeader('Access-Control-Allow-Origin', getMcpCorsOrigin(request));
    response.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');
    response.setHeader('Vary', 'Origin');

    const mcpServer = createMcpServer(authContext);
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
      console.error(
        JSON.stringify({
          component: 'mcp-server',
          eventType: 'mcp_request_failed',
          timestamp: new Date().toISOString(),
          correlationId,
          method: String(request.method || 'UNKNOWN'),
          path: url.pathname,
          userId: authContext.userId,
          apiKeyId: authContext.apiKeyId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
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
