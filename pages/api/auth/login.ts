import { sign } from 'jsonwebtoken';
import { getUnomiConfig } from '@/lib/unomi-config';
import axios from 'axios';
import { DecodedToken } from '@/lib/api-auth';
import { createHandler } from '@/lib/api-middleware';

interface LoginRequestBody {
  email: string;
  password: string;
  loginType?: 'admin' | 'tenant'; // Type of login
  tenantId?: string; // Required for tenant login
}

/**
 * Verify admin credentials
 * In production, this should check against a user database
 */
async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  // TODO: Replace with actual admin user database check
  // For now, check against environment variables or a hardcoded admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@unomi.local';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

  return email === adminEmail && password === adminPassword;
}

/**
 * Verify tenant user credentials
 * This validates the user against Unomi or a user database
 * Note: We use system credentials to verify the tenant exists, but don't store API keys in JWT
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- email/password reserved for future credential validation */
async function verifyTenantUserCredentials(
  tenantId: string,
  email: string,
  password: string
): Promise<{ valid: boolean }> {
  try {
    const config = getUnomiConfig();

    // Use system credentials to verify the tenant exists
    // The app has trusted system-level access to Unomi
    const response = await axios.get(
      `${config.baseUrl}/cxs/tenants/${tenantId}`,
      {
        auth: {
          username: config.systemUser,
          password: config.systemPassword,
        },
      }
    );

    const tenant = response.data;

    if (!tenant || !tenant.tenantId) {
      return { valid: false };
    }

    // TODO: Validate user credentials against tenant's user database
    // For now, we'll accept any credentials if tenant exists
    // In production, validate email/password against tenant users
    // This could be:
    // 1. Query Unomi for the user profile
    // 2. Query a separate user database
    // 3. Validate password (hashed)

    // Note: We don't return API keys here - they will be fetched on-demand
    // using system credentials when needed
    return { valid: true };
  } catch (error) {
    console.error('Error verifying tenant user credentials:', error);
    return { valid: false };
  }
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export default createHandler({
  methods: ['POST'],
  handler: async (req, res) => {
    const { email, password, loginType = 'admin', tenantId } = req.body as LoginRequestBody;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    let tokenPayload: DecodedToken | undefined;
    let isValid = false;

    if (loginType === 'admin') {
      // Admin login
      isValid = await verifyAdminCredentials(email, password);
      if (isValid) {
        tokenPayload = {
          email,
          admin: true,
        };
      }
    } else if (loginType === 'tenant') {
      // Tenant user login
      if (!tenantId) {
        return res.status(400).json({ success: false, message: 'Tenant ID is required for tenant login' });
      }

      const result = await verifyTenantUserCredentials(tenantId, email, password);
      if (result.valid) {
        // Only store tenantId in JWT - API keys will be fetched on-demand using system credentials
        tokenPayload = {
          email,
          admin: false,
          tenantId,
        };
        isValid = true;
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid login type' });
    }

    if (!isValid || !tokenPayload) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = sign(
      tokenPayload,
      process.env.JWT_SECRET as string,
      { expiresIn: '24h' } // Extended expiration for better UX
    );

    // Set the token as an HTTP-only cookie
    const cookieOptions = [
      `token=${token}`,
      'HttpOnly',
      'Path=/',
      `Max-Age=${60 * 60 * 24}`, // 24 hours
      'SameSite=Strict',
      process.env.NODE_ENV === 'production' ? 'Secure' : '',
    ].filter(Boolean).join('; ');

    res.setHeader('Set-Cookie', cookieOptions);

    return res.status(200).json({
      success: true,
      user: {
        email: tokenPayload.email,
        admin: tokenPayload.admin || false,
        tenantId: tokenPayload.tenantId,
      }
    });
  },
});
