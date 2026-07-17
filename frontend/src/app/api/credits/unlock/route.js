import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/credits/unlock
// Atomically deduct 1 paidCredit and add cvId to unlockedCvIds.
// Idempotent: returns success if the CV is already unlocked.
export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cvId } = body;
    if (!cvId) {
      return NextResponse.json(
        { success: false, message: 'Thiếu cvId' },
        { status: 400 }
      );
    }

    const cvIdStr = String(cvId);
    const db = await getDb();

    // Atomic: deduct 1 paidCredit and add cvId, only if not already unlocked and credits > 0
    const result = await db.collection('users').findOneAndUpdate(
      {
        descopeId: decoded.descopeId,
        paidCredits: { $gt: 0 },
        unlockedCvIds: { $ne: cvIdStr },
      },
      {
        $inc: { paidCredits: -1 },
        $addToSet: { unlockedCvIds: cvIdStr },
        $set: { updatedAt: new Date() },
      },
      { returnDocument: 'after' }
    );

    if (result) {
      return NextResponse.json({
        success: true,
        data: {
          paidCredits: result.paidCredits,
          unlockedCvIds: result.unlockedCvIds,
        },
      });
    }

    // findOneAndUpdate returned null — check why
    const user = await db.collection('users').findOne({ descopeId: decoded.descopeId });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    if (Array.isArray(user.unlockedCvIds) && user.unlockedCvIds.includes(cvIdStr)) {
      return NextResponse.json({
        success: true,
        alreadyUnlocked: true,
        data: {
          paidCredits: user.paidCredits || 0,
          unlockedCvIds: user.unlockedCvIds,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        code: 'INSUFFICIENT_CREDITS',
        message: 'Không đủ lượt mở khoá. Vui lòng mua thêm.',
        data: { paidCredits: user.paidCredits || 0 },
      },
      { status: 402 }
    );
  } catch (error) {
    console.error('Unlock CV error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
