import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';
import { COMMISSION_RATE } from '@/lib/affiliate';
import { PACKAGES } from '@/lib/packages';

// SePay IPN - server-to-server notification
// SePay sends POST with X-Secret-Key header for authentication
export async function POST(request) {
  try {
    const secretKey = request.headers.get('x-secret-key');
    const configuredKey = process.env.SEPAY_IPN_SECRET;
    if (configuredKey && secretKey !== configuredKey) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_type, order } = body;

    if (notification_type !== 'ORDER_PAID') {
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
    let dbUser;

    if (payment.package && PACKAGES[payment.package]) {
      // New credit model: grant credits or pass
      const pkg = PACKAGES[payment.package];
      const $set = { updatedAt: now };
      const $inc = {};

      if (pkg.credits > 0) {
        $inc.paidCredits = pkg.credits;
      }
      if ((pkg.freeCreditsBonus || 0) > 0) {
        $inc.freeCredits = pkg.freeCreditsBonus;
      }
      if (pkg.passDays > 0) {
        const passEnd = new Date(now);
        passEnd.setDate(passEnd.getDate() + pkg.passDays);
        $set.passExpiresAt = passEnd;
      }

      const updateOp = Object.keys($inc).length > 0 ? { $set, $inc } : { $set };
      dbUser = await User.findByIdAndUpdate(payment.user, updateOp, { new: true });

      if (!dbUser) {
        console.error(`[IPN] CRITICAL: User not found for payment ${payment.orderId}, userId=${payment.user}`);
      } else {
        console.log(`[IPN] Granted ${pkg.label} to user ${dbUser.descopeId || dbUser._id}`);
      }
    } else if (payment.plan) {
      // Legacy subscription model
      const expiresAt = new Date(now);
      if (payment.billingPeriod === 'yearly') {
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
      } else {
        expiresAt.setMonth(expiresAt.getMonth() + 1);
      }
      dbUser = await User.findByIdAndUpdate(
        payment.user,
        { plan: payment.plan, planExpiresAt: expiresAt, updatedAt: now },
        { new: true }
      );

      if (!dbUser) {
        console.error(`[IPN] CRITICAL: User not found for payment ${payment.orderId}, userId=${payment.user}`);
      } else {
        console.log(`[IPN] Set plan=${payment.plan} for user ${dbUser.descopeId || dbUser._id}`);
      }
    } else {
      console.error(`[IPN] Payment ${payment.orderId} has neither package nor plan — nothing to grant`);
    }

    // Affiliate commission — best-effort, never blocks IPN response
    if (dbUser?.descopeId) {
      try {
        // 90-day rule: commission on ALL purchases within 90 days of signup
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        const referral = await Referral.findOne({
          referredUserId: dbUser.descopeId,
          signedUpAt: { $gte: ninetyDaysAgo },
        });

        if (referral) {
          // Per-order idempotency: don't commission the same order twice
          const alreadyCommissioned = await Commission.findOne({ orderId: payment.orderId });
          if (!alreadyCommissioned) {
            const gross = Math.round(payment.amount);
            await Commission.create({
              affiliateId: referral.affiliateId,
              referralId: referral._id,
              orderId: payment.orderId,
              grossAmount: gross,
              commissionAmount: Math.round(gross * COMMISSION_RATE),
              isFirstPayment: referral.status === 'signed_up',
            });
            // Mark referral converted on first purchase; subsequent purchases keep 'converted'
            if (referral.status === 'signed_up') {
              await Referral.updateOne(
                { _id: referral._id },
                { status: 'converted', convertedAt: now }
              );
            }
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
