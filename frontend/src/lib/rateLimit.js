export const RATE_LIMITS = {
  ai:      { windowMs:    60_000, maxRequests:  5 },
  upload:  { windowMs:    60_000, maxRequests: 10 },
  auth:    { windowMs:    60_000, maxRequests: 10 },
  general: { windowMs:    60_000, maxRequests: 60 },
  public:  { windowMs: 3_600_000, maxRequests:  2 }, // 2 per IP per hour
};

const store = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [key, data] of store.entries()) {
    const type = key.split(':')[0];
    const window = RATE_LIMITS[type]?.windowMs ?? 60_000;
    if (now - data.windowStart > window) store.delete(key);
  }
}, 300_000);

export async function checkRateLimit(identifier, type = 'general') {
  const config = RATE_LIMITS[type] || RATE_LIMITS.general;
  const key = `${type}:${identifier}`;
  const now = Date.now();
  let data = store.get(key);

  if (!data || now - data.windowStart > config.windowMs) {
    data = { windowStart: now, count: 0 };
  }
  data.count++;
  store.set(key, data);

  const remaining = Math.max(0, config.maxRequests - data.count);
  const resetIn   = Math.max(0, config.windowMs - (now - data.windowStart));
  return { limited: data.count > config.maxRequests, remaining, resetIn, limit: config.maxRequests };
}

export async function rateLimitMiddleware(request, identifier, type = 'general') {
  const result = await checkRateLimit(identifier, type);

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
        'X-RateLimit-Limit':     result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset':     Math.ceil(result.resetIn / 1000).toString(),
        'Retry-After':           Math.ceil(result.resetIn / 1000).toString(),
      },
    };
  }

  return {
    limited: false,
    headers: {
      'X-RateLimit-Limit':     result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset':     Math.ceil(result.resetIn / 1000).toString(),
    },
  };
}
