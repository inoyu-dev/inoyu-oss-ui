import type { DecodedToken } from './api-auth';

/**
 * Configuration for connecting to Unomi CDP (version 3).
 * Supports both API key authentication and legacy system user authentication.
 */
export interface UnomiV3Config {
  /** Unomi version (should be '3' for V3) */
  version: string;
  /** Public API key for event collection endpoints */
  publicApiKey?: string;
  /** Private API key for administrative endpoints */
  privateApiKey?: string;
  /** Tenant ID for multi-tenant deployments */
  tenantId?: string;
  /** Base URL of the Unomi server */
  baseUrl: string;
  /** System username for legacy authentication */
  systemUser: string;
  /** System password for legacy authentication */
  systemPassword: string;
}

type RequestWithCookies = { cookies?: Partial<{ [key: string]: string }> };

interface TenantApiKeys {
  publicApiKey?: string;
  privateApiKey?: string;
}

interface CachedTenantKeys extends TenantApiKeys {
  expiresAt: number;
}

/** Server-side cache TTL for tenant API keys fetched via system credentials. */
const TENANT_KEY_CACHE_TTL_MS = 5 * 60 * 1000;

const tenantKeyCache = new Map<string, CachedTenantKeys>();

function decodeSessionToken(req?: RequestWithCookies): DecodedToken | null {
  if (!req?.cookies) {
    return null;
  }

  const token = req.cookies.token;
  if (!token || !process.env.JWT_SECRET) {
    return null;
  }

  try {
    // Lazy import to avoid circular dependencies
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { verify } = require('jsonwebtoken');
    return verify(token, process.env.JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

/**
 * Whether the session JWT should drive Unomi tenant isolation.
 * Includes tenant users and external sessions (Open CDP handoff, external-login).
 */
function shouldUseSessionTenantForUnomi(decoded: DecodedToken | null): boolean {
  if (!decoded?.tenantId) {
    return false;
  }
  if (!decoded.admin) {
    return true;
  }
  return decoded.external === true;
}

/**
 * Get tenant ID from JWT when the session is tenant-scoped for Unomi.
 */
function getSessionTenantIdFromToken(req?: RequestWithCookies): string | null {
  const decoded = decodeSessionToken(req);
  if (!shouldUseSessionTenantForUnomi(decoded)) {
    return null;
  }
  return decoded!.tenantId!;
}

function getCachedTenantKeys(tenantId: string): TenantApiKeys | null {
  const entry = tenantKeyCache.get(tenantId);
  if (!entry) {
    return null;
  }
  if (entry.expiresAt <= Date.now()) {
    tenantKeyCache.delete(tenantId);
    return null;
  }
  return {
    publicApiKey: entry.publicApiKey,
    privateApiKey: entry.privateApiKey,
  };
}

function setCachedTenantKeys(tenantId: string, keys: TenantApiKeys): void {
  tenantKeyCache.set(tenantId, {
    ...keys,
    expiresAt: Date.now() + TENANT_KEY_CACHE_TTL_MS,
  });
}

function extractApiKeysFromTenant(tenant: {
  publicApiKey?: string;
  privateApiKey?: string;
  apiKeys?: Array<{ type?: string; key?: string }>;
}): TenantApiKeys | null {
  let publicApiKey = tenant.publicApiKey;
  let privateApiKey = tenant.privateApiKey;

  if (tenant.apiKeys && Array.isArray(tenant.apiKeys)) {
    for (const apiKey of tenant.apiKeys) {
      if (apiKey.type === 'PUBLIC' && apiKey.key) {
        publicApiKey = apiKey.key;
      } else if (apiKey.type === 'PRIVATE' && apiKey.key) {
        privateApiKey = apiKey.key;
      }
    }
  }

  if (!publicApiKey && !privateApiKey) {
    return null;
  }

  return { publicApiKey, privateApiKey };
}

/**
 * Fetch tenant API keys from Unomi using system credentials.
 * IMPORTANT: server-side only; /cxs/tenants/* requires system credentials.
 */
async function fetchTenantApiKeys(tenantId: string): Promise<TenantApiKeys | null> {
  if (typeof window !== 'undefined') {
    console.warn('fetchTenantApiKeys should only be called server-side');
    return null;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_UNOMI_URL || 'http://localhost:8181';
    const systemUser = process.env.UNOMI_USER || 'karaf';
    const systemPassword = process.env.UNOMI_PASSWORD || 'karaf';

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const axios = require('axios');
    const response = await axios.get(`${baseUrl}/cxs/tenants/${tenantId}`, {
      auth: {
        username: systemUser,
        password: systemPassword,
      },
    });

    return extractApiKeysFromTenant(response.data ?? {});
  } catch (error) {
    console.error(`Error fetching API keys for tenant ${tenantId}:`, error);
    return null;
  }
}

async function getTenantApiKeys(tenantId: string): Promise<TenantApiKeys | null> {
  const cached = getCachedTenantKeys(tenantId);
  if (cached?.publicApiKey && cached?.privateApiKey) {
    return cached;
  }

  const keys = await fetchTenantApiKeys(tenantId);
  if (keys) {
    setCachedTenantKeys(tenantId, keys);
  }
  return keys;
}

// Lazy import to avoid circular dependencies
let getRuntimeConfig: (() => { publicApiKey?: string; privateApiKey?: string; tenantId?: string }) | null = null;

/**
 * Set the runtime config getter (called from tenant-initialization)
 */
export function setRuntimeConfigGetter(getter: () => { publicApiKey?: string; privateApiKey?: string; tenantId?: string }) {
  getRuntimeConfig = getter;
}

function getRuntimeTenantConfig(): { publicApiKey?: string; privateApiKey?: string; tenantId?: string } {
  return getRuntimeConfig ? getRuntimeConfig() : {};
}

function runtimeKeysApplyToTenant(tenantId: string | undefined): boolean {
  if (!tenantId) {
    return false;
  }
  const runtimeConfig = getRuntimeTenantConfig();
  return runtimeConfig.tenantId === tenantId;
}

/**
 * Get tenant context from request (for server-side use)
 * Checks for admin "login as tenant" context in cookies
 */
export function getTenantContextFromRequest(req?: RequestWithCookies): { tenantId?: string; publicApiKey?: string; privateApiKey?: string } | null {
  if (!req?.cookies) {
    return null;
  }

  try {
    const contextStr = req.cookies['admin_tenant_context'];
    if (contextStr) {
      return JSON.parse(contextStr);
    }
  } catch {
    // Ignore parse errors
  }

  return null;
}

export function getUnomiConfig(req?: RequestWithCookies): UnomiV3Config {
  // Priority order for tenant context:
  // 1. Admin "login as tenant" context (from cookies/localStorage)
  // 2. Session JWT tenantId (tenant users + external handoff sessions)
  // 3. Runtime config (startup initialization)
  // 4. Environment variables

  let adminTenantContext: { tenantId?: string; publicApiKey?: string; privateApiKey?: string } | null = null;
  let sessionTenantId: string | null = null;

  if (req) {
    adminTenantContext = getTenantContextFromRequest(req);
    sessionTenantId = getSessionTenantIdFromToken(req);
  } else if (typeof window !== 'undefined') {
    try {
      const contextStr = localStorage.getItem('admin_tenant_context');
      if (contextStr) {
        adminTenantContext = JSON.parse(contextStr);
      }
    } catch {
      // Ignore parse errors
    }
  }

  const runtimeConfig = getRuntimeTenantConfig();
  const tenantId =
    adminTenantContext?.tenantId ||
    sessionTenantId ||
    runtimeConfig.tenantId ||
    process.env.UNOMI_TENANT_ID;

  const useRuntimeKeys = runtimeKeysApplyToTenant(tenantId);

  return {
    version: process.env.UNOMI_VERSION || '3',
    publicApiKey: adminTenantContext?.publicApiKey || (useRuntimeKeys ? runtimeConfig.publicApiKey : undefined),
    privateApiKey: adminTenantContext?.privateApiKey || (useRuntimeKeys ? runtimeConfig.privateApiKey : undefined),
    tenantId,
    baseUrl: process.env.NEXT_PUBLIC_UNOMI_URL || 'http://localhost:8181',
    systemUser: process.env.UNOMI_USER || 'karaf',
    systemPassword: process.env.UNOMI_PASSWORD || 'karaf',
  };
}

export function isUnomiV3(): boolean {
  return getUnomiConfig().version === '3';
}

/**
 * True when V3 tenant credentials are available or can be resolved for this request.
 */
export function hasV3Credentials(req?: RequestWithCookies): boolean {
  const config = getUnomiConfig(req);
  if (!config.tenantId) {
    return false;
  }
  if (config.publicApiKey && config.privateApiKey) {
    return true;
  }

  if (req && typeof window === 'undefined') {
    const adminContext = getTenantContextFromRequest(req);
    const decoded = decodeSessionToken(req);
    if (adminContext?.tenantId || shouldUseSessionTenantForUnomi(decoded)) {
      return true;
    }
    if (runtimeKeysApplyToTenant(config.tenantId)) {
      return true;
    }
  }

  const globalConfig = getUnomiConfig();
  return !!(globalConfig.publicApiKey && globalConfig.privateApiKey && globalConfig.tenantId);
}

async function resolveTenantKeys(
  config: UnomiV3Config,
  req?: RequestWithCookies,
): Promise<TenantApiKeys | null> {
  if (!config.tenantId) {
    return null;
  }

  if (config.publicApiKey && config.privateApiKey) {
    return {
      publicApiKey: config.publicApiKey,
      privateApiKey: config.privateApiKey,
    };
  }

  if (!req || typeof window !== 'undefined') {
    return null;
  }

  return getTenantApiKeys(config.tenantId);
}

export async function getAuthHeaders(endpoint: string, req?: RequestWithCookies): Promise<Record<string, string>> {
  const config = getUnomiConfig(req);

  if (!isUnomiV3()) {
    return {};
  }

  if (endpoint.includes('/context.json') || endpoint.includes('/eventcollector')) {
    if (config.publicApiKey) {
      return {
        'X-Unomi-Api-Key': config.publicApiKey,
      };
    }

    if (config.tenantId && req && typeof window === 'undefined') {
      const keys = await resolveTenantKeys(config, req);
      if (keys?.publicApiKey) {
        return {
          'X-Unomi-Api-Key': keys.publicApiKey,
        };
      }
    }
  }

  return {};
}

export async function getAuthCredentials(endpoint: string, req?: RequestWithCookies): Promise<{ username: string; password: string } | null> {
  const config = getUnomiConfig(req);

  if (!isUnomiV3()) {
    return {
      username: config.systemUser,
      password: config.systemPassword,
    };
  }

  if (!endpoint.includes('/context.json') && !endpoint.includes('/eventcollector')) {
    if (config.privateApiKey && config.tenantId) {
      return {
        username: config.tenantId,
        password: config.privateApiKey,
      };
    }

    if (config.tenantId && req && typeof window === 'undefined') {
      const keys = await resolveTenantKeys(config, req);
      if (keys?.privateApiKey) {
        return {
          username: config.tenantId,
          password: keys.privateApiKey,
        };
      }
    }

    return {
      username: config.systemUser,
      password: config.systemPassword,
    };
  }

  return null;
}

/**
 * Warm the server-side tenant key cache (e.g. after Open CDP handoff).
 * Failures are logged but do not block the caller.
 */
export async function prefetchTenantApiKeys(tenantId: string): Promise<void> {
  try {
    await getTenantApiKeys(tenantId);
  } catch (error) {
    console.warn(`Failed to prefetch API keys for tenant ${tenantId}:`, error);
  }
}
