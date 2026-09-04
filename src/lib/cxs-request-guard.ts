import type { NextApiRequest } from 'next';
import { isTenantAdminEnabled } from '@/lib/tenant-admin';
import { isUnomiV3 } from '@/lib/unomi-config';
import { APIError } from '@/middleware/error-handling';
import { mustRejectPlaceholderTenant, requireScopedTenantId } from '@/utils/tenant';

export function isUnomiSystemEndpoint(endpoint: string): boolean {
  return endpoint.includes('/tenants') || endpoint.includes('/system');
}

/**
 * Launch P4.6 — SaaS CXS proxy must not be anonymous, must not use `default`,
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

/** True when V3 SaaS/hybrid must not fall back to karaf system credentials. */
export function mustUseTenantUnomiCredentials(endpoint: string): boolean {
  if (!isUnomiV3() || isUnomiSystemEndpoint(endpoint)) {
    return false;
  }
  return mustRejectPlaceholderTenant();
}
