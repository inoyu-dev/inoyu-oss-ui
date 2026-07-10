import { NextApiRequest } from 'next';
import { verify, JwtPayload } from 'jsonwebtoken';
import { isUnomiV3 } from '@/lib/unomi-config';

interface DecodedToken extends JwtPayload {
  email?: string;
  admin?: boolean;
  tenantId?: string;
  tenant?: string;
}

/**
 * Extracts tenantId from JWT token in request cookies.
 * Falls back to environment variable DEFAULT_TENANT_ID if no token is available.
 * For Unomi V2 compatibility, always returns 'default' tenant.
 * 
 * @param req - Next.js API request object
 * @returns The tenantId string
 */
export function getTenantId(req: NextApiRequest): string {
  // Unomi V2 doesn't support multi-tenancy, always use default tenant
  if (!isUnomiV3()) {
    return 'default';
  }
  
  // First, try to get tenantId from JWT token
  const token = req.cookies?.token;
  
  if (token && process.env.JWT_SECRET) {
    try {
      const decoded = verify(token, process.env.JWT_SECRET) as DecodedToken;
      // Check for tenantId or tenant field in the token
      const tenantId = decoded.tenantId || decoded.tenant;
      if (tenantId) {
        return tenantId;
      }
    } catch (error) {
      // If token verification fails, log but continue to fallback
      console.warn('Failed to verify JWT token, falling back to default tenant:', error);
    }
  }
  
  // Fallback to environment variable
  return process.env.DEFAULT_TENANT_ID || 'default';
}
