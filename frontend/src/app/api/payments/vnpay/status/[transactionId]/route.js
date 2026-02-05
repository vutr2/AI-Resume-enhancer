import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

/* ===================== CONFIG ===================== */

const VNPAY_CONFIG = {
  vnp_TmnCode: process.env.VNPAY_TMN_CODE,
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET,
  vnp_QueryUrl:
    process.env.VNPAY_QUERY_URL ||
    'https://sandbox.vnpayment.vn/merchant_webapi/api/transaction',
};

/* ===================== UTILS ===================== */

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function signVNPay(params) {
  const sorted = sortObject(params);
  const signData = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join('&');

  return crypto
    .createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');
}

function getVNPayDate(date = new Date()) {
  const vn = new Date(date.getTime() + 7 * 60 * 60 * 1000);
  return (
    vn.getFullYear().toString() +
    String(vn.getMonth() + 1).padStart(2, '0') +
    String(vn.getDate()).padStart(2, '0') +
    String(vn.getHours()).padStart(2, '0') +
    String(vn.getMinutes()).padStart(2, '0') +
    String(vn.getSeconds()).padStart(2, '0')
  );
}

/* ===================== ROUTE ===================== */

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const { transactionId } = params;
    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã giao dịch' },
        { status: 400 }
      );
    }

    await dbConnect();

    const payment = await Payment.findOne({
      orderId: transactionId,
      user: decoded.userId,
    });

    if (!payment) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy giao dịch' },
        { status: 404 }
      );
    }

    /* ✅ ĐÃ XONG */
    if (payment.status === 'completed') {
      const user = await User.findById(decoded.userId);
      return NextResponse.json({
        success: true,
        data: {
          status: 'completed',
          plan: user?.plan,
          planExpiresAt: user?.planExpiresAt,
        },
      });
    }

    /* ===================== QUERY VNPay ===================== */

    const vnpParams = {
      vnp_RequestId: crypto.randomUUID(),
      vnp_Version: '2.1.0',
      vnp_Command: 'querydr',
      vnp_TmnCode: VNPAY_CONFIG.vnp_TmnCode,
      vnp_TxnRef: transactionId,
      vnp_OrderInfo: 'Check transaction',
      vnp_TransactionDate:
        payment.paymentDetails?.vnp_CreateDate ||
        getVNPayDate(payment.createdAt),
      vnp_CreateDate: getVNPayDate(),
      vnp_IpAddr: '127.0.0.1',
    };

    vnpParams.vnp_SecureHash = signVNPay(vnpParams);

    const response = await fetch(VNPAY_CONFIG.vnp_QueryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vnpParams),
    });

    const vnpResponse = await response.json();

    /* ===================== HANDLE RESULT ===================== */

    if (vnpResponse.vnp_ResponseCode === '00') {
      const now = new Date();
      const endDate = new Date(now);

      if (payment.billingPeriod === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      payment.status = 'completed';
      payment.transactionId = vnpResponse.vnp_TransactionNo;
      payment.planStartDate = now;
      payment.planEndDate = endDate;
      await payment.save();

      await User.findByIdAndUpdate(decoded.userId, {
        plan: payment.plan,
        planExpiresAt: endDate,
        updatedAt: now,
      });

      return NextResponse.json({
        success: true,
        data: { status: 'completed' },
      });
    }

    if (vnpResponse.vnp_ResponseCode === '01') {
      return NextResponse.json({
        success: true,
        data: { status: 'pending' },
      });
    }

    payment.status = 'failed';
    await payment.save();

    return NextResponse.json({
      success: false,
      data: { status: 'failed' },
    });
  } catch (error) {
    console.error('Check VNPay status error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
