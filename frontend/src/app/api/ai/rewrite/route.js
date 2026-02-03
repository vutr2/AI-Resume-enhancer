import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
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

    // Rate limiting - 5 requests per minute per user
    const rateLimitResult = rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const body = await request.json();
    const { content, contentType, targetJob } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng cung cấp nội dung cần viết lại' },
        { status: 400 }
      );
    }

    // Parse content if it's JSON (CV data)
    let parsedContent = content;
    let formattedCV = content;

    try {
      parsedContent = typeof content === 'string' ? JSON.parse(content) : content;

      // Format CV data into readable text for AI
      if (parsedContent.personalInfo || parsedContent.experience || parsedContent.education) {
        const info = parsedContent.personalInfo || {};
        const sections = [];

        // Personal Info
        sections.push(`TÊN: ${info.name || 'N/A'}`);
        sections.push(`EMAIL: ${info.email || 'N/A'}`);
        sections.push(`PHONE: ${info.phone || 'N/A'}`);
        sections.push(`ĐỊA CHỈ: ${info.address || 'N/A'}`);

        // Summary
        if (parsedContent.summary) {
          sections.push(`\nTÓM TẮT:\n${parsedContent.summary}`);
        }

        // Experience
        if (parsedContent.experience?.length > 0) {
          sections.push(`\nKINH NGHIỆM:`);
          parsedContent.experience.forEach(exp => {
            sections.push(`\n${exp.company} - ${exp.position}`);
            sections.push(`Thời gian: ${exp.startDate || ''} - ${exp.endDate || exp.current ? 'Hiện tại' : ''}`);
            if (exp.description) sections.push(`Mô tả: ${exp.description}`);
            if (exp.achievements?.length > 0) {
              sections.push('Thành tích:');
              exp.achievements.forEach(a => sections.push(`• ${a}`));
            }
          });
        }

        // Education
        if (parsedContent.education?.length > 0) {
          sections.push(`\nHỌC VẤN:`);
          parsedContent.education.forEach(edu => {
            sections.push(`${edu.institution} - ${edu.degree} ${edu.field || ''}`);
            if (edu.endDate) sections.push(`Tốt nghiệp: ${edu.endDate}`);
            if (edu.gpa) sections.push(`GPA: ${edu.gpa}`);
          });
        }

        // Skills
        if (parsedContent.skills) {
          sections.push(`\nKỸ NĂNG:`);
          if (parsedContent.skills.technical?.length > 0) {
            sections.push(`Technical: ${parsedContent.skills.technical.join(', ')}`);
          }
          if (parsedContent.skills.soft?.length > 0) {
            sections.push(`Soft skills: ${parsedContent.skills.soft.join(', ')}`);
          }
          if (parsedContent.skills.languages?.length > 0) {
            sections.push(`Ngôn ngữ: ${parsedContent.skills.languages.map(l => `${l.name} (${l.level})`).join(', ')}`);
          }
        }

        // Awards
        if (parsedContent.awards?.length > 0) {
          sections.push(`\nGIẢI THƯỞNG:`);
          parsedContent.awards.forEach(award => {
            sections.push(`• ${award.title} (${award.date || ''})`);
            if (award.description) sections.push(`  ${award.description}`);
          });
        }

        formattedCV = sections.join('\n');
      }
    } catch {
      // If not JSON, use content as-is
      formattedCV = content;
    }

    // Build rewrite prompt
    let rewritePrompt = `Viết lại CV sau thành văn bản hoàn chỉnh, chuyên nghiệp:\n\n${formattedCV}`;
    if (targetJob) {
      rewritePrompt += `\n\nYêu cầu style: ${targetJob}`;
    }

    try {
      const result = await callOpenAI(
        SYSTEM_PROMPTS.rewriteContent,
        rewritePrompt
      );

      return NextResponse.json(
        {
          success: true,
          message: 'Viết lại nội dung thành công',
          data: {
            ...result,
          },
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('AI Rewrite error:', aiError);
      return NextResponse.json(
        { success: false, message: 'Lỗi khi viết lại nội dung' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Rewrite content error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
