import type { NextApiResponse } from 'next';
import axios, { type AxiosError } from 'axios';
import { createHandler } from '@/lib/api-middleware';
import { getUnomiConfig, getTenantContextFromRequest, isUnomiV3, hasV3Credentials } from '@/lib/unomi-config';
import { isTenantAdminEnabled } from '@/lib/tenant-admin';

async function getTenantDetails(tenantId: string, config = getUnomiConfig()): Promise<{ exists: boolean; hasApiKeys?: boolean }> {
  try {
    const response = await axios.get(`${config.baseUrl}/cxs/tenants/${tenantId}`, {
      auth: {
        username: config.systemUser,
        password: config.systemPassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    if (response.status === 200 && response.data) {
      const tenant = response.data;

      let hasPublicKey = false;
      let hasPrivateKey = false;

      if (tenant.apiKeys && Array.isArray(tenant.apiKeys) && tenant.apiKeys.length > 0) {
        for (const apiKey of tenant.apiKeys) {
          if (apiKey.type === 'PUBLIC' && apiKey.key) {
            hasPublicKey = true;
          } else if (apiKey.type === 'PRIVATE' && apiKey.key) {
            hasPrivateKey = true;
          }
        }
      }

      if (!hasPublicKey && tenant.publicApiKey) {
        hasPublicKey = true;
      }
      if (!hasPrivateKey && tenant.privateApiKey) {
        hasPrivateKey = true;
      }

      return { exists: true, hasApiKeys: hasPublicKey && hasPrivateKey };
    }
    return { exists: false };
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return { exists: false };
    }
    return { exists: false };
  }
}

export default createHandler({
  methods: ['GET'],
  handler: async (req, res: NextApiResponse) => {
    const config = getUnomiConfig(req);
    const isV3 = isUnomiV3();
    const hasCredentials = hasV3Credentials(req);
    const tenantId = config.tenantId;
    const tenantAdminEnabled = isTenantAdminEnabled();
    const adminContext = getTenantContextFromRequest(req);

    const activeTenant = adminContext?.tenantId
      ? {
          tenantId: adminContext.tenantId,
          name: (adminContext as { name?: string }).name,
          source: 'context' as const,
        }
      : tenantId
        ? {
            tenantId,
            source: 'default' as const,
          }
        : null;

    if (!isV3) {
      return res.status(200).json({
        tenantId: null,
        version: config.version,
        isV3: false,
        hasCredentials: false,
        tenantAvailable: true,
        tenantExists: false,
        tenantAdminEnabled,
        activeTenant: null,
      });
    }

    let tenantExists = false;
    let tenantAvailable = false;
    let tenantHasApiKeys = false;

    if (tenantId) {
      const tenantDetails = await getTenantDetails(tenantId, config);
      tenantExists = tenantDetails.exists;
      tenantHasApiKeys = tenantDetails.hasApiKeys || false;
      tenantAvailable = tenantExists;
    }

    return res.status(200).json({
      tenantId: tenantId || null,
      version: config.version,
      isV3: true,
      hasCredentials,
      tenantAvailable,
      tenantExists,
      tenantHasApiKeys,
      tenantAdminEnabled,
      activeTenant,
    });
  },
});
