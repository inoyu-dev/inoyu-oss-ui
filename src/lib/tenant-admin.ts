import type { NextApiRequest } from 'next';

import type { DeploymentType } from '@/config/feature-flags';
import { getDefaultFeatureFlags } from '@/config/feature-flags';
import { APIError } from '@/middleware/error-handling';

/**
 * Whether tenant management UI and APIs are enabled for this deployment.
 * Explicit TENANT_ADMIN_ENABLED wins; otherwise defaults follow DEPLOYMENT_TYPE.
 */
export function isTenantAdminEnabled(): boolean {
  const explicit = process.env.TENANT_ADMIN_ENABLED;
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return false;
  }
  const deploymentType = (process.env.DEPLOYMENT_TYPE || 'multi-tenant') as DeploymentType;
  return getDefaultFeatureFlags(deploymentType).tenantAdmin;
}

/** Require tenant admin feature; use on /api/tenants/* routes. */
export function requireTenantAdmin(_req?: NextApiRequest): void {
  if (!isTenantAdminEnabled()) {
    throw new APIError(404, 'Tenant management is not available in this deployment');
  }
}
