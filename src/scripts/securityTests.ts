import assert from 'node:assert/strict';
import { __testables } from '../api/httpApi.js';

type ConnectionPolicy = {
  id: string;
  user_id: string;
  base_host: string;
  allowed_hosts_json: unknown;
  allowed_path_prefixes_json: unknown;
  status: string;
};

function run(): void {
  const policy: ConnectionPolicy = {
    id: 'c1',
    user_id: 'u1',
    base_host: 'example.com',
    allowed_hosts_json: ['help.example.com'],
    allowed_path_prefixes_json: ['/app', '/docs'],
    status: 'active',
  };

  assert.equal(__testables.normalizeHost('Example.COM.'), 'example.com');
  assert.equal(__testables.normalizePathPrefix('docs'), '/docs');

  assert.equal(
    __testables.isUrlAllowedByPolicy('https://example.com/app/login', policy as any),
    true,
    'base host with approved prefix should be allowed',
  );
  assert.equal(
    __testables.isUrlAllowedByPolicy('https://help.example.com/docs/getting-started', policy as any),
    true,
    'approved subdomain with approved prefix should be allowed',
  );
  assert.equal(
    __testables.isUrlAllowedByPolicy('https://example.com/private', policy as any),
    false,
    'base host path outside prefixes should be denied',
  );
  assert.equal(
    __testables.isUrlAllowedByPolicy('https://evil.com/app', policy as any),
    false,
    'unapproved host should be denied',
  );

  const redacted = __testables.redactAuditDetails({
    event: 'secret_used',
    token: 'abc',
    nested: {
      password: 'p@ss',
      code: '123456',
      note: 'ok',
    },
  });

  assert.equal(redacted.token, '[REDACTED]');
  assert.equal((redacted.nested as any).password, '[REDACTED]');
  assert.equal((redacted.nested as any).code, '[REDACTED]');
  assert.equal((redacted.nested as any).note, 'ok');

  assert.equal(__testables.accountApiPathAllowed('/api/auth/request-code'), true);
  assert.equal(__testables.accountApiPathAllowed('/api/keys/test-id'), true);
  assert.equal(__testables.accountApiPathAllowed('/api/unknown'), false);

  assert.equal(__testables.secretApiPathAllowed('/api/cua/secret-fill-plan'), true);
  assert.equal(__testables.secretApiPathAllowed('/api/connections/c1/secrets'), true);
  assert.equal(__testables.secretApiPathAllowed('/api/keys'), false);

  console.log('[security-tests] all checks passed');
}

run();
