/**
 * AI Analyze — fdiScore and fdiReadiness
 *
 * Verifies that the analyze route correctly normalizes the new fdiScore field
 * from the AI response and persists fdiReadiness in the analysis object.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockCallAI   = vi.fn();
let mockResumeSave;
let mockResume;

vi.mock('@/lib/auth', () => ({ getCurrentUser: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/lib/rateLimit', () => ({
  rateLimitMiddleware: vi.fn().mockResolvedValue({ limited: false, headers: {} }),
}));
vi.mock('@/lib/access', () => ({
  getUserAccess:     vi.fn().mockResolvedValue({ level: 'limited', reason: 'free_credits', freeCredits: 3 }),
  consumeFreeCredit: vi.fn().mockResolvedValue({ success: true, freeCredits: 2 }),
}));
vi.mock('@/lib/openai', () => ({
  callOpenAI: (...a) => mockCallAI(...a),
  SYSTEM_PROMPTS: { analyzeResume: 'ANALYZE_PROMPT' },
}));
vi.mock('@/lib/cache', () => ({
  cachedAICall: (_content, _type, _key, fn) => fn(),
}));
vi.mock('@/models/Resume', () => ({
  default: { findOne: vi.fn() },
}));

import { getCurrentUser } from '@/lib/auth';
import Resume from '@/models/Resume';
import { POST } from '@/app/api/ai/analyze/route';

const FAKE_USER = { descopeId: 'U1', email: 'u@test.com' };

function makeReq(body) {
  return { json: async () => body };
}

const BASE_AI_RESPONSE = {
  scores: {
    overall: 75, atsScore: 70, contentScore: 72, formatScore: 80,
    keywordScore: 65, readabilityScore: 78, fdiScore: 60,
  },
  fdiReadiness: {
    englishQuality: 'fair',
    hasQuantifiedAchievements: false,
    formatIsAtsClean: true,
    hasFdiKeywords: false,
    summary: 'CV cần bổ sung thêm từ khóa FDI và số liệu định lượng.',
  },
  strengths: ['Good format'],
  weaknesses: ['Missing keywords'],
  suggestions: ['Add numbers'],
  keywords: { found: [], missing: [], recommended: [] },
  atsIssues: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue(FAKE_USER);
  mockResumeSave = vi.fn();
  mockResume = {
    _id: 'r1',
    user: 'U1',
    rawText: 'This is a sample resume with enough content to analyze properly.',
    parsedData: null,
    status: 'draft',
    scores: {},
    analysis: {},
    save: mockResumeSave,
  };
  Resume.findOne.mockResolvedValue(mockResume);
  mockCallAI.mockResolvedValue(BASE_AI_RESPONSE);
});

describe('POST /api/ai/analyze — fdiScore', () => {
  it('returns fdiScore in the scores object', async () => {
    const res = await POST(makeReq({ resumeId: 'r1' }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.data.scores.fdiScore).toBe(60);
  });

  it('returns fdiReadiness in the analysis object', async () => {
    const res = await POST(makeReq({ resumeId: 'r1' }));
    const data = await res.json();
    expect(data.data.analysis.fdiReadiness).toMatchObject({
      englishQuality: 'fair',
      hasQuantifiedAchievements: false,
      formatIsAtsClean: true,
      hasFdiKeywords: false,
    });
  });

  it('persists fdiScore to resume.scores', async () => {
    await POST(makeReq({ resumeId: 'r1' }));
    expect(mockResume.scores.fdiScore).toBe(60);
    expect(mockResumeSave).toHaveBeenCalled();
  });

  it('persists fdiReadiness to resume.analysis', async () => {
    await POST(makeReq({ resumeId: 'r1' }));
    expect(mockResume.analysis.fdiReadiness).toBeDefined();
    expect(mockResume.analysis.fdiReadiness.summary).toBe('CV cần bổ sung thêm từ khóa FDI và số liệu định lượng.');
  });

  it('defaults fdiScore to 0 when AI omits it', async () => {
    const responseWithoutFDI = { ...BASE_AI_RESPONSE, scores: { ...BASE_AI_RESPONSE.scores, fdiScore: undefined } };
    mockCallAI.mockResolvedValue(responseWithoutFDI);
    const res = await POST(makeReq({ resumeId: 'r1' }));
    const data = await res.json();
    expect(data.data.scores.fdiScore).toBe(0);
  });

  it('sets fdiReadiness to null when AI omits it', async () => {
    const { fdiReadiness: _, ...responseWithoutFDI } = BASE_AI_RESPONSE;
    mockCallAI.mockResolvedValue(responseWithoutFDI);
    const res = await POST(makeReq({ resumeId: 'r1' }));
    const data = await res.json();
    expect(data.data.analysis.fdiReadiness).toBeNull();
  });

  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeReq({ resumeId: 'r1' }));
    expect(res.status).toBe(401);
  });
});
