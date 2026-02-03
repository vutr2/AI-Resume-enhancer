'use client';

import { clsx } from 'clsx';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function ScoreCard({
  title,
  score,
  maxScore = 100,
  description,
  trend,
  icon: Icon,
}) {
  const percentage = (score / maxScore) * 100;

  const getScoreColor = () => {
    if (percentage >= 80) return 'text-[var(--success)]';
    if (percentage >= 60) return 'text-[var(--warning)]';
    return 'text-[var(--error)]';
  };

  const getProgressColor = () => {
    if (percentage >= 80) return 'bg-[var(--success)]';
    if (percentage >= 60) return 'bg-[var(--warning)]';
    return 'bg-[var(--error)]';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-[var(--success)]" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-[var(--error)]" />;
    return <Minus className="w-4 h-4 text-[var(--foreground-muted)]" />;
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-10 h-10 rounded-lg bg-[var(--background-secondary)] flex items-center justify-center">
              <Icon className="w-5 h-5 text-[var(--primary)]" />
            </div>
          )}
          <div>
            <h3 className="font-medium text-[var(--foreground)]">{title}</h3>
            {description && (
              <p className="text-sm text-[var(--foreground-muted)]">{description}</p>
            )}
          </div>
        </div>
        {trend && getTrendIcon()}
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className={clsx('text-3xl font-bold', getScoreColor())}>
          {score}
        </span>
        <span className="text-[var(--foreground-muted)] mb-1">/ {maxScore}</span>
      </div>

      <div className="progress-bar">
        <div
          className={clsx('progress-bar-fill', getProgressColor())}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
