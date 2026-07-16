import type { NextApiResponse } from 'next';
import axios, { type AxiosError } from 'axios';
import { createHandler } from '@/lib/api-middleware';
import {
  getUnomiConfig,
  getTenantContextFromRequest,
  isUnomiV3,
  hasV3Credentials,
  supportsTenants,
  getSessionTenantIdFromToken,
} from '@/lib/unomi-config';
import { isTenantAdminEnabled, isTenantAdminUiEnabled } from '@/lib/tenant-admin';

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
    const tenantsSupported = supportsTenants();
    const hasCredentials = hasV3Credentials(req);
    const tenantId = config.tenantId;
    const tenantAdminEnabled = isTenantAdminUiEnabled();
    const deploymentTenantAdmin = isTenantAdminEnabled();

    const adminContext = tenantAdminEnabled ? getTenantContextFromRequest(req) : null;
    const sessionTenantId = getSessionTenantIdFromToken(req);

    let activeTenant: {
      tenantId: string;
      name?: string;
      source: 'context' | 'default' | 'session';
    } | null = null;

    if (adminContext?.tenantId) {
      activeTenant = {
        tenantId: adminContext.tenantId,
        name: adminContext.name,
        source: 'context',
      };
    } else if (sessionTenantId) {
      activeTenant = {
        tenantId: sessionTenantId,
        source: 'session',
      };
    } else if (tenantId) {
      activeTenant = {
        tenantId,
        source: 'default',
      };
    }

    if (!tenantsSupported) {
      return res.status(200).json({
        tenantId: null,
        version: config.version,
        isV3,
        supportsTenants: false,
        hasCredentials: false,
        tenantAvailable: true,
        tenantExists: false,
        tenantAdminEnabled: false,
        deploymentTenantAdmin,
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

    // On-prem with no tenant yet: not an error when admin UI can create one
    if (tenantAdminEnabled && !tenantId) {
      tenantAvailable = true;
    }

    // SaaS: tenant comes from JWT — missing tenant is not a UNOMI_TENANT_ID config error
    if (!tenantAdminEnabled && !tenantId) {
      tenantAvailable = true;
    }

    return res.status(200).json({
      tenantId: tenantId || null,
      version: config.version,
      isV3: true,
      supportsTenants: true,
      hasCredentials,
      tenantAvailable,
      tenantExists,
      tenantHasApiKeys,
      tenantAdminEnabled,
      deploymentTenantAdmin,
      activeTenant,
    });
  },
});
