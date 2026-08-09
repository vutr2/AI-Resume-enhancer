// Static placeholder shown under blur when CoverLetterTab is locked
export default function CoverLetterPlaceholder() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Input mock */}
      <div className="space-y-4">
        <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
          <p className="text-sm font-semibold text-[var(--foreground)] mb-4">Thông tin công việc</p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Vị trí ứng tuyển</p>
              <div className="h-9 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 flex items-center text-sm text-[var(--foreground-secondary)]">Senior Software Engineer</div>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Tên công ty</p>
              <div className="h-9 rounded-lg bg-[var(--background)] border border-[var(--border)] px-3 flex items-center text-sm text-[var(--foreground-secondary)]">Samsung Vietnam Electronics</div>
            </div>
            <div>
              <p className="text-xs text-[var(--foreground-muted)] mb-1">Phong cách</p>
              <div className="flex gap-2">
                {['Trang trọng', 'Startup', 'Cấp cao'].map((s, i) => (
                  <span key={s} className="px-3 py-1.5 rounded-lg text-xs font-medium border" style={{
                    background: i === 0 ? 'var(--primary)' : 'var(--background)',
                    color: i === 0 ? 'white' : 'var(--foreground-secondary)',
                    borderColor: i === 0 ? 'var(--primary)' : 'var(--border)',
                  }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 h-9 rounded-lg bg-[var(--primary)] opacity-80 flex items-center justify-center">
            <p className="text-white text-sm font-semibold">Tạo thư ứng tuyển</p>
          </div>
        </div>
      </div>

      {/* Generated letter mock */}
      <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-[var(--foreground)]">Thư ứng tuyển</p>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">Đã tạo</span>
        </div>
        <div className="text-sm text-[var(--foreground)] leading-relaxed space-y-3">
          <p className="text-[var(--foreground-muted)] text-xs">Ho Chi Minh City, Vietnam | {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p>Dear Hiring Manager,</p>
          <p>
            I am writing to express my strong interest in the Senior Software Engineer position at Samsung Vietnam Electronics. With over four years of hands-on experience building production-grade systems for FDI manufacturing environments, I am confident in my ability to contribute meaningfully to your team from day one.
          </p>
          <p>
            In my current role at Panasonic Vietnam, I led the end-to-end development of a real-time monitoring dashboard that now serves 1,200 factory floor operators across three production sites. This project reduced downtime reporting latency from eight hours to under three minutes — a result that directly aligned with the operational efficiency goals your JD highlights. I also spearheaded a React 18 + TypeScript migration that cut page load times by 62%, demonstrating both my technical depth and my commitment to sustainable engineering practices.
          </p>
          <p>
            I am particularly drawn to Samsung Vietnam's emphasis on cross-cultural collaboration between Korean headquarters and local Vietnamese engineering teams. Having worked in bilingual environments throughout my career, I understand how to bridge communication gaps and maintain engineering standards across diverse stakeholder groups.
          </p>
          <p>
            I would welcome the opportunity to discuss how my background aligns with your team's goals. Thank you for your consideration.
          </p>
          <p>Sincerely,<br /><strong>Nguyễn Văn A</strong></p>
        </div>
      </div>
    </div>
  );
}
