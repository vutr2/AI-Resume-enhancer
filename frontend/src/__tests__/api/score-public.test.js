/**
 * /api/ai/score-public — public (no-auth) resume scoring endpoint
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@anthropic-ai/sdk', () => ({
  default: class { constructor() {} messages = { create: vi.fn() } },
}));

const mockCallOpenAI = vi.fn();
vi.mock('@/lib/openai', () => ({
  callOpenAI: (...args) => mockCallOpenAI(...args),
  SYSTEM_PROMPTS: { analyzeResume: 'ANALYZE_PROMPT' },
}));

vi.mock('@/lib/parsePdf', () => ({
  extractPdfText: vi.fn().mockResolvedValue(
    'John Doe\nSoftware Engineer\n5 years experience in React and Node.js at Samsung Vietnam'
  ),
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({
      value: 'John Doe\nSoftware Engineer\n5 years experience in React and Node.js',
    }),
  },
}));

// ── helpers ───────────────────────────────────────────────────────────────────

// Mock file object — avoids jsdom/undici File incompatibility
function makeFile({ name = 'cv.pdf', type = 'application/pdf', size = 1000 } = {}) {
  return {
    name,
    type,
    size,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(Math.min(size, 100))),
  };
}

// Mock request — avoids multipart FormData parser in undici
function makeRequest({ file, ip = '1.2.3.4' } = {}) {
  const fileValue = file !== undefined ? file : null;
  return {
    formData: () => Promise.resolve({ get: (key) => (key === 'file' ? fileValue : null) }),
    headers: {
      get: (key) => {
        if (key === 'x-forwarded-for') return ip;
        if (key === 'x-real-ip') return null;
        return null;
      },
    },
  };
}

const VALID_SCORES = {
  overall: 72, atsScore: 68, contentScore: 75,
  formatScore: 80, keywordScore: 65, fdiScore: 60,
};

// ── tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/ai/score-public', () => {
  let POST;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();

    // Re-mock after resetModules
    vi.doMock('@anthropic-ai/sdk', () => ({
      default: class { constructor() {} messages = { create: vi.fn() } },
    }));
    vi.doMock('@/lib/openai', () => ({
      callOpenAI: (...args) => mockCallOpenAI(...args),
      SYSTEM_PROMPTS: { analyzeResume: 'ANALYZE_PROMPT' },
    }));
    vi.doMock('@/lib/parsePdf', () => ({
      extractPdfText: vi.fn().mockResolvedValue(
        'John Doe\nSoftware Engineer\n5 years experience in React and Node.js at Samsung Vietnam'
      ),
    }));
    vi.doMock('mammoth', () => ({
      default: {
        extractRawText: vi.fn().mockResolvedValue({
          value: 'John Doe\nSoftware Engineer\n5 years experience in React and Node.js',
        }),
      },
    }));

    const mod = await import('@/app/api/ai/score-public/route');
    POST = mod.POST;

    mockCallOpenAI.mockResolvedValue({
      scores: VALID_SCORES,
      strengths: ['Good format'],
      weaknesses: ['No metrics'],
      suggestions: ['Add metrics to bullets', 'Include LinkedIn URL'],
    });
  });

  // ── file validation ──────────────────────────────────────────────────────

  it('returns 400 when no file provided', async () => {
    const req = makeRequest({ file: null, ip: '10.0.0.1' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.message).toMatch(/chọn file/i);
  });

  it('returns 400 for unsupported file type (jpg)', async () => {
    const req = makeRequest({ file: makeFile({ type: 'image/jpeg' }), ip: '10.0.0.2' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/PDF|DOC/i);
  });

  it('returns 400 when file exceeds 5MB', async () => {
    const req = makeRequest({ file: makeFile({ size: 6 * 1024 * 1024 }), ip: '10.0.0.3' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.message).toMatch(/5MB/);
  });

  // ── successful analysis ──────────────────────────────────────────────────

  it('returns 200 with scores and topFixes for valid PDF', async () => {
    const req = makeRequest({ file: makeFile(), ip: '10.1.0.1' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.scores.overall).toBe(72);
    expect(body.data.scores.atsScore).toBe(68);
    expect(body.data.scores.fdiScore).toBe(60);
  });

  it('returns exactly 2 topFixes', async () => {
    const req = makeRequest({ file: makeFile(), ip: '10.1.0.2' });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.topFixes).toHaveLength(2);
  });

  it('does NOT return strengths or weaknesses', async () => {
    const req = makeRequest({ file: makeFile(), ip: '10.1.0.3' });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data).not.toHaveProperty('strengths');
    expect(body.data).not.toHaveProperty('weaknesses');
  });

  it('accepts DOCX files', async () => {
    const docxType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const req = makeRequest({ file: makeFile({ name: 'cv.docx', type: docxType }), ip: '10.1.0.4' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it('accepts DOC files', async () => {
    const req = makeRequest({ file: makeFile({ name: 'cv.doc', type: 'application/msword' }), ip: '10.1.0.5' });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  // ── AI edge cases ────────────────────────────────────────────────────────

  it('returns 500 when AI returns all-zero scores', async () => {
    mockCallOpenAI.mockResolvedValue({ scores: { overall: 0, atsScore: 0 } });
    const req = makeRequest({ file: makeFile(), ip: '10.2.0.1' });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it('rounds decimal scores to integers', async () => {
    mockCallOpenAI.mockResolvedValue({
      scores: { overall: 72.6, atsScore: 68.3, contentScore: 75.9, formatScore: 80.1, keywordScore: 65.5, fdiScore: 60.4 },
      suggestions: ['Fix 1', 'Fix 2'],
    });
    const req = makeRequest({ file: makeFile(), ip: '10.2.0.2' });
    const res = await POST(req);
    const body = await res.json();
    expect(body.data.scores.overall).toBe(73);
    expect(body.data.scores.atsScore).toBe(68);
  });

  it('handles AI scores returned flat (not nested under scores key)', async () => {
    mockCallOpenAI.mockResolvedValue({
      overall: 65, atsScore: 60, contentScore: 70, formatScore: 75, keywordScore: 55, fdiScore: 50,
      suggestions: ['Fix A', 'Fix B'],
    });
    const req = makeRequest({ file: makeFile(), ip: '10.2.0.3' });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.scores.overall).toBe(65);
  });

  // ── rate limiting ────────────────────────────────────────────────────────

  it('returns 429 after 2 requests from the same IP', async () => {
    const ip = '10.9.9.9';
    const file = makeFile();

    const r1 = await POST(makeRequest({ file, ip }));
    const r2 = await POST(makeRequest({ file, ip }));
    const r3 = await POST(makeRequest({ file, ip }));

    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    expect(r3.status).toBe(429);
    const body = await r3.json();
    expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('different IPs have independent rate limits', async () => {
    const file = makeFile();
    const r1 = await POST(makeRequest({ file, ip: '10.8.1.1' }));
    const r2 = await POST(makeRequest({ file, ip: '10.8.1.2' }));
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
  });
});
