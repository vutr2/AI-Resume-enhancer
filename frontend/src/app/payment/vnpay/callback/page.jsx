'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadUserProfile } = useAuthStore();

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const urlStatus = searchParams.get('status');
    const urlMessage = searchParams.get('message');
    const txnRef = searchParams.get('txnRef');

    if (urlStatus === 'success') {
      setStatus('success');
      setMessage('Thanh toán thành công! Tài khoản của bạn đã được nâng cấp.');
      // Reload user profile to get updated plan
      loadUserProfile();
    } else if (urlStatus === 'failed') {
      setStatus('failed');
      setMessage(urlMessage || 'Thanh toán thất bại. Vui lòng thử lại.');
    } else if (urlStatus === 'error') {
      setStatus('error');
      setMessage(urlMessage || 'Đã xảy ra lỗi. Vui lòng liên hệ hỗ trợ.');
    } else {
      setStatus('loading');
      setMessage('Đang xử lý kết quả thanh toán...');
    }
  }, [searchParams, loadUserProfile]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
          )}
          {status === 'failed' && (
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
          {status === 'success' && 'Thanh toán thành công!'}
          {status === 'failed' && 'Thanh toán thất bại'}
          {status === 'error' && 'Đã xảy ra lỗi'}
        </h1>

        {/* Message */}
        <p className="text-[var(--foreground-secondary)] mb-8">{message}</p>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'success' && (
            <>
              <Button
                onClick={() => router.push('/dashboard')}
                className="w-full"
                size="lg"
              >
                <FileText className="w-5 h-5 mr-2" />
                Bắt đầu sử dụng
              </Button>
              <Link
                href="/dashboard/resumes"
                className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline text-sm"
              >
                Đi đến CV của tôi
                <ArrowRight className="w-4 h-4" />
              </Link>
            </>
          )}

          {(status === 'failed' || status === 'error') && (
            <>
              <Button
                onClick={() => router.push('/payment')}
                className="w-full"
                size="lg"
              >
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

        {/* Support */}
        {(status === 'failed' || status === 'error') && (
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <p className="text-sm text-[var(--foreground-muted)]">
              Cần hỗ trợ?{' '}
              <a
                href="mailto:support@resumax.vn"
                className="text-[var(--primary)] hover:underline"
              >
                Liên hệ chúng tôi
              </a>
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

export default function VNPayCallbackPage() {
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
