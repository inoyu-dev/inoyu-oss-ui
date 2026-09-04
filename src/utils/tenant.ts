import { NextApiRequest } from 'next';
import { verify, JwtPayload } from 'jsonwebtoken';
import { DEFAULT_DEPLOYMENT_TYPE } from '@/config/env-defaults';
import type { DeploymentType } from '@/config/feature-flags';
import { isUnomiV3 } from '@/lib/unomi-config';
import { APIError } from '@/middleware/error-handling';
import { isPlaceholderTenantId } from '@/utils/tenant-ids';

export { isPlaceholderTenantId } from '@/utils/tenant-ids';

interface DecodedToken extends JwtPayload {
  email?: string;
  admin?: boolean;
  tenantId?: string;
  tenant?: string;
}

function headerTenantId(req: NextApiRequest): string | undefined {
  const rawHeader = req.headers['x-tenant-id'] ?? req.headers['x-inoyu-tenant-id'];
  const raw = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
  if (typeof raw !== 'string') {
    return undefined;
  }
  const trimmed = raw.trim();
  return trimmed || undefined;
}

function sessionTenantId(req: NextApiRequest): string | undefined {
  const token = req.cookies?.token;
  if (!token || !process.env.JWT_SECRET) {
    return undefined;
  }
  try {
    const decoded = verify(token, process.env.JWT_SECRET) as DecodedToken;
    const tenantId = decoded.tenantId || decoded.tenant;
    return tenantId?.trim() || undefined;
  } catch (error) {
    console.warn('Failed to verify JWT token while resolving tenant:', error);
    return undefined;
  }
}

/**
 * SaaS / hybrid Unomi 3+ must never silently fall back to `default`.
 * On-prem keeps the legacy default-tenant path for single-tenant operators.
 */
export function mustRejectPlaceholderTenant(): boolean {
  if (!isUnomiV3()) {
    return false;
  }
  const deploymentType = (process.env.DEPLOYMENT_TYPE || DEFAULT_DEPLOYMENT_TYPE) as DeploymentType;
  switch (deploymentType) {
    case 'on-premise':
      return false;
    case 'multi-tenant':
    case 'hybrid':
      return true;
    default: {
      const _exhaustive: never = deploymentType;
      return _exhaustive;
    }
  }
}

/**
 * Extracts tenantId from the request.
 * Session JWT wins over `x-tenant-id` so a caller cannot hop tenants with a header.
 * Unomi V2 always returns `default`.
 */
export function getTenantId(req: NextApiRequest): string {
  if (!isUnomiV3()) {
    return 'default';
  }

  const fromSession = sessionTenantId(req);
  if (fromSession && !isPlaceholderTenantId(fromSession)) {
    return fromSession;
  }

  const fromHeader = headerTenantId(req);
  if (fromHeader && !isPlaceholderTenantId(fromHeader)) {
    return fromHeader;
  }

  return process.env.DEFAULT_TENANT_ID || 'default';
}

/**
 * Require a real Unomi tenant id (Launch P4.6).
 * Throws 401 on SaaS/hybrid when the resolved tenant is missing or `default`/`system`.
 */
export function requireScopedTenantId(req: NextApiRequest): string {
  const tenantId = getTenantId(req);
  if (mustRejectPlaceholderTenant() && isPlaceholderTenantId(tenantId)) {
    throw new APIError(
      401,
      'Tenant scope required. Re-open CDP from SaaS or pass X-Inoyu-Tenant-Id.',
    );
  }
  return tenantId;
}
