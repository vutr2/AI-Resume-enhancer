import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';

// POST upload and parse resume
export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    console.log('Decoded user:', decoded);

    if (!decoded || !decoded.descopeId) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
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
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Chỉ hỗ trợ file PDF, DOC, DOCX' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'File không được vượt quá 10MB' },
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
      } catch (parseError) {
        console.error('PDF parse error:', parseError);
        return NextResponse.json(
          { success: false, message: 'Không thể đọc file PDF' },
          { status: 400 }
        );
      }
    } else {
      // For DOC/DOCX, we'll store the raw content and parse later
      // In production, you'd use a library like mammoth for DOCX
      rawText = 'File Word sẽ được xử lý sau khi upload';
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
