/**
 * Shared helpers for /api/tenants/* routes (system-credential Unomi calls).
 */

import axios, { type AxiosError } from 'axios';
import type { NextApiRequest } from 'next';

import { APIError } from '@/middleware/error-handling';
import { getUnomiConfig, supportsTenants } from '@/lib/unomi-config';
import { requireTenantAdmin } from '@/lib/tenant-admin';
import { requireAdmin } from '@/utils/admin-auth';
import type { Tenant } from '@/services/client/TenantService';

interface UnomiApiKey {
  keyType: 'PUBLIC' | 'PRIVATE';
  key?: string;
  maskedKey?: string;
  creationDate?: string;
  revoked?: boolean;
}

/** Unomi 3.1+ returns plaintext once via ApiKeyCreationResult.plainTextKey. */
interface UnomiApiKeyCreationResult {
  apiKey?: UnomiApiKey;
  plainTextKey?: string;
  /** Legacy shape before ApiKeyCreationResult */
  key?: string;
  keyType?: 'PUBLIC' | 'PRIVATE';
}

export interface UnomiTenant {
  itemId: string;
  itemType?: string;
  tenantId?: string;
  name?: string;
  description?: string;
  status?: string;
  properties?: Record<string, unknown>;
  apiKeys?: UnomiApiKey[];
  creationDate?: string;
  lastModificationDate?: string;
  publicApiKey?: string;
  privateApiKey?: string;
}

/**
 * Unomi TenantRequest accepts only `requestedId` and `properties`.
 * UI may send a convenience top-level `name`; fold it into properties.
 */
export function toUnomiTenantRequest(input: {
  requestedId?: string;
  name?: string;
  properties?: Record<string, unknown>;
}): { requestedId?: string; properties?: Record<string, unknown> } {
  const { requestedId, name, properties } = input;
  const trimmedName = name?.trim();
  const mergedProperties =
    trimmedName || properties
      ? {
          ...properties,
          ...(trimmedName ? { name: trimmedName } : {}),
        }
      : undefined;

  return {
    ...(requestedId !== undefined ? { requestedId } : {}),
    ...(mergedProperties && Object.keys(mergedProperties).length > 0
      ? { properties: mergedProperties }
      : {}),
  };
}

/**
 * Adapt Unomi's persistence model to the tenant model exposed to the browser.
 * Unomi's `tenantId` is the owning persistence tenant (`system`); `itemId` is
 * the managed tenant's actual identifier.
 */
export function fromUnomiTenant(tenant: UnomiTenant): Tenant {
  const propertyName = tenant.properties?.['name'];
  const keys = extractRawApiKeys(tenant);

  return {
    tenantId: tenant.itemId,
    itemId: tenant.itemId,
    name: tenant.name || (typeof propertyName === 'string' ? propertyName : undefined),
    description: tenant.description,
    status: tenant.status,
    properties: tenant.properties,
    publicApiKey: keys?.publicApiKey,
    privateApiKey: keys?.privateApiKey,
    apiKeys: tenant.apiKeys?.map((apiKey) => ({
      type: apiKey.keyType,
      key: apiKey.key,
      maskedKey: apiKey.maskedKey,
      createdAt: apiKey.creationDate,
      revoked: apiKey.revoked,
    })),
    createdAt: tenant.creationDate,
    updatedAt: tenant.lastModificationDate,
  };
}

/**
 * Raw key material is only present on create/generate responses.
 * Subsequent GET /cxs/tenants/{id} returns maskedKey only.
 */
export function extractRawApiKeys(tenant: UnomiTenant): {
  publicApiKey: string;
  privateApiKey: string;
} | null {
  let publicApiKey = tenant.publicApiKey;
  let privateApiKey = tenant.privateApiKey;

  for (const apiKey of tenant.apiKeys || []) {
    if (apiKey.revoked || !apiKey.key) {
      continue;
    }
    if (apiKey.keyType === 'PUBLIC') {
      publicApiKey = apiKey.key;
    } else if (apiKey.keyType === 'PRIVATE') {
      privateApiKey = apiKey.key;
    }
  }

  if (!publicApiKey || !privateApiKey) {
    return null;
  }

  return { publicApiKey, privateApiKey };
}

/**
 * Generate a fresh PUBLIC + PRIVATE key pair for a tenant (system credentials).
 * Unomi returns the raw key once as ApiKeyCreationResult.plainTextKey.
 */
export async function generateTenantApiKeys(tenantId: string): Promise<{
  publicApiKey: string;
  privateApiKey: string;
}> {
  const { config, auth, headers } = systemAuthConfig();
  const url = `${config.baseUrl}/cxs/tenants/${tenantId}/apikeys`;

  // Sequential: Unomi replaces keys per type and persists the tenant document.
  const publicResponse = await axios.post<UnomiApiKeyCreationResult>(
    url,
    {},
    { auth, headers, params: { type: 'PUBLIC' } }
  );
  const privateResponse = await axios.post<UnomiApiKeyCreationResult>(
    url,
    {},
    { auth, headers, params: { type: 'PRIVATE' } }
  );

  const publicApiKey = readPlainTextApiKey(publicResponse.data);
  const privateApiKey = readPlainTextApiKey(privateResponse.data);
  if (!publicApiKey || !privateApiKey) {
    throw new APIError(502, 'Failed to generate tenant API keys: invalid Unomi response');
  }

  return { publicApiKey, privateApiKey };
}

export function readPlainTextApiKey(
  result: UnomiApiKeyCreationResult | undefined
): string | undefined {
  if (!result) {
    return undefined;
  }
  return result.plainTextKey || result.key;
}

export function assertTenantAdminAccess(req: NextApiRequest): void {
  requireTenantAdmin(req);
  requireAdmin(req);
  if (!supportsTenants()) {
    throw new APIError(400, 'Tenant management requires Unomi 3.1+');
  }
}

export function systemAuthConfig() {
  const config = getUnomiConfig();
  return {
    config,
    auth: {
      username: config.systemUser,
      password: config.systemPassword,
    },
    headers: { 'Content-Type': 'application/json' as const },
  };
}

export function rethrowUnomiError(error: unknown, fallbackMessage: string): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    if (axiosError.response) {
      const data = axiosError.response.data;
      const details =
        data !== null && typeof data === 'object' && !Array.isArray(data)
          ? (data as Record<string, unknown>)
          : { response: data };
      throw new APIError(axiosError.response.status, fallbackMessage, details);
    }
  }
  throw error;
}

export function isSystemTenant(tenant: {
  itemId?: string;
  properties?: Record<string, unknown>;
}): boolean {
  const tenantId = tenant.itemId?.toLowerCase() || '';
  return (
    tenantId === 'system' ||
    tenantId === 'default' ||
    tenantId.startsWith('_system') ||
    tenantId.startsWith('_internal') ||
    tenant.properties?.['system'] === true ||
    tenant.properties?.['internal'] === true
  );
}
