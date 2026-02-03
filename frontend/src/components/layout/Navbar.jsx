'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Search,
  Crown,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useDescope, useUser } from '@descope/nextjs-sdk/client';
import { useAuthStore } from '@/store/useAuthStore';
import Button from '@/components/ui/Button';

export default function Navbar() {
  const router = useRouter();
  const { logout: descopeLogout } = useDescope();
  const { user: descopeUser } = useUser();
  const { user, clearUser } = useAuthStore();

  // Use Descope user info as fallback
  const displayName = user?.name || descopeUser?.name || 'Người dùng';
  const displayEmail = user?.email || descopeUser?.email || '';
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const userMenuRef = useRef(null);
  const notificationRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await descopeLogout();
    clearUser();
    router.push('/');
  };

  const notifications = [
    { id: 1, text: 'CV của bạn đã được phân tích xong', time: '5 phút trước', read: false },
    { id: 2, text: 'Điểm ATS đã được cải thiện', time: '1 giờ trước', read: false },
    { id: 3, text: 'Chào mừng bạn đến với ResuMax VN!', time: '2 ngày trước', read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl text-[var(--foreground)] hidden sm:block">
            ResuMax VN
          </span>
        </Link>

        {/* Search Bar - Hidden on mobile */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
            <input
              type="text"
              placeholder="Tìm kiếm CV, mẫu, hoặc tính năng..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          {/* Upgrade Button */}
          {user?.plan === 'free' && (
            <Link href="/pricing" className="hidden sm:block">
              <Button variant="outline" size="sm" className="gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                Nâng cấp
              </Button>
            </Link>
          )}

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
            >
              <Bell className="w-5 h-5 text-[var(--foreground-secondary)]" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--error)] text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-[var(--background-elevated)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--foreground)]">Thông báo</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`px-4 py-3 hover:bg-[var(--background-secondary)] cursor-pointer border-b border-[var(--border)] last:border-b-0 ${
                        !notification.read ? 'bg-[var(--primary)] bg-opacity-5' : ''
                      }`}
                    >
                      <p className="text-sm text-[var(--foreground)]">{notification.text}</p>
                      <p className="text-xs text-[var(--foreground-muted)] mt-1">
                        {notification.time}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-[var(--border)]">
                  <Link
                    href="/notifications"
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-[var(--background-secondary)] transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-medium">
                {displayName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {displayName}
                </p>
                <p className="text-xs text-[var(--foreground-muted)]">
                  {user?.plan === 'premium'
                    ? 'Premium'
                    : user?.plan === 'pro'
                    ? 'Pro'
                    : 'Miễn phí'}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-[var(--foreground-muted)] hidden sm:block" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-[var(--background-elevated)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-[var(--border)]">
                  <p className="font-medium text-[var(--foreground)]">
                    {displayName}
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)]">{displayEmail}</p>
                </div>
                <div className="py-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="w-4 h-4" />
                    Hồ sơ cá nhân
                  </Link>
                  <Link
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Cài đặt
                  </Link>
                  {user?.plan === 'free' && (
                    <Link
                      href="/pricing"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)] sm:hidden"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Crown className="w-4 h-4 text-amber-500" />
                      Nâng cấp gói
                    </Link>
                  )}
                </div>
                <div className="border-t border-[var(--border)] py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--background-secondary)]"
                  >
                    <LogOut className="w-4 h-4" />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
