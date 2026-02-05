import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

// VNPay config
const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE || 'YOUR_TMN_CODE',
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
  vnp_Url:
    process.env.VNPAY_URL ||
    'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  vnp_ReturnUrl:
    process.env.VNPAY_RETURN_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/payments/vnpay/callback`,
  vnp_IpnUrl:
    process.env.VNPAY_IPN_URL ||
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/payments/vnpay/ipn`,
};

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

// Generate unique transaction ID
function generateTxnRef() {
  const date = new Date();
  const timestamp = date.getTime();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `RMX${timestamp}${random}`;
}

// Sort object keys
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

function getVNPayDate(date = new Date()) {
  const vnTime = new Date(date.getTime(0 + 7 * 60 * 60 * 1000));
  return (
    vnTime.getFullYear().toString() +
    String(vnTime.getMonth() + 1).padStart(2, '0') +
    String(vnTime.getDate()).padStart(2, '0') +
    String(vnTime.getHours()).padStart(2, '0') +
    String(vnTime.getMinutes()).padStart(2, '0') +
    String(vnTime.getSeconds()).padStart(2, '0')
  );
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
    const { planId, billingCycle } = body;

    // Validate plan
    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { success: false, message: 'Gói dịch vụ không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, message: 'Chu kỳ thanh toán không hợp lệ' },
        { status: 400 }
      );
    }

    const amount = PLAN_PRICES[planId][billingCycle];
    const txnRef = generateTxnRef();

    // Find user in database to get ObjectId
    const dbUser = await User.findOne({
      $or: [
        { descopeId: decoded.descopeId },
        { email: decoded.email?.toLowerCase() },
      ],
    });

    if (!dbUser) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy thông tin người dùng' },
        { status: 404 }
      );
    }

    // Get client IP
    const ipAddr =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1';

    // Create date in VNPay format: yyyyMMddHHmmss
    const vnp_CreateDate = getVNPayDate();

    // Expire date (15 minutes from now)
    const expireDate = new Date(Date.now() + 15 * 60 * 1000);
    const vnp_ExpireDate = getVNPayDate(expireDate);

    // Order info
    const orderInfo = `ResuMax VN - Nang cap goi ${planId.charAt(0).toUpperCase() + planId.slice(1)} ${billingCycle === 'yearly' ? '12 thang' : '1 thang'}`;

    // VNPay params
    let vnp_Params = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: txnRef,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100, // VNPay requires amount in smallest unit (x100)
      vnp_ReturnUrl: VNPAY_CONFIG.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr.split(',')[0].trim(),
      vnp_CreateDate: vnp_CreateDate,
      vnp_ExpireDate: vnp_ExpireDate,
    };

    // Sort params and create signature
    vnp_Params = sortObject(vnp_Params);

    const signData = new URLSearchParams(vnp_Params).toString();
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    // Create payment URL
    const paymentUrl = `${VNPAY_CONFIG.vnp_Url}?${new URLSearchParams(vnp_Params).toString()}`;

    console.log('VNPay order created:', {
      txnRef,
      amount,
      planId,
      billingCycle,
    });

    // Save payment record
    await Payment.create({
      user: dbUser._id,
      orderId: txnRef,
      plan: planId,
      amount: amount,
      paymentMethod: 'vnpay',
      billingPeriod: billingCycle,
      status: 'pending',
      paymentDetails: {
        vnp_TxnRef: txnRef,
        vnp_CreateDate: vnp_CreateDate,
        descopeId: decoded.descopeId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo đơn hàng thành công',
        data: {
          transactionId: txnRef,
          paymentUrl: paymentUrl,
          amount: amount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Create VNPay order error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
