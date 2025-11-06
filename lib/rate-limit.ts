import type { VercelRequest } from '@vercel/node';

/**
 * Simple in-memory rate limiter
 *
 * For production, use Vercel KV or Upstash Redis
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store (resets on cold start)
const requests = new Map<string, { count: number; resetAt: number }>();

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 100,  // 100 requests
  windowMs: 60000    // per minute
};

/**
 * Get client identifier from request
 */
function getClientId(req: VercelRequest): string {
  // Use x-forwarded-for or x-real-ip from Vercel
  const forwarded = req.headers['x-forwarded-for'];
  const realIp = req.headers['x-real-ip'];

  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }

  if (typeof realIp === 'string') {
    return realIp;
  }

  return 'unknown';
}

/**
 * Check if request is within rate limit
 */
export async function rateLimit(
  req: VercelRequest,
  config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
  const clientId = getClientId(req);
  const now = Date.now();

  // Clean up expired entries
  for (const [key, value] of requests.entries()) {
    if (value.resetAt < now) {
      requests.delete(key);
    }
  }

  // Get or create client record
  let record = requests.get(clientId);

  if (!record || record.resetAt < now) {
    // New window
    record = {
      count: 1,
      resetAt: now + config.windowMs
    };
    requests.set(clientId, record);

    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetAt: record.resetAt
    };
  }

  // Check if over limit
  if (record.count >= config.maxRequests) {
    return {
      success: false,
      remaining: 0,
      resetAt: record.resetAt
    };
  }

  // Increment count
  record.count++;

  return {
    success: true,
    remaining: config.maxRequests - record.count,
    resetAt: record.resetAt
  };
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult
): void {
  headers['X-RateLimit-Limit'] = String(DEFAULT_CONFIG.maxRequests);
  headers['X-RateLimit-Remaining'] = String(result.remaining);
  headers['X-RateLimit-Reset'] = String(Math.floor(result.resetAt / 1000));
}
