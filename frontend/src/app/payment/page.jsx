'use client';

import { useState, Suspense } from 'react';
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
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const plans = {
  basic: {
    name: 'Basic',
    priceMonthly: 99000,
    priceYearly: 990000,
  },
  pro: {
    name: 'Pro',
    priceMonthly: 199000,
    priceYearly: 1990000,
  },
  enterprise: {
    name: 'Enterprise',
    priceMonthly: 499000,
    priceYearly: 4990000,
  },
};

function PaymentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();

  const planId = searchParams.get('plan') || 'pro';
  const cycle = searchParams.get('cycle') || 'monthly';

  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('vnpay'); // 'vnpay' hoặc 'zalopay'

  const plan = plans[planId];
  const price = cycle === 'yearly' ? plan?.priceYearly : plan?.priceMonthly;

  const formatPrice = (p) => {
    return new Intl.NumberFormat('vi-VN').format(p);
  };

  const handlePayment = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      router.push(`/login?redirect=/payment?plan=${planId}&cycle=${cycle}`);
      return;
    }

    if (selectedMethod === 'zalopay') {
      toast('ZaloPay sẽ sớm được hỗ trợ!', { icon: '🚀' });
      return;
    }

    setIsProcessing(true);

    try {
      const response = await api.createVNPayOrder(planId, cycle);

      if (response.success) {
        const { transactionId, paymentUrl, amount } = response.data;

        // Save pending payment info
        localStorage.setItem(
          'pendingPayment',
          JSON.stringify({
            transactionId,
            planId,
            billingCycle: cycle,
            amount,
            method: 'vnpay',
          })
        );

        if (paymentUrl) {
          // Redirect to VNPay payment page
          window.location.href = paymentUrl;
        } else {
          toast.error('Không thể tạo liên kết thanh toán');
        }
      } else {
        toast.error(response.message || 'Tạo đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Payment error:', error);
      if (error.message.includes('đăng nhập') || error.message.includes('401')) {
        toast.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        router.push(`/login?redirect=/payment?plan=${planId}&cycle=${cycle}`);
      } else {
        toast.error('Thanh toán thất bại. Vui lòng thử lại sau.');
        setTimeout(() => {
          router.push('/dashboard?payment=failed');
        }, 1500);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Gói không hợp lệ</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-[var(--foreground)]">
                ResuMax VN
              </span>
            </Link>
            <div className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
              <Shield className="w-4 h-4" />
              Thanh toán bảo mật
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)] mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại chọn gói
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-6">
                Phương thức thanh toán
              </h2>

              <div className="space-y-4">
                {/* VNPay - Active */}
                <button
                  onClick={() => setSelectedMethod('vnpay')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedMethod === 'vnpay'
                      ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                      : 'border-[var(--border)] hover:border-[var(--primary)] hover:border-opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#0066CC] flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-[var(--foreground)]">
                        VNPay
                      </p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Thanh toán qua VNPay - ATM, Visa, MasterCard
                      </p>
                    </div>
                    {selectedMethod === 'vnpay' && (
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* ZaloPay - Coming Soon */}
                <button
                  onClick={() => setSelectedMethod('zalopay')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left relative ${
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
                        <p className="font-semibold text-[var(--foreground)]">
                          ZaloPay
                        </p>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                          <Clock className="w-3 h-3" />
                          Coming Soon
                        </span>
                      </div>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        Ví điện tử ZaloPay - Sắp ra mắt
                      </p>
                    </div>
                    {selectedMethod === 'zalopay' && (
                      <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Payment instructions */}
              <div className="mt-6 p-4 bg-[var(--background-secondary)] rounded-lg">
                {selectedMethod === 'vnpay' ? (
                  <>
                    <p className="text-sm text-[var(--foreground-secondary)] mb-3">
                      Bạn sẽ được chuyển đến trang thanh toán của VNPay để hoàn tất giao dịch. Hỗ trợ thanh toán qua:
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
                        QR Code (VNPay QR)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-[var(--success)]" />
                        Ví VNPay
                      </li>
                    </ul>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <Clock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                    <p className="text-[var(--foreground-secondary)] font-medium">
                      ZaloPay sẽ sớm được hỗ trợ!
                    </p>
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      Vui lòng sử dụng VNPay để thanh toán ngay bây giờ.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-[var(--background-secondary)] rounded-lg">
              <Shield className="w-5 h-5 text-[var(--success)] flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-[var(--foreground)]">
                  Thanh toán an toàn
                </p>
                <p className="text-[var(--foreground-muted)]">
                  Thông tin thanh toán của bạn được mã hóa và bảo mật tuyệt đối.
                  Chúng tôi không lưu trữ thông tin thẻ của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <h3 className="text-lg font-bold text-[var(--foreground)] mb-4">
                Đơn hàng của bạn
              </h3>

              <div className="space-y-3 pb-4 border-b border-[var(--border)]">
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-secondary)]">
                    Gói {plan.name}
                  </span>
                  <span className="text-[var(--foreground)]">
                    {formatPrice(cycle === 'yearly' ? price / 12 : price)}đ/tháng
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--foreground-secondary)]">
                    Chu kỳ thanh toán
                  </span>
                  <span className="text-[var(--foreground)]">
                    {cycle === 'yearly' ? '12 tháng' : '1 tháng'}
                  </span>
                </div>
              </div>

              <div className="py-4 border-b border-[var(--border)]">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[var(--foreground)]">Tổng cộng</span>
                  <span className="text-[var(--primary)]">
                    {formatPrice(price)}đ
                  </span>
                </div>
                {cycle === 'yearly' && (
                  <p className="text-sm text-[var(--success)] mt-1">
                    Tiết kiệm 2 tháng so với thanh toán hàng tháng
                  </p>
                )}
              </div>

              <ul className="py-4 space-y-2 text-sm">
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Hủy bất cứ lúc nào
                </li>
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Hoàn tiền trong 7 ngày
                </li>
                <li className="flex items-center gap-2 text-[var(--foreground-secondary)]">
                  <Check className="w-4 h-4 text-[var(--success)]" />
                  Hỗ trợ kỹ thuật 24/7
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
                    Thanh toán qua VNPay
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-[var(--foreground-muted)] mt-4">
                Bằng việc thanh toán, bạn đồng ý với{' '}
                <Link
                  href="/terms"
                  className="text-[var(--primary)] hover:underline"
                >
                  Điều khoản
                </Link>{' '}
                và{' '}
                <Link
                  href="/privacy"
                  className="text-[var(--primary)] hover:underline"
                >
                  Chính sách bảo mật
                </Link>
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
