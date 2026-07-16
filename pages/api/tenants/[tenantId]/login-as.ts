import type { NextApiResponse } from 'next';
import axios from 'axios';

import { createHandler, APIError } from '@/lib/api-middleware';
import {
  assertTenantAdminAccess,
  extractRawApiKeys,
  fromUnomiTenant,
  generateTenantApiKeys,
  rethrowUnomiError,
  systemAuthConfig,
  type UnomiTenant,
} from '@/lib/tenant-api';
import {
  getRememberedTenantApiKeys,
  rememberTenantApiKeys,
} from '@/lib/unomi-config';

export default createHandler({
  methods: ['POST'],
  handler: async (req, res: NextApiResponse) => {
    assertTenantAdminAccess(req);
    const { config, auth, headers } = systemAuthConfig();

    const { tenantId } = req.query;
    if (!tenantId || typeof tenantId !== 'string') {
      throw new APIError(400, 'Tenant ID is required');
    }

    try {
      const tenantResponse = await axios.get<UnomiTenant>(
        `${config.baseUrl}/cxs/tenants/${tenantId}`,
        { auth, headers }
      );
      const tenant = fromUnomiTenant(tenantResponse.data);

      let keys = getRememberedTenantApiKeys(tenantId) || extractRawApiKeys(tenantResponse.data);
      if (!keys) {
        keys = await generateTenantApiKeys(tenantId);
      }
      rememberTenantApiKeys(tenantId, keys);

      res.setHeader('Set-Cookie', [
        `admin_tenant_context=${JSON.stringify({
          tenantId: tenant.tenantId,
          publicApiKey: keys.publicApiKey,
          privateApiKey: keys.privateApiKey,
          name: tenant.name,
          switchedAt: new Date().toISOString(),
        })}; Path=/; Max-Age=86400; HttpOnly; SameSite=Lax`,
      ]);

      return res.status(200).json({
        tenantId: tenant.tenantId,
        publicApiKey: keys.publicApiKey,
        privateApiKey: keys.privateApiKey,
        name: tenant.name,
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      rethrowUnomiError(error, 'Failed to get tenant credentials');
    }
  },
});
