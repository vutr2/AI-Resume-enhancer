import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';
import { rateLimitMiddleware } from '@/lib/rateLimit';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const rateLimitResult = rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const body = await request.json();
    const { resumeId } = body;

    if (!resumeId) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp ID của CV' },
        { status: 400 }
      );
    }

    // Get resume
    const resume = await Resume.findOne({
      _id: resumeId,
      user: decoded.descopeId,
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy CV' },
        { status: 404 }
      );
    }

    if (!resume.rawText || resume.rawText.trim().length < 50) {
      return NextResponse.json(
        { success: false, message: 'CV không có đủ nội dung để phân tích' },
        { status: 400 }
      );
    }

    // Update status
    resume.status = 'analyzing';
    await resume.save();

    try {
      // Call AI to parse resume
      const parsedData = await callOpenAI(
        SYSTEM_PROMPTS.parseResume,
        `Phân tích CV sau:\n\n${resume.rawText}`
      );

      // Update resume with parsed data
      resume.parsedData = parsedData;
      resume.status = 'analyzed';
      await resume.save();

      return NextResponse.json(
        {
          success: true,
          message: 'Phân tích CV thành công',
          data: {
            parsedData,
          },
        },
        { status: 200 }
      );
    } catch (aiError) {
      resume.status = 'error';
      await resume.save();

      console.error('AI Parse error:', aiError);
      return NextResponse.json(
        { success: false, message: 'Lỗi khi phân tích CV bằng AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Parse resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
