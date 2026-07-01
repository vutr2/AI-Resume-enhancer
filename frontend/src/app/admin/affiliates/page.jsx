'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@descope/nextjs-sdk/client';
import { CheckSquare, DollarSign, Users, TrendingUp } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';

function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN');
}

export default function AdminAffiliatesPage() {
  const router = useRouter();
  const { isAuthenticated, isSessionLoading } = useSession();

  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCommissions, setSelectedCommissions] = useState([]);
  const [payoutForm, setPayoutForm] = useState({ affiliateId: '', periodStart: '', periodEnd: '', note: '' });
  const [payoutLoading, setPayoutLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/affiliates');
      if (res.status === 403) { router.push('/dashboard'); return; }
      const json = await res.json();
      if (json.success) setData(json.data);
      else toast.error(json.message);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setIsLoading(false); }
  }, [router]);

  useEffect(() => {
    if (!isSessionLoading && !isAuthenticated) { router.push('/login'); return; }
    if (!isSessionLoading && isAuthenticated) fetchData();
  }, [isAuthenticated, isSessionLoading, router, fetchData]);

  const toggleCommission = (id) => {
    setSelectedCommissions((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleApprove = async () => {
    if (selectedCommissions.length === 0) return;
    try {
      const res = await fetch('/api/admin/commissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionIds: selectedCommissions }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Đã duyệt ${json.data.modifiedCount} commission`);
        setSelectedCommissions([]);
        fetchData();
      } else toast.error(json.message);
    } catch { toast.error('Lỗi kết nối'); }
  };

  const handleCreatePayout = async (e) => {
    e.preventDefault();
    setPayoutLoading(true);
    try {
      const res = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', ...payoutForm }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Tạo payout thành công: ${formatVND(json.data.totalAmount)}`);
        setPayoutForm({ affiliateId: '', periodStart: '', periodEnd: '', note: '' });
        fetchData();
      } else toast.error(json.message);
    } catch { toast.error('Lỗi kết nối'); }
    finally { setPayoutLoading(false); }
  };

  const handleMarkPaid = async (payoutId) => {
    try {
      const res = await fetch('/api/admin/payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid', payoutId }),
      });
      const json = await res.json();
      if (json.success) { toast.success('Đã đánh dấu đã trả'); fetchData(); }
      else toast.error(json.message);
    } catch { toast.error('Lỗi kết nối'); }
  };

  if (isSessionLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]" />
      </div>
    );
  }

  if (!data) return null;

  const { affiliates, pendingCommissions } = data;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Quản lý Affiliate</h1>
          <p className="text-[var(--foreground-muted)] text-sm mt-1">Trang quản trị hệ thống affiliate marketing</p>
        </div>

        {/* Affiliate list */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-[var(--primary)]" />
            <h2 className="font-semibold text-[var(--foreground)]">Danh sách Affiliate ({affiliates.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--foreground-muted)] border-b border-[var(--border)]">
                  <th className="pb-2 font-medium">Tên / Email</th>
                  <th className="pb-2 font-medium">Mã ref</th>
                  <th className="pb-2 font-medium">Đăng ký</th>
                  <th className="pb-2 font-medium">Converted</th>
                  <th className="pb-2 font-medium">Doanh thu</th>
                  <th className="pb-2 font-medium">Hoa hồng chờ</th>
                  <th className="pb-2 font-medium">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {affiliates.map((a) => (
                  <tr key={a.id}>
                    <td className="py-3">
                      <p className="font-medium text-[var(--foreground)]">{a.name}</p>
                      <p className="text-xs text-[var(--foreground-muted)]">{a.email}</p>
                    </td>
                    <td className="py-3 font-mono text-[var(--primary)]">{a.refCode}</td>
                    <td className="py-3 text-[var(--foreground-secondary)]">{a.stats.signedUp}</td>
                    <td className="py-3 text-[var(--foreground-secondary)]">{a.stats.converted}</td>
                    <td className="py-3 text-[var(--foreground-secondary)]">{formatVND(a.stats.totalRevenue)}</td>
                    <td className="py-3 font-medium text-amber-500">{formatVND(a.stats.pendingAmount)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'active'
                          ? 'bg-[var(--success)]/10 text-[var(--success)]'
                          : 'bg-[var(--error)]/10 text-[var(--error)]'
                      }`}>
                        {a.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[var(--foreground-muted)]">
                      Chưa có affiliate nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Pending commissions */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-[var(--foreground)]">
                Commission chờ duyệt ({pendingCommissions.length})
              </h2>
            </div>
            {selectedCommissions.length > 0 && (
              <Button onClick={handleApprove} size="sm" variant="success" className="gap-2">
                <CheckSquare className="w-4 h-4" />
                Duyệt {selectedCommissions.length} commission
              </Button>
            )}
          </div>
          {pendingCommissions.length === 0 ? (
            <p className="text-sm text-[var(--foreground-muted)] text-center py-6">Không có commission nào chờ duyệt</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[var(--foreground-muted)] border-b border-[var(--border)]">
                    <th className="pb-2"><input type="checkbox" onChange={(e) => {
                      if (e.target.checked) setSelectedCommissions(pendingCommissions.map((c) => c.id));
                      else setSelectedCommissions([]);
                    }} /></th>
                    <th className="pb-2 font-medium">Order ID</th>
                    <th className="pb-2 font-medium">Affiliate</th>
                    <th className="pb-2 font-medium">Doanh thu</th>
                    <th className="pb-2 font-medium">Hoa hồng (50%)</th>
                    <th className="pb-2 font-medium">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {pendingCommissions.map((c) => {
                    const aff = affiliates.find((a) => a.id === c.affiliateId);
                    return (
                      <tr key={c.id}>
                        <td className="py-3">
                          <input
                            type="checkbox"
                            checked={selectedCommissions.includes(c.id)}
                            onChange={() => toggleCommission(c.id)}
                          />
                        </td>
                        <td className="py-3 font-mono text-xs text-[var(--foreground-secondary)]">{c.orderId}</td>
                        <td className="py-3 text-[var(--foreground)]">{aff?.name || c.affiliateId}</td>
                        <td className="py-3 text-[var(--foreground-secondary)]">{formatVND(c.grossAmount)}</td>
                        <td className="py-3 font-semibold text-[var(--success)]">{formatVND(c.commissionAmount)}</td>
                        <td className="py-3 text-[var(--foreground-secondary)]">{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Create payout */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-[var(--success)]" />
            <h2 className="font-semibold text-[var(--foreground)]">Tạo đợt chi trả</h2>
          </div>
          <form onSubmit={handleCreatePayout} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Affiliate *</label>
              <select
                value={payoutForm.affiliateId}
                onChange={(e) => setPayoutForm((p) => ({ ...p, affiliateId: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="">Chọn affiliate</option>
                {affiliates.map((a) => (
                  <option key={a.id} value={a.id}>{a.name} ({a.refCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Ghi chú</label>
              <input
                value={payoutForm.note}
                onChange={(e) => setPayoutForm((p) => ({ ...p, note: e.target.value }))}
                placeholder="Đợt chi trả tháng 7..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Từ ngày *</label>
              <input
                type="date"
                value={payoutForm.periodStart}
                onChange={(e) => setPayoutForm((p) => ({ ...p, periodStart: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--foreground-secondary)] mb-1">Đến ngày *</label>
              <input
                type="date"
                value={payoutForm.periodEnd}
                onChange={(e) => setPayoutForm((p) => ({ ...p, periodEnd: e.target.value }))}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--foreground)] text-sm focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" loading={payoutLoading} className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Tạo payout (gộp tất cả commission approved)
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
