import crypto from 'crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

/* ===================== CONFIG ===================== */

const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;

if (!VNPAY_HASH_SECRET) {
  throw new Error('❌ Missing VNPAY_HASH_SECRET');
}

/* ===================== UTILS ===================== */

// sort key a-z
function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

// ✅ VERIFY SIGNATURE CHUẨN VNPay (KHÔNG encode)
function verifyVNPaySignature(vnpParams, secureHash) {
  const cloned = { ...vnpParams };
  delete cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHashType;

  const sorted = sortObject(cloned);

  const signData = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join('&');

  const signed = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return signed === secureHash;
}

// response chuẩn VNPay
function vnpayResponse(code, message) {
  return NextResponse.json(
    {
      RspCode: String(code),
      Message: message,
    },
    { status: 200 }
  );
}

/* ===================== IPN ===================== */

export async function GET(request) {
  console.log('🔥 VNPay IPN HIT:', request.url);

  try {
    const { searchParams } = new URL(request.url);

    /* 1️⃣ CHỈ LẤY PARAM vnp_ */
    const vnpParams = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('vnp_')) {
        vnpParams[key] = value;
      }
    }

    const txnRef = vnpParams.vnp_TxnRef;
    const secureHash = vnpParams.vnp_SecureHash;
    const responseCode = vnpParams.vnp_ResponseCode;
    const transactionStatus = vnpParams.vnp_TransactionStatus;
    const transactionNo = vnpParams.vnp_TransactionNo;
    const amount = Number(vnpParams.vnp_Amount) / 100;

    if (!txnRef || !secureHash) {
      console.error('[IPN] Missing params');
      return vnpayResponse('97', 'Missing parameters');
    }

    /* 2️⃣ VERIFY SIGNATURE */
    if (!verifyVNPaySignature(vnpParams, secureHash)) {
      console.error('[IPN] Invalid signature:', txnRef);
      return vnpayResponse('97', 'Invalid signature');
    }

    console.log('[IPN] Valid signature:', txnRef);

    /* 3️⃣ CONNECT DB */
    await dbConnect();

    /* 4️⃣ FIND PAYMENT (IDEMPOTENT) */
    const payment = await Payment.findOne({ orderId: txnRef });

    if (!payment) {
      console.log('[IPN] Payment not found:', txnRef);
      return vnpayResponse('00', 'Confirm Success');
    }

    if (payment.status === 'completed') {
      console.log('[IPN] Already processed:', txnRef);
      return vnpayResponse('00', 'Confirm Success');
    }

    /* 5️⃣ VERIFY AMOUNT */
    if (Number(payment.amount) !== Number(amount)) {
      console.error('[IPN] Amount mismatch:', {
        expected: payment.amount,
        received: amount,
      });
      return vnpayResponse('04', 'Invalid amount');
    }

    /* 6️⃣ SUCCESS */
    if (responseCode === '00' && transactionStatus === '00') {
      payment.status = 'completed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        vnp_ResponseCode: responseCode,
        vnp_TransactionStatus: transactionStatus,
        vnp_TransactionNo: transactionNo,
        vnp_PayDate: vnpParams.vnp_PayDate,
        vnp_BankCode: vnpParams.vnp_BankCode,
        vnp_CardType: vnpParams.vnp_CardType,
      };
      await payment.save();

      // calculate expiration
      const now = new Date();
      const expiresAt = new Date(now);

      if (payment.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // update user
      await User.findByIdAndUpdate(payment.user, {
        plan: payment.plan,
        planExpiresAt: expiresAt,
        updatedAt: now,
      });

      console.log('[IPN] Payment completed:', txnRef);
      return vnpayResponse('00', 'Confirm Success');
    }

    /* 7️⃣ FAILED / CANCELED */
    payment.status = 'failed';
    payment.paymentDetails = {
      ...payment.paymentDetails,
      vnp_ResponseCode: responseCode,
      vnp_TransactionStatus: transactionStatus,
      vnp_TransactionNo: transactionNo,
    };
    await payment.save();

    console.log('[IPN] Payment failed:', txnRef, responseCode);
    return vnpayResponse('00', 'Confirm Success');
  } catch (err) {
    console.error('[VNPay IPN ERROR]', err);
    return vnpayResponse('99', 'Unknown error');
  }
}

// POST để test tay (VNPay chỉ gọi GET)
export async function POST(request) {
  return GET(request);
}
