import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const user = await User.findOne({
      $or: [
        { descopeId: decoded.descopeId },
        { email: decoded.email?.toLowerCase() },
      ],
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy người dùng' },
        { status: 404 }
      );
    }

    if (user.plan === 'free') {
      return NextResponse.json(
        { success: false, message: 'Bạn đang sử dụng gói miễn phí' },
        { status: 400 }
      );
    }

    const previousPlan = user.plan;

    // Update user to free plan
    user.plan = 'free';
    user.planExpiresAt = null;
    user.updatedAt = new Date();
    await user.save();

    console.log('Subscription cancelled:', decoded.email, previousPlan, '-> free');

    return NextResponse.json(
      {
        success: true,
        message: 'Đã hủy gói thành công. Bạn đã chuyển về gói miễn phí.',
        data: {
          previousPlan,
          currentPlan: 'free',
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
