/**
 * AI Rewrite — FDI English mode
 *
 * Verifies that when mode='fdi-english' is passed, the route uses the FDI
 * system prompt instead of the standard rewrite prompt.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallOpenAI = vi.fn();
const mockGetUserAccess = vi.fn();

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware: vi.fn().mockResolvedValue({ limited: false, headers: {} }),
}));
vi.mock('@/lib/access', () => ({ getUserAccess: (...a) => mockGetUserAccess(...a) }));
vi.mock('@/lib/openai', () => ({
  callOpenAI: (...a) => mockCallOpenAI(...a),
  SYSTEM_PROMPTS: {
    rewriteContent:    'STANDARD_PROMPT',
    rewriteFDIEnglish: 'FDI_PROMPT',
  },
}));

import { getCurrentUser } from '@/lib/auth';
import { POST } from '@/app/api/ai/rewrite/route';

const FAKE_USER = { descopeId: 'U1', email: 'u@test.com' };

function makeReq(body) {
  return { json: async () => body };
}

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(FAKE_USER);
  mockGetUserAccess.mockResolvedValue({ level: 'full', reason: 'pass', paidCredits: 0, freeCredits: 0 });
  mockCallOpenAI.mockResolvedValue({
    rewrittenContent: 'CV content here',
    changes: [],
    improvements: [],
  });
});

describe('POST /api/ai/rewrite — FDI mode', () => {
  it('uses FDI system prompt when mode=fdi-english', async () => {
    await POST(makeReq({ content: 'Some CV text', mode: 'fdi-english' }));
    expect(mockCallOpenAI).toHaveBeenCalledWith('FDI_PROMPT', expect.any(String));
  });

  it('uses standard system prompt when no mode is specified', async () => {
    await POST(makeReq({ content: 'Some CV text' }));
    expect(mockCallOpenAI).toHaveBeenCalledWith('STANDARD_PROMPT', expect.any(String));
  });

  it('uses standard system prompt when mode is something else', async () => {
    await POST(makeReq({ content: 'Some CV text', mode: 'fresher' }));
    expect(mockCallOpenAI).toHaveBeenCalledWith('STANDARD_PROMPT', expect.any(String));
  });

  it('FDI prompt receives English instruction in the user message', async () => {
    await POST(makeReq({ content: 'Some CV text', mode: 'fdi-english' }));
    const [, userMessage] = mockCallOpenAI.mock.calls[0];
    expect(userMessage).toMatch(/English CV for FDI/i);
  });

  it('standard prompt receives Vietnamese instruction in the user message', async () => {
    await POST(makeReq({ content: 'Some CV text' }));
    const [, userMessage] = mockCallOpenAI.mock.calls[0];
    expect(userMessage).toMatch(/Viết lại CV/);
  });

  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ content: 'x', mode: 'fdi-english' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when content is missing', async () => {
    const res = await POST(makeReq({ mode: 'fdi-english' }));
    expect(res.status).toBe(400);
  });

  it('returns 200 with rewrittenContent on success', async () => {
    const res = await POST(makeReq({ content: 'CV text', mode: 'fdi-english' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
