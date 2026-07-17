/**
 * getUserAccess — central access control for credit model
 *
 * Priority order (highest to lowest):
 *   1. Active 7-day pass
 *   2. Legacy pro subscription (within expiry)
 *   3. CV-specific unlock (cvId in unlockedCvIds)
 *   4. Paid credits available (can unlock)
 *   5. Free credits available (limited access)
 *   6. No access (locked)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('@/lib/db', () => ({
  getDb: vi.fn(),
}));

import { getDb } from '@/lib/db';

const mockFindOne = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  getDb.mockResolvedValue({ collection: () => ({ findOne: mockFindOne }) });
});

import { getUserAccess, consumeFreeCredit } from '@/lib/access';

// ── Helpers ───────────────────────────────────────────────────────────────

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
const PAST = new Date(Date.now() - 24 * 60 * 60 * 1000);

function user(overrides = {}) {
  return {
    descopeId: 'u-123',
    plan: 'free',
    planExpiresAt: null,
    passExpiresAt: null,
    freeCredits: 5,
    paidCredits: 0,
    unlockedCvIds: [],
    ...overrides,
  };
}

// ── getUserAccess ──────────────────────────────────────────────────────────

describe('getUserAccess', () => {
  it('returns locked when user not found', async () => {
    mockFindOne.mockResolvedValue(null);
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('locked');
    expect(result.reason).toBe('user_not_found');
  });

  // 1. Active pass
  it('returns full access when pass is active', async () => {
    mockFindOne.mockResolvedValue(user({ passExpiresAt: FUTURE, freeCredits: 0, paidCredits: 0 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('full');
    expect(result.reason).toBe('pass');
  });

  it('does NOT grant full access when pass is expired', async () => {
    mockFindOne.mockResolvedValue(user({ passExpiresAt: PAST, freeCredits: 2 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('limited');
  });

  // 2. Legacy pro
  it('returns full access for active legacy pro subscription', async () => {
    mockFindOne.mockResolvedValue(user({ plan: 'pro', planExpiresAt: FUTURE, freeCredits: 0 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('full');
    expect(result.reason).toBe('legacy_pro');
  });

  it('does NOT grant full access when pro subscription is expired', async () => {
    mockFindOne.mockResolvedValue(user({ plan: 'pro', planExpiresAt: PAST, freeCredits: 3 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('limited');
  });

  // 3. CV unlock
  it('returns full access when cvId is in unlockedCvIds', async () => {
    mockFindOne.mockResolvedValue(user({ unlockedCvIds: ['cv-abc', 'cv-xyz'] }));
    const result = await getUserAccess('u-123', 'cv-abc');
    expect(result.level).toBe('full');
    expect(result.reason).toBe('unlocked');
  });

  it('does NOT grant unlock access when cvId is not in the list', async () => {
    mockFindOne.mockResolvedValue(user({ unlockedCvIds: ['cv-other'], freeCredits: 3 }));
    const result = await getUserAccess('u-123', 'cv-abc');
    expect(result.level).toBe('limited');
  });

  // 4. Paid credits
  it('returns limited with canUnlock=true when user has paidCredits and a cvId', async () => {
    mockFindOne.mockResolvedValue(user({ paidCredits: 2, freeCredits: 0 }));
    const result = await getUserAccess('u-123', 'cv-abc');
    expect(result.level).toBe('limited');
    expect(result.reason).toBe('has_paid_credits');
    expect(result.canUnlock).toBe(true);
    expect(result.paidCredits).toBe(2);
  });

  it('returns canUnlock=false when there is no cvId even with paidCredits', async () => {
    mockFindOne.mockResolvedValue(user({ paidCredits: 1, freeCredits: 0 }));
    const result = await getUserAccess('u-123', null);
    expect(result.level).toBe('limited');
    expect(result.canUnlock).toBe(false);
  });

  // 5. Free credits
  it('returns limited when user has freeCredits remaining', async () => {
    mockFindOne.mockResolvedValue(user({ freeCredits: 3, paidCredits: 0 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('limited');
    expect(result.reason).toBe('free_credits');
    expect(result.freeCredits).toBe(3);
  });

  it('returns locked when freeCredits is 0 and no paid credits', async () => {
    mockFindOne.mockResolvedValue(user({ freeCredits: 0, paidCredits: 0 }));
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('locked');
    expect(result.reason).toBe('no_credits');
  });

  // Legacy migration: derive freeCredits from monthlyCreditsUsed
  it('derives freeCredits from monthlyCreditsUsed for legacy users (no freeCredits field)', async () => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    mockFindOne.mockResolvedValue({
      descopeId: 'u-legacy',
      plan: 'free',
      planExpiresAt: null,
      passExpiresAt: null,
      // no freeCredits field
      monthlyCreditsUsed: 2,
      currentBillingMonth: currentMonth,
      paidCredits: 0,
      unlockedCvIds: [],
    });
    const result = await getUserAccess('u-legacy');
    expect(result.level).toBe('limited');
    expect(result.freeCredits).toBe(3); // 5 - 2
  });

  // Priority order check: pass beats everything
  it('pass takes priority over paidCredits and freeCredits', async () => {
    mockFindOne.mockResolvedValue(
      user({ passExpiresAt: FUTURE, paidCredits: 3, freeCredits: 5 })
    );
    const result = await getUserAccess('u-123');
    expect(result.level).toBe('full');
    expect(result.reason).toBe('pass');
  });
});
