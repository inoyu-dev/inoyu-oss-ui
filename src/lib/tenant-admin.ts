import type { NextApiRequest } from 'next';

import type { DeploymentType } from '@/config/feature-flags';
import { getDefaultFeatureFlags } from '@/config/feature-flags';
import { DEFAULT_DEPLOYMENT_TYPE } from '@/config/env-defaults';
import { APIError } from '@/middleware/error-handling';
import { supportsTenants } from '@/lib/unomi-config';

/**
 * Whether tenant management is enabled for this deployment type.
 * Explicit TENANT_ADMIN_ENABLED wins; otherwise defaults follow DEPLOYMENT_TYPE.
 * Does not check Unomi version — compose with supportsTenants() / isTenantAdminUiEnabled().
 */
export function isTenantAdminEnabled(): boolean {
  const explicit = process.env.TENANT_ADMIN_ENABLED;
  if (explicit === 'true') {
    return true;
  }
  if (explicit === 'false') {
    return false;
  }
  const deploymentType = (process.env.DEPLOYMENT_TYPE || DEFAULT_DEPLOYMENT_TYPE) as DeploymentType;
  return getDefaultFeatureFlags(deploymentType).tenantAdmin;
}

/**
 * Show tenant admin UI / APIs only for Unomi >= 3.1 on-prem (managed multi-tenant).
 * SaaS (dynamic multi-tenant) and Unomi &lt; 3.1 never get this chrome.
 */
export function isTenantAdminUiEnabled(): boolean {
  return supportsTenants() && isTenantAdminEnabled();
}

/** Require tenant admin UI feature; use on /api/tenants/* routes. */
export function requireTenantAdmin(_req?: NextApiRequest): void {
  if (!isTenantAdminUiEnabled()) {
    throw new APIError(404, 'Tenant management is not available in this deployment');
  }
}
