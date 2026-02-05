import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

const VNPAY_HASH_SECRET = process.env.VNPAY_HASH_SECRET;

/* ===================== Utils ===================== */

function sortObject(obj) {
  return Object.keys(obj)
    .sort()
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function verifyVNPaySignature(params, secureHash) {
  const cloned = { ...params };
  delete cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHashType;

  const sorted = sortObject(cloned);
  const signData = new URLSearchParams(sorted).toString();

  const signed = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return secureHash === signed;
}

/* ===================== IPN ===================== */

export async function GET(request) {
  try {
    const searchParams = Object.fromEntries(
      new URL(request.url).searchParams.entries()
    );

    const secureHash = searchParams.vnp_SecureHash;
    const txnRef = searchParams.vnp_TxnRef;
    const responseCode = searchParams.vnp_ResponseCode;
    const transactionStatus = searchParams.vnp_TransactionStatus;
    const transactionNo = searchParams.vnp_TransactionNo;
    const amount = Number(searchParams.vnp_Amount) / 100;

    console.log('[VNPay IPN]', {
      txnRef,
      responseCode,
      transactionStatus,
      amount,
    });

    /* 1️⃣ Verify signature */
    if (!verifyVNPaySignature(searchParams, secureHash)) {
      console.error('[IPN] Invalid signature:', txnRef);
      return NextResponse.json({ RspCode: '97', Message: 'Invalid signature' });
    }

    await dbConnect();

    /* 2️⃣ Idempotent: chỉ xử lý khi pending */
    const payment = await Payment.findOne({
      orderId: txnRef,
      status: 'pending',
    });

    if (!payment) {
      console.log('[IPN] Ignored (already processed):', txnRef);
      return NextResponse.json({
        RspCode: '02',
        Message: 'Order already processed',
      });
    }

    /* 3️⃣ Verify amount */
    if (Number(payment.amount) !== Number(amount)) {
      console.error('[IPN] Amount mismatch:', {
        expected: payment.amount,
        received: amount,
      });
      return NextResponse.json({
        RspCode: '04',
        Message: 'Invalid amount',
      });
    }

    /* 4️⃣ Success case */
    if (responseCode === '00' && transactionStatus === '00') {
      // Update payment
      payment.status = 'completed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        vnp_ResponseCode: responseCode,
        vnp_TransactionStatus: transactionStatus,
        vnp_TransactionNo: transactionNo,
        vnp_PayDate: searchParams.vnp_PayDate,
        vnp_BankCode: searchParams.vnp_BankCode,
        vnp_CardType: searchParams.vnp_CardType,
      };
      await payment.save();

      // Calculate expiration
      const now = new Date();
      let expiresAt = new Date(now);

      if (payment.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // Update user plan (mongoose-safe)
      await User.findByIdAndUpdate(payment.user, {
        plan: payment.plan,
        planExpiresAt: expiresAt,
        updatedAt: now,
      });

      console.log('[IPN] Payment completed:', txnRef);

      return NextResponse.json({
        RspCode: '00',
        Message: 'Confirm Success',
      });
    }

    /* 5️⃣ Failed / canceled */
    payment.status = 'failed';
    payment.paymentDetails = {
      ...payment.paymentDetails,
      vnp_ResponseCode: responseCode,
      vnp_TransactionStatus: transactionStatus,
      vnp_TransactionNo: transactionNo,
    };
    await payment.save();

    console.log('[IPN] Payment failed:', txnRef, responseCode);

    return NextResponse.json({
      RspCode: '00',
      Message: 'Confirm Success',
    });
  } catch (err) {
    console.error('[VNPay IPN ERROR]', err);
    return NextResponse.json({
      RspCode: '99',
      Message: 'Unknown error',
    });
  }
}
