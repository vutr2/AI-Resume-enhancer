import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI } from '@/lib/openai';
import { getUserAccess, consumeFreeCredit } from '@/lib/access';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { cachedAICall } from '@/lib/cache';

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
    const rateLimitResult = await rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const body = await request.json();
    const { resumeId } = body;
    const jobDescription = typeof body.jobDescription === 'string'
      ? body.jobDescription.slice(0, 10000)
      : body.jobDescription;

    // Access control — check after parsing body so we have resumeId for per-CV unlock check
    const access = await getUserAccess(decoded.descopeId, resumeId || null);
    if (access.level === 'locked') {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đã dùng hết lượt miễn phí. Mua thêm lượt để tiếp tục.',
          code: 'NO_CREDITS',
          data: { freeCredits: 0, paidCredits: 0 },
        },
        { status: 403 }
      );
    }

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
      // Build prompt content — cap rawText to avoid excess tokens
      let content = `Phân tích và đánh giá CV sau:\n\n${resume.rawText.substring(0, 12000)}`;
      if (jobDescription) {
        content += `\n\nMô tả công việc đang ứng tuyển:\n${jobDescription}`;
      }

      // Cached AI call - same CV text = same result from cache
      const result = await cachedAICall(
        resume.rawText,
        'process',
        jobDescription || '',
        () => callOpenAI(COMBINED_PROMPT, content, { model: 'claude-haiku-4-5-20251001', maxTokens: 5000, temperature: 0.1 })
      );

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

      const rawFixes = analysisData.topFixes || [];
      const topFixes = rawFixes.slice(0, 3).map((fix) => {
        if (typeof fix === 'string') return { title: fix, detail: fix, priority: 1 };
        return {
          title:    String(fix?.title    || fix?.suggestion || ''),
          detail:   String(fix?.detail   || fix?.description || fix?.suggestion || ''),
          priority: Number(fix?.priority || 1),
        };
      }).filter((f) => f.title);

      const normalizedAnalysis = {
        strengths: analysisData.strengths || [],
        weaknesses: analysisData.weaknesses || [],
        suggestions: analysisData.suggestions || [],
        keywords: analysisData.keywords || { found: [], missing: [], recommended: [] },
        atsIssues: normalizedAtsIssues,
        topFixes,
        working: (analysisData.working || []).slice(0, 3).map(String),
      };

      // Update resume with all data
      resume.parsedData = parsedData;
      resume.scores = normalizedScores;
      resume.analysis = normalizedAnalysis;
      resume.status = 'analyzed';
      await resume.save();

      console.log('CV processed successfully with scores:', normalizedScores);

      // Consume 1 free credit after a successful limited-access analysis
      let freeCreditsRemaining = access.freeCredits ?? 0;
      if (access.reason === 'free_credits') {
        const consumed = await consumeFreeCredit(decoded.descopeId);
        if (consumed.success) {
          freeCreditsRemaining = consumed.freeCredits ?? Math.max(0, freeCreditsRemaining - 1);
        }
      }

      const isLimited = access.level === 'limited';

      return NextResponse.json(
        {
          success: true,
          message: 'Xử lý CV thành công',
          data: {
            parsedData,
            scores: normalizedScores,
            analysis: normalizedAnalysis,
            isLimited,
            freeCredits: freeCreditsRemaining,
            paidCredits: access.paidCredits ?? 0,
            canUnlock: access.canUnlock ?? false,
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
