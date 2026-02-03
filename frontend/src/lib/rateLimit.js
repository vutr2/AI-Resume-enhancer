/**
 * Simple in-memory rate limiter for serverless functions
 * For production with multiple instances, use Redis instead
 */

// In-memory store for rate limiting
const rateLimitStore = new Map();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now - data.windowStart > 60000) { // 1 minute window
      rateLimitStore.delete(key);
    }
  }
}, 300000);

/**
 * Rate limit configuration
 */
export const RATE_LIMITS = {
  // AI endpoints - strict limits
  ai: {
    windowMs: 60000, // 1 minute
    maxRequests: 5,  // 5 requests per minute
  },
  // Upload endpoints
  upload: {
    windowMs: 60000,
    maxRequests: 10, // 10 uploads per minute
  },
  // General API
  general: {
    windowMs: 60000,
    maxRequests: 60, // 60 requests per minute
  },
};

/**
 * Check if request should be rate limited
 * @param {string} identifier - User ID or IP address
 * @param {string} type - Rate limit type ('ai', 'upload', 'general')
 * @returns {{ limited: boolean, remaining: number, resetIn: number }}
 */
export function checkRateLimit(identifier, type = 'general') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.general;
  const key = `${type}:${identifier}`;
  const now = Date.now();

  let data = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!data || now - data.windowStart > config.windowMs) {
    data = {
      windowStart: now,
      count: 0,
    };
  }

  // Increment count
  data.count++;
  rateLimitStore.set(key, data);

  const remaining = Math.max(0, config.maxRequests - data.count);
  const resetIn = Math.max(0, config.windowMs - (now - data.windowStart));

  return {
    limited: data.count > config.maxRequests,
    remaining,
    resetIn,
    limit: config.maxRequests,
  };
}

/**
 * Rate limit middleware for API routes
 * @param {Request} request
 * @param {string} identifier - User ID or IP
 * @param {string} type - Rate limit type
 * @returns {Response|null} - Returns error response if limited, null otherwise
 */
export function rateLimitMiddleware(request, identifier, type = 'general') {
  const result = checkRateLimit(identifier, type);

  if (result.limited) {
    return {
      limited: true,
      response: {
        success: false,
        message: `Quá nhiều yêu cầu. Vui lòng thử lại sau ${Math.ceil(result.resetIn / 1000)} giây.`,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(result.resetIn / 1000),
      },
      status: 429,
      headers: {
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
        'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
      },
    };
  }

  return {
    limited: false,
    headers: {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': Math.ceil(result.resetIn / 1000).toString(),
    },
  };
}
