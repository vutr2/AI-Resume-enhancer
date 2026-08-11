import { NextResponse } from 'next/server';
import { callOpenAI, SYSTEM_PROMPTS } from '@/lib/openai';
import { checkRateLimit } from '@/lib/rateLimit';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request) {
  try {
    // Rate limit by IP — 2 per hour, no auth required
    const ip = getClientIp(request);
    const rateLimitResult = await checkRateLimit(ip, 'public');
    if (rateLimitResult.limited) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bạn đã sử dụng hết lượt kiểm tra miễn phí (2 lần/giờ). Đăng ký để phân tích không giới hạn.',
          error: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn file CV' },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Chỉ hỗ trợ file PDF, DOC, DOCX' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File không được vượt quá 5MB' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    let rawText = '';

    if (file.type === 'application/pdf') {
      try {
        const { extractPdfText } = await import('@/lib/parsePdf');
        rawText = await extractPdfText(buffer);
      } catch {
        return NextResponse.json(
          { success: false, message: 'Không thể đọc file PDF. File có thể là ảnh scan.' },
          { status: 400 }
        );
      }
    } else {
      try {
        const mammoth = (await import('mammoth')).default;
        const result = await mammoth.extractRawText({ buffer });
        rawText = result.value;
      } catch {
        return NextResponse.json(
          { success: false, message: 'Không thể đọc file Word. Vui lòng kiểm tra lại file.' },
          { status: 400 }
        );
      }
    }

    rawText = rawText.substring(0, 8000);

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: 'Không thể trích xuất nội dung từ file.' },
        { status: 400 }
      );
    }

    const analysis = await callOpenAI(
      SYSTEM_PROMPTS.scorePublic,
      `Chấm điểm CV sau:\n\n${rawText}`,
      { model: 'claude-haiku-4-5-20251001', maxTokens: 400, temperature: 0.1 }
    );

    const scoresData = analysis.scores || analysis;
    const scores = {
      overall:      Math.round(Number(scoresData?.overall)      || 0),
      atsScore:     Math.round(Number(scoresData?.atsScore)     || 0),
      contentScore: Math.round(Number(scoresData?.contentScore) || 0),
      formatScore:  Math.round(Number(scoresData?.formatScore)  || 0),
      keywordScore: Math.round(Number(scoresData?.keywordScore) || 0),
      fdiScore:     Math.round(Number(scoresData?.fdiScore)     || 0),
    };

    if (scores.overall === 0) {
      return NextResponse.json(
        { success: false, message: 'AI không thể phân tích CV này. Vui lòng thử lại.' },
        { status: 500 }
      );
    }

    // Return only 2 top fixes — detailed analysis is gated behind registration
    // Sanitize to plain strings to avoid cyclic-structure serialization errors
    const allSuggestions = analysis.suggestions || [];
    const topFixes = allSuggestions.slice(0, 2).map((fix) =>
      typeof fix === 'string'
        ? fix
        : String(fix?.suggestion || fix?.text || fix?.description || fix?.content || '')
    ).filter(Boolean);

    return NextResponse.json({
      success: true,
      data: {
        scores: {
          overall:      scores.overall,
          atsScore:     scores.atsScore,
          contentScore: scores.contentScore,
          formatScore:  scores.formatScore,
          keywordScore: scores.keywordScore,
          fdiScore:     scores.fdiScore,
        },
        topFixes,
      },
    });
  } catch (error) {
    console.error('score-public error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
