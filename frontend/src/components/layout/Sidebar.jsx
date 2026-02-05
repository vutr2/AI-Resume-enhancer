'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import {
  Upload,
  FileText,
  PenTool,
  Target,
  Shield,
  Mail,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Home,
  FolderOpen,
  CreditCard,
  Crown,
  Zap,
  Lock,
} from 'lucide-react';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const mainMenuItems = [
  {
    id: 'dashboard',
    label: 'Tổng quan',
    icon: Home,
    href: '/dashboard',
  },
  {
    id: 'resumes',
    label: 'CV của tôi',
    icon: FolderOpen,
    href: '/dashboard/resumes',
  },
];

const toolItems = [
  {
    id: 'upload',
    label: 'Tải lên CV',
    icon: Upload,
    tab: 'upload',
  },
  {
    id: 'review',
    label: 'Xem xét CV',
    icon: FileText,
    tab: 'review',
  },
  {
    id: 'rewrite',
    label: 'Viết lại CV',
    icon: PenTool,
    tab: 'rewrite',
    requiredFeature: 'rewriteCV',
    upgradeMsg: 'Vui lòng nâng cấp lên gói Basic để sử dụng tính năng Viết lại CV.',
  },
  {
    id: 'match',
    label: 'So khớp JD',
    icon: Target,
    tab: 'match',
    requiredFeature: 'matchJob',
    upgradeMsg: 'Vui lòng nâng cấp lên gói Pro để sử dụng tính năng So khớp JD.',
  },
  {
    id: 'ats',
    label: 'Kiểm tra ATS',
    icon: Shield,
    tab: 'ats',
  },
  {
    id: 'cover',
    label: 'Thư ứng tuyển',
    icon: Mail,
    tab: 'cover',
    requiredFeature: 'coverLetter',
    upgradeMsg: 'Vui lòng nâng cấp lên gói Pro để sử dụng tính năng Thư ứng tuyển.',
  },
];

const bottomItems = [
  {
    id: 'subscription',
    label: 'Gói dịch vụ',
    icon: CreditCard,
    href: '/pricing',
  },
  {
    id: 'help',
    label: 'Trợ giúp',
    icon: HelpCircle,
    href: '/help',
  },
];

export default function Sidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }) {
  const pathname = usePathname();
  const { currentResume } = useResumeStore();
  const { user } = useAuthStore();

  const isTabDisabled = (tab) => {
    if (tab === 'upload') return false;
    return !currentResume;
  };

  return (
    <aside
      className={clsx(
        'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-[var(--background)] border-r border-[var(--border)] transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Toggle Button */}
        <button
          onClick={onToggleCollapse}
          className="absolute -right-3 top-6 w-6 h-6 bg-[var(--background-elevated)] border border-[var(--border)] rounded-full flex items-center justify-center hover:bg-[var(--background-secondary)] transition-colors shadow-sm"
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3 text-[var(--foreground-muted)]" />
          ) : (
            <ChevronLeft className="w-3 h-3 text-[var(--foreground-muted)]" />
          )}
        </button>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {/* Main Menu */}
          <div className="px-3 mb-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Menu
              </p>
            )}
            <ul className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-[var(--primary)] text-white'
                          : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Tools */}
          <div className="px-3 mb-6">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Công cụ
              </p>
            )}
            <ul className="space-y-1">
              {toolItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.tab;
                const isDisabled = isTabDisabled(item.tab);
                const isLocked = item.requiredFeature && !user?.features?.[item.requiredFeature];

                const handleClick = () => {
                  if (isDisabled) return;
                  if (isLocked) {
                    toast(item.upgradeMsg, {
                      icon: '🔒',
                      duration: 3000,
                    });
                    return;
                  }
                  onTabChange(item.tab);
                };

                return (
                  <li key={item.id}>
                    <button
                      onClick={handleClick}
                      disabled={isDisabled}
                      className={clsx(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive && !isLocked
                          ? 'bg-[var(--primary)] text-white'
                          : isDisabled
                          ? 'text-[var(--foreground-muted)] cursor-not-allowed opacity-50'
                          : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                      {!collapsed && isLocked && (
                        <Lock className="w-3.5 h-3.5 ml-auto text-[var(--foreground-muted)]" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Divider */}
          <div className="mx-3 mb-6 border-t border-[var(--border)]" />

          {/* Bottom Items */}
          <div className="px-3">
            {!collapsed && (
              <p className="px-3 mb-2 text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider">
                Khác
              </p>
            )}
            <ul className="space-y-1">
              {bottomItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                        isActive
                          ? 'bg-[var(--primary)] text-white'
                          : 'text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <span className="text-sm font-medium">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* Current Resume Info */}
        {!collapsed && currentResume && (
          <div className="p-4 border-t border-[var(--border)]">
            <div className="p-3 bg-[var(--background-secondary)] rounded-lg">
              <p className="text-xs text-[var(--foreground-muted)] mb-1">CV đang làm việc</p>
              <p className="text-sm font-medium text-[var(--foreground)] truncate">
                {currentResume.parsedData?.personalInfo?.name || 'CV chưa đặt tên'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--primary)] rounded-full"
                    style={{ width: `${currentResume.scores?.atsScore || 0}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--foreground-muted)]">
                  {currentResume.scores?.atsScore || 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Credits Display */}
        {!collapsed && user && (
          <div className="p-4 border-t border-[var(--border)]">
            <div className="p-3 bg-[var(--background-secondary)] rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    Lượt sử dụng
                  </span>
                </div>
                {user.isUnlimited || user.creditsRemaining === -1 ? (
                  <span className="text-xs font-semibold text-emerald-500">Không giới hạn</span>
                ) : (
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    {user.creditsRemaining ?? 0}/{user.maxCredits ?? 5}
                  </span>
                )}
              </div>
              {!user.isUnlimited && user.creditsRemaining !== -1 && (
                <>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'h-full rounded-full transition-all',
                        (user.creditsRemaining ?? 0) > 3
                          ? 'bg-emerald-500'
                          : (user.creditsRemaining ?? 0) > 1
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      )}
                      style={{
                        width: `${
                          ((user.creditsRemaining ?? 0) /
                            (user.maxCredits ?? 5)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                    Gói {user.plan === 'basic' ? 'Basic' : user.plan === 'pro' ? 'Pro' : 'Miễn phí'}: {user.maxCredits ?? 5} lượt/tháng
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Upgrade Button */}
        {user?.plan === 'free' && (
          <div className={clsx('p-4 border-t border-[var(--border)]', collapsed && 'p-2')}>
            <Link
              href="/pricing"
              className={clsx(
                'flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? 'Nâng cấp Premium' : undefined}
            >
              <Crown className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div>
                  <p className="text-sm font-semibold">Nâng cấp Premium</p>
                  <p className="text-xs opacity-90">Mở khóa tất cả tính năng</p>
                </div>
              )}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
