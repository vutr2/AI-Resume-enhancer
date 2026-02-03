import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb-client';
import { getCurrentUser } from '@/lib/auth';

// Tính số credits còn lại trong tháng
function calculateCreditsRemaining(user) {
  // User trả phí => không giới hạn
  if (['basic', 'pro', 'enterprise'].includes(user.plan)) {
    const planExpiresAt = user.planExpiresAt ? new Date(user.planExpiresAt) : null;
    if (planExpiresAt && new Date() < planExpiresAt) {
      return -1; // -1 = unlimited
    }
  }

  const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"
  const isFirstMonth = user.isFirstMonth !== false;
  const maxCredits = isFirstMonth ? 10 : 3;

  // Nếu là tháng mới, reset
  if (user.currentBillingMonth !== currentMonth) {
    return maxCredits;
  }

  return Math.max(0, maxCredits - (user.monthlyCreditsUsed || 0));
}

export async function GET() {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    // Find user by Descope ID or email
    const user = await db.collection('users').findOne({
      $or: [
        { descopeId: descopeUser.descopeId },
        { email: descopeUser.email?.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Người dùng không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user._id.toString(),
            descopeId: user.descopeId,
            name: user.name,
            email: user.email,
            image: user.image,
            phone: user.phone,
            location: user.location,
            jobTitle: user.jobTitle,
            title: user.title || user.jobTitle,
            experience: user.experience,
            industry: user.industry,
            bio: user.bio,
            plan: user.plan || 'free',
            planExpiresAt: user.planExpiresAt,
            credits: user.credits ?? 10,
            monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
            currentBillingMonth: user.currentBillingMonth,
            isFirstMonth: user.isFirstMonth !== false,
            creditsRemaining: calculateCreditsRemaining(user),
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Get me error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const body = await request.json();
    const { name, image, phone, location, title, jobTitle, experience, industry, bio } = body;

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (phone !== undefined) updateData.phone = phone;
    if (location !== undefined) updateData.location = location;
    if (title !== undefined) updateData.title = title;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (experience !== undefined) updateData.experience = experience;
    if (industry !== undefined) updateData.industry = industry;
    if (bio !== undefined) updateData.bio = bio;

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

    return NextResponse.json(
      {
        success: true,
        message: 'Cập nhật thành công',
        data: {
          user: {
            id: user._id.toString(),
            descopeId: user.descopeId,
            name: user.name,
            email: user.email,
            image: user.image,
            phone: user.phone,
            location: user.location,
            jobTitle: user.jobTitle,
            title: user.title || user.jobTitle,
            experience: user.experience,
            industry: user.industry,
            bio: user.bio,
            plan: user.plan || 'free',
            planExpiresAt: user.planExpiresAt,
            credits: user.credits ?? 10,
            monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
            currentBillingMonth: user.currentBillingMonth,
            isFirstMonth: user.isFirstMonth !== false,
            creditsRemaining: calculateCreditsRemaining(user),
            onboardingCompleted: user.onboardingCompleted,
            createdAt: user.createdAt,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update me error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
