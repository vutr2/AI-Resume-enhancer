'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      setError('Vui long nhap email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email khong hop le');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.request('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setIsSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Co loi xay ra');
    } finally {
      setIsLoading(false);
    }
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

        <Card>
          {isSubmitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Kiem tra email
              </h1>
              <p className="text-[var(--foreground-secondary)] mb-6">
                Chung toi da gui huong dan dat lai mat khau den{' '}
                <span className="font-medium text-[var(--foreground)]">{email}</span>
              </p>
              <p className="text-sm text-[var(--foreground-muted)] mb-6">
                Khong nhan duoc email? Kiem tra thu muc spam hoac{' '}
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="text-[var(--primary)] hover:underline"
                >
                  thu lai
                </button>
              </p>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Quay lai dang nhap
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">
                Quen mat khau?
              </h1>
              <p className="text-center text-[var(--foreground-secondary)] mb-6">
                Nhap email cua ban de nhan huong dan dat lai mat khau
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="email@example.com"
                  error={error}
                  icon={<Mail className="w-5 h-5" />}
                />

                <Button
                  type="submit"
                  loading={isLoading}
                  className="w-full"
                  size="lg"
                >
                  Gui huong dan
                </Button>
              </form>

              <p className="mt-6 text-center text-sm">
                <Link
                  href="/login"
                  className="text-[var(--foreground-secondary)] hover:text-[var(--foreground)] inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Quay lai dang nhap
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
