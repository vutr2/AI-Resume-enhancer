// Static placeholder shown under blur when RewriteTab is locked
export default function RewritePlaceholder() {
  return (
    <div className="space-y-6">
      {/* Style selector mock */}
      <div className="p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)]">
        <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-wider mb-3">Phong cách</p>
        <div className="flex gap-2 flex-wrap">
          {['Fresher/Junior', 'Senior', 'Manager', 'FDI English'].map((s, i) => (
            <span
              key={s}
              className="px-3 py-1.5 rounded-lg text-sm font-medium border"
              style={{
                background: i === 2 ? 'var(--primary)' : 'var(--background)',
                color: i === 2 ? 'white' : 'var(--foreground-secondary)',
                borderColor: i === 2 ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {/* Rewritten CV output mock */}
      <div className="p-5 bg-[var(--background-secondary)] rounded-xl border border-[var(--border)] space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[var(--foreground)]">CV đã được viết lại</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">ATS Score: 88/100</span>
        </div>

        {/* Summary section */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">Professional Summary</p>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Results-driven Software Engineer with 4+ years of experience designing and delivering scalable web applications for FDI manufacturing and fintech clients. Proven track record in reducing system latency by 40% and leading cross-functional teams of 6+ engineers. Proficient in React, Node.js, and AWS cloud infrastructure.
          </p>
        </div>

        {/* Experience section */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-3">Work Experience</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-start">
                <p className="text-sm font-semibold text-[var(--foreground)]">Senior Frontend Engineer — Panasonic Vietnam</p>
                <p className="text-xs text-[var(--foreground-muted)] whitespace-nowrap ml-4">2021 – Present</p>
              </div>
              <ul className="mt-2 space-y-1.5 text-sm text-[var(--foreground-secondary)]">
                <li className="flex gap-2"><span className="text-[var(--primary)] mt-0.5">▸</span>Architected and shipped a real-time production dashboard used by 1,200 factory floor operators, reducing downtime reporting lag from 8 hours to under 3 minutes.</li>
                <li className="flex gap-2"><span className="text-[var(--primary)] mt-0.5">▸</span>Led migration from legacy jQuery codebase to React 18 + TypeScript, cutting average page load time by 62% and eliminating 3,400 lines of dead code.</li>
                <li className="flex gap-2"><span className="text-[var(--primary)] mt-0.5">▸</span>Mentored 3 junior engineers through structured code reviews, all promoted within 12 months.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Skills */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--foreground-muted)] mb-2">Technical Skills</p>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Node.js', 'AWS', 'PostgreSQL', 'Docker', 'CI/CD', 'Agile'].map(skill => (
              <span key={skill} className="px-2.5 py-1 text-xs rounded-md bg-[var(--background)] border border-[var(--border)] text-[var(--foreground-secondary)]">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
