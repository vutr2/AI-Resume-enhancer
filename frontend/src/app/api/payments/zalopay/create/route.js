import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import Payment from '@/models/Payment';
import { getCurrentUser } from '@/lib/auth';

// ZaloPay config
const ZALOPAY_CONFIG = {
  app_id: process.env.ZALOPAY_APP_ID || '2553',
  key1: process.env.ZALOPAY_KEY1 || 'PcY4iZIKFCIdgZvA6ueMcMHHUbRLYjPL',
  key2: process.env.ZALOPAY_KEY2 || 'kLtgPl8HHhfvMuDHPwKfgfsY4Ydm9eIz',
  endpoint: process.env.ZALOPAY_ENDPOINT || 'https://sb-openapi.zalopay.vn/v2/create',
};

// Plan prices in VND
const PLAN_PRICES = {
  basic: {
    monthly: 99000,
    yearly: 990000,
  },
  pro: {
    monthly: 199000,
    yearly: 1990000,
  },
  enterprise: {
    monthly: 499000,
    yearly: 4990000,
  },
};

// Generate unique transaction ID in format: yymmdd_xxxxxx
function generateAppTransId() {
  const date = new Date();
  const yy = date.getFullYear().toString().slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `${yy}${mm}${dd}_${random}`;
}

export async function POST(request) {
  try {
    const decoded = await getCurrentUser(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: 'Vui lòng đăng nhập' },
        { status: 401 }
      );
    }

    await dbConnect();

    const body = await request.json();
    const { planId, billingCycle } = body;

    // Validate plan
    if (!planId || !PLAN_PRICES[planId]) {
      return NextResponse.json(
        { success: false, message: 'Gói dịch vụ không hợp lệ' },
        { status: 400 }
      );
    }

    // Validate billing cycle
    if (!billingCycle || !['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json(
        { success: false, message: 'Chu kỳ thanh toán không hợp lệ' },
        { status: 400 }
      );
    }

    const amount = PLAN_PRICES[planId][billingCycle];
    const appTransId = generateAppTransId();

    // Prepare ZaloPay order
    const embedData = JSON.stringify({
      redirecturl: `${process.env.NEXT_PUBLIC_APP_URL}/payment/callback`,
    });

    const items = JSON.stringify([
      {
        itemid: planId,
        itemname: `Gói ${planId.charAt(0).toUpperCase() + planId.slice(1)} - ${billingCycle === 'yearly' ? '12 tháng' : '1 tháng'}`,
        itemprice: amount,
        itemquantity: 1,
      },
    ]);

    const orderData = {
      app_id: parseInt(ZALOPAY_CONFIG.app_id),
      app_user: decoded.userId,
      app_trans_id: appTransId,
      app_time: Date.now(),
      amount: amount,
      item: items,
      embed_data: embedData,
      description: `ResuMax VN - Nâng cấp gói ${planId.charAt(0).toUpperCase() + planId.slice(1)}`,
      bank_code: '',
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/zalopay/callback`,
    };

    // Create MAC signature
    const data = `${orderData.app_id}|${orderData.app_trans_id}|${orderData.app_user}|${orderData.amount}|${orderData.app_time}|${orderData.embed_data}|${orderData.item}`;
    orderData.mac = crypto.createHmac('sha256', ZALOPAY_CONFIG.key1).update(data).digest('hex');

    // Call ZaloPay API
    console.log('Calling ZaloPay API with order:', {
      app_id: orderData.app_id,
      app_trans_id: orderData.app_trans_id,
      amount: orderData.amount,
    });

    let zaloPayResponse;
    try {
      const response = await fetch(ZALOPAY_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(orderData).toString(),
      });

      zaloPayResponse = await response.json();
      console.log('ZaloPay response:', zaloPayResponse);
    } catch (fetchError) {
      console.error('ZaloPay fetch error:', fetchError);
      return NextResponse.json(
        {
          success: false,
          message: 'Không thể kết nối đến ZaloPay. Vui lòng thử lại sau.',
        },
        { status: 503 }
      );
    }

    if (zaloPayResponse.return_code === 1) {
      // Save payment record
      await Payment.create({
        user: decoded.userId,
        orderId: appTransId,
        plan: planId,
        amount: amount,
        paymentMethod: 'zalopay',
        billingPeriod: billingCycle,
        status: 'pending',
        paymentDetails: {
          zp_trans_token: zaloPayResponse.zp_trans_token,
          order_url: zaloPayResponse.order_url,
        },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Tạo đơn hàng thành công',
          data: {
            transactionId: appTransId,
            orderUrl: zaloPayResponse.order_url,
            amount: amount,
            zpTransToken: zaloPayResponse.zp_trans_token,
          },
        },
        { status: 200 }
      );
    } else {
      console.error('ZaloPay error:', zaloPayResponse);
      // Provide more specific error messages
      let errorMessage = 'Không thể tạo đơn hàng ZaloPay';
      if (zaloPayResponse.return_code === 2) {
        errorMessage = 'Thông tin đơn hàng không hợp lệ. Vui lòng thử lại.';
      } else if (zaloPayResponse.return_code === -1) {
        errorMessage = 'Lỗi hệ thống ZaloPay. Vui lòng thử lại sau.';
      } else if (zaloPayResponse.return_message) {
        errorMessage = zaloPayResponse.return_message;
      }

      return NextResponse.json(
        {
          success: false,
          message: errorMessage,
          code: zaloPayResponse.return_code,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Create ZaloPay order error:', error);
    return NextResponse.json(
      { success: false, message: 'Lỗi hệ thống' },
      { status: 500 }
    );
  }
}
