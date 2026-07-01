import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';
import Payout from '@/models/Payout';

// GET /api/affiliate/stats
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    await dbConnect();

    const affiliate = await Affiliate.findOne({ descopeUserId: user.descopeId }).lean();
    if (!affiliate) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy tài khoản affiliate' },
        { status: 404 }
      );
    }

    const [referrals, commissions, payouts] = await Promise.all([
      Referral.find({ affiliateId: affiliate._id }).lean(),
      Commission.find({ affiliateId: affiliate._id }).lean(),
      Payout.find({ affiliateId: affiliate._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const signedUp = referrals.filter((r) => r.status === 'signed_up').length;
    const converted = referrals.filter((r) => r.status === 'converted').length;

    const pendingAmount = commissions
      .filter((c) => c.status === 'pending')
      .reduce((s, c) => s + c.commissionAmount, 0);
    const approvedAmount = commissions
      .filter((c) => c.status === 'approved')
      .reduce((s, c) => s + c.commissionAmount, 0);
    const paidAmount = commissions
      .filter((c) => c.status === 'paid')
      .reduce((s, c) => s + c.commissionAmount, 0);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json({
      success: true,
      data: {
        affiliate: {
          refCode: affiliate.refCode,
          affiliateLink: `${appUrl}?ref=${affiliate.refCode}`,
          name: affiliate.name,
          email: affiliate.email,
          status: affiliate.status,
          payoutInfo: affiliate.payoutInfo,
        },
        stats: {
          signedUp,
          converted,
          pendingAmount,
          approvedAmount,
          paidAmount,
          totalEarned: paidAmount + approvedAmount + pendingAmount,
        },
        payouts: payouts.map((p) => ({
          id: p._id.toString(),
          totalAmount: p.totalAmount,
          periodStart: p.periodStart,
          periodEnd: p.periodEnd,
          status: p.status,
          paidAt: p.paidAt,
          note: p.note,
        })),
      },
    });
  } catch (error) {
    console.error('Affiliate stats error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
