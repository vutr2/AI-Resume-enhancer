import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';

// GET all resumes for current user
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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page')) || 1);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit')) || 10), 50);
    const sort = searchParams.get('sort') || '-updatedAt';
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const favorite = searchParams.get('favorite');

    const query = { user: decoded.descopeId };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'parsedData.personalInfo.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      query.status = status;
    }

    if (favorite === 'true') {
      query.isFavorite = true;
    }

    const skip = (page - 1) * limit;

    const [resumes, total] = await Promise.all([
      Resume.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-rawText -versions'),
      Resume.countDocuments(query),
    ]);

    return NextResponse.json(
      {
        success: true,
        data: {
          resumes,
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
    console.error('Get resumes error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

// POST create new resume
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

    const body = await request.json();
    const { title, originalFileName, rawText, parsedData } = body;

    if (!originalFileName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp tên file' },
        { status: 400 }
      );
    }

    const resume = await Resume.create({
      user: decoded.descopeId,
      title: title || originalFileName.replace(/\.[^/.]+$/, ''),
      originalFileName,
      rawText: rawText || '',
      parsedData: parsedData || {},
      status: 'draft',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Tạo CV thành công',
        data: { resume },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
