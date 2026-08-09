'use client';

import { useState } from 'react';
import { Lock, Loader2, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

// children  = real tool content (rendered when unlocked)
// placeholder = static preview rendered blurred when locked
export default function LockedTabOverlay({ cvId, featureName, placeholder, children }) {
  const router = useRouter();
  const { hasFullAccess, getPaidCredits, loadUserProfile } = useAuthStore();
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');

  // Unlocked — render real content, no overhead
  if (hasFullAccess(cvId)) {
    return children;
  }

  const paidCredits = getPaidCredits();

  const handleUnlock = async () => {
    if (!cvId || unlocking) return;
    setUnlocking(true);
    setError('');
    try {
      await api.unlockCv(cvId);
      await loadUserProfile();
      // hasFullAccess will now be true → re-render shows real content
    } catch (err) {
      setError(err.message || 'Mở khoá thất bại, thử lại sau.');
      setUnlocking(false);
    }
  };

  return (
    <div className="relative" style={{ minHeight: 480 }}>
      {/* Blurred placeholder */}
      <div className="pointer-events-none select-none" style={{ filter: 'blur(5px)', opacity: 0.55 }}>
        {placeholder}
      </div>

      {/* Gradient + CTA overlay */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          background: 'linear-gradient(to bottom, transparent 0%, var(--background) 42%)',
        }}
      >
        <div className="flex flex-col items-center gap-5 px-6 text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-[var(--background-secondary)] border border-[var(--border)] flex items-center justify-center shadow-lg">
            <Lock className="w-6 h-6 text-[var(--foreground-muted)]" />
          </div>

          <div>
            <h3 className="text-lg font-bold text-[var(--foreground)] mb-1">
              Mở khoá {featureName}
            </h3>
            <p className="text-sm text-[var(--foreground-secondary)]">
              {paidCredits > 0
                ? `Bạn có ${paidCredits} lượt — dùng 1 lượt để mở khoá CV này vĩnh viễn.`
                : 'Mua lượt mở khoá hoặc Pass 7 ngày để dùng toàn bộ tính năng AI.'}
            </p>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {paidCredits > 0 ? (
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm w-full justify-center transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {unlocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              {unlocking ? 'Đang mở khoá...' : `Mở khoá CV này — dùng 1 lượt (còn ${paidCredits})`}
            </button>
          ) : (
            <button
              onClick={() => router.push('/pricing')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm w-full justify-center"
              style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
            >
              Xem gói mua lượt
            </button>
          )}

          {paidCredits > 0 && (
            <button
              onClick={() => router.push('/pricing')}
              className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              Hoặc mua Pass 7 ngày — 99.000đ (không giới hạn)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
