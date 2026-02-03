import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb-client';
import { getCurrentUser } from '@/lib/auth';

// Tính số credits còn lại trong tháng
function calculateCreditsRemaining(user, currentMonth) {
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

export async function POST() {
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

    const currentMonth = new Date().toISOString().slice(0, 7);
    const creditsRemaining = calculateCreditsRemaining(user, currentMonth);

    // User trả phí => không cần trừ credit
    if (creditsRemaining === -1) {
      return NextResponse.json({
        success: true,
        data: {
          creditsRemaining: -1,
          message: 'Gói Premium - Không giới hạn lượt sử dụng',
        },
      });
    }

    // Hết lượt
    if (creditsRemaining <= 0) {
      const isFirstMonth = user.isFirstMonth !== false;
      return NextResponse.json(
        {
          success: false,
          message: isFirstMonth
            ? 'Bạn đã sử dụng hết 10 lượt miễn phí trong tháng đầu tiên. Vui lòng nâng cấp để tiếp tục.'
            : 'Bạn đã sử dụng hết 3 lượt miễn phí trong tháng. Vui lòng nâng cấp để tiếp tục.',
          code: 'OUT_OF_CREDITS',
          data: {
            creditsRemaining: 0,
            isFirstMonth,
          },
        },
        { status: 403 }
      );
    }

    // Trừ 1 credit
    const updateData = {};

    // Nếu sang tháng mới, reset và update isFirstMonth
    if (user.currentBillingMonth !== currentMonth) {
      // Nếu đã có billing month trước đó => không còn first month
      if (user.currentBillingMonth !== null) {
        updateData.isFirstMonth = false;
      }
      updateData.currentBillingMonth = currentMonth;
      updateData.monthlyCreditsUsed = 1;
    } else {
      updateData.monthlyCreditsUsed = (user.monthlyCreditsUsed || 0) + 1;
    }

    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: updateData }
    );

    const newCreditsRemaining = creditsRemaining - 1;
    const isFirstMonth = updateData.isFirstMonth !== undefined ? updateData.isFirstMonth : (user.isFirstMonth !== false);
    const maxCredits = isFirstMonth ? 10 : 3;

    return NextResponse.json({
      success: true,
      data: {
        creditsRemaining: newCreditsRemaining,
        maxCredits,
        isFirstMonth,
        monthlyCreditsUsed: updateData.monthlyCreditsUsed,
        message: `Còn ${newCreditsRemaining}/${maxCredits} lượt trong tháng`,
      },
    });
  } catch (error) {
    console.error('Use credit error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
