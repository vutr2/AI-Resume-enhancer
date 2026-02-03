import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
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

    const body = await request.json();
    const { orderId, transactionId } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp mã đơn hàng' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await Payment.findOne({
      orderId,
      user: decoded.userId,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy đơn hàng' },
        { status: 404 }
      );
    }

    if (payment.status === 'completed') {
      return NextResponse.json(
        { success: true, message: 'Đơn hàng đã được xác nhận', data: { payment } },
        { status: 200 }
      );
    }

    // Update payment status
    payment.status = 'completed';
    payment.transactionId = transactionId || null;

    // Calculate plan dates
    const now = new Date();
    const endDate = new Date(now);
    if (payment.billingPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    payment.planStartDate = now;
    payment.planEndDate = endDate;
    await payment.save();

    // Update user plan
    const user = await User.findById(decoded.userId);
    user.plan = payment.plan;
    user.planExpiresAt = endDate;

    // Set credits based on plan
    const planCredits = {
      basic: 50,
      pro: -1, // unlimited
      enterprise: -1, // unlimited
    };
    user.credits = planCredits[payment.plan];
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Thanh toán thành công! Gói dịch vụ đã được kích hoạt.',
        data: {
          payment: {
            _id: payment._id,
            orderId: payment.orderId,
            plan: payment.plan,
            amount: payment.amount,
            status: payment.status,
            planStartDate: payment.planStartDate,
            planEndDate: payment.planEndDate,
          },
          user: {
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
            credits: user.credits,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
