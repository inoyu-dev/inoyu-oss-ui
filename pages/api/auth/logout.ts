import { serialize } from 'cookie';
import { createHandler } from '@/lib/api-middleware';

/**
 * Logout endpoint - clears the authentication cookie
 */
export default createHandler({
  methods: ['POST'],
  handler: async (_req, res) => {
    const cookie = serialize('token', '', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0, // Expire immediately
      sameSite: 'strict',
    });

    res.setHeader('Set-Cookie', cookie);
    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  },
});
