import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb-client';
import { getCurrentUser } from '@/lib/auth';

// API này chỉ dùng để debug - xóa khi deploy production
export async function GET() {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

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

    return NextResponse.json({
      debug: {
        userId: user._id.toString(),
        email: user.email,
        plan: user.plan,
        // Credit fields from database
        credits: user.credits,
        monthlyCreditsUsed: user.monthlyCreditsUsed,
        currentBillingMonth: user.currentBillingMonth,
        isFirstMonth: user.isFirstMonth,
        // Calculated values
        currentMonth,
        isNewMonth: user.currentBillingMonth !== currentMonth,
        calculatedIsFirstMonth: user.isFirstMonth !== false,
        maxCredits: user.isFirstMonth !== false ? 10 : 3,
        calculatedCreditsRemaining: (() => {
          const isFirstMonth = user.isFirstMonth !== false;
          const maxCredits = isFirstMonth ? 10 : 3;
          if (user.currentBillingMonth !== currentMonth) {
            return maxCredits;
          }
          return Math.max(0, maxCredits - (user.monthlyCreditsUsed || 0));
        })(),
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Reset credits for testing
export async function POST(request) {
  try {
    const descopeUser = await getCurrentUser();
    if (!descopeUser) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db();

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
            isFirstMonth: true,
          }
        }
      );

      return NextResponse.json({ success: true, message: 'User set to Free with 10 credits' });
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
            isFirstMonth: true,
          }
        }
      );

      return NextResponse.json({ success: true, message: 'Credits reset to 10' });
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
