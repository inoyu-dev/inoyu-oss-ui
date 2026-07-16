/**
 * Tenant mode matrix tests:
 *   Unomi version (>= 3.1 vs < 3.1) × deployment (SaaS multi-tenant vs on-premise)
 * Plus first-login bootstrap (system admin only when no tenants).
 */

import axios from 'axios';
import {
  parseUnomiVersion,
  supportsTenants,
  isUnomiAtLeast,
  getUnomiConfig,
  getTenantContextFromRequest,
} from '@/lib/unomi-config';
import {
  isTenantAdminEnabled,
  isTenantAdminUiEnabled,
  requireTenantAdmin,
} from '@/lib/tenant-admin';
import { getTenantUiCapabilities, hasAnyTenants } from '@/lib/tenant-bootstrap';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

const ENV_KEYS = [
  'UNOMI_VERSION',
  'DEPLOYMENT_TYPE',
  'TENANT_ADMIN_ENABLED',
  'UNOMI_TENANT_ID',
  'JWT_SECRET',
] as const;

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

function setMatrixEnv(opts: {
  version: string;
  deployment: 'multi-tenant' | 'on-premise';
  tenantAdminEnabled?: 'true' | 'false' | undefined;
  tenantId?: string;
}): void {
  process.env.UNOMI_VERSION = opts.version;
  process.env.DEPLOYMENT_TYPE = opts.deployment;
  if (opts.tenantAdminEnabled === undefined) {
    delete process.env.TENANT_ADMIN_ENABLED;
  } else {
    process.env.TENANT_ADMIN_ENABLED = opts.tenantAdminEnabled;
  }
  if (opts.tenantId === undefined) {
    delete process.env.UNOMI_TENANT_ID;
  } else {
    process.env.UNOMI_TENANT_ID = opts.tenantId;
  }
}

describe('code defaults when env unset (env-defaults.ts)', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('defaults to Unomi 3.1 + on-premise (tenant admin UI on)', () => {
    expect(supportsTenants()).toBe(true);
    expect(isTenantAdminEnabled()).toBe(true);
    expect(isTenantAdminUiEnabled()).toBe(true);
    expect(getUnomiConfig().version).toBe('3.1');
    expect(getTenantUiCapabilities(false)).toMatchObject({
      supportsTenants: true,
      deploymentTenantAdmin: true,
      showTenantAdminUi: true,
      allowTenantLogin: false,
      systemAdminOnly: true,
    });
  });
});

describe('parseUnomiVersion / supportsTenants', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it.each([
    ['2', { major: 2, minor: 0, patch: 0 }],
    ['2.2.0', { major: 2, minor: 2, patch: 0 }],
    ['3', { major: 3, minor: 0, patch: 0 }],
    ['3.0', { major: 3, minor: 0, patch: 0 }],
    ['3.0.1', { major: 3, minor: 0, patch: 1 }],
    ['3.1', { major: 3, minor: 1, patch: 0 }],
    ['3.1.0-SNAPSHOT', { major: 3, minor: 1, patch: 0 }],
    ['3.2.1', { major: 3, minor: 2, patch: 1 }],
  ])('parses %s', (raw, expected) => {
    expect(parseUnomiVersion(raw)).toMatchObject(expected);
  });

  it.each([
    ['2', false],
    ['2.2', false],
    ['3', false],
    ['3.0', false],
    ['3.0.9', false],
    ['3.1', true],
    ['3.1.0-SNAPSHOT', true],
    ['3.2', true],
    ['4.0', true],
  ])('supportsTenants for UNOMI_VERSION=%s → %s', (version, expected) => {
    process.env.UNOMI_VERSION = version;
    expect(supportsTenants()).toBe(expected);
    expect(isUnomiAtLeast(3, 1)).toBe(expected);
  });
});

describe('tenant UI matrix (Unomi × deployment)', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  const cases: Array<{
    name: string;
    version: string;
    deployment: 'multi-tenant' | 'on-premise';
    tenantsExist: boolean;
    expect: {
      supportsTenants: boolean;
      deploymentTenantAdmin: boolean;
      showTenantAdminUi: boolean;
      allowTenantLogin: boolean;
      systemAdminOnly: boolean;
    };
  }> = [
    {
      name: '<3.1 × SaaS, no tenants',
      version: '3.0',
      deployment: 'multi-tenant',
      tenantsExist: false,
      expect: {
        supportsTenants: false,
        deploymentTenantAdmin: false,
        showTenantAdminUi: false,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '<3.1 × SaaS, tenants exist (still no tenant UI)',
      version: '2',
      deployment: 'multi-tenant',
      tenantsExist: true,
      expect: {
        supportsTenants: false,
        deploymentTenantAdmin: false,
        showTenantAdminUi: false,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '<3.1 × on-prem, no tenants',
      version: '3',
      deployment: 'on-premise',
      tenantsExist: false,
      expect: {
        supportsTenants: false,
        deploymentTenantAdmin: true,
        showTenantAdminUi: false,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '<3.1 × on-prem, tenants exist (UI still off)',
      version: '3.0.1',
      deployment: 'on-premise',
      tenantsExist: true,
      expect: {
        supportsTenants: false,
        deploymentTenantAdmin: true,
        showTenantAdminUi: false,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '>=3.1 × SaaS, no tenants',
      version: '3.1',
      deployment: 'multi-tenant',
      tenantsExist: false,
      expect: {
        supportsTenants: true,
        deploymentTenantAdmin: false,
        showTenantAdminUi: false,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '>=3.1 × SaaS, tenants exist (JWT path; no admin UI)',
      version: '3.1',
      deployment: 'multi-tenant',
      tenantsExist: true,
      expect: {
        supportsTenants: true,
        deploymentTenantAdmin: false,
        showTenantAdminUi: false,
        allowTenantLogin: true,
        systemAdminOnly: false,
      },
    },
    {
      name: '>=3.1 × on-prem, no tenants (bootstrap → system admin only)',
      version: '3.1',
      deployment: 'on-premise',
      tenantsExist: false,
      expect: {
        supportsTenants: true,
        deploymentTenantAdmin: true,
        showTenantAdminUi: true,
        allowTenantLogin: false,
        systemAdminOnly: true,
      },
    },
    {
      name: '>=3.1 × on-prem, tenants exist (full tenant admin UI)',
      version: '3.2',
      deployment: 'on-premise',
      tenantsExist: true,
      expect: {
        supportsTenants: true,
        deploymentTenantAdmin: true,
        showTenantAdminUi: true,
        allowTenantLogin: true,
        systemAdminOnly: false,
      },
    },
  ];

  it.each(cases)('$name', ({ version, deployment, tenantsExist, expect: expected }) => {
    setMatrixEnv({ version, deployment });
    expect(isTenantAdminEnabled()).toBe(expected.deploymentTenantAdmin);
    expect(isTenantAdminUiEnabled()).toBe(expected.showTenantAdminUi);
    expect(getTenantUiCapabilities(tenantsExist)).toEqual(expected);
  });

  it('TENANT_ADMIN_ENABLED=true on SaaS still enables deployment flag, but UI needs 3.1+', () => {
    setMatrixEnv({ version: '3.0', deployment: 'multi-tenant', tenantAdminEnabled: 'true' });
    expect(isTenantAdminEnabled()).toBe(true);
    expect(isTenantAdminUiEnabled()).toBe(false);

    setMatrixEnv({ version: '3.1', deployment: 'multi-tenant', tenantAdminEnabled: 'true' });
    expect(isTenantAdminUiEnabled()).toBe(true);
  });

  it('TENANT_ADMIN_ENABLED=false disables on-prem UI even on 3.1+', () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise', tenantAdminEnabled: 'false' });
    expect(isTenantAdminEnabled()).toBe(false);
    expect(isTenantAdminUiEnabled()).toBe(false);
    expect(() => requireTenantAdmin()).toThrow(/Tenant management is not available/);
  });

  it('requireTenantAdmin throws outside on-prem 3.1+', () => {
    setMatrixEnv({ version: '3.1', deployment: 'multi-tenant' });
    expect(() => requireTenantAdmin()).toThrow(/Tenant management is not available/);

    setMatrixEnv({ version: '3.0', deployment: 'on-premise' });
    expect(() => requireTenantAdmin()).toThrow(/Tenant management is not available/);

    setMatrixEnv({ version: '3.1', deployment: 'on-premise' });
    expect(() => requireTenantAdmin()).not.toThrow();
  });
});

describe('getUnomiConfig admin_tenant_context (SaaS vs on-prem)', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  const adminCookie = {
    cookies: {
      admin_tenant_context: JSON.stringify({
        tenantId: 'switched-tenant',
        publicApiKey: 'pub',
        privateApiKey: 'priv',
        name: 'Switched',
      }),
    },
  };

  it('on-prem 3.1+ uses admin_tenant_context cookie', () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise' });
    const config = getUnomiConfig(adminCookie);
    expect(config.tenantId).toBe('switched-tenant');
    expect(config.publicApiKey).toBe('pub');
  });

  it('on-prem 3.1+ ignores UNOMI_TENANT_ID without admin context', () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise', tenantId: 'env-tenant' });
    expect(getUnomiConfig().tenantId).toBeUndefined();
  });

  it('on-prem 3.1+ prefers admin context over UNOMI_TENANT_ID', () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise', tenantId: 'env-tenant' });
    const config = getUnomiConfig(adminCookie);
    expect(config.tenantId).toBe('switched-tenant');
  });

  it('SaaS 3.1+ ignores admin_tenant_context cookie', () => {
    setMatrixEnv({ version: '3.1', deployment: 'multi-tenant', tenantId: 'env-tenant' });
    const config = getUnomiConfig(adminCookie);
    expect(config.tenantId).toBe('env-tenant');
    expect(config.publicApiKey).toBeUndefined();
  });

  it('SaaS 3.1+ still uses UNOMI_TENANT_ID as fallback', () => {
    setMatrixEnv({ version: '3.1', deployment: 'multi-tenant', tenantId: 'env-tenant' });
    expect(getUnomiConfig().tenantId).toBe('env-tenant');
  });

  it('Unomi < 3.1 ignores admin_tenant_context even on-prem', () => {
    setMatrixEnv({ version: '3.0', deployment: 'on-premise', tenantId: 'env-tenant' });
    const config = getUnomiConfig(adminCookie);
    expect(config.tenantId).toBe('env-tenant');
  });

  it('getTenantContextFromRequest still parses cookie (gating is in getUnomiConfig)', () => {
    expect(getTenantContextFromRequest(adminCookie)?.tenantId).toBe('switched-tenant');
  });
});

describe('hasAnyTenants / login bootstrap', () => {
  let envSnap: Record<string, string | undefined>;

  beforeEach(() => {
    envSnap = snapshotEnv();
    mockedAxios.get.mockReset();
  });

  afterEach(() => {
    restoreEnv(envSnap);
  });

  it('returns false when Unomi < 3.1 without calling Unomi', async () => {
    setMatrixEnv({ version: '3.0', deployment: 'on-premise' });
    await expect(hasAnyTenants()).resolves.toBe(false);
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it('returns false when tenant list is empty (system-admin-only bootstrap)', async () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise' });
    mockedAxios.get.mockResolvedValueOnce({ data: [] });
    await expect(hasAnyTenants()).resolves.toBe(false);
    expect(getTenantUiCapabilities(false).systemAdminOnly).toBe(true);
    expect(getTenantUiCapabilities(false).allowTenantLogin).toBe(false);
  });

  it('returns true when Unomi has tenants', async () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise' });
    mockedAxios.get.mockResolvedValueOnce({
      data: [{ tenantId: 'acme' }],
    });
    await expect(hasAnyTenants()).resolves.toBe(true);
    expect(getTenantUiCapabilities(true).allowTenantLogin).toBe(true);
    expect(getTenantUiCapabilities(true).systemAdminOnly).toBe(false);
  });

  it('returns false when Unomi list call fails', async () => {
    setMatrixEnv({ version: '3.1', deployment: 'on-premise' });
    mockedAxios.get.mockRejectedValueOnce(new Error('network'));
    await expect(hasAnyTenants()).resolves.toBe(false);
  });
});
