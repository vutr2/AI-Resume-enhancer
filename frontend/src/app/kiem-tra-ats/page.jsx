import Link from 'next/link';
import { Zap } from 'lucide-react';
import ResumeScoreWidget from '@/components/landing/ResumeScoreWidget';
import DauViecLogo from '@/components/ui/DauViecLogo';

export const metadata = {
  title: 'Kiểm tra ATS CV miễn phí – Đậu Việc',
  description: 'Upload CV và xem ngay điểm ATS + mức độ sẵn sàng cho FDI. Miễn phí, không cần đăng ký. Chỉ mất 20 giây.',
};

export default function KiemTraATSPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Minimal navbar */}
      <nav className="border-b border-[var(--border)] px-4 py-4">
        <div className="container mx-auto max-w-5xl flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <DauViecLogo size={32} />
            <span className="text-lg font-bold text-[var(--foreground)]">Đậu Việc</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
              Đăng nhập
            </Link>
            <Link href="/register" className="btn btn-primary text-sm px-4 py-2">
              Dùng thử miễn phí
            </Link>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] text-[var(--accent)] text-xs font-semibold mb-4">
              <Zap className="w-3.5 h-3.5" />
              Miễn phí — không cần đăng ký
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--foreground)] mb-3">
              Điểm ATS CV của bạn là bao nhiêu?
            </h1>
            <p className="text-[var(--foreground-secondary)] text-lg">
              Upload CV và xem ngay điểm ATS + mức độ sẵn sàng cho FDI. Chỉ mất 20 giây.
            </p>
          </div>

          <ResumeScoreWidget />

          <p className="text-center text-sm text-[var(--foreground-muted)] mt-8">
            Muốn viết lại CV chuẩn FDI?{' '}
            <Link href="/register" className="text-[var(--primary)] font-medium hover:underline">
              Đăng ký miễn phí →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
