import { createHandler } from '@/lib/api-middleware';
import { getUnomiConfig } from '@/lib/unomi-config';
import axios from 'axios';

export default createHandler({
  methods: ['GET'],
  handler: async (_req, res) => {
    const config = getUnomiConfig();
    try {
      const response = await axios.get(`${config.baseUrl}/cxs/cluster`, {
        auth: {
          username: config.systemUser,
          password: config.systemPassword,
        },
        timeout: 5000,
      });
      return res.status(200).json({
        status: 'healthy',
        unomi: {
          connected: true,
          url: config.baseUrl,
          cluster: response.data,
        },
      });
    } catch (error) {
      return res.status(503).json({
        status: 'unhealthy',
        unomi: {
          connected: false,
          error: error instanceof Error ? error.message : 'Connection failed',
        },
      });
    }
  },
});
