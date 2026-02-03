'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import api from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState('checking'); // checking, success, failed
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      // Lấy thông tin pending payment từ localStorage
      const pendingPaymentStr = localStorage.getItem('pendingPayment');

      if (!pendingPaymentStr) {
        setStatus('failed');
        return;
      }

      try {
        const pendingPayment = JSON.parse(pendingPaymentStr);
        const { transactionId } = pendingPayment;

        // Gọi API kiểm tra trạng thái
        const response = await api.checkZaloPayStatus(transactionId);

        if (response.success && response.data.status === 'completed') {
          setStatus('success');
          setPaymentInfo({
            ...pendingPayment,
            paidAt: response.data.paidAt,
          });
          // Xóa pending payment
          localStorage.removeItem('pendingPayment');
        } else if (response.data?.status === 'failed') {
          setStatus('failed');
          localStorage.removeItem('pendingPayment');
        } else {
          // Còn đang xử lý, thử lại sau 2 giây
          setTimeout(checkPaymentStatus, 2000);
        }
      } catch (error) {
        console.error('Check payment status error:', error);
        setStatus('failed');
      }
    };

    checkPaymentStatus();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--foreground)]">
            ResuMax VN
          </span>
        </Link>

        <Card className="text-center">
          {status === 'checking' && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--primary)] animate-spin" />
              <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
                Đang kiểm tra thanh toán...
              </h1>
              <p className="text-[var(--foreground-secondary)]">
                Vui lòng đợi trong giây lát
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Thanh toán thành công!
              </h1>
              <p className="text-[var(--foreground-secondary)] mb-6">
                Cảm ơn bạn đã nâng cấp lên gói {paymentInfo?.planId === 'premium' ? 'Premium' : 'Pro'}
              </p>

              {paymentInfo && (
                <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6 text-left">
                  <div className="flex justify-between mb-2">
                    <span className="text-[var(--foreground-muted)]">Gói dịch vụ</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {paymentInfo.planId === 'premium' ? 'Premium' : 'Pro'}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[var(--foreground-muted)]">Chu kỳ</span>
                    <span className="font-medium text-[var(--foreground)]">
                      {paymentInfo.billingCycle === 'yearly' ? '12 tháng' : '1 tháng'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">Số tiền</span>
                    <span className="font-medium text-[var(--primary)]">
                      {formatPrice(paymentInfo.amount)}đ
                    </span>
                  </div>
                </div>
              )}

              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  Bắt đầu sử dụng
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </>
          )}

          {status === 'failed' && (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Thanh toán thất bại
              </h1>
              <p className="text-[var(--foreground-secondary)] mb-6">
                Giao dịch không thành công. Vui lòng thử lại hoặc liên hệ hỗ trợ.
              </p>

              <div className="space-y-3">
                <Link href="/pricing">
                  <Button className="w-full" size="lg">
                    Thử lại
                  </Button>
                </Link>
                <Link href="/dashboard">
                  <Button variant="outline" className="w-full">
                    Quay lại Dashboard
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>

        <p className="text-center text-sm text-[var(--foreground-muted)] mt-6">
          Cần hỗ trợ?{' '}
          <Link href="/contact" className="text-[var(--primary)] hover:underline">
            Liên hệ chúng tôi
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ZaloPayCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
