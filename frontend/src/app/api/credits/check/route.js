import { NextResponse } from 'next/server';
import { checkCredits } from '@/lib/credits';

export async function GET() {
  try {
    const result = await checkCredits();

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: result.error,
          code: result.code,
          data: {
            creditsRemaining: result.creditsRemaining ?? 0,
            maxCredits: result.maxCredits ?? 0,
            plan: result.plan,
          },
        },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        creditsRemaining: result.creditsRemaining,
        maxCredits: result.maxCredits,
        isUnlimited: result.isUnlimited,
        canUse: result.creditsRemaining !== 0,
        plan: result.plan,
        monthlyCreditsUsed: result.user.monthlyCreditsUsed || 0,
        currentBillingMonth: result.user.currentBillingMonth,
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
