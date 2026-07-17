import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getDescopeClient } from '@/lib/descope';
import { getUserPlan } from '@/lib/plans';
import dbConnect from '@/lib/db';
import Affiliate from '@/models/Affiliate';
import Referral from '@/models/Referral';

// POST /api/auth/descope-sync
// Sync Descope user with our MongoDB database
export async function POST(request) {
  try {
    // Validate session via Bearer token sent immediately after Descope onSuccess
    // (the DS cookie isn't written to the browser yet at that instant)
    const authHeader = request.headers.get('Authorization');
    const sessionJwt = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!sessionJwt) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let verifiedToken;
    try {
      const client = getDescopeClient();
      const result = await client.validateSession(sessionJwt);
      verifiedToken = result.token;
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid session token' },
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
    if (userId !== verifiedToken.sub) {
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
        freeCredits: 5,
        paidCredits: 0,
        unlockedCvIds: [],
        passExpiresAt: null,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };

      // Affiliate referral tracking — runs best-effort, never blocks signup
      try {
        const affRef = request.cookies.get('aff_ref')?.value;
        if (affRef) {
          await dbConnect();
          const affiliate = await Affiliate.findOne({ refCode: affRef, status: 'active' }).lean();
          if (affiliate && affiliate.descopeUserId !== userId) {
            await Referral.create({
              affiliateId: affiliate._id,
              refCode: affRef,
              referredUserId: userId,
              signedUpAt: new Date(),
            });
          }
        }
      } catch (affErr) {
        console.error('Affiliate referral tracking error (non-fatal):', affErr);
      }
    }

    // For existing users without onboardingCompleted field, consider them completed
    // Only new users (created with onboardingCompleted: false) need onboarding
    const onboardingCompleted = user.onboardingCompleted === undefined ? true : user.onboardingCompleted;

    const plan = getUserPlan(user);

    const response = NextResponse.json({
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

    // Clear affiliate cookie after it's been consumed by a new signup
    if (isNewUser) {
      response.cookies.delete('aff_ref');
    }

    return response;
  } catch (error) {
    console.error('Descope sync error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
