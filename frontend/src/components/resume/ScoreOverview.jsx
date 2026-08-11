'use client';

import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import { Lock, ChevronRight } from 'lucide-react';
import { useDashboard } from '@/contexts/DashboardContext';

const SCORE_LABEL = (s) => {
  if (s >= 80) return { text: 'Xuất sắc', color: '#22c55e' };
  if (s >= 60) return { text: 'Tốt', color: '#f59e0b' };
  if (s >= 40) return { text: 'Cần cải thiện', color: '#f97316' };
  return { text: 'Yếu', color: '#ef4444' };
};

const CATEGORIES = [
  { key: 'contentScore',     label: 'Nội dung'         },
  { key: 'atsScore',         label: 'ATS & cấu trúc'   },
  { key: 'keywordScore',     label: 'Từ khóa'           },
  { key: 'formatScore',      label: 'Định dạng'         },
  { key: 'readabilityScore', label: 'Dễ đọc'            },
  { key: 'fdiScore',         label: 'FDI Ready'         },
];

function ScoreRing({ score }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const { text, color } = SCORE_LABEL(score);
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={circ - (score / 100) * circ}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--foreground)]">{score}</span>
          <span className="text-xs text-[var(--foreground-muted)]">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{text}</span>
    </div>
  );
}

function CategoryBar({ label, score }) {
  const { color } = SCORE_LABEL(score);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--foreground-secondary)] w-28 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-[var(--foreground)] w-10 text-right">
        {score}
      </span>
    </div>
  );
}

function CategoryRowLocked({ label, score }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0">
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{score}</span>
        <Lock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
      </div>
    </div>
  );
}

export default function ScoreOverview({ scores, resumeId }) {
  const { hasFullAccess } = useAuthStore();
  const { analysis } = useResumeStore();
  const { setActiveTab } = useDashboard();

  const overall = scores?.overall ? Number(scores.overall) : 0;
  const unlocked = hasFullAccess(resumeId);
  const topFixCount = analysis?.topFixes?.length || 0;

  if (!scores || overall === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-8 text-center h-full flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Chưa có điểm đánh giá</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] overflow-y-auto h-full">
      {/* Score ring */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-[var(--border)]">
        <ScoreRing score={overall} />
        {topFixCount > 0 && !unlocked && (
          <p className="mt-3 text-xs text-center text-[var(--foreground-secondary)] max-w-[200px]">
            Tìm thấy <strong className="text-[var(--foreground)]">{topFixCount} lỗi</strong> cần sửa.
            Xem chi tiết tại tab ATS.
          </p>
        )}
      </div>

      {/* Categories */}
      <div className="px-5 py-4">
        <p className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase mb-4">
          Chi tiết từng tiêu chí
        </p>

        {unlocked ? (
          <div className="space-y-3">
            {CATEGORIES.map((c) => (
              <CategoryBar key={c.key} label={c.label} score={scores[c.key] || 0} />
            ))}
          </div>
        ) : (
          <div className="-mx-1">
            {CATEGORIES.map((c) => (
              <CategoryRowLocked key={c.key} label={c.label} score={scores[c.key] || 0} />
            ))}
          </div>
        )}
      </div>

      {/* CTA to ATS tab */}
      <div className="px-5 pb-5">
        <button
          onClick={() => setActiveTab('ats')}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold
            bg-[var(--primary)] text-white hover:opacity-90 transition-opacity"
        >
          {unlocked ? 'Xem phân tích ATS đầy đủ' : `Mở khóa ${topFixCount > 0 ? topFixCount + ' lỗi' : 'chi tiết'}`}
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
