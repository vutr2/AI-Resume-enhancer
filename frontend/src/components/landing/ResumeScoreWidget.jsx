'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { Upload, FileText, Loader2, ArrowRight, Lock } from 'lucide-react';

const SESSION_KEY = 'resumax_public_score';

function ScoreCircle({ score }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 80 ? 'Tốt' : score >= 50 ? 'Cần cải thiện' : 'Yếu';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="var(--border)" strokeWidth="10" />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[var(--foreground)]">{score}</span>
          <span className="text-xs text-[var(--foreground-muted)]">/100</span>
        </div>
      </div>
      <span className="text-sm font-semibold" style={{ color }}>{label}</span>
    </div>
  );
}

function CategoryBar({ label, score }) {
  const color = score >= 80 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-[var(--foreground-secondary)] w-24 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)]">
        <div
          className="h-2 rounded-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs font-medium text-[var(--foreground)] w-8 text-right">{score}</span>
    </div>
  );
}

export default function ResumeScoreWidget() {
  const [state, setState] = useState('idle'); // idle | loading | result | error
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef(null);

  // Restore from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        setResult(JSON.parse(saved));
        setState('result');
      }
    } catch {}
  }, []);

  const analyze = useCallback(async (file) => {
    setState('loading');
    setErrorMsg('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/ai/score-public', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Lỗi phân tích. Vui lòng thử lại.');
        setState('error');
        return;
      }
      const payload = { ...data.data, fileName: file.name };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
      } catch {
        // non-critical — result still shows without cache
      }
      setResult(payload);
      setState('result');
    } catch {
      setErrorMsg('Lỗi kết nối. Vui lòng thử lại.');
      setState('error');
    }
  }, []);

  const onFile = useCallback((file) => {
    if (!file) return;
    analyze(file);
  }, [analyze]);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    onFile(e.dataTransfer.files[0]);
  }, [onFile]);

  const reset = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setResult(null);
    setState('idle');
  };

  // ── idle / error ──────────────────────────────────────────────────────────
  if (state === 'idle' || state === 'error') {
    return (
      <div
        data-testid="score-widget"
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all
          ${dragging
            ? 'border-[var(--primary)] bg-[var(--primary)]/5'
            : 'border-[var(--border)] hover:border-[var(--primary)]/60 hover:bg-[var(--background-secondary)]'
          }`}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={(e) => onFile(e.target.files[0])}
          data-testid="file-input"
        />
        <Upload className="w-10 h-10 text-[var(--primary)] mx-auto mb-3" />
        <p className="font-semibold text-[var(--foreground)] mb-1">
          Thả CV vào đây hoặc click để chọn file
        </p>
        <p className="text-sm text-[var(--foreground-muted)]">PDF, DOC, DOCX · Tối đa 5MB · Miễn phí</p>
        {state === 'error' && (
          <p className="mt-3 text-sm text-red-500" data-testid="error-msg">{errorMsg}</p>
        )}
      </div>
    );
  }

  // ── loading ───────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div data-testid="score-widget" className="rounded-xl border border-[var(--border)] p-10 text-center">
        <Loader2 className="w-10 h-10 text-[var(--primary)] mx-auto mb-3 animate-spin" />
        <p className="font-semibold text-[var(--foreground)]">Đang phân tích CV...</p>
        <p className="text-sm text-[var(--foreground-muted)] mt-1">AI đang chấm điểm, mất khoảng 10-20 giây</p>
      </div>
    );
  }

  // ── result ────────────────────────────────────────────────────────────────
  const { scores, topFixes = [], fileName } = result;
  const categories = [
    { label: 'ATS Score',  score: scores.atsScore     },
    { label: 'Nội dung',   score: scores.contentScore },
    { label: 'Định dạng',  score: scores.formatScore  },
    { label: 'Từ khóa',    score: scores.keywordScore },
    { label: 'FDI Ready',  score: scores.fdiScore     },
  ];

  return (
    <div data-testid="score-widget" className="rounded-xl border border-[var(--border)] overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--background-secondary)] px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--foreground-muted)]" />
          <span className="text-sm text-[var(--foreground-secondary)] truncate max-w-xs">{fileName}</span>
        </div>
        <button onClick={reset} className="text-xs text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
          Kiểm tra lại
        </button>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Score circle */}
        <div className="flex flex-col items-center justify-center">
          <ScoreCircle score={scores.overall} />
          <p className="mt-3 text-xs text-[var(--foreground-muted)] text-center">
            Điểm tổng — ATS của các công ty FDI
          </p>
        </div>

        {/* Category bars */}
        <div className="flex flex-col justify-center gap-3">
          {categories.map((c) => (
            <CategoryBar key={c.label} label={c.label} score={c.score} />
          ))}
        </div>
      </div>

      {/* Gated: Top fixes — blurred, CTA to register */}
      <div className="relative border-t border-[var(--border)]">
        {/* blurred preview */}
        <div className="px-6 py-4 select-none pointer-events-none blur-sm opacity-60" aria-hidden>
          <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">
            Top sửa ngay
          </p>
          {(topFixes.length > 0 ? topFixes : ['Thêm số liệu vào các mục thành tích', 'Bổ sung từ khóa theo ngành']).map((fix, i) => (
            <div key={i} className="flex items-start gap-2 mb-2">
              <span className="text-xs font-bold text-[var(--primary)]">0{i + 1}</span>
              <p className="text-sm text-[var(--foreground)]">{typeof fix === 'object' ? fix.suggestion || fix.text || JSON.stringify(fix) : fix}</p>
            </div>
          ))}
        </div>

        {/* Overlay CTA */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[var(--background)]/80 backdrop-blur-[2px]">
          <Lock className="w-5 h-5 text-[var(--primary)] mb-2" />
          <p className="text-sm font-semibold text-[var(--foreground)] mb-3 text-center px-4">
            Đăng ký miễn phí để xem phân tích chi tiết
          </p>
          <Link
            href="/register"
            className="btn btn-primary text-sm px-6 py-2 flex items-center gap-2"
            data-testid="cta-register"
          >
            Xem đầy đủ miễn phí
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
