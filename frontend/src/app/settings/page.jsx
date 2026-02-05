'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  CreditCard,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const settingsSections = [
  {
    id: 'account',
    icon: User,
    title: 'Tài khoản',
    description: 'Thông tin cá nhân và bảo mật',
  },
  {
    id: 'subscription',
    icon: CreditCard,
    title: 'Gói dịch vụ',
    description: 'Quản lý gói và thanh toán',
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const [activeSection, setActiveSection] = useState('account');

  // Account settings
  const [accountData, setAccountData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Payment history
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeSection === 'subscription') {
      setLoadingHistory(true);
      api.getPaymentHistory()
        .then((res) => {
          if (res.success) {
            setPaymentHistory(res.data.payments || []);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingHistory(false));
    }
  }, [activeSection]);

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAccount = async () => {
    try {
      await updateProfile({
        name: accountData.name,
      });
      toast.success('Thông tin đã được cập nhật');
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleChangePassword = async () => {
    if (accountData.newPassword !== accountData.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp');
      return;
    }
    toast.success('Mật khẩu đã được thay đổi');
    setAccountData((prev) => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await api.request('/auth/delete-account', { method: 'DELETE' });
      if (res.success) {
        toast.success('Tài khoản đã được xóa');
        await logout();
        router.push('/');
      } else {
        toast.error(res.message || 'Xóa tài khoản thất bại');
      }
    } catch (error) {
      toast.error('Lỗi hệ thống');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Thông tin cá nhân
              </h3>
              <div className="space-y-4">
                <Input
                  label="Họ và tên"
                  name="name"
                  value={accountData.name}
                  onChange={handleAccountChange}
                  placeholder="Nguyễn Văn A"
                />
                <Input
                  label="Email"
                  name="email"
                  value={accountData.email}
                  onChange={handleAccountChange}
                  disabled
                  placeholder="email@example.com"
                />
                <Button onClick={handleSaveAccount} loading={isLoading}>
                  Lưu thay đổi
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Đổi mật khẩu
              </h3>
              <div className="space-y-4">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  name="currentPassword"
                  value={accountData.currentPassword}
                  onChange={handleAccountChange}
                />
                <Input
                  label="Mật khẩu mới"
                  type="password"
                  name="newPassword"
                  value={accountData.newPassword}
                  onChange={handleAccountChange}
                />
                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  name="confirmPassword"
                  value={accountData.confirmPassword}
                  onChange={handleAccountChange}
                />
                <Button variant="outline" onClick={handleChangePassword}>
                  Đổi mật khẩu
                </Button>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--border)]">
              <h3 className="text-lg font-semibold text-[var(--error)] mb-4">
                Vùng nguy hiểm
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-[var(--error)] border-opacity-30 rounded-lg">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Đăng xuất
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Đăng xuất khỏi tất cả thiết bị
                    </p>
                  </div>
                  <Button variant="ghost" onClick={handleLogout}>
                    Đăng xuất
                  </Button>
                </div>
                <div className="flex items-center justify-between p-4 border border-[var(--error)] border-opacity-30 rounded-lg">
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      Xóa tài khoản
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      Xóa vĩnh viễn tài khoản và toàn bộ dữ liệu
                    </p>
                  </div>
                  {!showDeleteConfirm ? (
                    <Button
                      variant="ghost"
                      className="text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-10"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      Xóa tài khoản
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        onClick={() => setShowDeleteConfirm(false)}
                      >
                        Hủy
                      </Button>
                      <Button
                        variant="ghost"
                        className="text-white bg-[var(--error)] hover:opacity-90"
                        onClick={handleDeleteAccount}
                        loading={deleting}
                      >
                        Xác nhận xóa
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'subscription':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Gói dịch vụ hiện tại
            </h3>
            <Card className="border-[var(--primary)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-[var(--foreground)]">
                    {user?.plan === 'basic'
                      ? 'Basic'
                      : user?.plan === 'pro'
                      ? 'Pro'
                      : user?.plan === 'enterprise'
                      ? 'Enterprise'
                      : 'Miễn phí'}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {user?.plan === 'basic'
                      ? '10 CV mỗi tháng'
                      : user?.plan === 'pro' || user?.plan === 'enterprise'
                      ? 'Không giới hạn'
                      : '3 CV mỗi tháng'}
                  </p>
                </div>
                <Link href="/pricing">
                  <Button variant="outline">Nâng cấp</Button>
                </Link>
              </div>
            </Card>

            <div>
              <h4 className="font-medium text-[var(--foreground)] mb-3">
                Lịch sử thanh toán
              </h4>
              <div className="space-y-2">
                {loadingHistory ? (
                  <p className="text-sm text-[var(--foreground-muted)]">Đang tải...</p>
                ) : paymentHistory.length === 0 ? (
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Chưa có giao dịch nào
                  </p>
                ) : (
                  paymentHistory.map((payment) => (
                    <Card key={payment._id} className="!p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            Gói {payment.plan === 'basic' ? 'Basic' : payment.plan === 'pro' ? 'Pro' : 'Enterprise'}
                            {' - '}
                            {payment.billingPeriod === 'yearly' ? '12 tháng' : '1 tháng'}
                          </p>
                          <p className="text-xs text-[var(--foreground-muted)]">
                            {new Date(payment.createdAt).toLocaleDateString('vi-VN')}
                            {' | '}
                            {payment.paymentMethod === 'vnpay' ? 'VNPay' : payment.paymentMethod === 'zalopay' ? 'ZaloPay' : payment.paymentMethod}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-[var(--foreground)]">
                            {payment.amount?.toLocaleString('vi-VN')}đ
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            payment.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {payment.status === 'completed' ? 'Thành công' : payment.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[var(--foreground)]">
                Cài đặt
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-[var(--primary)] bg-opacity-10 text-[var(--primary)]'
                        : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-left">
                      <p className="font-medium">{section.title}</p>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <Card>{renderContent()}</Card>
          </div>
        </div>
      </main>
    </div>
  );
}
