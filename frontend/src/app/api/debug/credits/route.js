import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { calculateCreditsRemaining } from '@/lib/credits';
import { getUserPlan, getMaxAICredits } from '@/lib/plans';

// Debug-only API - disabled in production
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const db = await getDb();

    const user = await db.collection('users').findOne({
      $or: [
        { descopeId: descopeUser.descopeId },
        { email: descopeUser.email?.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const plan = getUserPlan(user);
    const maxCredits = getMaxAICredits(user);
    const creditsRemaining = calculateCreditsRemaining(user);

    return NextResponse.json({
      debug: {
        userId: user._id.toString(),
        email: user.email,
        // Plan info
        planKey: plan.planKey,
        planName: plan.name,
        planExpired: plan.expired,
        planExpiresAt: user.planExpiresAt,
        features: plan.features,
        // Credit fields from database
        monthlyCreditsUsed: user.monthlyCreditsUsed,
        currentBillingMonth: user.currentBillingMonth,
        // Calculated values
        currentMonth,
        isNewMonth: user.currentBillingMonth !== currentMonth,
        maxCredits,
        creditsRemaining,
        isUnlimited: maxCredits === -1,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Reset credits for testing
export async function POST(request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available' }, { status: 404 });
  }

  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const db = await getDb();

    // Check if body contains action
    let action = 'reset';
    try {
      const body = await request.json();
      action = body.action || 'reset';
    } catch {
      // No body, use default action
    }

    if (action === 'set-pro') {
      // Set user as Pro with expiration 1 year from now
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);

      await db.collection('users').updateOne(
        {
          $or: [
            { descopeId: descopeUser.descopeId },
            { email: descopeUser.email?.toLowerCase() }
          ]
        },
        {
          $set: {
            plan: 'pro',
            planExpiresAt: expiresAt,
          }
        }
      );

      return NextResponse.json({
        success: true,
        message: `User upgraded to Pro until ${expiresAt.toISOString()}`
      });
    } else if (action === 'set-free') {
      // Set user back to free
      await db.collection('users').updateOne(
        {
          $or: [
            { descopeId: descopeUser.descopeId },
            { email: descopeUser.email?.toLowerCase() }
          ]
        },
        {
          $set: {
            plan: 'free',
            planExpiresAt: null,
            monthlyCreditsUsed: 0,
            currentBillingMonth: null,
          }
        }
      );

      return NextResponse.json({ success: true, message: 'User set to Free plan (5 AI credits/month)' });
    } else {
      // Default: reset credits
      await db.collection('users').updateOne(
        {
          $or: [
            { descopeId: descopeUser.descopeId },
            { email: descopeUser.email?.toLowerCase() }
          ]
        },
        {
          $set: {
            monthlyCreditsUsed: 0,
            currentBillingMonth: null,
          }
        }
      );

      return NextResponse.json({ success: true, message: 'Credits reset for current plan' });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
