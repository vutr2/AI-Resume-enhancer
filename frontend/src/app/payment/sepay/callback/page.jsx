'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { trackPurchase } from '@/lib/pixel';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUserProfile } = useAuthStore();

  const urlStatus  = searchParams.get('status');
  const urlMessage = searchParams.get('message');
  const urlAmount  = searchParams.get('amount');
  const orderId    = searchParams.get('orderId');

  const status = urlStatus || 'loading';

  // profileReady: true once loadUserProfile() resolves after a successful payment
  const [profileReady, setProfileReady] = useState(status !== 'success');
  const [retrying, setRetrying] = useState(false);

  const refreshProfile = useCallback(async () => {
    try {
      await loadUserProfile();
    } catch {
      // best-effort
    } finally {
      setProfileReady(true);
    }
  }, [loadUserProfile]);

  useEffect(() => {
    if (status !== 'success') return;

    const amount = urlAmount ? Number(urlAmount) : undefined;
    if (amount) trackPurchase({ value: amount, currency: 'VND' });

    // Refresh immediately — the callback API route already granted credits
    // synchronously before redirecting here, so one fetch is enough.
    refreshProfile();
  }, [status, urlAmount, refreshProfile]);

  const handleManualRetry = async () => {
    setRetrying(true);
    setProfileReady(false);
    await refreshProfile();
    setRetrying(false);
  };

  const message =
    status === 'success'
      ? 'Thanh toán thành công! Tài khoản của bạn đã được cập nhật.'
      : status === 'cancelled'
        ? 'Bạn đã hủy giao dịch.'
        : status === 'failed'
          ? urlMessage || 'Thanh toán thất bại. Vui lòng thử lại.'
          : status === 'error'
            ? urlMessage || 'Đã xảy ra lỗi. Vui lòng liên hệ hỗ trợ.'
            : 'Đang xử lý kết quả thanh toán...';

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          {(status === 'loading' || (status === 'success' && !profileReady)) && (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}
          {status === 'success' && profileReady && (
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          )}
          {(status === 'failed' || status === 'cancelled') && (
            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          )}
          {status === 'error' && (
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-amber-500" />
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {status === 'loading' && 'Đang xử lý...'}
          {status === 'success' && !profileReady && 'Đang cập nhật tài khoản...'}
          {status === 'success' && profileReady && 'Thanh toán thành công!'}
          {status === 'failed' && 'Thanh toán thất bại'}
          {status === 'cancelled' && 'Đã hủy giao dịch'}
          {status === 'error' && 'Đã xảy ra lỗi'}
        </h1>

        <p className="text-[var(--foreground-secondary)] mb-8">
          {status === 'success' && !profileReady
            ? 'Đang đồng bộ thông tin tài khoản, vui lòng đợi...'
            : message}
        </p>

        {/* Actions — only shown after profile is refreshed */}
        <div className="space-y-3">
          {status === 'success' && profileReady && (
            <>
              <Button onClick={() => router.push('/dashboard?tab=ats')} className="w-full" size="lg">
                <FileText className="w-5 h-5 mr-2" />
                Xem kết quả ATS ngay
              </Button>

              {/* Manual retry in case something went wrong */}
              <button
                onClick={handleManualRetry}
                disabled={retrying}
                className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mx-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
                {retrying ? 'Đang tải...' : 'Không thấy quyền? Tải lại'}
              </button>
            </>
          )}

          {status === 'success' && !profileReady && (
            <p className="text-sm text-[var(--foreground-muted)]">
              Vui lòng không đóng trang này...
            </p>
          )}

          {(status === 'failed' || status === 'cancelled' || status === 'error') && (
            <>
              <Button onClick={() => router.back()} className="w-full" size="lg">
                Thử lại
              </Button>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-1 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] text-sm w-full py-2"
              >
                Quay về Dashboard
              </Link>
            </>
          )}

          {status === 'loading' && (
            <p className="text-sm text-[var(--foreground-muted)]">
              Vui lòng không đóng trang này...
            </p>
          )}
        </div>

        {(status === 'failed' || status === 'error') && (
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground-muted)]">
              Cần hỗ trợ?{' '}
              <a href="mailto:support@resumax.vn" className="text-[var(--primary)] hover:underline">
                Liên hệ chúng tôi
              </a>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function SePayCallbackPage() {
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
