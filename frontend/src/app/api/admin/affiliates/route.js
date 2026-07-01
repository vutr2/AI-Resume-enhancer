import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import dbConnect from '@/lib/db';
import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';
import Commission from '@/models/Commission';

// GET /api/admin/affiliates
export async function GET() {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    }
    if (!isAdmin(decoded.email)) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 403 });
    }

    await dbConnect();

    const affiliates = await Affiliate.find({}).sort({ createdAt: -1 }).lean();

    const affiliateIds = affiliates.map((a) => a._id);

    const [referrals, commissions] = await Promise.all([
      Referral.find({ affiliateId: { $in: affiliateIds } }).lean(),
      Commission.find({ affiliateId: { $in: affiliateIds } }).lean(),
    ]);

    const pendingCommissions = commissions.filter((c) => c.status === 'pending');

    const affiliateData = affiliates.map((a) => {
      const aRefs = referrals.filter((r) => r.affiliateId.toString() === a._id.toString());
      const aComms = commissions.filter((c) => c.affiliateId.toString() === a._id.toString());
      return {
        id: a._id.toString(),
        name: a.name,
        email: a.email,
        refCode: a.refCode,
        status: a.status,
        payoutInfo: a.payoutInfo,
        createdAt: a.createdAt,
        stats: {
          signedUp: aRefs.filter((r) => r.status === 'signed_up').length,
          converted: aRefs.filter((r) => r.status === 'converted').length,
          pendingAmount: aComms.filter((c) => c.status === 'pending').reduce((s, c) => s + c.commissionAmount, 0),
          approvedAmount: aComms.filter((c) => c.status === 'approved').reduce((s, c) => s + c.commissionAmount, 0),
          paidAmount: aComms.filter((c) => c.status === 'paid').reduce((s, c) => s + c.commissionAmount, 0),
          totalRevenue: aComms.reduce((s, c) => s + c.grossAmount, 0),
        },
      };
    });

    const pendingCommissionData = pendingCommissions.map((c) => ({
      id: c._id.toString(),
      affiliateId: c.affiliateId.toString(),
      orderId: c.orderId,
      grossAmount: c.grossAmount,
      commissionAmount: c.commissionAmount,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      success: true,
      data: { affiliates: affiliateData, pendingCommissions: pendingCommissionData },
    });
  } catch (error) {
    console.error('Admin affiliates error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
