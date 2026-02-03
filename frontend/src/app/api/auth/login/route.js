// src/app/api/auth/login/route.js
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    // Lấy thông tin user từ Descope session
    const descopeUser = await getCurrentUser();

    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập qua Descope trước' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Tìm hoặc tạo user trong database
    let user = await User.findOne({ descopeId: descopeUser.descopeId });

    if (!user) {
      // Tạo user mới nếu chưa tồn tại
      user = await User.create({
        descopeId: descopeUser.descopeId,
        email: descopeUser.email,
        name: descopeUser.name,
        avatar: null,
        plan: 'free',
        credits: 100,
        lastLogin: new Date(),
      });
    } else {
      // Cập nhật lastLogin cho user đã tồn tại
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
    }

    // Trả về thông tin user
    return NextResponse.json(
      {
        success: true,
        message: 'Đăng nhập thành công',
        data: {
          user: {
            _id: user._id,
            descopeId: user.descopeId,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            planExpiresAt: user.planExpiresAt,
            credits: user.credits,
            settings: user.settings,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống, vui lòng thử lại sau' },
      { status: 500 }
    );
  }
}
