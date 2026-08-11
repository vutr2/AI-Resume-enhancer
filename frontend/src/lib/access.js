import { getDb } from '@/lib/db';

/**
 * Central access control. Call before every gated AI feature.
 *
 * Returns an object with:
 *   level: 'full' | 'limited' | 'locked'
 *   reason: why this level was chosen
 *   canUnlock: true when user has paidCredits and could unlock a specific CV
 *   freeCredits, paidCredits, passExpiresAt for UI display
 */
export async function getUserAccess(descopeId, cvId = null) {
  const db = await getDb();
  const user = await db.collection('users').findOne({ descopeId });

  if (!user) return { level: 'locked', reason: 'user_not_found' };

  const now = Date.now();

  // 1. Active 7-day pass
  if (user.passExpiresAt && new Date(user.passExpiresAt).getTime() > now) {
    return {
      level: 'full',
      reason: 'pass',
      passExpiresAt: user.passExpiresAt,
      paidCredits: user.paidCredits || 0,
      freeCredits: user.freeCredits ?? 0,
    };
  }

  // 2. Legacy pro subscription (backward compat — keep until existing subs expire)
  if (
    user.plan === 'pro' &&
    user.planExpiresAt &&
    new Date(user.planExpiresAt).getTime() > now
  ) {
    return {
      level: 'full',
      reason: 'legacy_pro',
      planExpiresAt: user.planExpiresAt,
      paidCredits: user.paidCredits || 0,
      freeCredits: user.freeCredits ?? 0,
    };
  }

  // 3. CV-specific unlock
  if (cvId) {
    const cvIdStr = String(cvId);
    if (Array.isArray(user.unlockedCvIds) && user.unlockedCvIds.includes(cvIdStr)) {
      return {
        level: 'full',
        reason: 'unlocked',
        paidCredits: user.paidCredits || 0,
        freeCredits: user.freeCredits ?? 0,
      };
    }
  }

  // 4. Paid credits — full access
  if ((user.paidCredits || 0) > 0) {
    return {
      level: 'full',
      reason: 'paid_credits',
      paidCredits: user.paidCredits,
      freeCredits: user.freeCredits ?? 0,
    };
  }

  // 5. Free credits (explicit field, or derived from old monthly system for legacy users)
  const freeCredits =
    user.freeCredits != null
      ? user.freeCredits
      : Math.max(0, 5 - (user.monthlyCreditsUsed || 0));

  if (freeCredits > 0) {
    return {
      level: 'limited',
      reason: 'free_credits',
      canUnlock: false,
      freeCredits,
      paidCredits: 0,
    };
  }

  // 6. No access
  return {
    level: 'locked',
    reason: 'no_credits',
    freeCredits: 0,
    paidCredits: 0,
  };
}

/**
 * Atomically deduct 1 free credit. Returns true on success.
 * Handles both new users (explicit freeCredits field) and legacy users (monthlyCreditsUsed).
 */
export async function consumeFreeCredit(descopeId) {
  const db = await getDb();

  // New model: explicit freeCredits field
  const result = await db.collection('users').findOneAndUpdate(
    { descopeId, freeCredits: { $gt: 0 } },
    { $inc: { freeCredits: -1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );
  if (result) return { success: true, freeCredits: result.freeCredits };

  // Legacy model: monthlyCreditsUsed (users without freeCredits field)
  const currentMonth = new Date().toISOString().slice(0, 7);

  const legacyReset = await db.collection('users').findOneAndUpdate(
    {
      descopeId,
      freeCredits: { $exists: false },
      $or: [{ currentBillingMonth: { $ne: currentMonth } }, { currentBillingMonth: null }],
    },
    {
      $set: {
        currentBillingMonth: currentMonth,
        monthlyCreditsUsed: 1,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );
  if (legacyReset) {
    return { success: true, freeCredits: Math.max(0, 4 - (legacyReset.monthlyCreditsUsed || 0)) };
  }

  const legacyResult = await db.collection('users').findOneAndUpdate(
    {
      descopeId,
      freeCredits: { $exists: false },
      currentBillingMonth: currentMonth,
      monthlyCreditsUsed: { $lt: 5 },
    },
    { $inc: { monthlyCreditsUsed: 1 }, $set: { updatedAt: new Date() } },
    { returnDocument: 'after' }
  );

  if (legacyResult) {
    return {
      success: true,
      freeCredits: Math.max(0, 5 - (legacyResult.monthlyCreditsUsed || 0)),
    };
  }

  return { success: false };
}
