import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Health check endpoint
 */

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  version: string;
  uptime: number;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse<HealthResponse>
) {
  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      uptime: 0
    });
  }

  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    uptime: process.uptime()
  });
}
