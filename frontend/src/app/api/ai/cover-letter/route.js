import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import CoverLetter from '@/models/CoverLetter';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';
import { checkCredits, consumeCredit } from '@/lib/credits';
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

    // Rate limiting - 5 requests per minute per user
    const rateLimitResult = rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    // Kiểm tra credits trước khi xử lý
    const creditCheck = await checkCredits();
    if (!creditCheck.success) {
      return NextResponse.json(
        {
          success: false,
          message: creditCheck.error,
          code: creditCheck.code,
          data: {
            creditsRemaining: creditCheck.creditsRemaining,
            isFirstMonth: creditCheck.isFirstMonth,
          },
        },
        { status: creditCheck.status }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { resumeId, jobTitle, companyName, jobDescription, tone, language } = body;

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

      // Trừ credit sau khi tạo thành công
      const creditResult = await consumeCredit(creditCheck.user._id);

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
            creditsRemaining: creditResult.creditsRemaining,
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
