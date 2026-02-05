import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getUserPlan } from '@/lib/plans';

// POST /api/auth/descope-sync
// Sync Descope user with our MongoDB database
export async function POST(request) {
  try {
    // Validate Descope session
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId, email, name, image } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { success: false, message: 'userId and email are required' },
        { status: 400 }
      );
    }

    // Ensure request matches the authenticated session
    if (userId !== descopeUser.descopeId) {
      return NextResponse.json(
        { success: false, message: 'User ID mismatch' },
        { status: 403 }
      );
    }

    const db = await getDb();
    const usersCollection = db.collection('users');

    // Check if user exists
    let user = await usersCollection.findOne({
      $or: [
        { descopeId: userId },
        { email: email.toLowerCase() }
      ]
    });

    let isNewUser = false;

    if (user) {
      // Update existing user with Descope ID if not set
      if (!user.descopeId) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              descopeId: userId,
              updatedAt: new Date(),
            }
          }
        );
      }

      // Update name and image if provided
      if (name || image) {
        await usersCollection.updateOne(
          { _id: user._id },
          {
            $set: {
              ...(name && { name }),
              ...(image && { image }),
              updatedAt: new Date(),
            }
          }
        );
      }

      // Fetch updated user
      user = await usersCollection.findOne({ _id: user._id });
    } else {
      // Create new user
      isNewUser = true;
      const newUser = {
        descopeId: userId,
        email: email.toLowerCase(),
        name: name || email.split('@')[0],
        image: image || null,
        plan: 'free',
        monthlyCreditsUsed: 0,
        currentBillingMonth: null,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // For existing users without onboardingCompleted field, consider them completed
    // Only new users (created with onboardingCompleted: false) need onboarding
    const onboardingCompleted = user.onboardingCompleted === undefined ? true : user.onboardingCompleted;

    const plan = getUserPlan(user);

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          descopeId: user.descopeId,
          email: user.email,
          name: user.name,
          image: user.image,
          plan: plan.planKey,
          features: plan.features,
          onboardingCompleted,
        },
        isNewUser,
      }
    });
  } catch (error) {
    console.error('Descope sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
