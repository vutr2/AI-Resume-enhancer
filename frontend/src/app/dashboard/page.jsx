'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ResumeUploader from '@/components/resume/ResumeUploader';
import ResumePreview from '@/components/resume/ResumePreview';
import ScoreOverview from '@/components/resume/ScoreOverview';
import RewriteTab from './tabs/RewriteTab';
import JobMatchTab from './tabs/JobMatchTab';
import ATSTab from './tabs/ATSTab';
import CoverLetterTab from './tabs/CoverLetterTab';
import { useResumeStore } from '@/store/useResumeStore';
import { useDashboard } from '@/contexts/DashboardContext';
import Card from '@/components/ui/Card';
import { FileText, TrendingUp, Target, Clock, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

function DashboardPageContent() {
  const searchParams = useSearchParams();
  const { activeTab, setActiveTab } = useDashboard();
  const { currentResume, scores, isUploading, uploadResume, error, resumes } =
    useResumeStore();

  // Check for payment status in URL
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'failed') {
      toast.error(
        'Thanh toán không thành công. Bạn có thể thử lại sau hoặc chọn gói khác.'
      );
      // Clean URL without reload
      window.history.replaceState({}, '', '/dashboard');
    } else if (paymentStatus === 'success') {
      toast.success('Thanh toán thành công! Gói dịch vụ đã được kích hoạt.');
      window.history.replaceState({}, '', '/dashboard');
    }
  }, [searchParams]);

  const handleUpload = async (file) => {
    const result = await uploadResume(file);
    if (result.success) {
      setActiveTab('review');
    }
  };

  // Overview stats
  const stats = [
    {
      label: 'CV đã tạo',
      value: resumes?.length || 0,
      icon: FileText,
      color: 'var(--primary)',
      change: '+2 tuần này',
    },
    {
      label: 'Điểm ATS trung bình',
      value: resumes?.length
        ? `${Math.round(resumes.reduce((acc, r) => acc + (r.scores?.atsScore || 0), 0) / resumes.length)}%`
        : '0%',
      icon: TrendingUp,
      color: 'var(--success)',
      change: '+5% so với tuần trước',
    },
    {
      label: 'Việc đã ứng tuyển',
      value: 12,
      icon: Target,
      color: '#F59E0B',
      change: '+3 tuần này',
    },
    {
      label: 'Thời gian tiết kiệm',
      value: '8 giờ',
      icon: Clock,
      color: '#8B5CF6',
      change: 'So với viết thủ công',
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                Tải lên CV của bạn
              </h2>
              <p className="text-[var(--foreground-secondary)]">
                AI sẽ phân tích và đánh giá CV của bạn trong vài giây
              </p>
            </div>
            <ResumeUploader onUpload={handleUpload} isLoading={isUploading} />
            {error && (
              <p className="mt-4 text-center text-[var(--error)]">{error}</p>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Thông tin CV
              </h2>
              <ResumePreview resume={currentResume?.parsedData} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--foreground)] mb-4">
                Điểm đánh giá
              </h2>
              <ScoreOverview scores={scores} />
            </div>
          </div>
        );

      case 'rewrite':
        return <RewriteTab resume={currentResume} />;

      case 'match':
        return <JobMatchTab resume={currentResume} />;

      case 'ats':
        return <ATSTab resume={currentResume} />;

      case 'cover':
        return <CoverLetterTab resume={currentResume} />;

      default:
        // Dashboard Overview
        return (
          <div className="space-y-8">
            {/* Welcome */}
            <div>
              <h1 className="text-2xl font-bold text-[var(--foreground)]">
                Chào mừng trở lại! 👋
              </h1>
              <p className="text-[var(--foreground-secondary)] mt-1">
                Đây là tổng quan hoạt động của bạn
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} className="relative overflow-hidden">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                          {stat.value}
                        </p>
                        <p className="text-xs text-[var(--success)] mt-2">
                          {stat.change}
                        </p>
                      </div>
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{ color: stat.color }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Hành động nhanh
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('upload')}
                  className="p-4 bg-[var(--primary)] text-white rounded-xl hover:opacity-90 transition-opacity text-left"
                >
                  <FileText className="w-6 h-6 mb-2" />
                  <p className="font-medium">Tải lên CV mới</p>
                  <p className="text-sm opacity-80 mt-1">
                    Phân tích và tối ưu hóa CV của bạn
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('ats')}
                  className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl hover:bg-[var(--background-tertiary)] transition-colors text-left"
                  disabled={!currentResume}
                >
                  <TrendingUp className="w-6 h-6 mb-2 text-[var(--success)]" />
                  <p className="font-medium text-[var(--foreground)]">
                    Kiểm tra ATS
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    Xem điểm tương thích ATS
                  </p>
                </button>
                <button
                  onClick={() => setActiveTab('cover')}
                  className="p-4 bg-[var(--background-secondary)] border border-[var(--border)] rounded-xl hover:bg-[var(--background-tertiary)] transition-colors text-left"
                  disabled={!currentResume}
                >
                  <Target className="w-6 h-6 mb-2 text-amber-500" />
                  <p className="font-medium text-[var(--foreground)]">
                    Tạo thư ứng tuyển
                  </p>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    AI viết thư cho bạn
                  </p>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                Hoạt động gần đây
              </h2>
              <Card>
                {resumes && resumes.length > 0 ? (
                  <div className="divide-y divide-[var(--border)]">
                    {resumes.slice(0, 5).map((resume, index) => (
                      <div
                        key={resume._id || index}
                        className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {resume.parsedData?.personalInfo?.name ||
                                'CV chưa đặt tên'}
                            </p>
                            <p className="text-sm text-[var(--foreground-muted)]">
                              {new Date(resume.createdAt).toLocaleDateString(
                                'vi-VN'
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-[var(--foreground)]">
                              ATS: {resume.scores?.atsScore || 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 mx-auto text-[var(--foreground-muted)] opacity-50 mb-3" />
                    <p className="text-[var(--foreground-muted)]">
                      Chưa có CV nào. Hãy tải lên CV đầu tiên của bạn!
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        );
    }
  };

  return renderContent();
}
export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)]">Đang tải...</p>
          </div>
        </div>
      }
    >
      <DashboardPageContent />
    </Suspense>
  );
}
