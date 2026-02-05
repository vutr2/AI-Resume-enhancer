import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';
import { rateLimitMiddleware } from '@/lib/rateLimit';

// Max file size: 5MB (reduced from 10MB for better memory usage)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Allowed file types
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// POST upload and parse resume
export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);

    if (!decoded || !decoded.descopeId) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    // Rate limiting - 10 uploads per minute
    const rateLimitResult = rateLimitMiddleware(request, decoded.descopeId, 'upload');
    if (rateLimitResult.limited) {
      return NextResponse.json(rateLimitResult.response, {
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
      });
    }

    await dbConnect();

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng chọn file CV' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Chỉ hỗ trợ file PDF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size BEFORE reading into memory
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: 'File không được vượt quá 5MB' },
        { status: 400 }
      );
    }

    // Read file content
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let rawText = '';

    // Parse PDF
    if (file.type === 'application/pdf') {
      try {
        const pdfParse = (await import('pdf-parse')).default;
        const pdfData = await pdfParse(buffer);
        rawText = pdfData.text;

        // Truncate extremely long texts to prevent token overflow
        if (rawText.length > 50000) {
          rawText = rawText.substring(0, 50000);
        }
      } catch (parseError) {
        console.error('PDF parse error:', parseError);
        return NextResponse.json(
          { success: false, message: 'Không thể đọc file PDF. Vui lòng kiểm tra file có text hay không (file scan/ảnh không được hỗ trợ).' },
          { status: 400 }
        );
      }
    } else {
      rawText = 'File Word sẽ được xử lý sau khi upload';
    }

    // Validate extracted text
    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { success: false, message: 'Không thể trích xuất nội dung từ file. File có thể là ảnh scan hoặc bị hỏng.' },
        { status: 400 }
      );
    }

    // Create resume record
    const resume = await Resume.create({
      user: decoded.descopeId,
      title: file.name.replace(/\.[^/.]+$/, ''),
      originalFileName: file.name,
      rawText,
      status: 'draft',
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Upload CV thành công',
        data: {
          resume: {
            _id: resume._id,
            title: resume.title,
            originalFileName: resume.originalFileName,
            status: resume.status,
            createdAt: resume.createdAt,
          },
          rawText: rawText.substring(0, 500) + '...',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Upload resume error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống khi upload' },
      { status: 500 }
    );
  }
}
