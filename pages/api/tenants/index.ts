import type { NextApiResponse } from 'next';
import axios from 'axios';

import { createHandler, APIError } from '@/lib/api-middleware';
import {
  assertTenantAdminAccess,
  fromUnomiTenant,
  isSystemTenant,
  rethrowUnomiError,
  systemAuthConfig,
  toUnomiTenantRequest,
  type UnomiTenant,
} from '@/lib/tenant-api';
import type { Tenant, TenantRequest } from '@/services/client/TenantService';

export type { Tenant, TenantRequest };

export default createHandler({
  methods: ['GET', 'POST'],
  handler: async (req, res: NextApiResponse) => {
    assertTenantAdminAccess(req);
    const { config, auth, headers } = systemAuthConfig();

    if (req.method === 'GET') {
      try {
        const response = await axios.get<UnomiTenant[]>(`${config.baseUrl}/cxs/tenants`, {
          auth,
          headers,
        });
        const tenants = (response.data || [])
          .filter((tenant) => !isSystemTenant(tenant))
          .map(fromUnomiTenant);
        return res.status(200).json(tenants);
      } catch (error) {
        rethrowUnomiError(error, 'Failed to list tenants');
      }
    }

    const tenantRequest = req.body as TenantRequest;
    if (!tenantRequest?.requestedId?.trim()) {
      throw new APIError(400, 'Tenant ID is required');
    }

    const unomiBody = toUnomiTenantRequest(tenantRequest);
    try {
      const response = await axios.post<UnomiTenant>(`${config.baseUrl}/cxs/tenants`, unomiBody, {
        auth,
        headers,
      });
      return res.status(201).json(fromUnomiTenant(response.data));
    } catch (error) {
      rethrowUnomiError(error, 'Failed to create tenant');
    }
  },
});
