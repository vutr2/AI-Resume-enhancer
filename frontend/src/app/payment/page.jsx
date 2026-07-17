'use client';

import { useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Shield,
  ArrowLeft,
  Check,
  Wallet,
  Loader2,
  CreditCard,
  Clock,
  Zap,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { trackInitiateCheckout } from '@/lib/pixel';

const PACKAGES = {
  credit_1: {
    label: '1 lượt mở khoá',
    description: 'Mở khoá đầy đủ 1 CV — viết lại, so khớp JD, thư ứng tuyển',
    price: 10000,
    icon: Zap,
    color: '#0369A1',
  },
  credit_3: {
    label: '3 lượt mở khoá',
    description: '3 lượt mở khoá — tiết kiệm 17% so với mua lẻ',
    price: 25000,
    icon: Zap,
    color: '#16A34A',
    popular: true,
  },
  week_pass: {
    label: 'Pass 7 ngày',
    description: 'Không giới hạn mọi tính năng AI trong 7 ngày',
    price: 99000,
    icon: Clock,
    color: '#7C3AED',
  },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const formRef = useRef(null);

  const packageId = searchParams.get('package') || 'credit_1';
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('sepay');
  const [sePayForm, setSePayForm] = useState(null);

  const pkg = PACKAGES[packageId];
  const formatPrice = (p) => new Intl.NumberFormat('vi-VN').format(p);

  const handlePayment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      router.push(`/login?redirect=/payment?package=${packageId}`);
      return;
    }

    if (selectedMethod === 'zalopay') {
      toast('ZaloPay sẽ sớm được hỗ trợ!', { icon: '🚀' });
      return;
    }

    trackInitiateCheckout({ value: pkg.price });
    setIsProcessing(true);
    try {
      const response = await api.createSePayOrder(packageId);

      if (response.success) {
        const { checkoutURL, fields } = response.data;
        setSePayForm({ checkoutURL, fields });
        setTimeout(() => formRef.current?.submit(), 100);
      } else {
        toast.error(response.message || 'Tạo đơn hàng thất bại');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment error:', error);
      if (error.message?.includes('401')) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        router.push(`/login?redirect=/payment?package=${packageId}`);
      } else {
        toast.error('Thanh toán thất bại. Vui lòng thử lại sau.');
      }
      setIsProcessing(false);
    }
  };

  if (!pkg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--foreground-muted)]">Gói không hợp lệ</p>
      </div>
    );
  }

  const PkgIcon = pkg.icon;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Hidden SePay POST form */}
      {sePayForm && (
        <form ref={formRef} action={sePayForm.checkoutURL} method="POST" style={{ display: 'none' }}>
          {Object.entries(sePayForm.fields).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
        </form>
      )}

      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-[var(--foreground)]">ResuMax VN</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
            <Shield className="w-4 h-4" />
            Thanh toán bảo mật
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chọn gói
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Method */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                Phương thức thanh toán
              </h2>

              <div className="space-y-4">
                {/* SePay */}
                <button
                  onClick={() => setSelectedMethod('sepay')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMethod === 'sepay'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                      : 'border-[var(--border)] hover:border-[var(--primary)] hover:border-opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#E8534A] flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--foreground)]">SePay</p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Thẻ ATM, Visa/MasterCard, QR Code ngân hàng
                      </p>
                    </div>
                    {selectedMethod === 'sepay' && (
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* ZaloPay — Coming Soon */}
                <button
                  onClick={() => setSelectedMethod('zalopay')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMethod === 'zalopay'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                      : 'border-[var(--border)] hover:border-[var(--primary)] hover:border-opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#008FE5] flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--foreground)]">ZaloPay</p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">Ví điện tử ZaloPay - Sắp ra mắt</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="mt-6 p-4 bg-[var(--background-secondary)] rounded-lg">
                {selectedMethod === 'sepay' ? (
                  <>
                    <p className="text-sm text-[var(--foreground-secondary)] mb-3">
                      Bạn sẽ được chuyển đến trang SePay để hoàn tất thanh toán:
                    </p>
                    <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[var(--success)]" />
                        Thẻ ATM nội địa (Napas)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[var(--success)]" />
                        Thẻ Visa / MasterCard / JCB
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[var(--success)]" />
                        QR Code ngân hàng
                      </li>
                    </ul>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-[var(--foreground-secondary)] font-medium">ZaloPay sẽ sớm được hỗ trợ!</p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      Vui lòng sử dụng SePay để thanh toán ngay.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-[var(--background-secondary)] rounded-lg">
              <Shield className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--foreground)]">Thanh toán an toàn</p>
                <p className="text-[var(--foreground-muted)]">
                  Thông tin của bạn được mã hóa và bảo mật. Không lưu trữ thông tin thẻ.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">Đơn hàng của bạn</h3>

              <div className="flex items-center gap-3 p-3 bg-[var(--background-tertiary)] rounded-lg mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: pkg.color }}
                >
                  <PkgIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--foreground)] text-sm">{pkg.label}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">{pkg.description}</p>
                </div>
              </div>

              <div className="space-y-3 pb-4 border-b border-[var(--border)]">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--foreground-secondary)]">Giá</span>
                  <span className="text-[var(--foreground)]">{formatPrice(pkg.price)}đ</span>
                </div>
              </div>

              <div className="py-4 border-b border-[var(--border)]">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[var(--foreground)]">Tổng cộng</span>
                  <span className="text-[var(--primary)]">{formatPrice(pkg.price)}đ</span>
                </div>
              </div>

              <ul className="py-4 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Kích hoạt ngay sau thanh toán
                </li>
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Hỗ trợ kỹ thuật qua email
                </li>
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Không gia hạn tự động
                </li>
              </ul>

              <Button
                onClick={handlePayment}
                loading={isProcessing}
                className="w-full"
                size="lg"
                disabled={selectedMethod === 'zalopay'}
              >
                {isProcessing ? (
                  'Đang xử lý...'
                ) : selectedMethod === 'zalopay' ? (
                  <>
                    <Clock className="w-5 h-5 mr-2" />
                    Coming Soon
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Thanh toán {formatPrice(pkg.price)}đ
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-[var(--foreground-muted)] mt-4">
                Bằng việc thanh toán, bạn đồng ý với{' '}
                <Link href="/terms" className="text-[var(--primary)] hover:underline">Điều khoản</Link>
                {' '}và{' '}
                <Link href="/privacy" className="text-[var(--primary)] hover:underline">Chính sách bảo mật</Link>
              </p>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
