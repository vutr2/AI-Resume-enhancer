import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import dbConnect from '@/lib/db';
import Affiliate from '@/models/Affiliate';
import { generateRefCode } from '@/lib/affiliate';

// POST /api/affiliate/register
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, message: 'Vui lòng đăng nhập' }, { status: 401 });
    }

    const { bankName, accountNumber, accountHolder } = await request.json();

    if (!bankName?.trim() || !accountNumber?.trim() || !accountHolder?.trim()) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng nhập đầy đủ thông tin ngân hàng' },
        { status: 400 }
      );
    }

    await dbConnect();

    const existing = await Affiliate.findOne({ descopeUserId: user.descopeId });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Bạn đã đăng ký affiliate rồi' },
        { status: 409 }
      );
    }

    const refCode = await generateRefCode(user.name || user.email);

    const affiliate = await Affiliate.create({
      descopeUserId: user.descopeId,
      refCode,
      name: user.name || user.email,
      email: user.email,
      payoutInfo: {
        bankName: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountHolder: accountHolder.trim(),
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    return NextResponse.json(
      {
        success: true,
        data: {
          refCode: affiliate.refCode,
          affiliateLink: `${appUrl}?ref=${affiliate.refCode}`,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Affiliate register error:', error);
    return NextResponse.json({ success: false, message: 'Lỗi server' }, { status: 500 });
  }
}
