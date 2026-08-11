import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI } from '@/lib/openai';
import { getUserAccess, consumeFreeCredit } from '@/lib/access';
import { rateLimitMiddleware } from '@/lib/rateLimit';

// Combined system prompt for both parsing AND analyzing in one call
const COMBINED_PROMPT = `Bạn là chuyên gia phân tích CV và ATS. Trích xuất thông tin + chấm điểm CV, trả về JSON ngắn gọn:

GIỚI HẠN ĐỘ DÀI (bắt buộc tuân thủ để tránh cắt JSON):
- description/summary: tối đa 15 từ
- achievements mỗi mục: tối đa 12 từ, tối đa 3 mục/job
- skills: tối đa 8 kỹ năng mỗi loại
- analysis strings: tối đa 12 từ
- atsIssues description/suggestion: tối đa 12 từ

{
  "parsedData": {
    "personalInfo": { "name": "", "email": "", "phone": "", "address": "", "linkedin": "", "github": "", "website": "" },
    "summary": "Tối đa 15 từ",
    "experience": [
      { "company": "", "position": "", "location": "", "startDate": "MM/YYYY", "endDate": "MM/YYYY", "current": false, "description": "Tối đa 12 từ", "achievements": ["Tối đa 12 từ"] }
    ],
    "education": [
      { "institution": "", "degree": "", "field": "", "startDate": "YYYY", "endDate": "YYYY", "gpa": "", "achievements": [] }
    ],
    "skills": {
      "technical": ["skill1", "skill2"],
      "soft": ["skill1", "skill2"],
      "languages": [{ "name": "", "level": "" }],
      "certifications": [{ "name": "", "issuer": "", "date": "" }]
    },
    "projects": [{ "name": "", "description": "Tối đa 10 từ", "technologies": [], "url": "" }],
    "awards": [{ "title": "", "issuer": "", "date": "", "description": "Tối đa 10 từ" }]
  },
  "scores": {
    "overall": 0,
    "atsScore": 0,
    "contentScore": 0,
    "formatScore": 0,
    "keywordScore": 0,
    "readabilityScore": 0,
    "fdiScore": 0
  },
  "analysis": {
    "strengths": ["Tối đa 8 từ", "Tối đa 8 từ"],
    "weaknesses": ["Tối đa 8 từ", "Tối đa 8 từ"],
    "suggestions": ["Tối đa 10 từ", "Tối đa 10 từ"],
    "keywords": {
      "found": ["keyword1", "keyword2", "keyword3"],
      "missing": ["keyword1", "keyword2", "keyword3"],
      "recommended": ["keyword1", "keyword2"]
    },
    "topFixes": [
      { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 1 },
      { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 2 },
      { "title": "Tối đa 5 từ", "detail": "1 câu có số thực tế, tối đa 12 từ.", "priority": 3 }
    ],
    "working": ["Tối đa 5 từ", "Tối đa 5 từ"],
    "atsIssues": [
      { "type": "content|format|keyword", "severity": "high|medium|low", "description": "Lỗi cụ thể từ CV này, tối đa 12 từ", "suggestion": "Cách sửa ngắn gọn, tối đa 10 từ" }
    ]
  }
}

QUAN TRỌNG:
- atsIssues: liệt kê TẤT CẢ lỗi thực tế của CV này (5–8 mục), type là "content"/"format"/"keyword", severity là "high"/"medium"/"low"
- topFixes: đúng 3 mục quan trọng nhất, detail phải có số cụ thể (ví dụ "4/10 bullet thiếu số liệu")
- Chỉ trả về JSON, không text thêm`;

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
      const result = await callOpenAI(COMBINED_PROMPT, content, { model: 'claude-haiku-4-5-20251001', maxTokens: 5000, temperature: 0.1 });

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
        fdiScore: Number(scoresData.fdiScore) || 0,
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
