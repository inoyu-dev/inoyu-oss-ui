import { createHandler } from '@/lib/api-middleware';
import { getUnomiConfig } from '@/lib/unomi-config';

export default createHandler({
  methods: ['GET'],
  handler: async (_req, res) => {
    const config = getUnomiConfig();
    const url = `${config.baseUrl}/cxs/cluster`;
    try {
      const auth = Buffer.from(
        `${config.systemUser}:${config.systemPassword}`,
        'utf8'
      ).toString('base64');
      const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        return res.status(503).json({
          status: 'unhealthy',
          unomi: {
            connected: false,
            url: config.baseUrl,
            error: `HTTP ${response.status}`,
          },
        });
      }
      const cluster = await response.json();
      return res.status(200).json({
        status: 'healthy',
        unomi: {
          connected: true,
          url: config.baseUrl,
          cluster,
        },
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        unomi: {
          connected: false,
          url: config.baseUrl,
          error: error instanceof Error ? error.message || String(error) : 'Connection failed',
        },
      });
    }
  },
});
