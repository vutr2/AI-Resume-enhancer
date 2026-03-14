'use client';

import { X, Zap, Target, CheckCircle, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UpgradeModal({ isOpen, onClose, featureName }) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f1a2e 0%, #1a1a2e 50%, #16213e 100%)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-pink-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Nâng cấp lên Pro</h2>
              <p className="text-sm text-gray-400">Mở khóa toàn bộ tính năng AI</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Potential score */}
        <div className="mx-5 mt-5 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-400">Tiềm năng điểm ResuMax</p>
                <p className="text-2xl font-bold text-emerald-400">Lên đến 90+</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Sau khi áp dụng AI</p>
              <p className="text-xs text-gray-500">Kết quả khác nhau mỗi CV</p>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-3 gap-3 mx-5 mt-4">
          <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/20">
            <Zap className="w-4 h-4 text-pink-400 mb-2" />
            <p className="text-xs font-semibold text-white">Viết lại CV</p>
            <p className="text-xs text-gray-400 mt-1">AI viết lại toàn bộ CV chuẩn ATS</p>
          </div>
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <Target className="w-4 h-4 text-blue-400 mb-2" />
            <p className="text-xs font-semibold text-white">So khớp JD</p>
            <p className="text-xs text-gray-400 mt-1">Phân tích và khớp với mô tả việc làm</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="w-4 h-4 text-emerald-400 mb-2" />
            <p className="text-xs font-semibold text-white">Thư ứng tuyển</p>
            <p className="text-xs text-gray-400 mt-1">Tạo cover letter cá nhân hóa</p>
          </div>
        </div>

        {/* What you unlock */}
        <div className="mx-5 mt-4 p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">Bạn sẽ được mở khóa</span>
          </div>
          <ul className="space-y-1.5 text-sm text-gray-300">
            <li>• AI không giới hạn lượt sử dụng</li>
            <li>• CV không giới hạn số lượng</li>
            <li>• Phân tích ATS chi tiết</li>
            <li>• So khớp mô tả công việc</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="p-5 flex flex-col gap-3">
          <button
            onClick={() => { onClose(); router.push('/payment?plan=pro&cycle=monthly'); }}
            className="w-full py-3 rounded-xl font-bold text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #ec4899, #8b5cf6)' }}
          >
            Nâng cấp Pro — 99.000đ/tháng
          </button>
          <p className="text-center text-xs text-gray-500">
            Bạn đang rất gần một CV hoàn hảo
          </p>
        </div>
      </div>
    </div>
  );
}
