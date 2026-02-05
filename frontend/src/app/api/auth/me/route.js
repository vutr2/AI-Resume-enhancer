import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateCreditsRemaining } from '@/lib/credits';
import { getUserPlan } from '@/lib/plans';

export async function GET() {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    const db = await getDb();

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

    const plan = getUserPlan(user);
    const creditsRemaining = calculateCreditsRemaining(user);

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
            plan: plan.planKey,
            planExpiresAt: user.planExpiresAt,
            maxCredits: plan.monthlyAICredits,
            monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
            currentBillingMonth: user.currentBillingMonth,
            creditsRemaining,
            isUnlimited: creditsRemaining === -1,
            features: plan.features,
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

    const db = await getDb();

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

    const updatedPlan = getUserPlan(user);
    const updatedCreditsRemaining = calculateCreditsRemaining(user);

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
            plan: updatedPlan.planKey,
            planExpiresAt: user.planExpiresAt,
            maxCredits: updatedPlan.monthlyAICredits,
            monthlyCreditsUsed: user.monthlyCreditsUsed || 0,
            currentBillingMonth: user.currentBillingMonth,
            creditsRemaining: updatedCreditsRemaining,
            isUnlimited: updatedCreditsRemaining === -1,
            features: updatedPlan.features,
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
