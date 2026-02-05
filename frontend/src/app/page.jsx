'use client';

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
} from 'lucide-react';

export default function HomePage() {
  const features = [
    {
      icon: <Upload className="w-8 h-8 text-[var(--primary)]" />,
      title: 'Phân tích CV thông minh',
      description:
        'Upload PDF, DOCX hoặc dán văn bản. AI tự động nhận diện và trích xuất thông tin.',
    },
    {
      icon: <PenTool className="w-8 h-8 text-[var(--secondary)]" />,
      title: 'Viết lại chuyên nghiệp',
      description:
        'Viết lại CV theo phong cách: Fresher, Senior, Manager. Tự động tối ưu từ ngữ.',
    },
    {
      icon: <Target className="w-8 h-8 text-[var(--accent)]" />,
      title: 'So khớp Job Description',
      description:
        'Chấm điểm CV vs JD. Gợi ý từ khóa và cách viết lại để khớp hơn.',
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-[var(--success)]" />,
      title: 'Kiểm tra ATS',
      description:
        'Phát hiện vấn đề định dạng, gợi ý sửa lỗi để CV vượt qua hệ thống ATS.',
    },
    {
      icon: <FileText className="w-8 h-8 text-[var(--info)]" />,
      title: 'Tạo thư ứng tuyển',
      description:
        'Tạo cover letter chuẩn Việt Nam: trang trọng, startup, cấp cao.',
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-[var(--error)]" />,
      title: 'Chấm điểm chi tiết',
      description:
        'Điểm ATS, kỹ năng khớp, độc hiểu, phù hợp cấp bậc. Giải thích rõ ràng.',
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 text-white text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Powered by Claude AI
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-[var(--foreground)] mb-6 leading-tight">
            Tối ưu hóa CV
            <br />
            <span className="text-[var(--primary)]">
              cho thị trường Việt Nam
            </span>
          </h1>

          <p className="text-xl text-[var(--foreground-secondary)] mb-8 max-w-2xl mx-auto leading-relaxed">
            AI hiểu văn hóa tuyển dụng Việt Nam. Phân tích, viết lại CV và tạo
            thư ứng tuyển chuyên nghiệp trong vài phút.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn btn-primary text-lg px-8 py-3"
            >
              Bắt đầu miễn phí
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <a href="#features" className="btn btn-secondary text-lg px-8 py-3">
              Tìm hiểu thêm
            </a>
          </div>

          <p className="mt-6 text-sm text-[var(--foreground-muted)]">
            10 lượt miễn phí. Không cần thẻ tín dụng.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-4 bg-[var(--background-secondary)]"
      >
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-4">
              Tính năng nổi bật
            </h2>
            <p className="text-lg text-[var(--foreground-secondary)]">
              Mọi thứ bạn cần để có CV hoàn hảo
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card hover:shadow-lg transition-shadow"
              >
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
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--foreground)] mb-4">
              Tại sao chọn ResuMax VN?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                AI hiểu tiếng Việt
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Không dịch từ tiếng Anh, tư duy bằng tiếng Việt
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Bảo mật dữ liệu
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                CV của bạn được mã hóa và xóa theo yêu cầu
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] bg-opacity-10 text-[var(--primary)] flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-semibold text-[var(--foreground)] mb-2">
                Xử lý nhanh
              </h3>
              <p className="text-sm text-[var(--foreground-secondary)]">
                Phân tích và viết lại CV trong vài giây
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="card bg-[var(--primary)] text-white text-center p-12 rounded-2xl">
            <h2 className="text-3xl font-bold mb-4">
              Sẵn sàng tối ưu CV của bạn?
            </h2>
            <p className="text-lg opacity-90 mb-8">
              Đăng ký miễn phí và nhận ngay 10 lượt sử dụng.
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
          <p>© 2026 ResuMax VN. Dữ liệu của bạn được bảo mật.</p>
        </div>
      </footer>
    </div>
  );
}
