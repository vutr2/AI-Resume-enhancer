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

// ✅ FIX: Không dùng URLSearchParams (VNPay không encode)
function verifyVNPaySignature(params, secureHash) {
  const cloned = { ...params };
  delete cloned.vnp_SecureHash;
  delete cloned.vnp_SecureHashType;

  const sorted = sortObject(cloned);

  // ✅ ĐÚNG: Join trực tiếp không encode
  const signData = Object.keys(sorted)
    .map((key) => `${key}=${sorted[key]}`)
    .join('&');

  const signed = crypto
    .createHmac('sha512', VNPAY_HASH_SECRET)
    .update(Buffer.from(signData, 'utf-8'))
    .digest('hex');

  return secureHash === signed;
}

// ✅ Helper: Trả response chuẩn VNPay
function vnpayResponse(rspCode, message, status = 200) {
  return new Response(JSON.stringify({ RspCode: rspCode, Message: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/* ===================== IPN ===================== */

export async function GET(request) {
  // ✅ FIX 3: Log ngay đầu để biết VNPay có gọi IPN không
  console.log('VNPay IPN HIT:', request.url);

  try {
    // ✅ Validate hash secret
    if (!VNPAY_HASH_SECRET) {
      console.error('[IPN] Missing VNPAY_HASH_SECRET');
      return vnpayResponse('99', 'Config error');
    }

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
      return vnpayResponse('97', 'Invalid signature');
    }

    /* 2️⃣ Connect DB */
    try {
      await dbConnect();
    } catch (dbErr) {
      console.error('[IPN] DB connect failed:', dbErr);
      return vnpayResponse('99', 'Database error');
    }

    /* 3️⃣ Idempotent: chỉ xử lý khi pending */
    const payment = await Payment.findOne({
      orderId: txnRef,
      status: 'pending',
    });

    if (!payment) {
      console.log('[IPN] Ignored (already processed or not found):', txnRef);
      return vnpayResponse('02', 'Order already processed');
    }

    /* 4️⃣ Verify amount */
    if (Number(payment.amount) !== Number(amount)) {
      console.error('[IPN] Amount mismatch:', {
        expected: payment.amount,
        received: amount,
      });
      return vnpayResponse('04', 'Invalid amount');
    }

    /* 5️⃣ Success case */
    if (responseCode === '00' && transactionStatus === '00') {
      // ✅ Update payment (atomic)
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

      // ✅ Update user plan (atomic)
      await User.findByIdAndUpdate(
        payment.user,
        {
          plan: payment.plan,
          planExpiresAt: expiresAt,
          updatedAt: now,
        },
        { new: true }
      );

      console.log('[IPN] Payment completed:', txnRef);

      return vnpayResponse('00', 'Confirm Success');
    }

    /* 6️⃣ Failed / canceled */
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
