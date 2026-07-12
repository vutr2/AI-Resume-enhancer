import Link from 'next/link';
import {
  ArrowRight,
  FileText,
  Target,
  CheckCircle,
  Sparkles,
  Shield,
  Zap,
  Upload,
  PenTool,
  BarChart3,
  Gift,
  Share2,
  Wallet,
  GraduationCap,
  HardHat,
  Briefcase,
  Languages,
  Star,
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <PenTool className="w-8 h-8 text-[var(--primary)]" />,
      title: 'Viết CV tiếng Anh từ CV tiếng Việt',
      description:
        'Không phải dịch máy — AI viết lại hoàn toàn bằng business English chuẩn, đúng cách HR nước ngoài đọc hồ sơ.',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[var(--secondary)]" />,
      title: 'Kiểm tra ATS chuẩn FDI',
      description:
        'Phát hiện lỗi format, thiếu từ khóa và cấu trúc không vượt được hệ thống lọc ATS của các tập đoàn lớn.',
    },
    {
      icon: <Target className="w-8 h-8 text-[var(--accent)]" />,
      title: 'So khớp JD Samsung / LG / Foxconn',
      description:
        'Dán tin tuyển dụng vào, AI chỉ ra CV còn thiếu từ khóa gì và cách bổ sung để khớp JD hơn.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[var(--success)]" />,
      title: 'Điểm FDI-Readiness',
      description:
        'Chấm điểm mức độ sẵn sàng apply FDI: tiếng Anh, số liệu định lượng, format, từ khóa ngành sản xuất/kỹ thuật.',
    },
    {
      icon: <FileText className="w-8 h-8 text-[var(--info)]" />,
      title: 'Cover letter 3 phong cách FDI',
      description:
        'Tạo thư ứng tuyển tiếng Anh theo giọng tập đoàn Hàn Quốc, Nhật Bản hoặc Âu-Mỹ — đúng văn hóa công ty.',
    },
    {
      icon: <Languages className="w-8 h-8 text-[var(--error)]" />,
      title: 'Từ vựng ngành tiếng Anh',
      description:
        'Gợi ý từ khóa tiếng Anh chuẩn cho sản xuất, QA/QC, kỹ thuật, logistics, văn phòng FDI.',
    },
  ];

  const personas = [
    {
      icon: <GraduationCap className="w-7 h-7 text-[var(--primary)]" />,
      title: 'Sinh viên mới ra trường',
      desc: 'Muốn apply thẳng vào FDI nhưng chưa biết viết CV tiếng Anh chuẩn. AI giúp biến CV tiếng Việt thành hồ sơ đủ chuẩn nộp Samsung, Canon, Amkor.',
    },
    {
      icon: <HardHat className="w-7 h-7 text-[var(--secondary)]" />,
      title: 'Kỹ sư / Kỹ thuật viên',
      desc: 'Đang làm công ty Việt, muốn nhảy sang FDI lương cao hơn 30-50%. CV tiếng Việt tốt nhưng bản tiếng Anh chưa đủ chuẩn để qua vòng lọc HR.',
    },
    {
      icon: <Briefcase className="w-7 h-7 text-[var(--accent)]" />,
      title: 'Nhân viên văn phòng',
      desc: 'Apply vị trí Admin, HR, Purchasing, Logistics tại FDI — các vị trí yêu cầu tiếng Anh giao tiếp và CV tiếng Anh chuyên nghiệp.',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-[var(--foreground)]">
                ResuMax VN
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="btn btn-secondary">
                Đăng nhập
              </Link>
              <Link href="/register" className="btn btn-primary">
                Bắt đầu miễn phí
              </Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-[var(--primary)] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            AI được huấn luyện theo chuẩn HR FDI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6 leading-tight">
            CV tiếng Anh chuẩn FDI
            <br />
            <span className="text-[var(--primary)]">trong 5 phút</span>
          </h1>

          <p className="text-xl text-[var(--foreground-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
            AI được huấn luyện theo cách HR Samsung, LG, Foxconn, Canon đọc hồ sơ —
            viết CV tiếng Anh chuyên nghiệp, vượt vòng lọc ATS, đúng khẩu vị
            nhà tuyển dụng FDI.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-3">
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#features" className="btn btn-secondary text-lg px-8 py-3">
              Tìm hiểu thêm
            </a>
          </div>

          <p className="mt-6 text-sm text-[var(--foreground-muted)]">
            5 lượt miễn phí · Không cần thẻ tín dụng
          </p>

          {/* Social proof badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[var(--foreground-muted)]">
            {['Samsung', 'LG', 'Foxconn', 'Canon', 'Amkor', 'Goertek'].map((co) => (
              <span key={co} className="px-3 py-1 rounded-full border border-[var(--border)] text-xs">
                {co}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* "Dành cho ai" Section */}
      <section className="py-16 px-4 bg-[var(--background-secondary)]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--foreground)] mb-3">
              Dành cho ai?
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              ResuMax VN được tạo ra cho người Việt muốn vào công ty FDI
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map((p) => (
              <div key={p.title} className="card">
                <div className="w-12 h-12 rounded-xl bg-[var(--background)] flex items-center justify-center mb-4">
                  {p.icon}
                </div>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{p.title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-lg text-[var(--foreground-secondary)]">
              Mọi thứ bạn cần để có CV tiếng Anh vượt ATS của FDI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-[var(--background-secondary)] flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-[var(--foreground-secondary)] text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-[var(--background-secondary)]">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
              Tại sao chọn ResuMax VN?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                <Star className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Khẩu vị HR Hàn / Nhật
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                AI hiểu văn hóa tuyển dụng FDI — ngắn gọn, số liệu, kỷ luật, quy trình
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Bảo mật dữ liệu
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                CV của bạn được mã hóa và xóa theo yêu cầu, không chia sẻ bên thứ ba
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-[var(--primary)]" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Kết quả trong 5 phút
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Upload CV tiếng Việt, nhận CV tiếng Anh chuẩn FDI ngay lập tức
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Affiliate Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium mb-4">
              <Gift className="w-4 h-4" />
              Chương trình Affiliate
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              Giới thiệu bạn bè,<br />
              <span className="text-[var(--primary)]">kiếm 50% hoa hồng</span>
            </h2>
            <p className="text-lg text-[var(--foreground-secondary)] max-w-xl mx-auto">
              Chia sẻ link giới thiệu của bạn. Mỗi người bạn giới thiệu mua gói, bạn nhận ngay 50% doanh thu.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              {
                icon: <Share2 className="w-6 h-6 text-[var(--primary)]" />,
                step: '01',
                title: 'Đăng ký & lấy link',
                desc: 'Tạo tài khoản ResuMax VN và nhận link giới thiệu riêng của bạn',
              },
              {
                icon: <Gift className="w-6 h-6 text-[var(--primary)]" />,
                step: '02',
                title: 'Chia sẻ link',
                desc: 'Gửi link cho bạn bè, đăng lên mạng xã hội, hoặc viết blog',
              },
              {
                icon: <Wallet className="w-6 h-6 text-[var(--primary)]" />,
                step: '03',
                title: 'Nhận tiền tự động',
                desc: 'Hoa hồng tự động tính, chi trả 2 tuần/lần qua chuyển khoản',
              },
            ].map((item) => (
              <div key={item.step} className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mx-auto mb-4">
                  {item.icon}
                </div>
                <p className="text-xs font-bold text-[var(--primary)] tracking-widest mb-2">BƯỚC {item.step}</p>
                <h3 className="font-semibold text-[var(--foreground)] mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--foreground-secondary)]">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/affiliate/register" className="btn btn-primary text-lg px-8 py-3">
              Tham gia ngay — miễn phí
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Cookie tracking 30 ngày · Không giới hạn số lần giới thiệu
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-[var(--background-secondary)]">
        <div className="container mx-auto max-w-3xl">
          <div className="card bg-[var(--primary)] text-white text-center p-12 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Sẵn sàng apply FDI?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Đăng ký miễn phí, nhận ngay 5 lượt tạo CV tiếng Anh chuẩn FDI.
            </p>
            <Link
              href="/register"
              className="btn bg-white text-[var(--primary)] hover:bg-gray-100 text-lg px-8 py-3"
            >
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] py-8 px-4">
        <div className="container mx-auto text-center text-[var(--foreground-muted)] text-sm">
          <p>© 2026 C&T Technology Company. Dữ liệu của bạn được bảo mật.</p>
          <p className="mt-2">
            <Link href="/affiliate/register" className="hover:text-[var(--foreground)] transition-colors">
              Chương trình Affiliate →
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
