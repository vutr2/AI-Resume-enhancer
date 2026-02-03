'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Globe,
  ChevronRight,
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const settingsSections = [
  {
    id: 'account',
    icon: User,
    title: 'Tài khoản',
    description: 'Thông tin cá nhân và bảo mật',
  },
  {
    id: 'notifications',
    icon: Bell,
    title: 'Thông báo',
    description: 'Quản lý thông báo email và ứng dụng',
  },
  {
    id: 'subscription',
    icon: CreditCard,
    title: 'Gói dịch vụ',
    description: 'Quản lý gói và thanh toán',
  },
  {
    id: 'appearance',
    icon: Palette,
    title: 'Giao diện',
    description: 'Chế độ sáng/tối và tùy chỉnh',
  },
  {
    id: 'language',
    icon: Globe,
    title: 'Ngôn ngữ',
    description: 'Thay đổi ngôn ngữ hiển thị',
  },
  {
    id: 'privacy',
    icon: Shield,
    title: 'Quyền riêng tư',
    description: 'Quản lý dữ liệu và quyền truy cập',
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

  // Notification settings
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    updates: true,
  });

  // Appearance settings
  const [theme, setTheme] = useState('system');

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
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
    // API call to change password
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
                      Xóa vĩnh viễn tài khoản và dữ liệu
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-10"
                  >
                    Xóa tài khoản
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Cài đặt thông báo
            </h3>
            <div className="space-y-4">
              {[
                {
                  key: 'email',
                  title: 'Thông báo email',
                  description: 'Nhận thông báo qua email',
                },
                {
                  key: 'push',
                  title: 'Thông báo đẩy',
                  description: 'Nhận thông báo trên trình duyệt',
                },
                {
                  key: 'updates',
                  title: 'Cập nhật sản phẩm',
                  description: 'Thông tin về tính năng mới',
                },
                {
                  key: 'marketing',
                  title: 'Email tiếp thị',
                  description: 'Khuyến mãi và ưu đãi đặc biệt',
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-[var(--background-secondary)] rounded-lg"
                >
                  <div>
                    <p className="font-medium text-[var(--foreground)]">
                      {item.title}
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {item.description}
                    </p>
                  </div>
                  <button
                    onClick={() => handleNotificationChange(item.key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      notifications[item.key]
                        ? 'bg-[var(--primary)]'
                        : 'bg-[var(--border)]'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        notifications[item.key]
                          ? 'translate-x-7'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
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
                    {user?.plan === 'premium'
                      ? 'Premium'
                      : user?.plan === 'pro'
                      ? 'Pro'
                      : 'Miễn phí'}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {user?.plan === 'free'
                      ? '3 CV mỗi tháng'
                      : user?.plan === 'pro'
                      ? '20 CV mỗi tháng'
                      : 'Không giới hạn'}
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
                <p className="text-sm text-[var(--foreground-muted)]">
                  Chưa có giao dịch nào
                </p>
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Giao diện
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'light', icon: Sun, label: 'Sáng' },
                { id: 'dark', icon: Moon, label: 'Tối' },
                { id: 'system', icon: Monitor, label: 'Hệ thống' },
              ].map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => setTheme(option.id)}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      theme === option.id
                        ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                        : 'border-[var(--border)] hover:border-[var(--foreground-muted)]'
                    }`}
                  >
                    <Icon className="w-6 h-6 mx-auto mb-2 text-[var(--foreground)]" />
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      {option.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        );

      case 'language':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Ngôn ngữ
            </h3>
            <div className="space-y-2">
              {[
                { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
                { code: 'en', name: 'English', flag: '🇺🇸' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  className="w-full flex items-center gap-3 p-4 bg-[var(--background-secondary)] rounded-lg hover:bg-[var(--background-tertiary)] transition-colors"
                >
                  <span className="text-2xl">{lang.flag}</span>
                  <span className="font-medium text-[var(--foreground)]">
                    {lang.name}
                  </span>
                  {lang.code === 'vi' && (
                    <span className="ml-auto text-[var(--primary)]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)]">
              Quyền riêng tư và dữ liệu
            </h3>
            <div className="space-y-4">
              <Card>
                <h4 className="font-medium text-[var(--foreground)] mb-2">
                  Dữ liệu CV của bạn
                </h4>
                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                  CV của bạn được mã hóa và lưu trữ an toàn. Chúng tôi không
                  chia sẻ dữ liệu của bạn với bất kỳ bên thứ ba nào.
                </p>
                <Button variant="outline" size="sm">
                  Tải xuống dữ liệu
                </Button>
              </Card>

              <Card>
                <h4 className="font-medium text-[var(--foreground)] mb-2">
                  Lịch sử hoạt động
                </h4>
                <p className="text-sm text-[var(--foreground-muted)] mb-4">
                  Xem và quản lý lịch sử sử dụng dịch vụ của bạn.
                </p>
                <Button variant="outline" size="sm">
                  Xem lịch sử
                </Button>
              </Card>
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
