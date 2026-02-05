import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect, { getDb } from '@/lib/db';
import Payment from '@/models/Payment';

const VNPAY_CONFIG = {
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
};

function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

// IPN endpoint - VNPay server-to-server call
// VNPay expects response: { RspCode: '00', Message: 'success' }
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Get all VNPay params
    const vnp_Params = {};
    for (const [key, value] of searchParams.entries()) {
      if (key.startsWith('vnp_')) {
        vnp_Params[key] = value;
      }
    }

    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort and create signature
    const sortedParams = sortObject(vnp_Params);
    const signData = Object.keys(sortedParams)
      .map((key) => `${key}=${sortedParams[key]}`)
      .join('&');
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const txnRef = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];
    const amount = parseInt(vnp_Params['vnp_Amount']) / 100;

    console.log('VNPay IPN received:', {
      txnRef,
      responseCode,
      transactionNo,
      amount,
      hashValid: secureHash === signed,
    });

    // Verify signature
    if (secureHash !== signed) {
      console.error('IPN invalid signature:', txnRef);
      return NextResponse.json(
        { RspCode: '97', Message: 'Invalid signature' },
        { status: 200 }
      );
    }

    await dbConnect();

    // Find payment
    const payment = await Payment.findOne({ orderId: txnRef });

    if (!payment) {
      console.error('IPN payment not found:', txnRef);
      return NextResponse.json(
        { RspCode: '01', Message: 'Order not found' },
        { status: 200 }
      );
    }

    // Check if already processed
    if (payment.status === 'completed') {
      console.log('IPN already processed:', txnRef);
      return NextResponse.json(
        { RspCode: '02', Message: 'Order already confirmed' },
        { status: 200 }
      );
    }

    // Verify amount
    if (payment.amount !== amount) {
      console.error('IPN amount mismatch:', { expected: payment.amount, received: amount });
      return NextResponse.json(
        { RspCode: '04', Message: 'Invalid amount' },
        { status: 200 }
      );
    }

    if (responseCode === '00') {
      // Payment successful - update DB
      payment.status = 'completed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        vnp_TransactionNo: transactionNo,
        vnp_ResponseCode: responseCode,
        vnp_PayDate: vnp_Params['vnp_PayDate'],
        vnp_BankCode: vnp_Params['vnp_BankCode'],
        vnp_CardType: vnp_Params['vnp_CardType'],
      };
      await payment.save();

      // Update user plan
      const db = await getDb();

      const now = new Date();
      const expiresAt = new Date(now);
      if (payment.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      await db.collection('users').updateOne(
        { _id: payment.user },
        {
          $set: {
            plan: payment.plan,
            planExpiresAt: expiresAt,
            updatedAt: now,
          },
        }
      );

      console.log('IPN payment successful:', txnRef);
      return NextResponse.json(
        { RspCode: '00', Message: 'Confirm Success' },
        { status: 200 }
      );
    } else {
      // Payment failed
      payment.status = 'failed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        vnp_ResponseCode: responseCode,
        vnp_TransactionNo: transactionNo,
      };
      await payment.save();

      console.log('IPN payment failed:', txnRef, responseCode);
      return NextResponse.json(
        { RspCode: '00', Message: 'Confirm Success' },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('VNPay IPN error:', error);
    return NextResponse.json(
      { RspCode: '99', Message: 'Unknown error' },
      { status: 200 }
    );
  }
}
