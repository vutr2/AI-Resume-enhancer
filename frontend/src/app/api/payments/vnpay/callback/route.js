import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import clientPromise from '@/lib/mongodb-client';

// VNPay config
const VNPAY_CONFIG = {
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
};

// Sort object keys
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).sort();
  for (const key of keys) {
    sorted[key] = obj[key];
  }
  return sorted;
}

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

    // Get secure hash from params
    const secureHash = vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    // Sort params
    const sortedParams = sortObject(vnp_Params);

    // Create signature to verify
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const txnRef = vnp_Params['vnp_TxnRef'];
    const responseCode = vnp_Params['vnp_ResponseCode'];
    const transactionNo = vnp_Params['vnp_TransactionNo'];
    const amount = parseInt(vnp_Params['vnp_Amount']) / 100; // Convert back from smallest unit

    console.log('VNPay callback received:', {
      txnRef,
      responseCode,
      transactionNo,
      amount,
      hashValid: secureHash === signed,
    });

    await dbConnect();

    // Find payment record
    const payment = await Payment.findOne({ orderId: txnRef });

    if (!payment) {
      console.error('Payment not found:', txnRef);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback?status=error&message=Không tìm thấy đơn hàng`
      );
    }

    // Verify signature
    if (secureHash !== signed) {
      console.error('Invalid signature for payment:', txnRef);
      payment.status = 'failed';
      payment.paymentDetails = {
        ...payment.paymentDetails,
        error: 'Invalid signature',
        vnp_ResponseCode: responseCode,
      };
      await payment.save();

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback?status=error&message=Chữ ký không hợp lệ`
      );
    }

    // Check response code
    if (responseCode === '00') {
      // Payment successful
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
      const client = await clientPromise;
      const db = client.db();

      // Calculate plan expiration
      const now = new Date();
      const expiresAt = new Date(now);
      if (payment.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }

      // payment.user is now ObjectId
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

      console.log('Payment successful:', txnRef);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback?status=success&txnRef=${txnRef}`
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

      // Map VNPay error codes to messages
      const errorMessages = {
        '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
        '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking',
        '10': 'Xác thực thông tin thẻ không đúng quá 3 lần',
        '11': 'Đã hết hạn chờ thanh toán',
        '12': 'Thẻ/Tài khoản bị khóa',
        '13': 'Mật khẩu OTP không chính xác',
        '24': 'Giao dịch đã bị hủy',
        '51': 'Tài khoản không đủ số dư',
        '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'Nhập sai mật khẩu quá số lần quy định',
        '99': 'Lỗi không xác định',
      };

      const errorMessage = errorMessages[responseCode] || 'Thanh toán thất bại';

      console.log('Payment failed:', txnRef, responseCode);

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback?status=failed&message=${encodeURIComponent(errorMessage)}`
      );
    }
  } catch (error) {
    console.error('VNPay callback error:', error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/payment/vnpay/callback?status=error&message=Lỗi hệ thống`
    );
  }
}
