/**
 * Admin authentication utilities
 * Checks if the current user has admin privileges
 */

import { verify } from 'jsonwebtoken';
import { NextApiRequest } from 'next';
import { DecodedToken } from '@/lib/api-auth';
import { APIError } from '@/middleware/error-handling';

export interface AdminUser extends DecodedToken {
  email: string;
  admin: boolean;
}

/**
 * Check if the current request is from an admin user
 */
export function isAdmin(req: NextApiRequest): boolean {
  const token = req.cookies.token;

  if (!token) {
    return false;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as AdminUser;
    return decoded.admin === true;
  } catch {
    return false;
  }
}

/**
 * Require admin access - throws APIError if not admin.
 * Compatible with createHandler's withErrorHandling middleware.
 */
export function requireAdmin(req: NextApiRequest): AdminUser {
  const token = req.cookies.token;

  if (!token) {
    throw new APIError(401, 'Authentication required');
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET as string) as AdminUser;
    if (!decoded.admin) {
      throw new APIError(403, 'Admin access required');
    }
    return decoded;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(401, 'Invalid token');
  }
}
