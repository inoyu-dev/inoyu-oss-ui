import type { NextApiResponse } from 'next';

import { createHandler, APIError } from '@/lib/api-middleware';
import {
  assertTenantAdminAccess,
  generateTenantApiKeys,
  rethrowUnomiError,
} from '@/lib/tenant-api';
import { rememberTenantApiKeys } from '@/lib/unomi-config';

export default createHandler({
  methods: ['POST'],
  handler: async (req, res: NextApiResponse) => {
    assertTenantAdminAccess(req);

    const { tenantId } = req.query;
    if (!tenantId || typeof tenantId !== 'string') {
      throw new APIError(400, 'Tenant ID is required');
    }

    try {
      const keys = await generateTenantApiKeys(tenantId);
      rememberTenantApiKeys(tenantId, keys);
      return res.status(200).json({
        ...keys,
        saved: true,
      });
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      rethrowUnomiError(error, 'Failed to generate API keys');
    }
  },
});
