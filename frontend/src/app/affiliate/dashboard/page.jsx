'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@descope/nextjs-sdk/client';
import {
  Copy, Check, Users, TrendingUp, DollarSign, Clock,
  ArrowLeft, BarChart2, User,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('vi-VN');
}

export default function AffiliateDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();

  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliate/stats');
      if (res.status === 401) {
        router.push('/login?returnUrl=/affiliate/dashboard');
        return;
      }
      if (res.status === 404) {
        router.push('/affiliate/register');
        return;
      }
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      } else {
        toast.error(data.message || 'Không thể tải dữ liệu');
      }
    } catch {
      toast.error('Lỗi kết nối');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) {
      router.push('/login?returnUrl=/affiliate/dashboard');
      return;
    }
    if (!isSessionLoading && isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated, isSessionLoading, router, fetchStats]);

  const handleCopy = () => {
    if (!stats?.affiliate?.affiliateLink) return;
    navigator.clipboard.writeText(stats.affiliate.affiliateLink);
    setCopied(true);
    toast.success('Đã sao chép link!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!stats) return null;

  const { affiliate, stats: s, payouts } = stats;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Back button */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Về Dashboard
        </Link>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">Affiliate Dashboard</h1>
            <p className="text-[var(--foreground-muted)] text-sm mt-1">Xin chào, {affiliate.name}</p>
          </div>
          {affiliate.status === 'suspended' && (
            <span className="px-3 py-1 rounded-full text-xs bg-[var(--error)]/10 text-[var(--error)] font-medium">
              Tài khoản bị tạm dừng
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-[var(--background-secondary)] rounded-xl mb-6 w-fit">
          {[
            { id: 'overview', label: 'Tổng quan', icon: BarChart2 },
            { id: 'profile',  label: 'Hồ sơ',     icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm'
                  : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)]'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Overview tab ─────────────────────────────────────────────────── */}
        {activeTab === 'overview' && (
          <>
            {/* Affiliate link */}
            <Card className="mb-6">
              <p className="text-sm font-medium text-[var(--foreground)] mb-2">Link giới thiệu của bạn</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-[var(--background-secondary)] rounded-lg px-4 py-3">
                  <p className="text-sm font-mono text-[var(--foreground)] break-all">{affiliate.affiliateLink}</p>
                </div>
                <Button onClick={handleCopy} size="sm" className="shrink-0 gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Đã sao chép' : 'Copy'}
                </Button>
              </div>
              <p className="text-xs text-[var(--foreground-muted)] mt-2">
                Mã: <span className="font-mono font-bold text-[var(--primary)]">{affiliate.refCode}</span>
              </p>
            </Card>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Đã đăng ký',  value: s.signedUp,            icon: Users,       color: 'text-[var(--info)]' },
                { label: 'Đã mua gói',  value: s.converted,            icon: TrendingUp,  color: 'text-[var(--success)]' },
                { label: 'Chờ duyệt',   value: formatVND(s.pendingAmount),  icon: Clock,  color: 'text-amber-500' },
                { label: 'Đã nhận',     value: formatVND(s.paidAmount),     icon: DollarSign, color: 'text-[var(--success)]' },
              ].map((item) => (
                <Card key={item.label}>
                  <div className={`${item.color} mb-2`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <p className="text-xl font-bold text-[var(--foreground)]">{item.value}</p>
                  <p className="text-xs text-[var(--foreground-muted)] mt-1">{item.label}</p>
                </Card>
              ))}
            </div>

            {/* Approved (ready to pay) */}
            {s.approvedAmount > 0 && (
              <Card className="mb-6 border-[var(--success)]/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">Sẵn sàng chi trả</p>
                    <p className="text-2xl font-bold text-[var(--success)] mt-1">{formatVND(s.approvedAmount)}</p>
                  </div>
                  <p className="text-xs text-[var(--foreground-muted)] max-w-48 text-right">
                    Hoa hồng đã được duyệt, sẽ được thanh toán trong kỳ chi trả tiếp theo
                  </p>
                </div>
              </Card>
            )}

            {/* Payout history */}
            <Card>
              <h2 className="font-semibold text-[var(--foreground)] mb-4">Lịch sử chi trả</h2>
              {payouts.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)] text-center py-8">
                  Chưa có đợt chi trả nào
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--foreground-muted)] border-b border-[var(--border)]">
                        <th className="pb-2 font-medium">Kỳ</th>
                        <th className="pb-2 font-medium">Số tiền</th>
                        <th className="pb-2 font-medium">Trạng thái</th>
                        <th className="pb-2 font-medium">Ngày nhận</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {payouts.map((p) => (
                        <tr key={p.id}>
                          <td className="py-3 text-[var(--foreground-secondary)]">
                            {formatDate(p.periodStart)} – {formatDate(p.periodEnd)}
                          </td>
                          <td className="py-3 font-semibold text-[var(--foreground)]">
                            {formatVND(p.totalAmount)}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              p.status === 'completed'
                                ? 'bg-[var(--success)]/10 text-[var(--success)]'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}>
                              {p.status === 'completed' ? 'Đã nhận' : 'Đang xử lý'}
                            </span>
                          </td>
                          <td className="py-3 text-[var(--foreground-secondary)]">
                            {formatDate(p.paidAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </>
        )}

        {/* ── Profile tab ──────────────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            <Card>
              <h2 className="font-semibold text-[var(--foreground)] mb-4">Thông tin tài khoản</h2>
              <dl className="space-y-3">
                {[
                  { label: 'Họ và tên',      value: affiliate.name },
                  { label: 'Email',           value: affiliate.email },
                  { label: 'Mã giới thiệu',  value: affiliate.refCode, mono: true, highlight: true },
                  { label: 'Ngày tham gia',  value: formatDate(affiliate.joinedAt) },
                  { label: 'Trạng thái',     value: affiliate.status === 'active' ? 'Hoạt động' : 'Tạm dừng',
                    badge: affiliate.status === 'active' ? 'success' : 'error' },
                ].map(({ label, value, mono, highlight, badge }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                    <dt className="text-sm text-[var(--foreground-muted)]">{label}</dt>
                    <dd className="text-sm font-medium text-right">
                      {badge ? (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          badge === 'success'
                            ? 'bg-[var(--success)]/10 text-[var(--success)]'
                            : 'bg-[var(--error)]/10 text-[var(--error)]'
                        }`}>
                          {value}
                        </span>
                      ) : (
                        <span className={`${mono ? 'font-mono' : ''} ${highlight ? 'text-[var(--primary)]' : 'text-[var(--foreground)]'}`}>
                          {value}
                        </span>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>

            <Card>
              <h2 className="font-semibold text-[var(--foreground)] mb-4">Thông tin ngân hàng</h2>
              {affiliate.payoutInfo ? (
                <dl className="space-y-3">
                  {[
                    { label: 'Ngân hàng',        value: affiliate.payoutInfo.bankName },
                    { label: 'Số tài khoản',      value: affiliate.payoutInfo.accountNumber, mono: true },
                    { label: 'Tên chủ tài khoản', value: affiliate.payoutInfo.accountHolder },
                  ].map(({ label, value, mono }) => (
                    <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                      <dt className="text-sm text-[var(--foreground-muted)]">{label}</dt>
                      <dd className={`text-sm font-medium text-[var(--foreground)] ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-[var(--foreground-muted)]">Chưa có thông tin ngân hàng</p>
              )}
              <p className="text-xs text-[var(--foreground-muted)] mt-4">
                Để cập nhật thông tin ngân hàng, vui lòng liên hệ{' '}
                <Link href="mailto:support@resumax.vn" className="hover:text-[var(--foreground)] transition-colors">
                  support@resumax.vn
                </Link>
              </p>
            </Card>
          </div>
        )}

        <p className="text-center text-xs text-[var(--foreground-muted)] mt-8">
          Vấn đề hoặc câu hỏi?{' '}
          <Link href="mailto:support@resumax.vn" className="hover:text-[var(--foreground)] transition-colors">
            Liên hệ hỗ trợ
          </Link>
        </p>
      </div>
    </div>
  );
}
