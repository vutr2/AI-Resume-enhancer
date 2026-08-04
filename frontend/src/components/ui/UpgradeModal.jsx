'use client';

import { useState } from 'react';
import { X, Zap, Target, CheckCircle, Lock, Loader2, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';

export default function UpgradeModal({ isOpen, onClose, cvId }) {
  const router = useRouter();
  const { getPaidCredits, loadUserProfile } = useAuthStore();
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState('');

  if (!isOpen) return null;

  const paidCredits = getPaidCredits();
  const canUnlock = cvId && paidCredits > 0;

  const handleUnlock = async () => {
    if (!cvId) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      await api.unlockCv(cvId);
      await loadUserProfile();
      onClose();
    } catch (err) {
      setUnlockError(err.message || 'Mở khoá thất bại, thử lại sau.');
    } finally {
      setUnlocking(false);
    }
  };

  const goToPricing = (pkg) => {
    onClose();
    router.push(pkg ? `/pricing#${pkg}` : '/pricing');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1a1a2e 50%, #16213e 100%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {canUnlock ? 'Mở khoá tính năng AI' : 'Nâng cấp để dùng AI'}
              </h2>
              <p className="text-sm text-gray-400">
                {canUnlock
                  ? `Bạn còn ${paidCredits} lượt mở khoá`
                  : 'Chọn gói phù hợp với bạn'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feature preview */}
        <div className="grid grid-cols-3 gap-3 mx-5 mt-5">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <Zap className="w-4 h-4 text-pink-400 mb-2" />
            <p className="text-xs font-semibold text-white">Viết lại CV</p>
            <p className="text-xs text-gray-400 mt-1">AI chuẩn ATS</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Target className="w-4 h-4 text-blue-400 mb-2" />
            <p className="text-xs font-semibold text-white">So khớp JD</p>
            <p className="text-xs text-gray-400 mt-1">Phân tích điểm khớp</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-white">Cover letter</p>
            <p className="text-xs text-gray-400 mt-1">Cá nhân hóa</p>
          </div>
        </div>

        {/* Primary action: unlock with credit */}
        {canUnlock && (
          <div className="mx-5 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-sm text-gray-300 mb-3">
              Mở khoá CV này để dùng toàn bộ tính năng AI (vĩnh viễn):
            </p>
            {unlockError && (
              <p className="text-xs text-red-400 mb-2">{unlockError}</p>
            )}
            <button
              onClick={handleUnlock}
              disabled={unlocking}
              className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              {unlocking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Key className="w-4 h-4" />
              )}
              {unlocking ? 'Đang mở khoá...' : `Mở khoá CV này — dùng 1 lượt (còn ${paidCredits})`}
            </button>
          </div>
        )}

        {/* Pricing options */}
        <div className="mx-5 mt-4 space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wider">
            {canUnlock ? 'Hoặc mua thêm lượt' : 'Chọn gói'}
          </p>

          <button
            onClick={() => goToPricing('week_pass')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">Pass 7 ngày</p>
              <p className="text-xs text-gray-400">Dùng không giới hạn mọi CV trong 7 ngày</p>
            </div>
            <span className="text-sm font-bold text-amber-400 whitespace-nowrap ml-3">99.000đ</span>
          </button>

          <button
            onClick={() => goToPricing('credit_3')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">
                3 lượt mở khoá
                <span className="ml-2 text-xs text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded-full">Phổ biến</span>
              </p>
              <p className="text-xs text-gray-400">Mỗi lượt mở khoá 1 CV vĩnh viễn</p>
            </div>
            <span className="text-sm font-bold text-blue-300 whitespace-nowrap ml-3">25.000đ</span>
          </button>

          <button
            onClick={() => goToPricing('credit_1')}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">1 lượt mở khoá</p>
              <p className="text-xs text-gray-400">Mở khoá 1 CV duy nhất</p>
            </div>
            <span className="text-sm font-bold text-gray-300 whitespace-nowrap ml-3">10.000đ</span>
          </button>
        </div>

        <div className="p-5">
          <p className="text-center text-xs text-gray-500">Bạn đang rất gần một CV hoàn hảo</p>
        </div>
      </div>
    </div>
  );
}
