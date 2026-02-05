import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Payment from '@/models/Payment';
import Resume from '@/models/Resume';
import CoverLetter from '@/models/CoverLetter';
import { getCurrentUser } from '@/lib/auth';

export async function DELETE() {
  try {
    const decoded = await getCurrentUser();
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user
    const user = await User.findOne({
      $or: [
        { descopeId: decoded.descopeId },
        { email: decoded.email?.toLowerCase() },
      ],
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy tài khoản' },
        { status: 404 }
      );
    }

    const userId = user._id;

    // Delete all user data
    await Promise.all([
      Resume.deleteMany({ user: userId }),
      Payment.deleteMany({ user: userId }),
      CoverLetter.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });

    console.log('Account deleted:', decoded.email);

    return NextResponse.json(
      { success: true, message: 'Tài khoản đã được xóa' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
