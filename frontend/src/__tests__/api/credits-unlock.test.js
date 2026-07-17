/**
 * POST /api/credits/unlock — CV unlock with paidCredit deduction
 *
 * Key invariants:
 *   - Atomic: deduct exactly 1 paidCredit and add cvId in one operation
 *   - Idempotent: unlocking the same CV twice never deducts twice
 *   - Guard: returns 402 when paidCredits === 0
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
}));
vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth';
import { getDb } from '@/lib/db';

const mockFindOneAndUpdate = vi.fn();
const mockFindOne = vi.fn();

const fakeCollection = {
  findOneAndUpdate: (...a) => mockFindOneAndUpdate(...a),
  findOne: (...a) => mockFindOne(...a),
};

beforeEach(() => {
  vi.clearAllMocks();
  getCurrentUser.mockResolvedValue({ descopeId: 'u-abc' });
  getDb.mockResolvedValue({ collection: () => fakeCollection });
});

import { POST } from '@/app/api/credits/unlock/route';

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body) {
  return { json: async () => body };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/credits/unlock', () => {
  it('returns 401 when not authenticated', async () => {
    getCurrentUser.mockResolvedValue(null);
    const res = await POST(makeRequest({ cvId: 'cv-1' }));
    expect(res.status).toBe(401);
  });

  it('returns 400 when cvId is missing', async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it('atomically deducts 1 paidCredit and adds cvId on success', async () => {
    mockFindOneAndUpdate.mockResolvedValue({
      paidCredits: 1,
      unlockedCvIds: ['cv-1'],
    });

    const res = await POST(makeRequest({ cvId: 'cv-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.paidCredits).toBe(1);

    // Verify the atomic operation used correct conditions
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        descopeId: 'u-abc',
        paidCredits: { $gt: 0 },
        unlockedCvIds: { $ne: 'cv-1' },
      }),
      expect.objectContaining({
        $inc: { paidCredits: -1 },
        $addToSet: { unlockedCvIds: 'cv-1' },
      }),
      expect.anything()
    );
  });

  it('returns alreadyUnlocked:true without deducting when CV is already in list', async () => {
    // Atomic op finds nothing (cvId already in list)
    mockFindOneAndUpdate.mockResolvedValue(null);
    // Fallback findOne shows it's already unlocked
    mockFindOne.mockResolvedValue({
      paidCredits: 2,
      unlockedCvIds: ['cv-1'],
    });

    const res = await POST(makeRequest({ cvId: 'cv-1' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.alreadyUnlocked).toBe(true);
    // No second findOneAndUpdate call
    expect(mockFindOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns 402 when user has 0 paidCredits', async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);
    mockFindOne.mockResolvedValue({
      paidCredits: 0,
      unlockedCvIds: [],
    });

    const res = await POST(makeRequest({ cvId: 'cv-new' }));
    const data = await res.json();

    expect(res.status).toBe(402);
    expect(data.code).toBe('INSUFFICIENT_CREDITS');
  });

  it('returns 404 when user does not exist', async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);
    mockFindOne.mockResolvedValue(null);

    const res = await POST(makeRequest({ cvId: 'cv-1' }));
    expect(res.status).toBe(404);
  });

  it('coerces cvId to string to avoid type mismatches', async () => {
    mockFindOneAndUpdate.mockResolvedValue({ paidCredits: 0, unlockedCvIds: [123] });

    await POST(makeRequest({ cvId: 123 })); // numeric cvId

    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ unlockedCvIds: { $ne: '123' } }),
      expect.anything(),
      expect.anything()
    );
  });
});
