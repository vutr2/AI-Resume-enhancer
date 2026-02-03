import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';

// ZaloPay config
const ZALOPAY_KEY2 = process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz';

export async function POST(request) {
  try {
    const body = await request.json();
    const { data, mac } = body;

    // Verify MAC
    const computedMac = crypto.createHmac('sha256', ZALOPAY_KEY2).update(data).digest('hex');

    if (mac !== computedMac) {
      return NextResponse.json(
        { return_code: -1, return_message: 'mac not equal' },
        { status: 200 }
      );
    }

    // Parse data
    const dataJson = JSON.parse(data);
    const { app_trans_id, zp_trans_id, amount } = dataJson;

    await dbConnect();

    // Find and update payment
    const payment = await Payment.findOne({ orderId: app_trans_id });

    if (!payment) {
      return NextResponse.json(
        { return_code: -1, return_message: 'order not found' },
        { status: 200 }
      );
    }

    if (payment.status === 'completed') {
      return NextResponse.json(
        { return_code: 1, return_message: 'success' },
        { status: 200 }
      );
    }

    // Update payment status
    const now = new Date();
    const endDate = new Date(now);
    if (payment.billingPeriod === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    payment.status = 'completed';
    payment.transactionId = zp_trans_id;
    payment.planStartDate = now;
    payment.planEndDate = endDate;
    await payment.save();

    // Update user plan
    const user = await User.findById(payment.user);
    if (user) {
      user.plan = payment.plan;
      user.planExpiresAt = endDate;

      // Set credits based on plan
      const planCredits = {
        basic: 50,
        pro: -1, // unlimited
        enterprise: -1, // unlimited
      };
      user.credits = planCredits[payment.plan] || 50;
      await user.save();
    }

    return NextResponse.json(
      { return_code: 1, return_message: 'success' },
      { status: 200 }
    );
  } catch (error) {
    console.error('ZaloPay callback error:', error);
    return NextResponse.json(
      { return_code: 0, return_message: 'error' },
      { status: 200 }
    );
  }
}
