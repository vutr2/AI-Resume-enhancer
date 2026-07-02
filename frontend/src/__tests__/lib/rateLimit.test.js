import { describe, it, expect, vi, beforeEach } from 'vitest';

// Each test needs a fresh module to reset the in-memory store singleton
async function freshModule() {
  vi.resetModules();
  return import('@/lib/rateLimit');
}

describe('checkRateLimit', () => {
  beforeEach(() => { vi.resetModules(); });

  it('allows requests under the limit', async () => {
    const { checkRateLimit, RATE_LIMITS } = await freshModule();
    const result = await checkRateLimit('user_1', 'ai');
    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(RATE_LIMITS.ai.maxRequests - 1);
  });

  it('blocks after exceeding maxRequests', async () => {
    const { checkRateLimit, RATE_LIMITS } = await freshModule();
    const max = RATE_LIMITS.ai.maxRequests;
    for (let i = 0; i < max; i++) await checkRateLimit('burst', 'ai');
    const result = await checkRateLimit('burst', 'ai');
    expect(result.limited).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it('tracks different identifiers separately', async () => {
    const { checkRateLimit, RATE_LIMITS } = await freshModule();
    const max = RATE_LIMITS.ai.maxRequests;
    for (let i = 0; i < max; i++) await checkRateLimit('heavy', 'ai');
    const blocked = await checkRateLimit('heavy', 'ai');
    const allowed = await checkRateLimit('other',  'ai');
    expect(blocked.limited).toBe(true);
    expect(allowed.limited).toBe(false);
  });

  it('tracks different types separately', async () => {
    const { checkRateLimit, RATE_LIMITS } = await freshModule();
    const max = RATE_LIMITS.ai.maxRequests;
    for (let i = 0; i < max; i++) await checkRateLimit('user_x', 'ai');
    expect((await checkRateLimit('user_x', 'ai')).limited).toBe(true);
    expect((await checkRateLimit('user_x', 'upload')).limited).toBe(false);
  });

  it('falls back to general limits for unknown type', async () => {
    const { checkRateLimit, RATE_LIMITS } = await freshModule();
    const result = await checkRateLimit('user_1', 'unknown');
    expect(result.limit).toBe(RATE_LIMITS.general.maxRequests);
  });
});

describe('rateLimitMiddleware', () => {
  beforeEach(() => { vi.resetModules(); });

  it('returns limited=false with rate-limit headers when allowed', async () => {
    const { rateLimitMiddleware, RATE_LIMITS } = await freshModule();
    const result = await rateLimitMiddleware({}, 'ok_user', 'ai');
    expect(result.limited).toBe(false);
    expect(result.headers['X-RateLimit-Limit']).toBe(String(RATE_LIMITS.ai.maxRequests));
    expect(result.headers['X-RateLimit-Remaining']).toBeDefined();
  });

  it('returns 429 with Retry-After and error body when blocked', async () => {
    const { rateLimitMiddleware, RATE_LIMITS } = await freshModule();
    const max = RATE_LIMITS.ai.maxRequests;
    for (let i = 0; i < max; i++) await rateLimitMiddleware({}, 'blocked', 'ai');
    const result = await rateLimitMiddleware({}, 'blocked', 'ai');
    expect(result.limited).toBe(true);
    expect(result.status).toBe(429);
    expect(result.response.error).toBe('RATE_LIMIT_EXCEEDED');
    expect(result.headers['Retry-After']).toBeDefined();
  });

  it('blocked message is in Vietnamese', async () => {
    const { rateLimitMiddleware, RATE_LIMITS } = await freshModule();
    const max = RATE_LIMITS.ai.maxRequests;
    for (let i = 0; i < max; i++) await rateLimitMiddleware({}, 'vi_user', 'ai');
    const result = await rateLimitMiddleware({}, 'vi_user', 'ai');
    expect(result.response.message).toMatch(/Quá nhiều yêu cầu/);
  });
});
