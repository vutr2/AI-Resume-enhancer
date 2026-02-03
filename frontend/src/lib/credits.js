import clientPromise from '@/lib/mongodb-client';
import { getCurrentUser } from '@/lib/auth';

// Tính số credits còn lại trong tháng
export function calculateCreditsRemaining(user, currentMonth = null) {
  if (!currentMonth) {
    currentMonth = new Date().toISOString().slice(0, 7);
  }

  // User trả phí => không giới hạn
  if (['basic', 'pro', 'enterprise'].includes(user.plan)) {
    const planExpiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (planExpiresAt && new Date() < planExpiresAt) {
      return -1; // -1 = unlimited
    }
  }

  const isFirstMonth = user.isFirstMonth !== false;
  const maxCredits = isFirstMonth ? 10 : 3;

  if (user.currentBillingMonth !== currentMonth) {
    return maxCredits;
  }

  return Math.max(0, maxCredits - (user.monthlyCreditsUsed || 0));
}

// Kiểm tra user có thể sử dụng credit không
export async function checkCredits() {
  const descopeUser = await getCurrentUser();
  if (!descopeUser) {
    return {
      success: false,
      error: 'Vui lòng đăng nhập',
      status: 401,
    };
  }

  const client = await clientPromise;
  const db = client.db();

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

  const creditsRemaining = calculateCreditsRemaining(user);
  const isFirstMonth = user.isFirstMonth !== false;

  if (creditsRemaining === 0) {
    return {
      success: false,
      error: isFirstMonth
        ? 'Bạn đã sử dụng hết 10 lượt miễn phí trong tháng đầu tiên. Vui lòng nâng cấp để tiếp tục.'
        : 'Bạn đã sử dụng hết 3 lượt miễn phí trong tháng. Vui lòng nâng cấp để tiếp tục.',
      code: 'OUT_OF_CREDITS',
      status: 403,
      creditsRemaining: 0,
      isFirstMonth,
    };
  }

  return {
    success: true,
    user,
    creditsRemaining,
    isFirstMonth,
    isUnlimited: creditsRemaining === -1,
  };
}

/**
 * Atomic credit consumption - prevents race conditions
 * Uses MongoDB findOneAndUpdate with conditions to ensure
 * credits are only consumed if available
 */
export async function consumeCredit(userId) {
  const client = await clientPromise;
  const db = client.db();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // First check if user is premium (no credit needed)
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Premium users - no credit consumed
  if (['basic', 'pro', 'enterprise'].includes(user.plan)) {
    const planExpiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (planExpiresAt && new Date() < planExpiresAt) {
      return { success: true, creditsRemaining: -1 };
    }
  }

  const isFirstMonth = user.isFirstMonth !== false;
  const maxCredits = isFirstMonth ? 10 : 3;

  // CASE 1: New month - reset and consume atomically
  if (user.currentBillingMonth !== currentMonth) {
    const newIsFirstMonth = user.currentBillingMonth !== null ? false : true;
    const newMaxCredits = newIsFirstMonth ? 10 : 3;

    const result = await db.collection('users').findOneAndUpdate(
      {
        _id: userId,
        // Only update if still the old month (another request hasn't reset yet)
        $or: [
          { currentBillingMonth: { $ne: currentMonth } },
          { currentBillingMonth: null },
        ],
      },
      {
        $set: {
          currentBillingMonth: currentMonth,
          monthlyCreditsUsed: 1,
          isFirstMonth: newIsFirstMonth,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    // If update matched, we successfully reset + consumed
    if (result) {
      return {
        success: true,
        creditsRemaining: newMaxCredits - 1,
        maxCredits: newMaxCredits,
        isFirstMonth: newIsFirstMonth,
      };
    }

    // If no match, another request already reset this month
    // Fall through to CASE 2
  }

  // CASE 2: Same month - atomic increment with limit check
  const result = await db.collection('users').findOneAndUpdate(
    {
      _id: userId,
      currentBillingMonth: currentMonth,
      monthlyCreditsUsed: { $lt: maxCredits }, // Only if under limit
    },
    {
      $inc: { monthlyCreditsUsed: 1 },
      $set: { updatedAt: new Date() },
    },
    { returnDocument: 'after' }
  );

  if (!result) {
    // User has hit the limit - race condition prevented
    return {
      success: false,
      error: 'Hết lượt sử dụng',
      creditsRemaining: 0,
      maxCredits,
      isFirstMonth,
    };
  }

  return {
    success: true,
    creditsRemaining: maxCredits - result.monthlyCreditsUsed,
    maxCredits,
    isFirstMonth,
  };
}

/**
 * Atomic check-and-consume in one operation
 * Combines checkCredits + consumeCredit to eliminate
 * the race condition window between check and consume
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

  const client = await clientPromise;
  const db = client.db();
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

  // Premium users - unlimited
  if (['basic', 'pro', 'enterprise'].includes(user.plan)) {
    const planExpiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (planExpiresAt && new Date() < planExpiresAt) {
      return {
        success: true,
        user,
        creditsRemaining: -1,
        isUnlimited: true,
        isFirstMonth: user.isFirstMonth !== false,
      };
    }
  }

  const isFirstMonth = user.isFirstMonth !== false;
  const maxCredits = isFirstMonth ? 10 : 3;

  // New month - reset + consume atomically
  if (user.currentBillingMonth !== currentMonth) {
    const newIsFirstMonth = user.currentBillingMonth !== null ? false : true;
    const newMaxCredits = newIsFirstMonth ? 10 : 3;

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
          isFirstMonth: newIsFirstMonth,
          updatedAt: new Date(),
        },
      },
      { returnDocument: 'after' }
    );

    if (result) {
      return {
        success: true,
        user: result,
        creditsRemaining: newMaxCredits - 1,
        maxCredits: newMaxCredits,
        isFirstMonth: newIsFirstMonth,
        isUnlimited: false,
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
      error: isFirstMonth
        ? 'Bạn đã sử dụng hết 10 lượt miễn phí trong tháng đầu tiên. Vui lòng nâng cấp để tiếp tục.'
        : 'Bạn đã sử dụng hết 3 lượt miễn phí trong tháng. Vui lòng nâng cấp để tiếp tục.',
      code: 'OUT_OF_CREDITS',
      status: 403,
      creditsRemaining: 0,
      isFirstMonth,
    };
  }

  return {
    success: true,
    user: result,
    creditsRemaining: maxCredits - result.monthlyCreditsUsed,
    maxCredits,
    isFirstMonth,
    isUnlimited: false,
  };
}
