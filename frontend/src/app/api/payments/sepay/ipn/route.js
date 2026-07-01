import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';
import { COMMISSION_RATE } from '@/lib/affiliate';

// SePay IPN - server-to-server notification
// SePay sends POST with X-Secret-Key header for authentication
export async function POST(request) {
  try {
    // Verify secret key if configured in SePay merchant dashboard
    const secretKey = request.headers.get('x-secret-key');
    const configuredKey = process.env.SEPAY_IPN_SECRET;
    if (configuredKey && secretKey !== configuredKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_type, order } = body;

    if (notification_type !== 'ORDER_PAID') {
      // Not a payment notification, acknowledge and ignore
      return NextResponse.json({ success: true });
    }

    const invoiceNumber = order?.order_invoice_number || order?.invoice_number;
    if (!invoiceNumber) {
      return NextResponse.json({ success: false, message: 'Missing invoice_number' }, { status: 400 });
    }

    await dbConnect();

    const payment = await Payment.findOne({ orderId: invoiceNumber });

    if (!payment) {
      return NextResponse.json({ success: false, message: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'completed') {
      // Already processed (e.g. by redirect callback), acknowledge
      return NextResponse.json({ success: true });
    }

    if (order.order_status !== 'CAPTURED') {
      payment.status = 'failed';
      await payment.save();
      return NextResponse.json({ success: true });
    }

    payment.status = 'completed';
    await payment.save();

    const now = new Date();
    const expiresAt = new Date(now);
    if (payment.billingPeriod === 'yearly') {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    const dbUser = await User.findByIdAndUpdate(
      payment.user,
      { plan: payment.plan, planExpiresAt: expiresAt, updatedAt: now },
      { new: true }
    );

    // Affiliate commission — best-effort, never blocks IPN response
    if (dbUser?.descopeId) {
      try {
        const referral = await Referral.findOne({
          referredUserId: dbUser.descopeId,
          status: 'signed_up',
        });
        if (referral) {
          const alreadyCommissioned = await Commission.findOne({ referralId: referral._id });
          if (!alreadyCommissioned) {
            const gross = Math.round(payment.amount);
            await Commission.create({
              affiliateId: referral.affiliateId,
              referralId: referral._id,
              orderId: payment.orderId,
              grossAmount: gross,
              commissionAmount: Math.round(gross * COMMISSION_RATE),
              isFirstPayment: true,
            });
            await Referral.updateOne(
              { _id: referral._id },
              { status: 'converted', convertedAt: new Date() }
            );
          }
        }
      } catch (affErr) {
        console.error('Affiliate commission error (non-fatal):', affErr);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('SePay IPN error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}
