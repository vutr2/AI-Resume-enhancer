'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2, FileText } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUserProfile } = useAuthStore();

  const [status, setStatus] = useState('loading'); // loading, success, failed
  const [message, setMessage] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [failedPaymentInfo, setFailedPaymentInfo] = useState(null);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Get transactionId from localStorage
        const pendingPayment = localStorage.getItem('pendingPayment');
        if (!pendingPayment) {
          setStatus('failed');
          setMessage('Không tìm thấy thông tin thanh toán');
          return;
        }

        const { transactionId } = JSON.parse(pendingPayment);

        if (!transactionId) {
          setStatus('failed');
          setMessage('Không tìm thấy mã giao dịch');
          return;
        }

        // Check payment status
        const response = await api.checkZaloPayStatus(transactionId);

        if (response.success && response.data.status === 'completed') {
          setStatus('success');
          setMessage('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
          setPaymentInfo(response.data);

          // Reload user to update plan
          await loadUser();

          // Clear pending payment
          localStorage.removeItem('pendingPayment');
        } else if (response.data?.status === 'pending') {
          // Still pending, retry after 3 seconds (max 10 retries)
          if (retryCount < 10) {
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
            }, 3000);
          } else {
            setStatus('failed');
            setMessage('Giao dịch đang được xử lý. Vui lòng kiểm tra lại sau.');
          }
        } else {
          setStatus('failed');
          setMessage(response.message || 'Thanh toán thất bại');
          // Save failed payment info for retry before removing from localStorage
          const pendingData = JSON.parse(pendingPayment);
          setFailedPaymentInfo({
            planId: pendingData.planId,
            billingCycle: pendingData.billingCycle,
          });
          localStorage.removeItem('pendingPayment');
        }
      } catch (error) {
        console.error('Check payment error:', error);
        setStatus('failed');
        setMessage(error.message || 'Có lỗi xảy ra khi kiểm tra thanh toán');
        // Save failed payment info for retry before removing from localStorage
        const pendingPayment = localStorage.getItem('pendingPayment');
        if (pendingPayment) {
          try {
            const pendingData = JSON.parse(pendingPayment);
            setFailedPaymentInfo({
              planId: pendingData.planId,
              billingCycle: pendingData.billingCycle,
            });
          } catch (e) {
            // Ignore parse error
          }
        }
        // Clear pending payment on error so user can retry
        localStorage.removeItem('pendingPayment');
      }
    };

    checkPaymentStatus();
  }, [retryCount, loadUser]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        {/* Logo */}
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-[var(--foreground)]">
            ResuMax VN
          </span>
        </Link>

        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--primary)] animate-spin" />
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Đang xác nhận thanh toán...
            </h1>
            <p className="text-[var(--foreground-muted)]">
              Vui lòng đợi trong giây lát
            </p>
            {retryCount > 0 && (
              <p className="text-sm text-[var(--foreground-muted)] mt-2">
                Đang kiểm tra... ({retryCount}/10)
              </p>
            )}
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--success)] bg-opacity-10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-[var(--success)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Thanh toán thành công!
            </h1>
            <p className="text-[var(--foreground-muted)] mb-6">{message}</p>

            {paymentInfo?.payment && (
              <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6 text-left">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--foreground-muted)]">
                    Gói dịch vụ:
                  </span>
                  <span className="font-medium text-[var(--foreground)] capitalize">
                    {paymentInfo.payment.plan}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-[var(--foreground-muted)]">
                    Số tiền:
                  </span>
                  <span className="font-medium text-[var(--foreground)]">
                    {new Intl.NumberFormat('vi-VN').format(
                      paymentInfo.payment.amount
                    )}
                    đ
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-muted)]">
                    Hiệu lực đến:
                  </span>
                  <span className="font-medium text-[var(--foreground)]">
                    {paymentInfo.payment.planEndDate
                      ? new Date(
                          paymentInfo.payment.planEndDate
                        ).toLocaleDateString('vi-VN')
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Vào Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/dashboard/resumes')}
                className="w-full"
              >
                Bắt đầu tạo CV
              </Button>
            </div>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error)] bg-opacity-10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-[var(--error)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--foreground)] mb-2">
              Thanh toán thất bại
            </h1>
            <p className="text-[var(--foreground-muted)] mb-6">{message}</p>

            <div className="space-y-3">
              {failedPaymentInfo ? (
                <Button
                  onClick={() =>
                    router.push(
                      `/payment?plan=${failedPaymentInfo.planId}&cycle=${failedPaymentInfo.billingCycle}`
                    )
                  }
                  className="w-full"
                >
                  Thử thanh toán lại
                </Button>
              ) : (
                <Button
                  onClick={() => router.push('/pricing')}
                  className="w-full"
                >
                  Chọn gói khác
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => router.push('/pricing')}
                className="w-full"
              >
                Xem các gói dịch vụ
              </Button>
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Về Dashboard
              </Button>
            </div>
          </>
        )}

        <p className="text-xs text-[var(--foreground-muted)] mt-6">
          Cần hỗ trợ?{' '}
          <Link href="/help" className="text-[var(--primary)] hover:underline">
            Liên hệ chúng tôi
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
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
