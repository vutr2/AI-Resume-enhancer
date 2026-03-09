import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

// SePay IPN - server-to-server notification
// SePay sends POST with X-Secret-Key header for authentication
export async function POST(request) {
  try {
    // Verify secret key
    const secretKey = request.headers.get('x-secret-key');
    if (!secretKey || secretKey !== process.env.SEPAY_SECRET_KEY) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_type, order } = body;

    if (notification_type !== 'ORDER_PAID') {
      // Not a payment notification, acknowledge and ignore
      return NextResponse.json({ success: true });
    }

    if (!order?.invoice_number) {
      return NextResponse.json({ success: false, message: 'Missing invoice_number' }, { status: 400 });
    }

    await dbConnect();

    const payment = await Payment.findOne({ orderId: order.invoice_number });

    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      // Already processed (e.g. by redirect callback), acknowledge
      return NextResponse.json({ success: true });
    }

    if (order.order_status !== 'CAPTURED') {
      payment.status = 'failed';
      await payment.save();
      return NextResponse.json({ success: true });
    }

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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SePay IPN error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
