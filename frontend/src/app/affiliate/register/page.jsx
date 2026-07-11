'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession, useUser } from '@descope/nextjs-sdk/client';
import { Copy, Check, Users, ArrowLeft } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import toast from 'react-hot-toast';
import { trackLead } from '@/lib/pixel';

export default function AffiliateRegisterPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();
  const { user } = useUser();

  const [form, setForm] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/affiliate/register');
    }
  }, [isAuthenticated, isSessionLoading, router]);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        trackLead();
        toast.success('Đăng ký thành công!');
      } else if (res.status === 409) {
        toast.error('Bạn đã đăng ký affiliate rồi.');
        router.push('/affiliate/dashboard');
      } else {
        toast.error(data.message || 'Đăng ký thất bại');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result.affiliateLink);
    setCopied(true);
    toast.success('Đã sao chép link!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSessionLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[var(--background)] py-12 px-4">
      <div className="max-w-lg mx-auto">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Đăng ký Affiliate</h1>
            <p className="text-sm text-[var(--foreground-muted)]">Kiếm 50% hoa hồng cho mỗi người bạn giới thiệu</p>
          </div>
        </div>

        {result ? (
          <Card>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[var(--success)]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-1">Chúc mừng!</h2>
              <p className="text-[var(--foreground-secondary)] text-sm">Link giới thiệu của bạn đã sẵn sàng</p>
            </div>

            <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-4">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Mã giới thiệu</p>
              <p className="font-mono font-bold text-[var(--primary)] text-lg">{result.refCode}</p>
            </div>

            <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6">
              <p className="text-xs text-[var(--foreground-muted)] mb-2">Link giới thiệu</p>
              <p className="text-sm text-[var(--foreground)] break-all font-mono">{result.affiliateLink}</p>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleCopy} className="flex-1 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Đã sao chép' : 'Sao chép link'}
              </Button>
              <Button variant="secondary" onClick={() => router.push('/affiliate/dashboard')} className="flex-1">
                Vào Dashboard
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            {user?.name && (
              <div className="bg-[var(--background-secondary)] rounded-lg px-4 py-3 mb-4">
                <p className="text-xs text-[var(--foreground-muted)]">Đăng ký với tài khoản</p>
                <p className="font-medium text-[var(--foreground)]">{user.name}</p>
                <p className="text-sm text-[var(--foreground-secondary)]">{user.email}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-3">Thông tin ngân hàng nhận tiền</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Tên ngân hàng *</label>
                    <Input name="bankName" value={form.bankName} onChange={handleChange} placeholder="Vietcombank, Techcombank..." required />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Số tài khoản *</label>
                    <Input name="accountNumber" value={form.accountNumber} onChange={handleChange} placeholder="0123456789" required />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Tên chủ tài khoản *</label>
                    <Input name="accountHolder" value={form.accountHolder} onChange={handleChange} placeholder="NGUYEN VAN A" required />
                  </div>
                </div>
              </div>

              <div className="bg-[var(--background-secondary)] rounded-lg p-4 text-xs text-[var(--foreground-secondary)]">
                <p className="font-medium text-[var(--foreground)] mb-1">Điều kiện hoa hồng</p>
                <ul className="space-y-1">
                  <li>• Hoa hồng: <strong className="text-[var(--primary)]">50%</strong> doanh thu từ người bạn giới thiệu</li>
                  <li>• Attribution: 30 ngày từ khi click link</li>
                  <li>• Chỉ tính hoa hồng cho lần trả tiền đầu tiên</li>
                  <li>• Chi trả 2 tuần/lần qua chuyển khoản</li>
                </ul>
              </div>

              <Button type="submit" loading={isLoading} className="w-full">
                Tham gia Affiliate
              </Button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}
