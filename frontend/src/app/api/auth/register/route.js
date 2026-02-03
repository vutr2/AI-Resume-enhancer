// src/app/api/auth/register/route.js
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
        {
          success: false,
          message: 'Vui lòng đăng ký qua Descope trước',
        },
        { status: 401 }
      );
    }

    await dbConnect();

    // Kiểm tra user đã tồn tại chưa
    const existingUser = await User.findOne({
      descopeId: descopeUser.descopeId,
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản này đã được đăng ký',
        },
        { status: 400 }
      );
    }

    // Lấy thông tin bổ sung từ body (nếu có)
    const body = await request.json();
    const { preferences, additionalInfo } = body;

    // Tạo user mới trong database
    const user = await User.create({
      descopeId: descopeUser.descopeId,
      name: descopeUser.name,
      email: descopeUser.email,
      avatar: descopeUser.picture || null,
      plan: 'free',
      credits: 10, // Credits khởi tạo
      settings: preferences || {},
      lastLogin: new Date(),
      ...additionalInfo, // Thông tin bổ sung nếu có
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Đăng ký thành công',
        data: {
          user: {
            _id: user._id,
            descopeId: user.descopeId,
            name: user.name,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            settings: user.settings,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);

    // Xử lý lỗi duplicate key (descopeId hoặc email)
    if (error.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Tài khoản này đã được đăng ký',
        },
        { status: 400 }
      );
    }

    // Xử lý lỗi validation
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return NextResponse.json(
        { success: false, message: messages[0] },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi hệ thống, vui lòng thử lại sau',
      },
      { status: 500 }
    );
  }
}
