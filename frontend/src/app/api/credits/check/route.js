import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb-client';
import { getCurrentUser } from '@/lib/auth';

// Tính số credits còn lại trong tháng
function calculateCreditsRemaining(user) {
  // User trả phí => không giới hạn
  if (['basic', 'pro', 'enterprise'].includes(user.plan)) {
    const planExpiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (planExpiresAt && new Date() < planExpiresAt) {
      return -1; // -1 = unlimited
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  const isFirstMonth = user.isFirstMonth !== false;
  const maxCredits = isFirstMonth ? 10 : 3;

  if (user.currentBillingMonth !== currentMonth) {
    return maxCredits;
  }

  return Math.max(0, maxCredits - (user.monthlyCreditsUsed || 0));
}

export async function GET() {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
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
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    const creditsRemaining = calculateCreditsRemaining(user);
    const isFirstMonth = user.isFirstMonth !== false;
    const maxCredits = creditsRemaining === -1 ? -1 : (isFirstMonth ? 10 : 3);

    return NextResponse.json({
      success: true,
      data: {
        creditsRemaining,
        maxCredits,
        isFirstMonth,
        canUse: creditsRemaining !== 0,
        plan: user.plan || 'free',
        currentBillingMonth: user.currentBillingMonth,
        monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
      },
    });
  } catch (error) {
    console.error('Check credits error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
