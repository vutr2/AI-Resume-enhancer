import { NextResponse } from 'next/server';

// VNPay Return URL - CHỈ redirect, KHÔNG xử lý DB
// Nghiệp vụ DB được xử lý ở IPN endpoint riêng
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const responseCode = searchParams.get('vnp_ResponseCode');
    const txnRef = searchParams.get('vnp_TxnRef');

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

    if (responseCode === '00') {
      // VNPay báo thành công -> redirect UI
      return NextResponse.redirect(
        `${APP_URL}/payment/vnpay/callback?status=success&txnRef=${txnRef}`
      );
    } else {
      // Map VNPay error codes
      const errorMessages = {
        '07': 'Trừ tiền thành công nhưng giao dịch bị nghi ngờ',
        '09': 'Thẻ/Tài khoản chưa đăng ký InternetBanking',
        '10': 'Xác thực thông tin thẻ không đúng quá 3 lần',
        '11': 'Đã hết hạn chờ thanh toán',
        '12': 'Thẻ/Tài khoản bị khóa',
        '13': 'Mật khẩu OTP không chính xác',
        '24': 'Giao dịch đã bị hủy',
        '51': 'Tài khoản không đủ số dư',
        '65': 'Tài khoản đã vượt quá hạn mức giao dịch trong ngày',
        '75': 'Ngân hàng thanh toán đang bảo trì',
        '79': 'Nhập sai mật khẩu quá số lần quy định',
        '99': 'Lỗi không xác định',
      };

      const errorMessage = errorMessages[responseCode] || 'Thanh toán thất bại';

      return NextResponse.redirect(
        `${APP_URL}/payment/vnpay/callback?status=failed&message=${encodeURIComponent(errorMessage)}`
      );
    }
  } catch (error) {
    console.error('VNPay return URL error:', error);
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    return NextResponse.redirect(
      `${APP_URL}/payment/vnpay/callback?status=error&message=${encodeURIComponent('Lỗi hệ thống')}`
    );
  }
}
