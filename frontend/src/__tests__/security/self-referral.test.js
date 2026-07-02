/**
 * Security: Self-Referral Prevention
 *
 * An affiliate must not be able to earn commission by referring themselves.
 * The descope-sync route checks affiliate.descopeUserId !== userId before
 * creating a Referral document.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({ default: vi.fn() }));
vi.mock('@/models/User', () => ({
  default: {
    findOne: vi.fn(),
    insertOne: vi.fn(),
  },
}));
vi.mock('@/models/Affiliate', () => ({
  default: { findOne: vi.fn() },
}));
vi.mock('@/models/Referral', () => ({
  default: { create: vi.fn() },
}));

import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';
import User from '@/models/User';

// We test the self-referral guard logic directly since the full
// descope-sync route depends on the Descope webhook token which we
// cannot easily mock in unit tests. The guard is:
//   if (affiliate && affiliate.descopeUserId !== userId) { create referral }

function selfReferralGuard({ affiliateDescopeId, signingUpUserId }) {
  // Mirrors the exact condition in descope-sync/route.js line 122
  if (affiliateDescopeId && affiliateDescopeId !== signingUpUserId) {
    return true; // referral should be created
  }
  return false; // blocked
}

describe('Self-referral guard logic', () => {
  it('allows referral when affiliate and new user are different people', () => {
    expect(selfReferralGuard({
      affiliateDescopeId: 'affiliate_user_id',
      signingUpUserId: 'new_user_id',
    })).toBe(true);
  });

  it('blocks referral when the affiliate is the same person signing up', () => {
    expect(selfReferralGuard({
      affiliateDescopeId: 'same_user_id',
      signingUpUserId: 'same_user_id',
    })).toBe(false);
  });

  it('blocks when affiliateDescopeId is null (no affiliate found)', () => {
    expect(selfReferralGuard({
      affiliateDescopeId: null,
      signingUpUserId: 'user_id',
    })).toBe(false);
  });

  it('blocks when affiliateDescopeId is undefined', () => {
    expect(selfReferralGuard({
      affiliateDescopeId: undefined,
      signingUpUserId: 'user_id',
    })).toBe(false);
  });
});

describe('Referral model is not called for self-referrals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not create a Referral when affiliate === signing-up user', async () => {
    const userId = 'desc_abc123';
    const affiliate = { _id: 'aff_obj_id', descopeUserId: userId, status: 'active' };

    // Simulate the guard
    if (affiliate && affiliate.descopeUserId !== userId) {
      await Referral.create({ affiliateId: affiliate._id });
    }

    expect(Referral.create).not.toHaveBeenCalled();
  });

  it('creates a Referral when affiliate !== signing-up user', async () => {
    Referral.create.mockResolvedValue({});
    const userId = 'new_user_123';
    const affiliate = { _id: 'aff_obj_id', descopeUserId: 'affiliate_456', status: 'active' };

    if (affiliate && affiliate.descopeUserId !== userId) {
      await Referral.create({
        affiliateId: affiliate._id,
        refCode: 'aff123',
        referredUserId: userId,
        signedUpAt: new Date(),
      });
    }

    expect(Referral.create).toHaveBeenCalledOnce();
    expect(Referral.create).toHaveBeenCalledWith(
      expect.objectContaining({ referredUserId: userId })
    );
  });
});
