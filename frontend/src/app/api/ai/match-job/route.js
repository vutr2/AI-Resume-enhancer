import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';

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
    const { resumeId, jobDescription, jobTitle, companyName } = body;

    if (!resumeId || !jobDescription) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp CV và mô tả công việc' },
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

    // Build prompt
    const prompt = `
Đánh giá mức độ phù hợp giữa CV và công việc:

CV:
${resume.rawText}

${resume.parsedData ? `Thông tin đã phân tích:\n${JSON.stringify(resume.parsedData, null, 2)}` : ''}

${jobTitle ? `Vị trí: ${jobTitle}` : ''}
${companyName ? `Công ty: ${companyName}` : ''}

Mô tả công việc:
${jobDescription}
`;

    try {
      const result = await callOpenAI(
        SYSTEM_PROMPTS.matchJob,
        prompt
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Đánh giá độ phù hợp thành công',
          data: {
            ...result,
            resumeId,
            jobTitle,
            companyName,
          },
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('AI Match Job error:', aiError);
      return NextResponse.json(
        { success: false, message: 'Lỗi khi đánh giá độ phù hợp' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Match job error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
