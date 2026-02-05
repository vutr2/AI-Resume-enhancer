import { NextResponse } from 'next/server';
import { atomicConsumeCredit } from '@/lib/credits';

export async function POST() {
  try {
    const result = await atomicConsumeCredit();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
          code: result.code,
          data: {
            creditsRemaining: result.creditsRemaining ?? 0,
            plan: result.plan,
          },
        },
        { status: result.status || 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        creditsRemaining: result.creditsRemaining,
        maxCredits: result.maxCredits,
        isUnlimited: result.isUnlimited,
        monthlyCreditsUsed: result.user.monthlyCreditsUsed || 0,
        plan: result.plan,
        message: result.isUnlimited
          ? 'Gói Premium - Không giới hạn lượt sử dụng'
          : `Còn ${result.creditsRemaining}/${result.maxCredits} lượt trong tháng`,
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
