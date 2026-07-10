import { verify } from 'jsonwebtoken';
import { DecodedToken } from '@/lib/api-auth';
import { createHandler } from '@/lib/api-middleware';

export default createHandler({
  methods: ['GET'],
  handler: async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    let decoded: DecodedToken;
    try {
      decoded = verify(token, process.env.JWT_SECRET as string) as DecodedToken;
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    return res.status(200).json({
      email: decoded.email,
      admin: decoded.admin || false,
      tenantId: decoded.tenantId,
      userId: decoded.userId,
      name: decoded.name,
      external: decoded.external || false,
    });
  },
});
