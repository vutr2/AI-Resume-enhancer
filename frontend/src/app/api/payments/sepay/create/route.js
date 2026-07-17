import { NextResponse } from 'next/server';
import { SePayPgClient } from 'sepay-pg-node';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { PACKAGES } from '@/lib/packages';

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

    const rateLimitResult = await rateLimitMiddleware(request, decoded.descopeId, 'general');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    const body = await request.json();
    const { packageId } = body;

    if (!packageId || !PACKAGES[packageId]) {
      return NextResponse.json(
        { success: false, message: 'Gói dịch vụ không hợp lệ' },
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

    const pkg = PACKAGES[packageId];
    const amount = pkg.price;
    const orderId = generateOrderId();
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    const client = new SePayPgClient({
      env: process.env.SEPAY_ENV || 'sandbox',
      merchant_id: process.env.SEPAY_MERCHANT_ID,
      secret_key: process.env.SEPAY_SECRET_KEY,
    });

    const checkoutURL = client.checkout.initCheckoutUrl();
    const fields = client.checkout.initOneTimePaymentFields({
      env: process.env.SEPAY_ENV || 'sandbox',
      operation: 'PURCHASE',
      payment_method: 'BANK_TRANSFER',
      order_invoice_number: orderId,
      order_amount: amount,
      currency: 'VND',
      order_description: `ResuMax VN - ${pkg.label}`,
      customer_id: decoded.descopeId,
      success_url: `${APP_URL}/api/payments/sepay/callback?status=success&orderId=${orderId}`,
      error_url: `${APP_URL}/api/payments/sepay/callback?status=failed&orderId=${orderId}`,
      cancel_url: `${APP_URL}/api/payments/sepay/callback?status=cancelled&orderId=${orderId}`,
    });

    await Payment.create({
      user: dbUser._id,
      orderId,
      package: packageId,
      amount,
      paymentMethod: 'sepay',
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
