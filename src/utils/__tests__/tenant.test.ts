import { sign } from 'jsonwebtoken';
import type { NextApiRequest } from 'next';
import {
  getTenantId,
  isPlaceholderTenantId,
  mustRejectPlaceholderTenant,
  requireScopedTenantId,
} from '@/utils/tenant';

const ENV_KEYS = ['UNOMI_VERSION', 'DEPLOYMENT_TYPE', 'JWT_SECRET', 'DEFAULT_TENANT_ID'] as const;

function snapshotEnv(): Record<string, string | undefined> {
  const snap: Record<string, string | undefined> = {};
  for (const key of ENV_KEYS) {
    snap[key] = process.env[key];
  }
  return snap;
}

function restoreEnv(snap: Record<string, string | undefined>): void {
  for (const key of ENV_KEYS) {
    if (snap[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = snap[key];
    }
  }
}

function req(overrides: {
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
}): NextApiRequest {
  return {
    headers: overrides.headers ?? {},
    cookies: overrides.cookies ?? {},
  } as NextApiRequest;
}

describe('placeholder tenant ids', () => {
  it.each(['', '  ', 'default', 'DEFAULT', 'system', 'systemScope', null, undefined])(
    'treats %j as placeholder',
    (value) => {
      expect(isPlaceholderTenantId(value)).toBe(true);
    },
  );

  it('accepts a real tenant id', () => {
    expect(isPlaceholderTenantId('t_bakery')).toBe(false);
  });
});

describe('mustRejectPlaceholderTenant', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('is false on Unomi < 4.0 even when deployment is SaaS', () => {
    process.env.UNOMI_VERSION = '2.2';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    expect(mustRejectPlaceholderTenant()).toBe(false);
  });

  it('is false on Unomi 3.0 (tenants require 4.0+)', () => {
    process.env.UNOMI_VERSION = '3.0';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    expect(mustRejectPlaceholderTenant()).toBe(false);
  });

  it('is false on-premise even on Unomi 4.0', () => {
    process.env.UNOMI_VERSION = '4.0';
    process.env.DEPLOYMENT_TYPE = 'on-premise';
    expect(mustRejectPlaceholderTenant()).toBe(false);
  });

  it('is true for SaaS multi-tenant Unomi 4.0+', () => {
    process.env.UNOMI_VERSION = '4.0';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    expect(mustRejectPlaceholderTenant()).toBe(true);
  });
});

describe('getTenantId', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    process.env.UNOMI_VERSION = '4.0';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    process.env.JWT_SECRET = 'test-secret';
    delete process.env.DEFAULT_TENANT_ID;
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('prefers session JWT tenant over x-tenant-id (no header spoof)', () => {
    const token = sign({ tenantId: 't_from_session' }, 'test-secret');
    expect(
      getTenantId(
        req({
          cookies: { token },
          headers: { 'x-tenant-id': 't_spoofed' },
        }),
      ),
    ).toBe('t_from_session');
  });

  it('uses x-tenant-id when there is no session (site SDK / resolve)', () => {
    expect(getTenantId(req({ headers: { 'x-inoyu-tenant-id': 't_site' } }))).toBe('t_site');
  });

  it('always returns default on Unomi < 4.0', () => {
    process.env.UNOMI_VERSION = '2.2';
    expect(getTenantId(req({ headers: { 'x-tenant-id': 't_site' } }))).toBe('default');
  });

  it('ignores placeholder header and falls back to default', () => {
    expect(getTenantId(req({ headers: { 'x-tenant-id': 'default' } }))).toBe('default');
  });
});

describe('requireScopedTenantId', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    process.env.UNOMI_VERSION = '4.0';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    process.env.JWT_SECRET = 'test-secret';
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('throws 401 on SaaS when tenant is missing', () => {
    expect(() => requireScopedTenantId(req({}))).toThrow(/Tenant scope required/);
  });

  it('throws 401 on SaaS when tenant is default', () => {
    expect(() => requireScopedTenantId(req({ headers: { 'x-tenant-id': 'default' } }))).toThrow(
      /Tenant scope required/,
    );
  });

  it('returns the real tenant id', () => {
    expect(requireScopedTenantId(req({ headers: { 'x-tenant-id': 't_bakery' } }))).toBe('t_bakery');
  });

  it('allows default on-premise', () => {
    process.env.DEPLOYMENT_TYPE = 'on-premise';
    expect(requireScopedTenantId(req({}))).toBe('default');
  });
});
