import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';

// GET single resume
export async function GET(request, { params }) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const resume = await Resume.findOne({
      _id: id,
      user: decoded.descopeId,
    }).select('-rawText -versions');

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy CV' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: { resume },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

// PUT update resume
export async function PUT(request, { params }) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;
    const body = await request.json();

    const allowedFields = [
      'title',
      'parsedData',
      'rawText',
      'scores',
      'analysis',
      'status',
      'tags',
      'isFavorite',
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const resume = await Resume.findOneAndUpdate(
      { _id: id, user: decoded.descopeId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy CV' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Cập nhật CV thành công',
        data: { resume },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

// DELETE resume
export async function DELETE(request, { params }) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { id } = await params;

    const resume = await Resume.findOneAndDelete({
      _id: id,
      user: decoded.descopeId,
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy CV' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Xóa CV thành công',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
