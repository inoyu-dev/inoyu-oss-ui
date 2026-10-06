import type { NextApiRequest } from 'next';
import { isTenantAdminEnabled } from '@/lib/tenant-admin';
import { APIError } from '@/middleware/error-handling';
import { mustRejectPlaceholderTenant, requireScopedTenantId } from '@/utils/tenant';

export function isUnomiSystemEndpoint(endpoint: string): boolean {
  return endpoint.includes('/tenants') || endpoint.includes('/system');
}

/**
 * SaaS CXS proxy must not be anonymous, must not use `default`,
 * and must not expose Unomi /tenants|/system through the catch-all.
 */
export function assertCxsRequestIsolation(req: NextApiRequest, endpoint: string): void {
  const system = isUnomiSystemEndpoint(endpoint);
  if (system && !isTenantAdminEnabled()) {
    throw new APIError(403, 'System Unomi endpoints are not available in this deployment');
  }
  if (!system && mustRejectPlaceholderTenant()) {
    requireScopedTenantId(req);
  }
}

/** True when SaaS/hybrid Unomi 4.0+ must not fall back to karaf system credentials. */
export function mustUseTenantUnomiCredentials(endpoint: string): boolean {
  if (isUnomiSystemEndpoint(endpoint)) {
    return false;
  }
  return mustRejectPlaceholderTenant();
}
