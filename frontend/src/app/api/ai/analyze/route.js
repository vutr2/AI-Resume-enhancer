import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';
import { rateLimitMiddleware } from '@/lib/rateLimit';

const MAX_JOB_DESC_LENGTH = 10000;

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const rateLimitResult = await rateLimitMiddleware(request, decoded.descopeId, 'ai');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const body = await request.json();
    const { resumeId, jobDescription, force } = body;

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

    // Return cached MongoDB result only if topFixes is already populated
    if (!force && resume.status === 'analyzed' && resume.scores?.overall > 0 && resume.analysis?.topFixes?.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Phân tích CV thành công',
          data: { scores: resume.scores, analysis: resume.analysis },
        },
        { status: 200 }
      );
    }

    // Kiểm tra CV có nội dung không
    if (!resume.rawText || resume.rawText.trim().length < 50) {
      return NextResponse.json(
        {
          success: false,
          message: `CV không có đủ nội dung để phân tích (${resume.rawText?.length || 0} ký tự). Nếu CV của bạn là file scan/ảnh, vui lòng sử dụng file PDF có text.`,
        },
        { status: 400 }
      );
    }

    // Build analysis content — rawText only, no parsedData JSON to keep tokens low
    const rawTextCapped = resume.rawText.substring(0, 12000);
    let analysisContent = rawTextCapped;
    if (jobDescription) {
      const trimmedJD = typeof jobDescription === 'string' ? jobDescription.slice(0, MAX_JOB_DESC_LENGTH) : '';
      analysisContent += `\n\nJob Description:\n${trimmedJD}`;
    }

    try {
      // Call AI with content-hash cache (24h TTL) — same CV content won't re-call Claude
      const analysis = await callOpenAI(
        SYSTEM_PROMPTS.analyzeResume,
        `Phân tích và chấm điểm CV sau:\n\n${analysisContent}`,
        { model: 'claude-haiku-4-5-20251001', maxTokens: 4000, temperature: 0.1 }
      );

      // Normalize atsIssues to match schema format
      let normalizedAtsIssues = [];
      if (Array.isArray(analysis.atsIssues)) {
        normalizedAtsIssues = analysis.atsIssues.map(issue => {
          if (typeof issue === 'string') {
            return { issueType: 'content', severity: 'medium', description: issue, suggestion: '' };
          }
          return {
            issueType: issue.type || 'content',
            severity: ['low', 'medium', 'high'].includes(issue.severity) ? issue.severity : 'medium',
            description: issue.description || '',
            suggestion: issue.suggestion || '',
          };
        });
      }

      // Normalize scores - AI có thể trả về scores trong object "scores" hoặc trực tiếp
      const scoresData = analysis.scores || analysis;
      const normalizedScores = {
        overall: Number(scoresData?.overall) || Number(scoresData?.scores?.overall) || 0,
        atsScore: Number(scoresData?.atsScore) || Number(scoresData?.scores?.atsScore) || 0,
        contentScore: Number(scoresData?.contentScore) || Number(scoresData?.scores?.contentScore) || 0,
        formatScore: Number(scoresData?.formatScore) || Number(scoresData?.scores?.formatScore) || 0,
        keywordScore: Number(scoresData?.keywordScore) || Number(scoresData?.scores?.keywordScore) || 0,
        readabilityScore: Number(scoresData?.readabilityScore) || Number(scoresData?.scores?.readabilityScore) || 0,
        fdiScore: Number(scoresData?.fdiScore) || Number(scoresData?.scores?.fdiScore) || 0,
      };

      // Validate: nếu tất cả scores = 0, có nghĩa là AI response không hợp lệ
      const hasValidScores = normalizedScores.overall > 0 ||
        normalizedScores.atsScore > 0 ||
        normalizedScores.contentScore > 0;

      if (!hasValidScores) {
        console.error('Invalid AI response - all scores are 0:', analysis);
        return NextResponse.json(
          { success: false, message: 'AI không thể phân tích CV này. Vui lòng thử lại.' },
          { status: 500 }
        );
      }

      // Update resume with analysis
      resume.scores = normalizedScores;
      const rawFixes = analysis.topFixes || [];
      const topFixes = rawFixes.slice(0, 3).map((fix) => {
        if (typeof fix === 'string') return { title: fix, detail: fix, priority: 1 };
        return {
          title:    String(fix?.title    || fix?.suggestion || ''),
          detail:   String(fix?.detail   || fix?.description || fix?.suggestion || ''),
          priority: Number(fix?.priority || 1),
        };
      }).filter((f) => f.title);

      resume.analysis = {
        strengths: analysis.strengths || [],
        weaknesses: analysis.weaknesses || [],
        suggestions: analysis.suggestions || [],
        keywords: analysis.keywords || { found: [], missing: [], recommended: [] },
        atsIssues: normalizedAtsIssues,
        fdiReadiness: analysis.fdiReadiness || null,
        topFixes,
        working: (analysis.working || []).slice(0, 3).map(String),
      };
      resume.status = 'analyzed';
      await resume.save();

      return NextResponse.json(
        {
          success: true,
          message: 'Phân tích CV thành công',
          data: {
            scores: resume.scores,
            analysis: resume.analysis,
          },
        },
        { status: 200 }
      );
    } catch (aiError) {
      console.error('AI Analyze error:', aiError);
      return NextResponse.json(
        { success: false, message: 'Lỗi khi phân tích CV bằng AI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Analyze resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
