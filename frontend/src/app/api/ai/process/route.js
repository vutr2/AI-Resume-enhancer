import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI } from '@/lib/openai';
import { checkCredits, consumeCredit } from '@/lib/credits';
import { rateLimitMiddleware } from '@/lib/rateLimit';

// Combined system prompt for both parsing AND analyzing in one call
const COMBINED_PROMPT = `Bạn là chuyên gia phân tích CV và ATS (Applicant Tracking System).
Nhiệm vụ của bạn là:
1. Trích xuất thông tin từ CV
2. Đánh giá và chấm điểm CV

Trả về JSON với cấu trúc sau:
{
  "parsedData": {
    "personalInfo": {
      "name": "Họ tên đầy đủ",
      "email": "email@example.com",
      "phone": "Số điện thoại",
      "address": "Địa chỉ",
      "linkedin": "LinkedIn URL",
      "github": "GitHub URL",
      "website": "Website cá nhân"
    },
    "summary": "Tóm tắt bản thân",
    "experience": [
      {
        "company": "Tên công ty",
        "position": "Vị trí",
        "location": "Địa điểm",
        "startDate": "MM/YYYY",
        "endDate": "MM/YYYY hoặc Hiện tại",
        "current": true/false,
        "description": "Mô tả công việc",
        "achievements": ["Thành tích 1", "Thành tích 2"]
      }
    ],
    "education": [
      {
        "institution": "Tên trường",
        "degree": "Bằng cấp",
        "field": "Ngành học",
        "startDate": "YYYY",
        "endDate": "YYYY",
        "gpa": "Điểm GPA",
        "achievements": ["Thành tích học tập"]
      }
    ],
    "skills": {
      "technical": ["Kỹ năng chuyên môn"],
      "soft": ["Kỹ năng mềm"],
      "languages": [{"name": "Tiếng Anh", "level": "Thành thạo"}],
      "certifications": [{"name": "Chứng chỉ", "issuer": "Đơn vị cấp", "date": "YYYY"}]
    },
    "projects": [
      {
        "name": "Tên dự án",
        "description": "Mô tả",
        "technologies": ["Tech 1", "Tech 2"],
        "url": "URL"
      }
    ],
    "awards": [
      {
        "title": "Giải thưởng",
        "issuer": "Đơn vị trao",
        "date": "YYYY",
        "description": "Mô tả"
      }
    ]
  },
  "scores": {
    "overall": 0-100,
    "atsScore": 0-100,
    "contentScore": 0-100,
    "formatScore": 0-100,
    "keywordScore": 0-100,
    "readabilityScore": 0-100
  },
  "analysis": {
    "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
    "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
    "suggestions": ["Gợi ý cải thiện 1", "Gợi ý cải thiện 2"],
    "keywords": {
      "found": ["Từ khóa tìm thấy"],
      "missing": ["Từ khóa còn thiếu"],
      "recommended": ["Từ khóa nên thêm"]
    },
    "atsIssues": [
      {
        "type": "format/content/keyword",
        "severity": "low/medium/high",
        "description": "Mô tả vấn đề",
        "suggestion": "Cách khắc phục"
      }
    ]
  }
}

Chỉ trả về JSON, không có text khác. Đánh giá khách quan và chi tiết.`;

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
    const { resumeId, jobDescription } = body;

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

    // Check if resume has content
    if (!resume.rawText || resume.rawText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          message: `CV không có đủ nội dung để phân tích (${resume.rawText?.length || 0} ký tự). Nếu CV của bạn là file scan/ảnh, vui lòng sử dụng file PDF có text.`,
        },
        { status: 400 }
      );
    }

    // Update status
    resume.status = 'analyzing';
    await resume.save();

    console.log('Processing CV with content length:', resume.rawText.length, 'chars');

    try {
      // Build prompt content
      let content = `Phân tích và đánh giá CV sau:\n\n${resume.rawText}`;
      if (jobDescription) {
        content += `\n\nMô tả công việc đang ứng tuyển:\n${jobDescription}`;
      }

      // Single AI call for both parsing and analyzing
      const result = await callOpenAI(COMBINED_PROMPT, content, {
        maxTokens: 6000, // Increase token limit for combined response
      });

      console.log('AI Process result received');

      // Extract and validate parsed data
      const parsedData = result.parsedData || {};

      // Extract and normalize scores
      const scoresData = result.scores || {};
      const normalizedScores = {
        overall: Number(scoresData.overall) || 0,
        atsScore: Number(scoresData.atsScore) || 0,
        contentScore: Number(scoresData.contentScore) || 0,
        formatScore: Number(scoresData.formatScore) || 0,
        keywordScore: Number(scoresData.keywordScore) || 0,
        readabilityScore: Number(scoresData.readabilityScore) || 0,
      };

      // Validate scores
      const hasValidScores = normalizedScores.overall > 0 ||
        normalizedScores.atsScore > 0 ||
        normalizedScores.contentScore > 0;

      if (!hasValidScores) {
        console.error('Invalid AI response - all scores are 0');
        return NextResponse.json(
          { success: false, message: 'AI không thể phân tích CV này. Vui lòng thử lại.' },
          { status: 500 }
        );
      }

      // Extract and normalize analysis
      const analysisData = result.analysis || {};

      // Normalize atsIssues
      let normalizedAtsIssues = [];
      if (Array.isArray(analysisData.atsIssues)) {
        normalizedAtsIssues = analysisData.atsIssues.map(issue => {
          if (typeof issue === 'string') {
            return { issueType: 'content', severity: 'medium', description: issue, suggestion: '' };
          }
          return {
            issueType: issue.type || issue.issueType || 'content',
            severity: ['low', 'medium', 'high'].includes(issue.severity) ? issue.severity : 'medium',
            description: issue.description || '',
            suggestion: issue.suggestion || '',
          };
        });
      }

      const normalizedAnalysis = {
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        suggestions: analysisData.suggestions || [],
        keywords: analysisData.keywords || { found: [], missing: [], recommended: [] },
        atsIssues: normalizedAtsIssues,
      };

      // Update resume with all data
      resume.parsedData = parsedData;
      resume.scores = normalizedScores;
      resume.analysis = normalizedAnalysis;
      resume.status = 'analyzed';
      await resume.save();

      console.log('CV processed successfully with scores:', normalizedScores);

      // Trừ credit sau khi xử lý thành công
      const creditResult = await consumeCredit(creditCheck.user._id);

      return NextResponse.json(
        {
          success: true,
          message: 'Xử lý CV thành công',
          data: {
            parsedData,
            scores: normalizedScores,
            analysis: normalizedAnalysis,
            creditsRemaining: creditResult.creditsRemaining,
          },
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('AI Process error:', aiError);
      resume.status = 'error';
      await resume.save();

      return NextResponse.json(
        { success: false, message: 'Lỗi khi xử lý CV bằng AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Process resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
