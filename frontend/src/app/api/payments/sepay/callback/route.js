import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

// SePay redirects user back here after payment
// DB update is handled here (SePay also supports IPN webhook as backup)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const orderId = searchParams.get('orderId');

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

  try {
    if (!orderId) {
      return NextResponse.redirect(
        `${APP_URL}/payment/sepay/callback?status=error&message=${encodeURIComponent('Thiếu thông tin đơn hàng')}`
      );
    }

    if (status === 'success') {
      await dbConnect();

      const payment = await Payment.findOne({ orderId });

      if (payment && payment.status !== 'completed') {
        payment.status = 'completed';
        await payment.save();

        const now = new Date();
        const expiresAt = new Date(now);
        if (payment.billingPeriod === 'yearly') {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        } else {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        }

        await User.findByIdAndUpdate(payment.user, {
          plan: payment.plan,
          planExpiresAt: expiresAt,
          updatedAt: now,
        });
      }

      return NextResponse.redirect(
        `${APP_URL}/payment/sepay/callback?status=success&orderId=${orderId}`
      );
    }

    if (status === 'cancelled') {
      return NextResponse.redirect(
        `${APP_URL}/payment/sepay/callback?status=cancelled`
      );
    }

    // failed
    return NextResponse.redirect(
      `${APP_URL}/payment/sepay/callback?status=failed&message=${encodeURIComponent('Thanh toán thất bại')}`
    );
  } catch (error) {
    console.error('SePay callback error:', error);
    return NextResponse.redirect(
      `${APP_URL}/payment/sepay/callback?status=error&message=${encodeURIComponent('Lỗi hệ thống')}`
    );
  }
}
