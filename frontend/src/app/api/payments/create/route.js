import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';
import crypto from 'crypto';

// Plan prices in VND
const PLAN_PRICES = {
  basic: {
    monthly: 99000,
    yearly: 990000,
  },
  pro: {
    monthly: 199000,
    yearly: 1990000,
  },
  enterprise: {
    monthly: 499000,
    yearly: 4990000,
  },
};

// Generate unique order ID
function generateOrderId() {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(4).toString('hex');
  return `RM-${timestamp}-${randomStr}`.toUpperCase();
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

    await dbConnect();

    const body = await request.json();
    const { plan, billingPeriod, paymentMethod } = body;

    // Validate plan
    if (!plan || !['basic', 'pro', 'enterprise'].includes(plan)) {
      return NextResponse.json(
        { success: false, message: 'Gói dịch vụ không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate billing period
    if (!billingPeriod || !['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { success: false, message: 'Chu kỳ thanh toán không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate payment method
    if (!paymentMethod || !['momo', 'vnpay', 'bank_transfer'].includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, message: 'Phương thức thanh toán không hợp lệ' },
        { status: 400 }
      );
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    const amount = PLAN_PRICES[plan][billingPeriod];
    const orderId = generateOrderId();

    // Create payment record
    const payment = await Payment.create({
      user: decoded.userId,
      orderId,
      plan,
      amount,
      paymentMethod,
      billingPeriod,
      status: 'pending',
    });

    // Generate payment URL based on method
    let paymentUrl = '';
    let paymentData = {};

    if (paymentMethod === 'momo') {
      // MoMo payment integration
      paymentData = await generateMoMoPayment(orderId, amount, plan);
      paymentUrl = paymentData.payUrl || '';
    } else if (paymentMethod === 'vnpay') {
      // VNPay payment integration
      paymentData = await generateVNPayPayment(orderId, amount, plan);
      paymentUrl = paymentData.paymentUrl || '';
    } else if (paymentMethod === 'bank_transfer') {
      // Bank transfer info
      paymentData = {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountName: 'RESUMAX VN',
        content: `Thanh toan ${orderId}`,
        amount,
      };
    }

    // Update payment with details
    payment.paymentDetails = paymentData;
    await payment.save();

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: {
          payment: {
            _id: payment._id,
            orderId: payment.orderId,
            plan: payment.plan,
            amount: payment.amount,
            billingPeriod: payment.billingPeriod,
            paymentMethod: payment.paymentMethod,
            status: payment.status,
          },
          paymentUrl,
          paymentData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create payment error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

// MoMo payment generation (placeholder - implement with actual MoMo API)
async function generateMoMoPayment(orderId, amount, plan) {
  const partnerCode = process.env.MOMO_PARTNER_CODE;
  const accessKey = process.env.MOMO_ACCESS_KEY;
  const secretKey = process.env.MOMO_SECRET_KEY;
  const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/momo/callback`;
  const ipnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/momo/webhook`;
  const requestId = orderId;
  const orderInfo = `Thanh toán gói ${plan} - ResuMax VN`;
  const requestType = 'captureWallet';
  const extraData = '';

  // In production, you would sign and call MoMo API
  // This is a placeholder
  return {
    payUrl: `https://test-payment.momo.vn/v2/gateway/pay?orderId=${orderId}`,
    requestId,
    orderInfo,
  };
}

// VNPay payment generation (placeholder - implement with actual VNPay API)
async function generateVNPayPayment(orderId, amount, plan) {
  const vnpTmnCode = process.env.VNPAY_TMN_CODE;
  const vnpHashSecret = process.env.VNPAY_HASH_SECRET;
  const vnpUrl = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback`;

  // In production, you would generate signed VNPay URL
  // This is a placeholder
  return {
    paymentUrl: `${vnpUrl}?vnp_TmnCode=${vnpTmnCode}&vnp_TxnRef=${orderId}&vnp_Amount=${amount * 100}`,
    orderId,
  };
}
