'use client';

import { Target, FileSearch, BookOpen, Briefcase, Key } from 'lucide-react';
import ScoreCard from './ScoreCard';

export default function ScoreOverview({ scores }) {
  // Đảm bảo tất cả scores là số hợp lệ
  const atsScore = Number(scores?.atsScore) || 0;
  const contentScore = Number(scores?.contentScore) || 0;
  const formatScore = Number(scores?.formatScore) || 0;
  const keywordScore = Number(scores?.keywordScore) || 0;
  const readabilityScore = Number(scores?.readabilityScore) || 0;

  const scoreItems = [
    {
      title: 'Điểm ATS',
      description: 'Khả năng vượt qua hệ thống lọc',
      score: atsScore,
      icon: FileSearch,
    },
    {
      title: 'Nội dung',
      description: 'Chất lượng và độ hoàn thiện',
      score: contentScore,
      icon: Target,
    },
    {
      title: 'Định dạng',
      description: 'Cấu trúc và trình bày',
      score: formatScore,
      icon: BookOpen,
    },
    {
      title: 'Từ khóa',
      description: 'Phù hợp với yêu cầu công việc',
      score: keywordScore,
      icon: Key,
    },
  ];

  // Tính điểm tổng thể - ưu tiên dùng overall từ API, nếu không thì tính trung bình
  const overallScore = scores?.overall
    ? Number(scores.overall)
    : Math.round((atsScore + contentScore + formatScore + keywordScore) / 4);

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <div className="card bg-[var(--primary)] text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium opacity-90">Điểm tổng thể</h2>
            <p className="text-sm opacity-75">Đánh giá toàn diện CV của bạn</p>
          </div>
          <div className="text-right">
            <span className="text-5xl font-bold">{overallScore}</span>
            <span className="text-xl opacity-75">/100</span>
          </div>
        </div>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scoreItems.map((item) => (
          <ScoreCard
            key={item.title}
            title={item.title}
            description={item.description}
            score={item.score}
            icon={item.icon}
          />
        ))}
      </div>
    </div>
  );
}
