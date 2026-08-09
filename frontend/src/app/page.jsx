import Link from 'next/link';
import ResumeScoreWidget from '@/components/landing/ResumeScoreWidget';
import DauViecLogo from '@/components/ui/DauViecLogo';
import {
  ArrowRight, FileText, Target, CheckCircle, Sparkles, Shield,
  Zap, PenTool, BarChart3, Gift, Share2, Wallet, GraduationCap,
  HardHat, Briefcase, Languages, Star, ChevronRight,
} from 'lucide-react';

/* ── Static product mockup (Server Component, no JS needed) ─────────── */
function ScoreMockup() {
  const bars = [
    { label: 'ATS Score',  score: 82, color: '#0369A1' },
    { label: 'Nội dung',   score: 74, color: '#0EA5E9' },
    { label: 'Từ khóa',    score: 68, color: '#D97706' },
    { label: 'FDI Ready',  score: 80, color: '#16A34A' },
  ];
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (82 / 100) * circ;

  return (
    <div className="relative w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto">
      {/* Glow accent behind card */}
      <div
        aria-hidden
        className="absolute -inset-4 rounded-3xl opacity-20"
        style={{ background: 'radial-gradient(ellipse at center, #0369A1 0%, transparent 70%)' }}
      />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--background-tertiary)]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 mx-3 py-0.5 px-3 rounded bg-[var(--background)] text-[10px] text-[var(--foreground-muted)] text-center">
            cttech.ltd/dashboard
          </div>
        </div>

        {/* App content */}
        <div className="p-5">
          {/* File header */}
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[var(--border)]">
            <div className="w-7 h-7 rounded bg-[var(--primary)]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[var(--primary)]" />
            </div>
            <span className="text-xs font-medium text-[var(--foreground)]">Nguyen_Van_An_CV.pdf</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] font-semibold">✓ Tốt</span>
          </div>

          {/* Score + bars */}
          <div className="flex items-center gap-4 mb-4">
            {/* Score ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 90 90">
                <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
                <circle
                  cx="45" cy="45" r={r} fill="none"
                  stroke="#0369A1" strokeWidth="7"
                  strokeDasharray={circ}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold text-[var(--foreground)]">82</span>
                <span className="text-[9px] text-[var(--foreground-muted)]">/100</span>
              </div>
            </div>

            {/* Category bars */}
            <div className="flex-1 space-y-2">
              {bars.map(({ label, score, color }) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-[10px] text-[var(--foreground-muted)] w-16 shrink-0">{label}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[var(--border)]">
                    <div className="h-1.5 rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--foreground)] w-5 text-right">{score}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback lines */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="text-[var(--accent)] shrink-0 font-bold">✓</span>
              <span className="text-[var(--foreground-secondary)]">Kinh nghiệm rõ ràng, có số liệu định lượng</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="text-[var(--error)] shrink-0 font-bold">✗</span>
              <span className="text-[var(--foreground-secondary)]">Thiếu từ khóa "Production Planning"</span>
            </div>
            <div className="flex items-start gap-1.5 text-[11px]">
              <span className="text-[var(--error)] shrink-0 font-bold">✗</span>
              <span className="text-[var(--foreground-secondary)]">Câu mở đầu chưa theo business English chuẩn</span>
            </div>
          </div>

          {/* Action button */}
          <button className="w-full py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-default">
            Viết lại CV với AI <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-2 -right-2 bg-[var(--accent)] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
        ✓ Vượt ATS Samsung
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────────────────────── */
export default function HomePage() {
  const features = [
    {
      icon: <PenTool className="w-5 h-5" />,
      color: 'var(--primary)',
      title: 'Viết CV tiếng Anh từ CV tiếng Việt',
      description: 'Không phải dịch máy — AI viết lại hoàn toàn bằng business English chuẩn, đúng cách HR nước ngoài đọc hồ sơ.',
    },
    {
      icon: <CheckCircle className="w-5 h-5" />,
      color: 'var(--accent)',
      title: 'Kiểm tra ATS chuẩn FDI',
      description: 'Phát hiện lỗi format, thiếu từ khóa và cấu trúc không vượt được hệ thống lọc ATS của các tập đoàn lớn.',
    },
    {
      icon: <Target className="w-5 h-5" />,
      color: 'var(--secondary)',
      title: 'So khớp JD Samsung / LG / Foxconn',
      description: 'Dán tin tuyển dụng vào, AI chỉ ra CV còn thiếu từ khóa gì và cách bổ sung để khớp JD hơn.',
    },
    {
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'var(--primary)',
      title: 'Điểm FDI-Readiness',
      description: 'Chấm điểm mức độ sẵn sàng apply FDI: tiếng Anh, số liệu định lượng, format, từ khóa ngành sản xuất/kỹ thuật.',
    },
    {
      icon: <FileText className="w-5 h-5" />,
      color: 'var(--secondary)',
      title: 'Cover letter 3 phong cách FDI',
      description: 'Tạo thư ứng tuyển tiếng Anh theo giọng tập đoàn Hàn Quốc, Nhật Bản hoặc Âu-Mỹ — đúng văn hóa công ty.',
    },
    {
      icon: <Languages className="w-5 h-5" />,
      color: 'var(--accent)',
      title: 'Từ vựng ngành tiếng Anh',
      description: 'Gợi ý từ khóa tiếng Anh chuẩn cho sản xuất, QA/QC, kỹ thuật, logistics, văn phòng FDI.',
    },
  ];

  const steps = [
    { n: '01', title: 'Upload CV tiếng Việt', desc: 'Hỗ trợ PDF, DOC, DOCX. AI đọc và phân tích toàn bộ nội dung.' },
    { n: '02', title: 'AI chấm điểm & phân tích', desc: 'Nhận điểm ATS, FDI-Readiness và danh sách lỗi cụ thể cần sửa.' },
    { n: '03', title: 'Nhận CV tiếng Anh chuẩn', desc: 'Download CV tiếng Anh được viết lại đúng format và ngôn ngữ FDI.' },
  ];

  const personas = [
    {
      icon: <GraduationCap className="w-6 h-6" />,
      color: 'var(--primary)',
      title: 'Sinh viên mới ra trường',
      desc: 'Muốn apply thẳng vào FDI nhưng chưa biết viết CV tiếng Anh chuẩn. AI giúp biến CV tiếng Việt thành hồ sơ đủ chuẩn nộp Samsung, Canon, Amkor.',
    },
    {
      icon: <HardHat className="w-6 h-6" />,
      color: 'var(--secondary)',
      title: 'Kỹ sư / Kỹ thuật viên',
      desc: 'Đang làm công ty Việt, muốn nhảy sang FDI lương cao hơn 30–50%. CV tiếng Việt tốt nhưng bản tiếng Anh chưa đủ chuẩn để qua vòng lọc HR.',
    },
    {
      icon: <Briefcase className="w-6 h-6" />,
      color: 'var(--accent)',
      title: 'Nhân viên văn phòng',
      desc: 'Apply vị trí Admin, HR, Purchasing, Logistics tại FDI — các vị trí yêu cầu tiếng Anh giao tiếp và CV tiếng Anh chuyên nghiệp.',
    },
  ];

  const companies = ['Samsung', 'LG', 'Foxconn', 'Canon', 'Amkor', 'Goertek', 'Panasonic', 'Bosch'];

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--background-secondary)]/90 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <nav className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5">
              <DauViecLogo size={36} />
              <span className="text-lg font-bold text-[var(--foreground)]">Đậu Việc</span>
            </Link>

            <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--foreground-secondary)]">
              <a href="#score" className="hover:text-[var(--primary)] transition-colors">Kiểm tra ATS</a>
              <a href="#features" className="hover:text-[var(--primary)] transition-colors">Tính năng</a>
              <Link href="/pricing" className="hover:text-[var(--primary)] transition-colors">Bảng giá</Link>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="btn btn-secondary text-sm py-2 px-4">Đăng nhập</Link>
              <Link href="/register" className="btn btn-primary text-sm py-2 px-4">
                Dùng miễn phí <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="py-16 md:py-24 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left: copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-[var(--primary)] text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                AI được huấn luyện theo chuẩn HR FDI
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-[var(--foreground)] leading-tight mb-5">
                CV tiếng Anh<br />
                chuẩn FDI —{' '}
                <span className="text-[var(--primary)]">trong 5 phút</span>
              </h1>

              <p className="text-lg text-[var(--foreground-secondary)] mb-8 leading-relaxed">
                AI viết lại CV theo cách HR Samsung, LG, Foxconn đọc hồ sơ.
                Vượt vòng lọc ATS, đúng khẩu vị nhà tuyển dụng FDI —
                không phải dịch máy.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/register" className="btn btn-primary text-base px-6 py-3">
                  Bắt đầu miễn phí
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#score" className="btn btn-secondary text-base px-6 py-3">
                  Kiểm tra ATS ngay
                </a>
              </div>

              <p className="text-xs text-[var(--foreground-muted)] mb-6">
                5 lượt miễn phí · Không cần thẻ tín dụng · Kết quả trong 30 giây
              </p>

              {/* Stats */}
              <div className="flex gap-6 pt-6 border-t border-[var(--border)]">
                {[
                  { n: '2,400+', l: 'CV đã tối ưu' },
                  { n: '94%',    l: 'Vượt vòng ATS' },
                  { n: '47',     l: 'Công ty FDI' },
                ].map(({ n, l }) => (
                  <div key={l}>
                    <div className="text-2xl font-bold text-[var(--primary)]">{n}</div>
                    <div className="text-xs text-[var(--foreground-muted)] mt-0.5">{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: product mockup */}
            <ScoreMockup />
          </div>

          {/* Company trust badges */}
          <div className="mt-14 pt-8 border-t border-[var(--border)]">
            <p className="text-center text-xs font-semibold text-[var(--foreground-muted)] uppercase tracking-widest mb-4">
              CV đã được chấp nhận tại
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {companies.map((co) => (
                <span key={co} className="px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--background-secondary)] text-xs font-medium text-[var(--foreground-secondary)]">
                  {co}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Free ATS Score Widget ───────────────────────────────────── */}
      <section id="score" className="py-16 px-4 bg-[var(--background-secondary)] border-y border-[var(--border)]">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--accent)] text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              Miễn phí — không cần đăng ký
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              Điểm ATS CV của bạn là bao nhiêu?
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              Upload CV và xem ngay điểm ATS + mức độ sẵn sàng cho FDI. Chỉ mất 20 giây.
            </p>
          </div>
          <ResumeScoreWidget />
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              3 bước đơn giản
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              Từ CV tiếng Việt đến CV tiếng Anh chuẩn FDI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* connector line */}
            <div aria-hidden className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-[var(--border)]" />

            {steps.map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--primary)] text-white flex items-center justify-center text-2xl font-bold mb-5 relative z-10">
                  {n}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 bg-[var(--background-secondary)] border-y border-[var(--border)]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              Tính năng nổi bật
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              Mọi thứ bạn cần để có CV tiếng Anh vượt ATS của FDI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon, color, title, description }) => (
              <div key={title} className="card hover:border-[var(--primary)]/40 transition-colors group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                >
                  {icon}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2 group-hover:text-[var(--primary)] transition-colors">
                  {title}
                </h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why choose us ──────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              Tại sao chọn Đậu Việc?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Star className="w-6 h-6 text-[var(--primary)]" />, title: 'Khẩu vị HR Hàn / Nhật', desc: 'AI hiểu văn hóa tuyển dụng FDI — ngắn gọn, số liệu, kỷ luật, quy trình' },
              { icon: <Shield className="w-6 h-6 text-[var(--primary)]" />, title: 'Bảo mật dữ liệu', desc: 'CV được mã hóa và xóa theo yêu cầu, không chia sẻ bên thứ ba' },
              { icon: <Zap className="w-6 h-6 text-[var(--primary)]" />, title: 'Kết quả trong 5 phút', desc: 'Upload CV tiếng Việt, nhận CV tiếng Anh chuẩn FDI ngay lập tức' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Personas ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[var(--background-secondary)] border-y border-[var(--border)]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              Dành cho ai?
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              Đậu Việc được tạo ra cho người Việt muốn vào công ty FDI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {personas.map(({ icon, color, title, desc }) => (
              <div key={title} className="card">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
                >
                  {icon}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Affiliate ──────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--accent)] text-xs font-semibold mb-4">
              <Gift className="w-3.5 h-3.5" />
              Chương trình Affiliate
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-4">
              Giới thiệu bạn bè —{' '}
              <span className="text-[var(--primary)]">nhận 50% hoa hồng</span>
            </h2>
            <p className="text-[var(--foreground-secondary)] max-w-lg mx-auto">
              Chia sẻ link giới thiệu. Mỗi người bạn giới thiệu mua gói, bạn nhận ngay 50% doanh thu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {[
              { icon: <Share2 className="w-5 h-5" />, n: '01', title: 'Đăng ký & lấy link', desc: 'Tạo tài khoản và nhận link giới thiệu riêng của bạn' },
              { icon: <Gift className="w-5 h-5" />, n: '02', title: 'Chia sẻ link', desc: 'Gửi cho bạn bè, đăng lên mạng xã hội hoặc viết blog' },
              { icon: <Wallet className="w-5 h-5" />, n: '03', title: 'Nhận tiền tự động', desc: 'Hoa hồng tự động tính, chi trả 2 tuần/lần qua chuyển khoản' },
            ].map(({ icon, n, title, desc }) => (
              <div key={n} className="card text-center">
                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center mx-auto mb-3">
                  {icon}
                </div>
                <p className="text-[10px] font-bold text-[var(--primary)] tracking-widest mb-2">BƯỚC {n}</p>
                <h3 className="font-semibold text-[var(--foreground)] mb-1.5">{title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">{desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/affiliate/register" className="btn btn-primary text-base px-8 py-3">
              Tham gia ngay — miễn phí
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="mt-3 text-xs text-[var(--foreground-muted)]">
              Cookie tracking 30 ngày · Không giới hạn số lần giới thiệu
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────── */}
      <section className="py-6 px-4 bg-[var(--background-secondary)] border-t border-[var(--border)]">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-2xl bg-[var(--primary)] px-8 py-12 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Sẵn sàng apply FDI?
            </h2>
            <p className="text-base opacity-90 mb-8 max-w-md mx-auto">
              Đăng ký miễn phí, nhận ngay 5 lượt tạo CV tiếng Anh chuẩn FDI.
              Không cần thẻ tín dụng.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-white text-[var(--primary)] font-semibold text-base hover:bg-[var(--background-tertiary)] transition-colors"
            >
              Bắt đầu ngay
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-[var(--border)] py-8 px-4 bg-[var(--background-secondary)]">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[var(--foreground-muted)]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[var(--primary)] flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-medium text-[var(--foreground-secondary)]">Đậu Việc</span>
            <span>· © 2026 C&T Technology Company</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors">Bảng giá</Link>
            <Link href="/help" className="hover:text-[var(--foreground)] transition-colors">Trợ giúp</Link>
            <Link href="/affiliate/register" className="hover:text-[var(--primary)] transition-colors font-medium">
              Affiliate →
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
