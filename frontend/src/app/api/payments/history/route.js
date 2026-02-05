import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import User from '@/models/User';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    // Find user by descopeId to get ObjectId
    const dbUser = await User.findOne({
      $or: [
        { descopeId: decoded.descopeId },
        { email: decoded.email?.toLowerCase() },
      ],
    });

    if (!dbUser) {
      return NextResponse.json(
        {
          success: true,
          data: {
            payments: [],
            pagination: { page: 1, limit: 10, total: 0, pages: 0 },
          },
        },
        { status: 200 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const status = searchParams.get('status');

    const query = { user: dbUser._id };
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort('-createdAt')
        .skip(skip)
        .limit(limit)
        .select('-paymentDetails'),
      Payment.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          payments,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get payment history error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
