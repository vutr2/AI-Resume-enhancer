import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { isAdmin } from '@/lib/affiliate';
import dbConnect from '@/lib/db';
import Commission from '@/models/Commission';

// POST /api/admin/commissions/approve
// Body: { commissionIds: [id, ...] }
export async function POST(request) {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    }
    if (!isAdmin(decoded.email)) {
      return NextResponse.json({ success: false, message: 'Không có quyền truy cập' }, { status: 403 });
    }

    const { commissionIds } = await request.json();
    if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'commissionIds phải là mảng không rỗng' },
        { status: 400 }
      );
    }

    await dbConnect();

    const result = await Commission.updateMany(
      { _id: { $in: commissionIds }, status: 'pending' },
      { $set: { status: 'approved' } }
    );

    return NextResponse.json({
      success: true,
      data: { modifiedCount: result.modifiedCount },
    });
  } catch (error) {
    console.error('Approve commissions error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
