import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserPlan, getMaxAICredits } from '@/lib/plans';

/**
 * Calculate remaining AI credits for a user
 */
export function calculateCreditsRemaining(user, currentMonth = null) {
  if (!currentMonth) {
    currentMonth = new Date().toISOString().slice(0, 7);
  }

  const maxCredits = getMaxAICredits(user);

  // Unlimited plan
  if (maxCredits === -1) return -1;

  // New month = full reset
  if (user.currentBillingMonth !== currentMonth) {
    return maxCredits;
  }

  return Math.max(0, maxCredits - (user.monthlyCreditsUsed || 0));
}

/**
 * Check if user can use an AI credit
 */
export async function checkCredits() {
  const descopeUser = await getCurrentUser();
  if (!descopeUser) {
    return {
      success: false,
      error: 'Vui lòng đăng nhập',
      status: 401,
    };
  }

  const db = await getDb();

  const user = await db.collection('users').findOne({
    $or: [
      { descopeId: descopeUser.descopeId },
      { email: descopeUser.email?.toLowerCase() }
    ]
  });

  if (!user) {
    return {
      success: false,
      error: 'Người dùng không tồn tại',
      status: 404,
    };
  }

  const plan = getUserPlan(user);
  const creditsRemaining = calculateCreditsRemaining(user);

  if (creditsRemaining === 0) {
    return {
      success: false,
      error: `Bạn đã sử dụng hết ${plan.monthlyAICredits} lượt AI trong tháng. Vui lòng nâng cấp để tiếp tục.`,
      code: 'OUT_OF_CREDITS',
      status: 403,
      creditsRemaining: 0,
      maxCredits: plan.monthlyAICredits,
      plan: plan.planKey,
    };
  }

  return {
    success: true,
    user,
    creditsRemaining,
    maxCredits: plan.monthlyAICredits,
    isUnlimited: creditsRemaining === -1,
    plan: plan.planKey,
  };
}

/**
 * Atomic credit consumption - prevents race conditions
 */
export async function consumeCredit(userId) {
  const db = await getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  const maxCredits = getMaxAICredits(user);

  // Unlimited plan - no credit consumed
  if (maxCredits === -1) {
    return { success: true, creditsRemaining: -1 };
  }

  // CASE 1: New month - reset and consume atomically
  if (user.currentBillingMonth !== currentMonth) {
    const result = await db.collection('users').findOneAndUpdate(
      {
        _id: userId,
        $or: [
          { currentBillingMonth: { $ne: currentMonth } },
          { currentBillingMonth: null },
        ],
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

    if (result) {
      return {
        success: true,
        creditsRemaining: maxCredits - 1,
        maxCredits,
      };
    }
    // Fall through - another request already reset
  }

  // CASE 2: Same month - atomic increment with limit check
  const result = await db.collection('users').findOneAndUpdate(
    {
      _id: userId,
      currentBillingMonth: currentMonth,
      monthlyCreditsUsed: { $lt: maxCredits },
    },
    {
      $inc: { monthlyCreditsUsed: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    return {
      success: false,
      error: 'Hết lượt sử dụng',
      creditsRemaining: 0,
      maxCredits,
    };
  }

  return {
    success: true,
    creditsRemaining: maxCredits - result.monthlyCreditsUsed,
    maxCredits,
  };
}

/**
 * Atomic check-and-consume in one operation
 */
export async function atomicConsumeCredit() {
  const descopeUser = await getCurrentUser();
  if (!descopeUser) {
    return {
      success: false,
      error: 'Vui lòng đăng nhập',
      status: 401,
    };
  }

  const db = await getDb();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const user = await db.collection('users').findOne({
    $or: [
      { descopeId: descopeUser.descopeId },
      { email: descopeUser.email?.toLowerCase() }
    ]
  });

  if (!user) {
    return {
      success: false,
      error: 'Người dùng không tồn tại',
      status: 404,
    };
  }

  const plan = getUserPlan(user);
  const maxCredits = plan.monthlyAICredits;

  // Unlimited plan
  if (maxCredits === -1) {
    return {
      success: true,
      user,
      creditsRemaining: -1,
      isUnlimited: true,
      plan: plan.planKey,
    };
  }

  // New month - reset + consume atomically
  if (user.currentBillingMonth !== currentMonth) {
    const result = await db.collection('users').findOneAndUpdate(
      {
        _id: user._id,
        $or: [
          { currentBillingMonth: { $ne: currentMonth } },
          { currentBillingMonth: null },
        ],
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

    if (result) {
      return {
        success: true,
        user: result,
        creditsRemaining: maxCredits - 1,
        maxCredits,
        isUnlimited: false,
        plan: plan.planKey,
      };
    }
  }

  // Same month - atomic increment with limit check
  const result = await db.collection('users').findOneAndUpdate(
    {
      _id: user._id,
      currentBillingMonth: currentMonth,
      monthlyCreditsUsed: { $lt: maxCredits },
    },
    {
      $inc: { monthlyCreditsUsed: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    return {
      success: false,
      error: `Bạn đã sử dụng hết ${maxCredits} lượt AI trong tháng. Vui lòng nâng cấp để tiếp tục.`,
      code: 'OUT_OF_CREDITS',
      status: 403,
      creditsRemaining: 0,
      plan: plan.planKey,
    };
  }

  return {
    success: true,
    user: result,
    creditsRemaining: maxCredits - result.monthlyCreditsUsed,
    maxCredits,
    isUnlimited: false,
    plan: plan.planKey,
  };
}
