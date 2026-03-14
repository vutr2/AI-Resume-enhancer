import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Resume from '@/models/Resume';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    const resume = await Resume.findOne({
      _id: id,
      user: decoded.descopeId,
    }).select('fileData fileMimeType originalFileName');

    if (!resume || !resume.fileData) {
      return new NextResponse('File not found', { status: 404 });
    }

    const buffer = Buffer.from(resume.fileData, 'base64');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': resume.fileMimeType || 'application/pdf',
        'Content-Disposition': `inline; filename="${resume.originalFileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Serve resume file error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
