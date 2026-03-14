'use client';

import { BarChart2 } from 'lucide-react';

function CircularGauge({ score }) {
  const radius = 70;
  const stroke = 10;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const dashOffset = circumference - (score / 100) * circumference;

  const color =
    score < 40 ? '#ef4444' : score < 60 ? '#f97316' : score < 80 ? '#eab308' : '#22c55e';

  const label =
    score < 40
      ? 'Critical — Rebuild Core Sections'
      : score < 60
      ? 'Needs Improvement'
      : score < 80
      ? 'Good — Polish Your Resume'
      : 'Excellent — Job Ready!';

  const sublabel =
    score < 40
      ? 'Unlock your rebuild roadmap: structure, keywords, and high-impact rewrites.'
      : score < 60
      ? 'Your resume needs some work to stand out to recruiters.'
      : score < 80
      ? 'A few more tweaks and your resume will be employer-ready.'
      : 'Your resume is optimized and ready to impress recruiters!';

  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative" style={{ width: radius * 2, height: radius * 2 }}>
        <svg width={radius * 2} height={radius * 2}>
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke="#1e2a3a"
            strokeWidth={stroke}
          />
          <circle
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${radius} ${radius})`}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold" style={{ color }}>{score}</span>
          <span className="text-sm text-gray-400">/ 100</span>
        </div>
      </div>
      <p className="mt-4 text-lg font-semibold text-center" style={{ color }}>{label}</p>
      <p className="mt-1 text-sm text-gray-400 text-center max-w-xs px-4">{sublabel}</p>
    </div>
  );
}

function CategoryBar({ label, score, max, color }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-300 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-[#1e2a3a] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-sm font-medium shrink-0" style={{ color }}>
        {score}/{max}
      </span>
    </div>
  );
}

export default function ScoreOverview({ scores }) {
  const atsScore = Number(scores?.atsScore) || 0;
  const contentScore = Number(scores?.contentScore) || 0;
  const formatScore = Number(scores?.formatScore) || 0;
  const keywordScore = Number(scores?.keywordScore) || 0;
  const readabilityScore = Number(scores?.readabilityScore) || 0;

  const overallScore = scores?.overall
    ? Number(scores.overall)
    : Math.round((atsScore + contentScore + formatScore + keywordScore) / 4);

  const barColor =
    overallScore < 40 ? '#ef4444' : overallScore < 60 ? '#f97316' : overallScore < 80 ? '#eab308' : '#22c55e';

  const categories = [
    { label: 'ATS',       score: Math.round((atsScore / 100) * 20),        max: 20, color: barColor },
    { label: 'Content',   score: Math.round((contentScore / 100) * 40),    max: 40, color: barColor },
    { label: 'Writing',   score: Math.round((formatScore / 100) * 10),     max: 10, color: barColor },
    { label: 'Job Match', score: Math.round((keywordScore / 100) * 25),    max: 25, color: barColor },
    { label: 'Ready',     score: Math.round((readabilityScore / 100) * 5), max: 5,  color: '#22c55e' },
  ];

  if (!scores || overallScore === 0) {
    return (
      <div className="rounded-2xl bg-[#0f1a27] p-6 text-center text-gray-500 h-full flex items-center justify-center">
        <p>Chưa có điểm đánh giá</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0f1a27] h-full overflow-y-auto">
      <CircularGauge score={overallScore} />
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-gray-200">Category Breakdown</span>
        </div>
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryBar key={cat.label} {...cat} />
          ))}
        </div>
      </div>
    </div>
  );
}
