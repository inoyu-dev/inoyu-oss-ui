import { NextApiRequest, NextApiResponse } from 'next';
import { verify, JwtPayload } from 'jsonwebtoken';

export interface DecodedToken extends JwtPayload {
  email?: string;
  admin?: boolean;
  // Tenant user information
  tenantId?: string;
  tenantApiKey?: string; // For future use - API key for tenant operations
  // External login information
  external?: boolean; // Indicates this token came from an external system
  userId?: string; // User ID from external system
  name?: string; // User name
}

/**
 * Verify authentication for API routes
 * Checks for JWT token in cookies and verifies it
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Decoded token if authenticated, null otherwise
 */
export function verifyApiAuth(
  req: NextApiRequest,
  _res: NextApiResponse
): DecodedToken | null {
  void _res; // Required by API route signature but not used in verification
  const token = req.cookies.token;

  if (!token) {
    return null;
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not configured');
    return null;
  }

  try {
    const decoded = verify(token, process.env.JWT_SECRET) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
}

/**
 * Require authentication for API routes
 * Returns 401 if not authenticated
 * 
 * @param req - Next.js API request
 * @param res - Next.js API response
 * @returns Decoded token if authenticated, null if not (and response is sent)
 */
export function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): DecodedToken | null {
  const decoded = verifyApiAuth(req, res);

  if (!decoded) {
    res.status(401).json({ error: 'Unauthorized' });
    return null;
  }

  return decoded;
}
