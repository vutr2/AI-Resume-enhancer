'use client';

import { X, Zap, Crown, Check } from 'lucide-react';
import Link from 'next/link';

export default function OutOfCreditsModal({ isOpen, onClose, isFirstMonth }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--background)] rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-white text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>

          <h2 className="text-2xl font-bold mb-2">
            {isFirstMonth ? 'Hết 10 lượt miễn phí!' : 'Hết lượt sử dụng!'}
          </h2>
          <p className="text-white/90">
            {isFirstMonth
              ? 'Bạn đã sử dụng hết 10 lượt miễn phí trong tháng đầu tiên.'
              : 'Bạn đã sử dụng hết 3 lượt miễn phí trong tháng này.'}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-[var(--foreground-secondary)] text-center mb-6">
            Nâng cấp lên Premium để tiếp tục sử dụng không giới hạn!
          </p>

          {/* Features */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-sm text-[var(--foreground)]">
                Phân tích CV không giới hạn
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-sm text-[var(--foreground)]">
                Viết thư ứng tuyển không giới hạn
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-sm text-[var(--foreground)]">
                So khớp JD và gợi ý cải thiện
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-3 h-3 text-emerald-600" />
              </div>
              <span className="text-sm text-[var(--foreground)]">
                Hỗ trợ ưu tiên 24/7
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Link
              href="/pricing"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              onClick={onClose}
            >
              <Crown className="w-5 h-5" />
              Nâng cấp Premium
            </Link>
            <button
              onClick={onClose}
              className="w-full py-3 text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
            >
              Để sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
