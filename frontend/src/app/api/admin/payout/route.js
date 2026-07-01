import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';
import Commission from '@/models/Commission';
import Payout from '@/models/Payout';

// POST /api/admin/payout
// Action: "create" — { action: "create", affiliateId, periodStart, periodEnd, note? }
// Action: "mark_paid" — { action: "mark_paid", payoutId }
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    }
    if (!isAdmin(decoded.email)) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 403 });
    }

    const body = await request.json();
    await dbConnect();

    if (body.action === 'mark_paid') {
      const { payoutId } = body;
      if (!payoutId) {
        return NextResponse.json({ success: false, message: 'payoutId là bắt buộc' }, { status: 400 });
      }
      const payout = await Payout.findByIdAndUpdate(
        payoutId,
        { $set: { status: 'completed', paidAt: new Date() } },
        { new: true }
      );
      if (!payout) {
        return NextResponse.json({ success: false, message: 'Không tìm thấy payout' }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: { payout } });
    }

    // action === "create"
    const { affiliateId, periodStart, periodEnd, note } = body;
    if (!affiliateId || !periodStart || !periodEnd) {
      return NextResponse.json(
        { success: false, message: 'affiliateId, periodStart và periodEnd là bắt buộc' },
        { status: 400 }
      );
    }

    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, message: 'Ngày kỳ không hợp lệ' }, { status: 400 });
    }

    const approvedCommissions = await Commission.find({
      affiliateId,
      status: 'approved',
      createdAt: { $gte: start, $lte: end },
    }).lean();

    if (approvedCommissions.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có commission approved nào trong kỳ này' },
        { status: 400 }
      );
    }

    const totalAmount = approvedCommissions.reduce((s, c) => s + c.commissionAmount, 0);
    const commissionIds = approvedCommissions.map((c) => c._id);

    // Use MongoDB transaction if available (Atlas replica set); fallback to sequential writes
    let session;
    try {
      session = await mongoose.startSession();
    } catch {
      session = null;
    }

    let payout;
    try {
      if (session) {
        session.startTransaction();
        payout = await Payout.create(
          [{ affiliateId, commissionIds, totalAmount, periodStart: start, periodEnd: end, note: note || '' }],
          { session }
        );
        payout = payout[0];
        await Commission.updateMany(
          { _id: { $in: commissionIds } },
          { $set: { status: 'paid', payoutId: payout._id } },
          { session }
        );
        await session.commitTransaction();
      } else {
        payout = await Payout.create({
          affiliateId, commissionIds, totalAmount, periodStart: start, periodEnd: end, note: note || '',
        });
        await Commission.updateMany(
          { _id: { $in: commissionIds } },
          { $set: { status: 'paid', payoutId: payout._id } }
        );
      }
    } catch (err) {
      if (session) await session.abortTransaction();
      throw err;
    } finally {
      if (session) session.endSession();
    }

    return NextResponse.json({
      success: true,
      data: {
        payoutId: payout._id.toString(),
        totalAmount,
        commissionCount: commissionIds.length,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Admin payout error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
