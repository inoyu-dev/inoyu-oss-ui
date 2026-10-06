/**
 * API: GET /api/config/unomi-plugins
 * Returns which registered Unomi OSGi plugins respond to their probe paths.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { createHandler } from '@/lib/api-middleware';
import {
  probeAllUnomiPluginsWithMeta,
  type UnomiPluginsResponse,
} from '@/lib/unomi-plugin-registry';

let cache: UnomiPluginsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_MS = 60_000;

export default createHandler({
  methods: ['GET'],
  handler: async (req: NextApiRequest, res: NextApiResponse) => {
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
    const now = Date.now();

    if (!forceRefresh && cache && now - cacheTimestamp < CACHE_MS) {
      return res.status(200).json(cache);
    }

    const { plugins, source } = await probeAllUnomiPluginsWithMeta(req);
    cache = {
      plugins,
      source,
      probedAt: new Date().toISOString(),
    };
    cacheTimestamp = now;

    return res.status(200).json(cache);
  },
});
