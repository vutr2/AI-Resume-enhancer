'use client';

import { useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Descope } from '@descope/nextjs-sdk';
import { useSession } from '@descope/nextjs-sdk/client';
import { FileText } from 'lucide-react';
import Card from '@/components/ui/Card';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isSessionLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isSessionLoading, router]);

  const handleSuccess = useCallback(
    async (e) => {
      toast.success('Đăng ký thành công!');

      // Sync user with our database
      try {
        const response = await fetch('/api/auth/descope-sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: e.detail.user.userId,
            email: e.detail.user.email,
            name: e.detail.user.name || e.detail.user.email?.split('@')[0],
            image: e.detail.user.picture,
          }),
        });

        if (response.ok) {
          const data = await response.json();

          // New user always goes to onboarding
          if (data.data?.isNewUser || data.data?.user?.onboardingCompleted === false) {
            router.push('/onboarding');
            return;
          }
        } else {
          console.error('Failed to sync user');
        }
      } catch (error) {
        console.error('Error syncing user:', error);
      }

      router.push('/dashboard');
    },
    [router]
  );

  const handleError = useCallback((e) => {
    console.error('Register error:', e);
    toast.error('Đăng ký thất bại. Vui lòng thử lại.');
  }, []);

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

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

        <Card>
          <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">
            Tạo tài khoản
          </h1>
          <p className="text-center text-[var(--foreground-secondary)] mb-6">
            Bắt đầu tối ưu hóa CV của bạn ngay hôm nay
          </p>

          {/* Descope Flow Component - sign-up flow */}
          <Descope
            flowId="sign-up-or-in"
            onSuccess={handleSuccess}
            onError={handleError}
            theme="dark"
          />

          <p className="mt-6 text-center text-sm text-[var(--foreground-secondary)]">
            Đã có tài khoản?{' '}
            <Link
              href="/login"
              className="text-[var(--primary)] font-medium hover:underline"
            >
              Đăng nhập
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
