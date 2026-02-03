'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  FileText,
  Sparkles,
  Zap,
  ArrowRight,
  Crown,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const plans = [
  {
    id: 'free',
    name: 'Miễn phí',
    description: 'Dành cho người mới bắt đầu',
    price: 0,
    priceMonthly: 0,
    icon: FileText,
    color: 'var(--foreground-secondary)',
    level: 0,
    features: [
      { text: '3 CV mỗi tháng', included: true },
      { text: '5 lượt AI miễn phí', included: true },
      { text: 'Điểm ATS cơ bản', included: true },
      { text: 'Viết lại CV', included: false },
      { text: 'So khớp JD', included: false },
      { text: 'Thư ứng tuyển', included: false },
      { text: 'Xuất PDF/DOCX', included: false },
      { text: 'Hỗ trợ ưu tiên', included: false },
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    description: 'Dành cho người tìm việc',
    price: 99000,
    priceMonthly: 99000,
    priceYearly: 990000,
    icon: Zap,
    color: 'var(--primary)',
    level: 1,
    features: [
      { text: '10 CV mỗi tháng', included: true },
      { text: '20 lượt AI/tháng', included: true },
      { text: 'Điểm ATS nâng cao', included: true },
      { text: 'Viết lại CV', included: true },
      { text: 'So khớp JD', included: false },
      { text: 'Thư ứng tuyển', included: false },
      { text: 'Xuất PDF/DOCX', included: true },
      { text: 'Hỗ trợ email', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Dành cho người tìm việc nghiêm túc',
    price: 199000,
    priceMonthly: 199000,
    priceYearly: 1990000,
    icon: Sparkles,
    color: '#8B5CF6',
    popular: true,
    level: 2,
    features: [
      { text: 'CV không giới hạn', included: true },
      { text: 'AI không giới hạn', included: true },
      { text: 'Điểm ATS chi tiết', included: true },
      { text: 'Viết lại CV không giới hạn', included: true },
      { text: 'So khớp JD', included: true },
      { text: 'Tạo thư ứng tuyển', included: true },
      { text: 'Xuất PDF/DOCX', included: true },
      { text: 'Hỗ trợ ưu tiên', included: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, loadUserProfile } = useAuthStore();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Refresh user data when page loads to ensure latest plan info
  useEffect(() => {
    loadUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get user's current plan level
  const getUserPlanLevel = () => {
    if (!user) return -1;
    const userPlan = plans.find((p) => p.id === user.plan);
    return userPlan?.level ?? 0;
  };

  const userPlanLevel = getUserPlanLevel();

  const handleCancelSubscription = async () => {
    setIsCancelling(true);
    try {
      const response = await api.cancelSubscription(cancelReason);
      if (response.success) {
        toast.success('Đã hủy gói thành công!');
        await loadUserProfile();
        setShowCancelModal(false);
        setCancelReason('');
      } else {
        toast.error(response.message || 'Không thể hủy gói');
      }
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSelectPlan = (planId) => {
    if (!user) {
      router.push('/register');
      return;
    }

    // If selecting current plan, go to dashboard
    if (user.plan === planId) {
      router.push('/dashboard');
      return;
    }

    // If free plan (cancel subscription), show cancel modal
    if (planId === 'free') {
      setShowCancelModal(true);
      return;
    }

    // Go to payment page for upgrade or change plan
    router.push(`/payment?plan=${planId}&cycle=${billingCycle}`);
  };

  const getButtonText = (plan) => {
    if (!user) {
      return plan.id === 'free' ? 'Bắt đầu miễn phí' : 'Chọn gói này';
    }

    if (user.plan === plan.id) {
      return 'Gói hiện tại';
    }

    if (plan.id === 'free' && userPlanLevel > 0) {
      return 'Hủy gói';
    }

    if (plan.level < userPlanLevel) {
      return 'Chuyển gói';
    }

    return 'Nâng cấp';
  };

  const isCurrentPlan = (planId) => {
    return user?.plan === planId;
  };

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
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {user.plan !== 'free' && (
                    <span className="flex items-center gap-1 text-sm text-[var(--primary)]">
                      <Crown className="w-4 h-4" />
                      {user.plan.charAt(0).toUpperCase() + user.plan.slice(1)}
                    </span>
                  )}
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost">Đăng nhập</Button>
                  </Link>
                  <Link href="/register">
                    <Button>Đăng ký</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl font-bold text-[var(--foreground)] mb-4">
            Chọn gói phù hợp với bạn
          </h1>
          <p className="text-lg text-[var(--foreground-secondary)]">
            Bắt đầu miễn phí, nâng cấp bất cứ lúc nào. Hủy bỏ dễ dàng.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={
              billingCycle === 'monthly'
                ? 'text-[var(--foreground)] font-medium'
                : 'text-[var(--foreground-muted)]'
            }
          >
            Tháng
          </span>
          <button
            onClick={() =>
              setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')
            }
            className="relative w-14 h-7 bg-[var(--primary)] rounded-full transition-colors"
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className={
              billingCycle === 'yearly'
                ? 'text-[var(--foreground)] font-medium'
                : 'text-[var(--foreground-muted)]'
            }
          >
            Năm{' '}
            <span className="text-[var(--success)] text-sm font-medium">
              -17%
            </span>
          </span>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const price =
              billingCycle === 'yearly' && plan.priceYearly
                ? Math.round(plan.priceYearly / 12)
                : plan.priceMonthly;
            const currentPlan = isCurrentPlan(plan.id);

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  plan.popular
                    ? 'border-2 border-[var(--primary)] shadow-lg'
                    : currentPlan
                      ? 'border-2 border-[var(--success)]'
                      : ''
                }`}
              >
                {plan.popular && !currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--primary)] text-white text-xs font-medium rounded-full">
                    Phổ biến nhất
                  </div>
                )}
                {currentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[var(--success)] text-white text-xs font-medium rounded-full">
                    Gói hiện tại
                  </div>
                )}

                <div className="text-center mb-6">
                  <div
                    className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${plan.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: plan.color }} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--foreground)]">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    {plan.description}
                  </p>
                </div>

                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-[var(--foreground)]">
                      {price === 0 ? 'Miễn phí' : `${formatPrice(price)}đ`}
                    </span>
                    {price > 0 && (
                      <span className="text-[var(--foreground-muted)]">
                        /tháng
                      </span>
                    )}
                  </div>
                  {billingCycle === 'yearly' && plan.priceYearly && (
                    <p className="text-sm text-[var(--foreground-muted)] mt-1">
                      Thanh toán {formatPrice(plan.priceYearly)}đ/năm
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      {feature.included ? (
                        <Check className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-[var(--foreground-muted)] flex-shrink-0" />
                      )}
                      <span
                        className={
                          feature.included
                            ? 'text-[var(--foreground)]'
                            : 'text-[var(--foreground-muted)]'
                        }
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  variant={
                    currentPlan
                      ? 'outline'
                      : plan.id === 'free' && userPlanLevel > 0
                        ? 'danger'
                        : plan.popular
                          ? 'primary'
                          : 'outline'
                  }
                  className="w-full"
                  size="lg"
                  disabled={currentPlan}
                >
                  {getButtonText(plan)}
                  {!currentPlan && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </Card>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-[var(--foreground-muted)]">
            Có câu hỏi?{' '}
            <Link href="/help" className="text-[var(--primary)] hover:underline">
              Xem trung tâm trợ giúp
            </Link>
          </p>
        </div>
      </main>

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <Card className="max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--error)] bg-opacity-10 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-[var(--error)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--foreground)]">
                Xác nhận hủy gói
              </h2>
              <p className="text-[var(--foreground-muted)] mt-2">
                Bạn có chắc muốn hủy gói <strong className="text-[var(--foreground)]">{user?.plan?.toUpperCase()}</strong>?
              </p>
            </div>

            <div className="bg-[var(--background-secondary)] rounded-lg p-4 mb-6">
              <p className="text-sm text-[var(--foreground-secondary)] mb-2">
                Khi hủy gói, bạn sẽ:
              </p>
              <ul className="text-sm text-[var(--foreground-muted)] space-y-1">
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-[var(--error)]" />
                  Mất quyền truy cập các tính năng premium
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-[var(--error)]" />
                  Giới hạn 3 CV và 5 lượt AI mỗi tháng
                </li>
                <li className="flex items-center gap-2">
                  <X className="w-4 h-4 text-[var(--error)]" />
                  Không thể xuất PDF/DOCX
                </li>
              </ul>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                Lý do hủy (không bắt buộc)
              </label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Chọn lý do...</option>
                <option value="too_expensive">Giá quá cao</option>
                <option value="not_using">Không sử dụng thường xuyên</option>
                <option value="missing_features">Thiếu tính năng cần thiết</option>
                <option value="found_alternative">Tìm được giải pháp khác</option>
                <option value="temporary">Tạm thời không cần</option>
                <option value="other">Lý do khác</option>
              </select>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                disabled={isCancelling}
              >
                Giữ gói hiện tại
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleCancelSubscription}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  'Xác nhận hủy'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
