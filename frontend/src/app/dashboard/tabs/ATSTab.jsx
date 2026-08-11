'use client';

import { useEffect } from 'react';
import { Shield, RotateCcw, ChevronRight, CheckCircle, Lock, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useResumeStore } from '@/store/useResumeStore';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const SCORE_LABEL = (s) => {
  if (s >= 80) return { text: 'Tốt', color: '#22c55e' };
  if (s >= 60) return { text: 'Cần cải thiện', color: '#f59e0b' };
  return { text: 'Yếu', color: '#ef4444' };
};

const CATEGORIES = [
  { key: 'contentScore',     label: 'Chất lượng nội dung' },
  { key: 'atsScore',         label: 'ATS & cấu trúc'      },
  { key: 'keywordScore',     label: 'Từ khóa'              },
  { key: 'formatScore',      label: 'Định dạng'            },
  { key: 'readabilityScore', label: 'Dễ đọc'               },
  { key: 'fdiScore',         label: 'FDI Ready'            },
];

function ScoreCircle({ score }) {
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const { text, color } = SCORE_LABEL(score);
  return (
    <div className="flex flex-col items-center gap-2" data-testid="score-circle">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={circ - (score / 100) * circ}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
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
    <div className="flex items-center gap-3" data-testid="category-bar">
      <span className="text-xs text-[var(--foreground-secondary)] w-32 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
        <div
          className="h-1.5 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-semibold text-[var(--foreground)] w-12 text-right tabular-nums">
        {score}<span className="text-[var(--foreground-muted)] font-normal">/100</span>
      </span>
    </div>
  );
}

/* Locked version — shows score number + lock icon, no bar */
function CategoryRowLocked({ label, score }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] last:border-0" data-testid="category-bar">
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold tabular-nums text-[var(--foreground)]">{score}</span>
        <Lock className="w-3.5 h-3.5 text-[var(--foreground-muted)]" />
      </div>
    </div>
  );
}

export default function ATSTab({ resume, onTabChange }) {
  const { analyzeATS, scores, analysis, isAnalyzing } = useResumeStore();
  const { hasFullAccess } = useAuthStore();

  const unlocked = hasFullAccess(resume?._id);
  const topFixes = analysis?.topFixes || [];
  const working   = analysis?.working   || [];

  const handleAnalyze = async (force = false) => {
    if (!resume?._id) return;
    toast.loading('Đang phân tích ATS...', { id: 'ats' });
    const result = await analyzeATS(resume._id, null, force);
    toast.dismiss('ats');
    if (result.success) toast.success('Phân tích ATS hoàn tất!');
    else toast.error(result.error || 'Lỗi khi phân tích ATS');
  };

  // Auto-trigger when resume exists but has no scores yet
  useEffect(() => {
    if (resume?._id && !scores && !isAnalyzing) {
      handleAnalyze(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume?._id]);

  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">Vui lòng tải lên CV trước khi kiểm tra ATS</p>
      </Card>
    );
  }

  /* ── Empty / loading state ── */
  if (!scores) {
    return (
      <Card className="text-center py-16" data-testid="empty-state">
        {isAnalyzing ? (
          <>
            <Loader2 className="w-12 h-12 text-[var(--primary)] mx-auto mb-4 animate-spin" />
            <p className="font-semibold text-[var(--foreground)] mb-1">Đang phân tích CV...</p>
            <p className="text-sm text-[var(--foreground-muted)]">AI đang chấm điểm, mất khoảng 5–10 giây</p>
          </>
        ) : (
          <>
            <Shield className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Kiểm tra tính tương thích ATS</h2>
            <p className="text-[var(--foreground-secondary)] mb-6 max-w-md mx-auto">
              Phân tích CV để phát hiện các vấn đề có thể làm giảm khả năng vượt qua hệ thống lọc tự động của FDI
            </p>
            <Button onClick={() => handleAnalyze(false)} loading={isAnalyzing} size="lg">
              <Shield className="w-5 h-5 mr-2" />
              Bắt đầu kiểm tra
            </Button>
          </>
        )}
      </Card>
    );
  }

  const overall = scores.overall || 0;

  /* ── Results ── */
  return (
    <div className="max-w-2xl mx-auto space-y-4" data-testid="ats-results">

      {/* Reanalyze button */}
      <div className="flex justify-end">
        <button
          onClick={() => handleAnalyze(true)}
          disabled={isAnalyzing}
          className="flex items-center gap-1.5 text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          data-testid="reanalyze-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Phân tích lại
        </button>
      </div>

      {/* ── LOCKED VIEW ── */}
      {!unlocked ? (
        <>
          {/* Score hero */}
          <Card>
            <div className="text-center py-4">
              <p className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase mb-3">
                CV của bạn đạt điểm
              </p>
              <div className="flex items-baseline justify-center gap-1 mb-3">
                <span className="text-6xl font-bold text-[var(--foreground)]">{overall}</span>
                <span className="text-2xl text-[var(--foreground-muted)] font-normal">/100</span>
              </div>
              {topFixes.length > 0 && (
                <p className="text-sm text-[var(--foreground-secondary)] max-w-sm mx-auto">
                  Được chấm bởi AI theo tiêu chuẩn FDI. Tìm thấy{' '}
                  <strong className="text-[var(--foreground)]">{topFixes.length} lỗi</strong>{' '}
                  cần sửa. Mở khóa để xem chi tiết từng lỗi và cách fix.
                </p>
              )}
            </div>
          </Card>

          {/* Category list — locked rows */}
          <Card>
            <div className="-my-1">
              {CATEGORIES.map((c) => (
                <CategoryRowLocked key={c.key} label={c.label} score={scores[c.key] || 0} />
              ))}
            </div>
          </Card>

          {/* Fixes — all blurred with unlock overlay */}
          {topFixes.length > 0 && (
            <Card data-testid="top-fixes">
              <p className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase mb-4">
                Phần mềm ATS phát hiện
              </p>

              {/* Blurred list */}
              <div className="relative overflow-hidden" style={{ minHeight: '200px' }}>
                <div className="space-y-4 select-none pointer-events-none blur-sm opacity-50" aria-hidden>
                  {topFixes.map((fix, i) => (
                    <div key={i} className="flex gap-3" data-testid="fix-locked">
                      <span className="text-xs font-bold text-[var(--primary)] mt-0.5 shrink-0">
                        0{i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-[var(--foreground)] mb-0.5">{fix.title}</p>
                        <p className="text-sm text-[var(--foreground-secondary)]">{fix.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Unlock overlay */}
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center"
                  style={{ background: 'linear-gradient(to bottom, transparent 0%, var(--background) 30%)' }}
                  data-testid="fixes-blur-overlay"
                >
                  <div className="mt-8 flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-[var(--primary)]" />
                    </div>
                    <p className="font-semibold text-[var(--foreground)]">
                      Xem toàn bộ lỗi và cách sửa
                    </p>
                    <p className="text-sm text-[var(--foreground-secondary)] max-w-xs">
                      {topFixes.length} lỗi đã tìm thấy. Mở khóa để xem chi tiết và gợi ý sửa sẵn dán.
                    </p>
                    <Button
                      onClick={() => onTabChange?.('rewrite')}
                      className="gap-2 mt-1"
                      data-testid="cta-rewrite"
                    >
                      Mở khóa tất cả {topFixes.length} lỗi
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
      ) : (
        /* ── UNLOCKED VIEW ── */
        <>
          {/* Score card with full category bars */}
          <Card>
            <div className="flex flex-col sm:flex-row gap-8 items-center">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <ScoreCircle score={overall} />
              </div>
              <div className="flex-1 w-full space-y-3">
                <p className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase mb-3">
                  Chi tiết từng tiêu chí
                </p>
                {CATEGORIES.map((c) => (
                  <CategoryBar key={c.key} label={c.label} score={scores[c.key] || 0} />
                ))}
              </div>
            </div>
          </Card>

          {/* Top Fixes — all visible */}
          {topFixes.length > 0 && (
            <Card data-testid="top-fixes">
              <p className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase mb-4">
                Phần mềm ATS phát hiện
              </p>
              <div className="space-y-5">
                {topFixes.map((fix, i) => (
                  <div key={i} className="flex gap-3" data-testid="fix-visible">
                    <span className="text-xs font-bold text-[var(--primary)] mt-0.5 shrink-0">
                      0{i + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-[var(--foreground)] mb-0.5">{fix.title}</p>
                      <p className="text-sm text-[var(--foreground-secondary)]">{fix.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* CTA for unlocked users */}
          <Card className="bg-gradient-to-r from-[var(--primary)]/5 to-[var(--primary)]/10 border-[var(--primary)]/20" data-testid="cta-unlocked">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="font-semibold text-[var(--foreground)]">Sẵn sàng sửa những lỗi này?</p>
                <p className="text-sm text-[var(--foreground-secondary)]">AI sẽ viết lại CV của bạn để đạt 80+ điểm</p>
              </div>
              <Button onClick={() => onTabChange?.('rewrite')} className="gap-2 shrink-0" data-testid="cta-rewrite-unlocked">
                Viết lại CV ngay
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {/* Working section */}
          {working.length > 0 && (
            <div className="flex flex-wrap gap-3 pt-1" data-testid="working-section">
              <span className="text-xs font-semibold tracking-widest text-[var(--foreground-muted)] uppercase self-center">
                Working
              </span>
              {working.map((w, i) => (
                <span key={i} className="flex items-center gap-1.5 text-xs text-[var(--foreground-secondary)]">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                  {w}
                </span>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
