'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Zap,
  Clock,
  FileText,
  Star,
  ArrowRight,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

const packages = [
  {
    id: 'credit_1',
    label: '1 lượt mở khoá',
    price: 10000,
    unit: 'lượt',
    icon: Zap,
    iconBg: '#0369A1',
    description: 'Thử nghiệm nhanh — mở khoá đầy đủ 1 CV',
    features: [
      { text: 'Mở khoá 1 CV cụ thể', included: true },
      { text: 'Viết lại CV với AI', included: true },
      { text: 'So khớp JD', included: true },
      { text: 'Tạo thư ứng tuyển', included: true },
      { text: 'Lưu vĩnh viễn', included: true },
    ],
    cta: 'Mua 1 lượt',
  },
  {
    id: 'credit_3',
    label: '3 lượt mở khoá',
    price: 25000,
    unit: '3 lượt',
    perUnit: '~8.300đ/lượt',
    icon: Zap,
    iconBg: '#16A34A',
    description: 'Tiết kiệm nhất — cho người đang ứng tuyển nhiều vị trí',
    popular: true,
    savings: 'Tiết kiệm 17%',
    features: [
      { text: 'Mở khoá 3 CV khác nhau', included: true },
      { text: 'Viết lại CV với AI', included: true },
      { text: 'So khớp JD', included: true },
      { text: 'Tạo thư ứng tuyển', included: true },
      { text: 'Lưu vĩnh viễn', included: true },
    ],
    cta: 'Mua 3 lượt',
  },
  {
    id: 'week_pass',
    label: 'Pass 7 ngày',
    price: 99000,
    unit: '7 ngày',
    perUnit: '~14.100đ/ngày',
    icon: Clock,
    iconBg: '#7C3AED',
    description: 'Không giới hạn trong 7 ngày — dành cho đợt tìm việc tích cực',
    features: [
      { text: 'Không giới hạn số CV', included: true },
      { text: 'Viết lại CV với AI', included: true },
      { text: 'So khớp JD không giới hạn', included: true },
      { text: 'Tạo thư ứng tuyển không giới hạn', included: true },
      { text: 'Hiệu lực 7 ngày liên tục', included: true },
    ],
    cta: 'Mua Pass 7 ngày',
  },
];

const freeFeatures = [
  { text: '5 lượt phân tích ATS miễn phí', included: true },
  { text: 'Điểm ATS + phân tích điểm yếu', included: true },
  { text: 'Xem kết quả phân tích cơ bản', included: true },
  { text: 'Viết lại CV với AI', included: false },
  { text: 'So khớp JD', included: false },
  { text: 'Tạo thư ứng tuyển', included: false },
];

const comparisonRows = [
  { feature: 'Phân tích ATS', free: '5 lượt', paid: '✓' },
  { feature: 'Điểm ATS chi tiết', free: '✓', paid: '✓' },
  { feature: 'Viết lại CV với AI', free: '✗', paid: '✓' },
  { feature: 'So khớp JD', free: '✗', paid: '✓' },
  { feature: 'Tạo thư ứng tuyển', free: '✗', paid: '✓' },
  { feature: 'Số CV được mở khoá', free: '0', paid: 'Theo gói' },
];

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p);

  const handleBuy = (packageId) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua gói');
      router.push(`/login?redirect=/payment?package=${packageId}`);
      return;
    }
    router.push(`/payment?package=${packageId}`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 bg-[var(--background)] backdrop-blur-sm z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[var(--foreground)]">Đậu Việc</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard">
                <Button size="sm">Vào Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="secondary" size="sm">Đăng nhập</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Bắt đầu miễn phí</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <p className="text-[var(--primary)] font-semibold text-sm uppercase tracking-wider mb-3">
            Bảng giá
          </p>
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            Trả theo lần dùng — không thuê bao
          </h1>
          <p className="text-lg text-[var(--foreground-muted)] max-w-2xl mx-auto">
            Mua khi cần, dùng bao lâu cũng được. Không gia hạn tự động, không phí ẩn.
          </p>
        </div>

        {/* Free tier banner */}
        <div className="mb-12 p-6 bg-[var(--background-secondary)] border border-[var(--border)] rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[var(--foreground)] text-lg mb-1">Miễn phí — bắt đầu ngay</h3>
            <p className="text-[var(--foreground-muted)] text-sm">5 lượt phân tích ATS miễn phí. Xem điểm số, điểm yếu, gợi ý cải thiện — không cần trả tiền.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {freeFeatures.slice(0, 3).map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-secondary)]">
                <Check className="w-4 h-4 text-[var(--success)]" />
                {f.text}
              </span>
            ))}
          </div>
          <Link href={user ? '/dashboard' : '/register'} className="shrink-0">
            <Button variant="secondary" size="sm">
              Dùng miễn phí
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Paid packages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {packages.map((pkg) => {
            const PkgIcon = pkg.icon;
            return (
              <div key={pkg.id} className={`relative ${pkg.popular ? 'md:-mt-4' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-[var(--accent)] text-white shadow">
                      <Star className="w-3 h-3" />
                      Phổ biến nhất
                    </span>
                  </div>
                )}
                <Card
                  className={`h-full flex flex-col ${
                    pkg.popular
                      ? 'border-[var(--accent)] border-2'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: pkg.iconBg }}
                    >
                      <PkgIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--foreground)]">{pkg.label}</h3>
                      {pkg.savings && (
                        <span className="text-xs font-semibold text-[var(--accent)]">{pkg.savings}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-[var(--foreground-muted)] mb-6">{pkg.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-[var(--foreground)]">
                        {formatPrice(pkg.price)}đ
                      </span>
                    </div>
                    {pkg.perUnit && (
                      <p className="text-sm text-[var(--foreground-muted)] mt-0.5">{pkg.perUnit}</p>
                    )}
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {pkg.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        {f.included ? (
                          <Check className="w-4 h-4 text-[var(--success)] mt-0.5 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-[var(--foreground-muted)] mt-0.5 shrink-0" />
                        )}
                        <span className={f.included ? 'text-[var(--foreground-secondary)]' : 'text-[var(--foreground-muted)]'}>
                          {f.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handleBuy(pkg.id)}
                    className="w-full"
                    style={pkg.popular ? { background: 'var(--accent)' } : {}}
                  >
                    {pkg.cta}
                  </Button>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Feature comparison table */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">
            So sánh tính năng
          </h2>
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left p-4 text-[var(--foreground-muted)] font-medium text-sm">Tính năng</th>
                    <th className="p-4 text-center text-[var(--foreground)] font-semibold text-sm">Miễn phí</th>
                    <th className="p-4 text-center text-[var(--primary)] font-semibold text-sm">Có trả phí</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-[var(--border)] last:border-0 ${i % 2 === 0 ? '' : 'bg-[var(--background-tertiary)]'}`}
                    >
                      <td className="p-4 text-sm text-[var(--foreground-secondary)]">{row.feature}</td>
                      <td className="p-4 text-center text-sm">
                        {row.free === '✓' ? (
                          <Check className="w-4 h-4 text-[var(--success)] mx-auto" />
                        ) : row.free === '✗' ? (
                          <X className="w-4 h-4 text-[var(--foreground-muted)] mx-auto" />
                        ) : (
                          <span className="text-[var(--foreground-muted)]">{row.free}</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-sm">
                        {row.paid === '✓' ? (
                          <Check className="w-4 h-4 text-[var(--success)] mx-auto" />
                        ) : (
                          <span className="text-[var(--foreground-secondary)]">{row.paid}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl font-bold text-[var(--foreground)] text-center mb-8">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {[
              {
                q: '"Mở khoá CV" nghĩa là gì?',
                a: 'Mỗi lượt mở khoá cho phép bạn dùng toàn bộ tính năng AI (viết lại, so khớp JD, thư ứng tuyển) trên 1 CV cụ thể. CV đã mở khoá được lưu vĩnh viễn — bạn có thể quay lại chỉnh sửa bất cứ lúc nào mà không tốn thêm lượt.',
              },
              {
                q: 'Pass 7 ngày khác gì so với mua lượt?',
                a: 'Pass 7 ngày cho phép mở khoá không giới hạn số CV trong 7 ngày. Phù hợp khi bạn đang ứng tuyển nhiều vị trí cùng lúc và cần xử lý nhiều hồ sơ nhanh.',
              },
              {
                q: 'Có gia hạn tự động không?',
                a: 'Không. Lượt mở khoá không có thời hạn, Pass 7 ngày hết hạn sau 7 ngày và không tự gia hạn. Bạn hoàn toàn kiểm soát chi tiêu.',
              },
              {
                q: '5 lượt phân tích ATS miễn phí dùng như thế nào?',
                a: 'Mỗi lần tải CV lên và bấm phân tích, hệ thống dùng 1 lượt miễn phí. Bạn sẽ thấy điểm ATS, điểm yếu và gợi ý. Để dùng tính năng viết lại/thư ứng tuyển, cần mở khoá CV đó.',
              },
            ].map((item, i) => (
              <div key={i} className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl">
                <p className="font-semibold text-[var(--foreground)] mb-2">{item.q}</p>
                <p className="text-sm text-[var(--foreground-muted)] leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center p-8 bg-[var(--primary)] rounded-2xl text-white">
          <h2 className="text-2xl font-bold mb-3">Bắt đầu miễn phí ngay hôm nay</h2>
          <p className="text-white/80 mb-6">5 lượt phân tích ATS miễn phí — không cần thẻ tín dụng</p>
          <Link href={user ? '/dashboard' : '/register'}>
            <Button className="bg-white text-[var(--primary)] hover:bg-white/90 font-semibold px-8">
              {user ? 'Vào Dashboard' : 'Tạo tài khoản miễn phí'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
