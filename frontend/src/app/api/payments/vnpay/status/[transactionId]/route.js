import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';


const VNPAY_CONFIG = {
  vnp_HashSecret: process.env.VNPAY_HASH_SECRET || 'YOUR_HASH_SECRET',
};

export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const { transactionId } = await params;

    if (!transactionId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu mã giao dịch' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find payment
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

    // If already completed, return success
    if (payment.status === 'completed') {
      const user = await User.findById(decoded.userId);
      return NextResponse.json(
        {
          success: true,
          message: 'Thanh toán thành công',
          data: {
            status: 'completed',
            payment: {
              orderId: payment.orderId,
              plan: payment.plan,
              amount: payment.amount,
              planStartDate: payment.planStartDate,
              planEndDate: payment.planEndDate,
            },
            user: {
              plan: user?.plan,
              planExpiresAt: user?.planExpiresAt,
              credits: user?.credits,
            },
          },
        },
        { status: 200 }
      );
    };

    const queryData = {
        app_id: process.env.VNPAY_APP_ID,
        app_trans_id: transactionId,};

    const data = `${queryData.app_id}|${queryData.app_trans_id}|${VNPAY_CONFIG.vnp_HashSecret}`;
    queryData.vnp_SecureHash = crypto.createHmac('sha512', VNPAY_CONFIG.vnp_HashSecret).update(data).digest('hex');

    const response = await fetch(VNPAY_CONFIG.vnp_QueryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(queryData).toString(),
    });

    const vnpResponse = await response.json();

    // return_code: 1 = success, 2 = failed, 3 = pending
    if (vnpResponse.vnp_ResponseCode === '1') {

        const now = new Date();
        const endDate = new Date(now);
        if (payment.billingPeriod === 'monthly') {
            endDate.setMonth(endDate.getMonth() + 1);
        } else {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }
      payment.status = 'completed';
      payment.transactionId = vnpResponse.vnp_TransactionNo;
      payment.planStartDate = now;
      payment.planEndDate = endDate;

      await payment.save();

      const user = await User.findById(decode.userId);
      if (user) {
        user.plan = payment.plan;
        user.planExpiresAt = endDate;
        const planCredits = {basic: 50, pro: -1, enterprise: -1};
        user.credits = planCredits[payment.plan] || 50;
        await user.save();
      }

      return NextResponse.json(
        {
            success: true,
            message: "Thanh toán thành công",
            data: {
                status: 'completed',
                payment: {
                    orderId: payment.orderId,
                    plan: payment.plan,
                    amount: payment.amount,
                    planStartDate: payment.planStartDate,
                    planEndDate: payment.planEndDate,
                },
                user: {
                    plan: user?.plan,
                    planExpiresAt: user?.planExpiresAt,
                    credits: user?.credits,
                },
            },
        },
        { status: 200 }
      );
    } else if (vnpResponse.vnp_ResponseCode === '2') {
        payment.status = 'failed';
        await payment.save();
        return NextResponse.json(
            {
                success: false,
                message: 'Thanh toán thất bại',
                data: { status: 'failed' },
            },
            { status: 200 }
        );
    } else {
        return NextResponse.json(
            {
                success: true,
                message: 'Đang chờ thanh toán',
                data: { status: 'pending' },
            },
        );
  } } catch (error) {
    console.error('Check VNPay status error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}