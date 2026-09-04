import type { NextApiRequest } from 'next';
import {
  assertCxsRequestIsolation,
  isUnomiSystemEndpoint,
  mustUseTenantUnomiCredentials,
} from '@/lib/cxs-request-guard';

const ENV_KEYS = ['UNOMI_VERSION', 'DEPLOYMENT_TYPE', 'TENANT_ADMIN_ENABLED'] as const;

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

function req(headers: Record<string, string> = {}): NextApiRequest {
  return { headers, cookies: {} } as NextApiRequest;
}

describe('isUnomiSystemEndpoint', () => {
  it('matches tenants and system paths', () => {
    expect(isUnomiSystemEndpoint('/cxs/tenants')).toBe(true);
    expect(isUnomiSystemEndpoint('/cxs/system/info')).toBe(true);
    expect(isUnomiSystemEndpoint('/cxs/segments')).toBe(false);
    expect(isUnomiSystemEndpoint('/cxs/profiles')).toBe(false);
  });
});

describe('assertCxsRequestIsolation', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    process.env.UNOMI_VERSION = '3.1';
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    delete process.env.TENANT_ADMIN_ENABLED;
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('forbids /tenants on SaaS (tenant admin off)', () => {
    expect(() => assertCxsRequestIsolation(req(), '/cxs/tenants')).toThrow(
      /System Unomi endpoints/,
    );
  });

  it('requires a real tenant on SaaS data-plane paths', () => {
    expect(() => assertCxsRequestIsolation(req(), '/cxs/segments')).toThrow(/Tenant scope required/);
    expect(() =>
      assertCxsRequestIsolation(req({ 'x-tenant-id': 't_bakery' }), '/cxs/segments'),
    ).not.toThrow();
  });

  it('allows system endpoints when tenant admin is on', () => {
    process.env.DEPLOYMENT_TYPE = 'on-premise';
    expect(() => assertCxsRequestIsolation(req(), '/cxs/tenants')).not.toThrow();
  });
});

describe('mustUseTenantUnomiCredentials', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    process.env.UNOMI_VERSION = '3.1';
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('is true for SaaS profile/segment proxy', () => {
    process.env.DEPLOYMENT_TYPE = 'multi-tenant';
    expect(mustUseTenantUnomiCredentials('/cxs/profiles')).toBe(true);
    expect(mustUseTenantUnomiCredentials('/cxs/tenants')).toBe(false);
  });

  it('is false on-premise', () => {
    process.env.DEPLOYMENT_TYPE = 'on-premise';
    expect(mustUseTenantUnomiCredentials('/cxs/profiles')).toBe(false);
  });
});
