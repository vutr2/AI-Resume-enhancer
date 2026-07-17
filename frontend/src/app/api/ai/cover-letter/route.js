import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import CoverLetter from '@/models/CoverLetter';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { getUserAccess } from '@/lib/access';

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    // Rate limiting - 5 requests per minute per user
    const rateLimitResult = await rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const body = await request.json();
    const { resumeId, jobTitle, companyName, jobDescription, tone, language } = body;

    // Full access required: pass, legacy pro, or CV unlocked
    const access = await getUserAccess(decoded.descopeId, resumeId || null);
    if (access.level !== 'full') {
      return NextResponse.json(
        {
          success: false,
          message: 'Tính năng tạo thư ứng tuyển yêu cầu mở khoá CV. Vui lòng mua lượt hoặc Pass 7 ngày.',
          code: 'UPGRADE_REQUIRED',
          data: {
            freeCredits: access.freeCredits ?? 0,
            paidCredits: access.paidCredits ?? 0,
            canUnlock: access.canUnlock ?? false,
          },
        },
        { status: 403 }
      );
    }

    if (!jobTitle || !companyName) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập vị trí và tên công ty' },
        { status: 400 }
      );
    }

    // Get resume if provided
    let resumeContent = '';
    let resume = null;
    if (resumeId) {
      resume = await Resume.findOne({
        _id: resumeId,
        user: decoded.descopeId,
      });
      if (resume) {
        resumeContent = `\n\nThông tin từ CV:\n${JSON.stringify(resume.parsedData, null, 2)}`;
      }
    }

    // Build prompt
    const prompt = `
Tạo thư ứng tuyển cho:
- Vị trí: ${jobTitle}
- Công ty: ${companyName}
- Giọng điệu: ${tone || 'professional'}
- Ngôn ngữ: ${language === 'en' ? 'Tiếng Anh' : 'Tiếng Việt'}
${jobDescription ? `\nMô tả công việc:\n${jobDescription}` : ''}
${resumeContent}
`;

    try {
      const result = await callOpenAI(
        SYSTEM_PROMPTS.generateCoverLetter,
        prompt
      );

      // Save cover letter
      const coverLetter = await CoverLetter.create({
        user: decoded.descopeId,
        resume: resume?._id || null,
        title: `Thư ứng tuyển - ${jobTitle} tại ${companyName}`,
        jobTitle,
        companyName,
        jobDescription: jobDescription || '',
        content: result.coverLetter,
        tone: tone || 'professional',
        language: language || 'vi',
        versions: [
          {
            version: 1,
            content: result.coverLetter,
            createdAt: new Date(),
            tone: tone || 'professional',
          },
        ],
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Tạo thư ứng tuyển thành công',
          data: {
            coverLetter: {
              _id: coverLetter._id,
              title: coverLetter.title,
              content: coverLetter.content,
              jobTitle: coverLetter.jobTitle,
              companyName: coverLetter.companyName,
            },
            keyPoints: result.keyPoints,
          },
        },
        { status: 201 }
      );
    } catch (aiError) {
      console.error('AI Cover Letter error:', aiError);
      return NextResponse.json(
        { success: false, message: 'Lỗi khi tạo thư ứng tuyển' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate cover letter error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
