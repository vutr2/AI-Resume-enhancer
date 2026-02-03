import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    // Check if user has a paid plan
    if (user.plan === 'free') {
      return NextResponse.json(
        { success: false, message: 'Bạn đang sử dụng gói miễn phí' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { reason } = body;

    // Store cancellation info
    const previousPlan = user.plan;
    const previousExpiry = user.planExpiresAt;

    // Create cancellation record
    await Payment.create({
      user: decoded.userId,
      orderId: `CANCEL_${Date.now()}`,
      plan: 'free',
      amount: 0,
      paymentMethod: 'cancel',
      billingPeriod: 'none',
      status: 'completed',
      paymentDetails: {
        previousPlan,
        previousExpiry,
        cancelReason: reason || 'Không có lý do',
        cancelledAt: new Date(),
      },
    });

    // Update user to free plan
    // Option 1: Immediate cancellation
    user.plan = 'free';
    user.planExpiresAt = null;
    user.credits = 5; // Reset to free tier credits

    // Option 2: Cancel at end of billing period (uncomment to use)
    // user.cancelAtPeriodEnd = true;

    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Đã hủy gói thành công. Bạn đã chuyển về gói miễn phí.',
        data: {
          previousPlan,
          currentPlan: user.plan,
          credits: user.credits,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
