// Static placeholder shown under blur when JobMatchTab is locked
export default function JobMatchPlaceholder() {
  const keywords = [
    { label: 'React / TypeScript', pct: 92, color: '#10b981' },
    { label: 'Agile / Scrum', pct: 80, color: '#10b981' },
    { label: 'AWS / Cloud', pct: 55, color: '#f59e0b' },
    { label: 'Leadership', pct: 35, color: '#f59e0b' },
    { label: 'System Design', pct: 18, color: '#ef4444' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* JD input mock */}
      <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
        <p className="text-sm font-semibold text-[var(--foreground)] mb-3">Mô tả công việc (JD)</p>
        <div className="h-48 rounded-lg bg-[var(--background)] border border-[var(--border)] p-3 text-xs text-[var(--foreground-muted)] leading-relaxed">
          We are looking for a Senior Software Engineer to join our cross-functional team at Samsung Vietnam Electronics. You will work closely with Korean and Vietnamese engineers to build internal tooling for our manufacturing lines...
        </div>
        <div className="mt-3 h-9 rounded-lg bg-[var(--primary)] opacity-80 flex items-center justify-center">
          <p className="text-white text-sm font-semibold">Phân tích ngay</p>
        </div>
      </div>

      {/* Results mock */}
      <div className="space-y-4">
        {/* Score */}
        <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border)" strokeWidth="8"/>
                <circle cx="40" cy="40" r="32" fill="none" stroke="#10b981" strokeWidth="8"
                  strokeDasharray="201" strokeDashoffset="48" strokeLinecap="round"/>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-[var(--foreground)]">76</span>
                <span className="text-xs text-[var(--foreground-muted)]">/100</span>
              </div>
            </div>
            <div>
              <p className="font-semibold text-[var(--foreground)]">Khá phù hợp</p>
              <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                CV của bạn khớp với 76% yêu cầu của JD. Cần bổ sung một số kỹ năng.
              </p>
            </div>
          </div>
        </div>

        {/* Keyword match bars */}
        <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Độ khớp từ khoá</p>
          <div className="space-y-3">
            {keywords.map(({ label, pct, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[var(--foreground-secondary)]">{label}</span>
                  <span className="font-semibold" style={{ color }}>{pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top suggestion */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-[var(--foreground-secondary)]">
          <p className="font-semibold text-amber-500 mb-1">💡 Gợi ý hàng đầu</p>
          Thêm ví dụ cụ thể về System Design vào mục Experience. JD yêu cầu thiết kế hệ thống phân tán cho 10k+ concurrent users.
        </div>
      </div>
    </div>
  );
}
