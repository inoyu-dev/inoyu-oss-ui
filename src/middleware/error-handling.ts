import { NextApiRequest, NextApiResponse } from 'next';

export class APIError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
  }
}

export async function errorHandler(
  error: Error,
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (error instanceof APIError) {
    console.error(`[API Error] ${error.statusCode} ${error.message}`, error.details ?? '', req.url);
    return res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
  }

  // Unexpected errors
  console.error('Unexpected error:', error.message, req.url);
  return res.status(500).json({
    error: 'Internal server error'
  });
}
