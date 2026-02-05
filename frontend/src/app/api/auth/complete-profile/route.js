import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// POST /api/auth/complete-profile
// Complete user profile after registration (onboarding)
export async function POST(request) {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, phone, location, jobTitle, experience, industry, onboardingCompleted } = body;

    const db = await getDb();

    const updateData = {
      updatedAt: new Date(),
    };

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (location) updateData.location = location;
    if (jobTitle) updateData.jobTitle = jobTitle;
    if (experience) updateData.experience = experience;
    if (industry) updateData.industry = industry;
    if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

    const result = await db.collection('users').findOneAndUpdate(
      {
        $or: [
          { descopeId: descopeUser.descopeId },
          { email: descopeUser.email?.toLowerCase() }
        ]
      },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    const user = result;

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Cập nhật hồ sơ thành công',
      data: {
        user: {
          id: user._id.toString(),
          descopeId: user.descopeId,
          name: user.name,
          email: user.email,
          phone: user.phone,
          location: user.location,
          jobTitle: user.jobTitle,
          experience: user.experience,
          industry: user.industry,
          plan: user.plan || 'free',
          credits: user.credits ?? 5,
          onboardingCompleted: user.onboardingCompleted,
        }
      }
    });
  } catch (error) {
    console.error('Complete profile error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
