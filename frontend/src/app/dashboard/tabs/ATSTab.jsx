'use client';

import { Shield, AlertCircle, CheckCircle, XCircle, Info } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useResumeStore } from '@/store/useResumeStore';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function ATSTab({ resume }) {
  const { analyzeATS, scores, analysis, isAnalyzing } = useResumeStore();

  const handleAnalyze = async () => {
    if (!resume?._id) return;
    toast.loading('Đang phân tích ATS...', { id: 'ats-loading' });
    const result = await analyzeATS(resume._id);
    toast.dismiss('ats-loading');
    if (result.success) {
      toast.success('Phân tích ATS hoàn tất!');
    } else {
      toast.error(result.error || 'Lỗi khi phân tích ATS');
    }
  };

  // Chuyển đổi từ scores/analysis sang format atsAnalysis
  const atsAnalysis = scores ? {
    score: scores.atsScore || scores.overall || 0,
    issues: analysis?.atsIssues?.map((issue) => ({
      severity: issue.severity === 'high' ? 'critical' : issue.severity === 'medium' ? 'warning' : 'info',
      title: issue.issueType || issue.type || 'Vấn đề',
      description: issue.description,
      suggestion: issue.suggestion,
    })) || [],
    recommendations: analysis?.suggestions || [],
  } : null;

  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">
          Vui lòng tải lên CV trước khi kiểm tra ATS
        </p>
      </Card>
    );
  }

  const getIssueIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-5 h-5 text-[var(--error)]" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-[var(--warning)]" />;
      case 'info':
        return <Info className="w-5 h-5 text-[var(--info)]" />;
      default:
        return <CheckCircle className="w-5 h-5 text-[var(--success)]" />;
    }
  };

  const getIssueColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-[var(--error)] bg-[var(--error)]';
      case 'warning':
        return 'border-[var(--warning)] bg-[var(--warning)]';
      case 'info':
        return 'border-[var(--info)] bg-[var(--info)]';
      default:
        return 'border-[var(--success)] bg-[var(--success)]';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Analyze Button */}
      {!atsAnalysis && (
        <Card className="text-center py-12">
          <Shield className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">
            Kiểm tra tính tương thích ATS
          </h2>
          <p className="text-[var(--foreground-secondary)] mb-6 max-w-md mx-auto">
            Phân tích CV để phát hiện các vấn đề định dạng và từ ngữ có thể làm giảm khả năng vượt qua hệ thống lọc tự động (ATS)
          </p>
          <Button onClick={handleAnalyze} loading={isAnalyzing} size="lg">
            <Shield className="w-5 h-5 mr-2" />
            Bắt đầu kiểm tra
          </Button>
        </Card>
      )}

      {/* Results */}
      {atsAnalysis && (
        <>
          {/* Score */}
          <Card
            className={clsx(
              'text-white',
              atsAnalysis.score >= 80
                ? 'bg-[var(--success)]'
                : atsAnalysis.score >= 60
                ? 'bg-[var(--warning)]'
                : 'bg-[var(--error)]'
            )}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg opacity-90">Điểm ATS</p>
                <p className="text-sm opacity-75">
                  {atsAnalysis.score >= 80
                    ? 'CV của bạn tương thích tốt với ATS'
                    : atsAnalysis.score >= 60
                    ? 'Cần cải thiện một số vấn đề'
                    : 'Cần sửa chữa nhiều vấn đề'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-5xl font-bold">{atsAnalysis.score}</span>
                <span className="text-xl opacity-75">/100</span>
              </div>
            </div>
          </Card>

          {/* Issues */}
          <Card>
            <h3 className="font-semibold text-[var(--foreground)] mb-4">
              Vấn đề phát hiện ({atsAnalysis.issues?.length || 0})
            </h3>
            <div className="space-y-3">
              {atsAnalysis.issues?.map((issue, index) => (
                <div
                  key={index}
                  className={clsx(
                    'p-4 rounded-lg border-l-4 bg-opacity-5',
                    getIssueColor(issue.severity)
                  )}
                >
                  <div className="flex items-start gap-3">
                    {getIssueIcon(issue.severity)}
                    <div className="flex-1">
                      <p className="font-medium text-[var(--foreground)]">
                        {issue.title}
                      </p>
                      <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                        {issue.description}
                      </p>
                      {issue.suggestion && (
                        <p className="text-sm text-[var(--primary)] mt-2">
                          Gợi ý: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(!atsAnalysis.issues || atsAnalysis.issues.length === 0) && (
                <div className="flex items-center gap-3 p-4 rounded-lg bg-[var(--success)] bg-opacity-5">
                  <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                  <p className="text-[var(--foreground)]">
                    Tuyệt vời! Không phát hiện vấn đề nào.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Recommendations */}
          {atsAnalysis.recommendations && atsAnalysis.recommendations.length > 0 && (
            <Card>
              <h3 className="font-semibold text-[var(--foreground)] mb-4">
                Khuyến nghị
              </h3>
              <ul className="space-y-2">
                {atsAnalysis.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-[var(--foreground-secondary)]"
                  >
                    <CheckCircle className="w-4 h-4 text-[var(--primary)] mt-0.5" />
                    {rec}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Re-analyze */}
          <div className="text-center">
            <Button onClick={handleAnalyze} loading={isAnalyzing} variant="secondary">
              Kiểm tra lại
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
