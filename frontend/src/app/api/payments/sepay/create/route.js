import { NextResponse } from 'next/server';
import { SePayPgClient } from 'sepay-pg-node';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

const PLAN_PRICES = {
  basic:      { monthly: 99000,  yearly: 990000  },
  pro:        { monthly: 199000, yearly: 1990000 },
  enterprise: { monthly: 499000, yearly: 4990000 },
};

function generateOrderId() {
  const ts = Date.now();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `RMX${ts}${rand}`;
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const { planId, billingCycle } = await request.json();

    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { success: false, message: 'Gói dịch vụ không hợp lệ' },
        { status: 400 }
      );
    }
    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, message: 'Chu kỳ thanh toán không hợp lệ' },
        { status: 400 }
      );
    }

    await dbConnect();

    const dbUser = await User.findOne({
      $or: [
        { descopeId: decoded.descopeId },
        { email: decoded.email?.toLowerCase() },
      ],
    });
    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    const amount = PLAN_PRICES[planId][billingCycle];
    const orderId = generateOrderId();
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    const client = new SePayPgClient({
      env: process.env.SEPAY_ENV || 'sandbox',
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      secret_key: process.env.SEPAY_SECRET_KEY,
    });

    const checkoutURL = client.checkout.initCheckoutUrl();
    const fields = client.checkout.initOneTimePaymentFields({
      operation: 'PURCHASE',
      payment_method: 'NAPAS_BANK_TRANSFER',
      order_invoice_number: orderId,
      order_amount: amount,
      currency: 'VND',
      order_description: `ResuMax VN - Goi ${planId} ${billingCycle === 'yearly' ? '12 thang' : '1 thang'}`,
      customer_id: decoded.descopeId,
      success_url: `${APP_URL}/api/payments/sepay/callback?status=success&orderId=${orderId}`,
      error_url:   `${APP_URL}/api/payments/sepay/callback?status=failed&orderId=${orderId}`,
      cancel_url:  `${APP_URL}/api/payments/sepay/callback?status=cancelled&orderId=${orderId}`,
    });

    // Save pending payment
    await Payment.create({
      user: dbUser._id,
      orderId,
      plan: planId,
      amount,
      paymentMethod: 'sepay',
      billingPeriod: billingCycle,
      status: 'pending',
      paymentDetails: { descopeId: decoded.descopeId },
    });

    return NextResponse.json({
      success: true,
      data: { checkoutURL, fields, orderId, amount },
    });
  } catch (error) {
    console.error('Create SePay order error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
