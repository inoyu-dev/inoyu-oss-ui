import type { NextApiResponse } from 'next';

import { createHandler } from '@/lib/api-middleware';
import { requireTenantAdmin } from '@/lib/tenant-admin';
import { requireAdmin } from '@/utils/admin-auth';

export default createHandler({
  methods: ['POST'],
  handler: async (req, res: NextApiResponse) => {
    requireTenantAdmin(req);
    requireAdmin(req);

    res.setHeader('Set-Cookie', [
      'admin_tenant_context=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax',
    ]);

    return res.status(200).json({ success: true });
  },
});
