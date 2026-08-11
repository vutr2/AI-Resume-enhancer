/**
 * POST /api/ai/analyze — credit deduction logic
 *
 * Key invariants:
 *   - 403 when user has no credits (locked)
 *   - Cache hit (status=analyzed + topFixes populated) → no AI call, no credit deducted
 *   - Real AI call + free_credits reason → consumeFreeCredit called
 *   - Real AI call + paid_credits reason → consumeFreeCredit also called (not unlimited)
 *   - Real AI call + pass reason         → consumeFreeCredit NOT called (unlimited)
 *   - Real AI call + legacy_pro reason   → consumeFreeCredit NOT called (unlimited)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware: vi.fn().mockResolvedValue({ limited: false }),
}));
vi.mock('@/lib/access', () => ({
  getUserAccess: vi.fn(),
  consumeFreeCredit: vi.fn(),
}));
vi.mock('@/lib/openai', () => ({
  SYSTEM_PROMPTS: { analyzeResume: 'system-prompt' },
  callOpenAI: vi.fn(),
}));

const mockResumeFindOne = vi.fn();
const mockResumeSave    = vi.fn();

vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/Resume', () => ({
  default: { findOne: (...a) => mockResumeFindOne(...a) },
}));

import { getCurrentUser } from '@/lib/auth';
import { getUserAccess, consumeFreeCredit } from '@/lib/access';
import { callOpenAI } from '@/lib/openai';
import { POST } from '@/app/api/ai/analyze/route';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body) {
  return { json: async () => body };
}

function fakeResume(overrides = {}) {
  return {
    _id: 'cv-1',
    user: 'u-abc',
    status: 'pending',
    rawText: 'Nguyễn Văn A, kỹ sư phần mềm 5 năm kinh nghiệm...'.repeat(20),
    scores: null,
    analysis: null,
    save: mockResumeSave,
    ...overrides,
  };
}

function fakeAIResponse() {
  return {
    scores: {
      overall: 78, atsScore: 72, contentScore: 80,
      formatScore: 75, keywordScore: 65, readabilityScore: 70, fdiScore: 60,
    },
    strengths: ['Kinh nghiệm phong phú'],
    weaknesses: ['Thiếu số liệu'],
    suggestions: ['Thêm metrics cụ thể'],
    keywords: { found: ['Python'], missing: ['Docker'], recommended: ['AWS'] },
    topFixes: [
      { title: 'Thêm số liệu', detail: '4/10 bullet thiếu số liệu', priority: 1 },
      { title: 'Format ATS', detail: 'Dùng bảng không đọc được bởi ATS', priority: 2 },
      { title: 'Từ khóa', detail: 'Thiếu 3 từ khóa quan trọng', priority: 3 },
    ],
    working: ['Format rõ ràng', 'Kinh nghiệm liên quan'],
    atsIssues: [
      { type: 'content', severity: 'high',   description: 'Thiếu số liệu định lượng', suggestion: 'Thêm % và số người' },
      { type: 'format',  severity: 'medium',  description: 'Dùng bảng trong CV',       suggestion: 'Chuyển sang bullet points' },
      { type: 'keyword', severity: 'high',   description: 'Thiếu từ khóa Docker',      suggestion: 'Thêm Docker vào skills' },
    ],
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ descopeId: 'u-abc' });
  mockResumeSave.mockResolvedValue(undefined);
});

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/ai/analyze — access control', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 403 when user has no credits (locked)', async () => {
    getUserAccess.mockResolvedValue({ level: 'locked', reason: 'no_credits' });
    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    const body = await res.json();
    expect(res.status).toBe(403);
    expect(body.code).toBe('NO_CREDITS');
  });

  it('returns 400 when resumeId is missing', async () => {
    getUserAccess.mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 });
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });
});

describe('POST /api/ai/analyze — cache hit (no credit deduction)', () => {
  it('returns cached result without calling AI or deducting credits', async () => {
    getUserAccess.mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 });
    mockResumeFindOne.mockResolvedValue(fakeResume({
      status: 'analyzed',
      scores: { overall: 78 },
      analysis: {
        topFixes: [{ title: 'Fix 1', detail: 'detail', priority: 1 }],
        atsIssues: [],
        strengths: [], weaknesses: [], suggestions: [],
        keywords: { found: [], missing: [], recommended: [] },
        working: [],
      },
    }));

    const res = await POST(makeRequest({ resumeId: 'cv-1', force: false }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(callOpenAI).not.toHaveBeenCalled();
    expect(consumeFreeCredit).not.toHaveBeenCalled();
  });

  it('bypasses cache and calls AI when force=true', async () => {
    getUserAccess.mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 });
    mockResumeFindOne.mockResolvedValue(fakeResume({
      status: 'analyzed',
      scores: { overall: 78 },
      analysis: { topFixes: [{ title: 'Fix 1', detail: 'd', priority: 1 }], atsIssues: [] },
    }));
    callOpenAI.mockResolvedValue(fakeAIResponse());
    consumeFreeCredit.mockResolvedValue({ success: true, freeCredits: 2 });

    await POST(makeRequest({ resumeId: 'cv-1', force: true }));

    expect(callOpenAI).toHaveBeenCalledTimes(1);
    expect(consumeFreeCredit).toHaveBeenCalledTimes(1);
  });
});

describe('POST /api/ai/analyze — credit deduction after real AI call', () => {
  beforeEach(() => {
    mockResumeFindOne.mockResolvedValue(fakeResume()); // no cache
    callOpenAI.mockResolvedValue(fakeAIResponse());
    consumeFreeCredit.mockResolvedValue({ success: true, freeCredits: 2 });
  });

  it('deducts freeCredit when reason is free_credits', async () => {
    getUserAccess.mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(consumeFreeCredit).toHaveBeenCalledWith('u-abc');
    expect(body.data.freeCredits).toBe(2);
  });

  it('ALSO deducts freeCredit when reason is paid_credits (not unlimited)', async () => {
    getUserAccess.mockResolvedValue({ level: 'full', reason: 'paid_credits', freeCredits: 1, paidCredits: 1 });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(consumeFreeCredit).toHaveBeenCalledWith('u-abc');
    expect(body.data.freeCredits).toBe(2);
  });

  it('does NOT deduct credits when reason is pass (unlimited)', async () => {
    getUserAccess.mockResolvedValue({
      level: 'full', reason: 'pass',
      freeCredits: 5, paidCredits: 0,
    });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));

    expect(res.status).toBe(200);
    expect(consumeFreeCredit).not.toHaveBeenCalled();
  });

  it('does NOT deduct credits when reason is legacy_pro (unlimited)', async () => {
    getUserAccess.mockResolvedValue({
      level: 'full', reason: 'legacy_pro',
      freeCredits: 5, paidCredits: 0,
    });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));

    expect(res.status).toBe(200);
    expect(consumeFreeCredit).not.toHaveBeenCalled();
  });

  it('returns updated freeCredits in response after deduction', async () => {
    getUserAccess.mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 });
    consumeFreeCredit.mockResolvedValue({ success: true, freeCredits: 2 });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    const body = await res.json();

    expect(body.data.freeCredits).toBe(2); // 3 - 1
  });

  it('response includes all atsIssues returned by AI', async () => {
    getUserAccess.mockResolvedValue({ level: 'full', reason: 'paid_credits', freeCredits: 1, paidCredits: 1 });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));
    const body = await res.json();

    expect(body.data.analysis.atsIssues).toHaveLength(3);
    expect(body.data.analysis.topFixes).toHaveLength(3);
  });
});

describe('POST /api/ai/analyze — CV access after unlock flow', () => {
  it('user with unlockedCvIds (reason=unlocked) deducts freeCredit on analysis', async () => {
    getUserAccess.mockResolvedValue({ level: 'full', reason: 'unlocked', freeCredits: 2, paidCredits: 0 });
    mockResumeFindOne.mockResolvedValue(fakeResume());
    callOpenAI.mockResolvedValue(fakeAIResponse());
    consumeFreeCredit.mockResolvedValue({ success: true, freeCredits: 1 });

    const res = await POST(makeRequest({ resumeId: 'cv-1' }));

    expect(res.status).toBe(200);
    expect(consumeFreeCredit).toHaveBeenCalledWith('u-abc');
  });
});
