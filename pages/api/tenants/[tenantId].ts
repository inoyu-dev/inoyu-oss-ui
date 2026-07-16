import type { NextApiResponse } from 'next';
import axios from 'axios';

import { createHandler, APIError } from '@/lib/api-middleware';
import {
  assertTenantAdminAccess,
  fromUnomiTenant,
  rethrowUnomiError,
  systemAuthConfig,
  toUnomiTenantRequest,
  type UnomiTenant,
} from '@/lib/tenant-api';
import type { TenantRequest } from '@/services/client/TenantService';

export default createHandler({
  methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
  handler: async (req, res: NextApiResponse) => {
    assertTenantAdminAccess(req);
    const { config, auth, headers } = systemAuthConfig();

    const { tenantId } = req.query;
    if (!tenantId || typeof tenantId !== 'string') {
      throw new APIError(400, 'Tenant ID is required');
    }

    if (req.method === 'GET') {
      try {
        const response = await axios.get<UnomiTenant>(`${config.baseUrl}/cxs/tenants/${tenantId}`, {
          auth,
          headers,
        });
        return res.status(200).json(fromUnomiTenant(response.data));
      } catch (error) {
        rethrowUnomiError(error, 'Failed to get tenant');
      }
    }

    if (req.method === 'PUT' || req.method === 'PATCH') {
      const tenantRequest = req.body as Partial<TenantRequest>;
      const unomiBody = toUnomiTenantRequest(tenantRequest);
      try {
        const response = await axios.put<UnomiTenant>(
          `${config.baseUrl}/cxs/tenants/${tenantId}`,
          unomiBody,
          { auth, headers }
        );
        return res.status(200).json(fromUnomiTenant(response.data));
      } catch (error) {
        rethrowUnomiError(error, 'Failed to update tenant');
      }
    }

    try {
      await axios.delete(`${config.baseUrl}/cxs/tenants/${tenantId}`, { auth });
      return res.status(204).end();
    } catch (error) {
      rethrowUnomiError(error, 'Failed to delete tenant');
    }
  },
});
