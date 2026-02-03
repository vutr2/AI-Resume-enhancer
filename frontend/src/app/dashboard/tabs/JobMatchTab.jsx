'use client';

import { useState } from 'react';
import { Target, AlertTriangle, CheckCircle, Lightbulb } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useResumeStore } from '@/store/useResumeStore';

export default function JobMatchTab({ resume }) {
  const [jobDescription, setJobDescription] = useState('');
  const { matchJob, currentJobMatch, isLoading } = useResumeStore();

  const handleMatch = async () => {
    if (!resume?._id || !jobDescription.trim()) return;
    await matchJob(resume._id, jobDescription);
  };

  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">
          Vui lòng tải lên CV trước khi so khớp với JD
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Input */}
      <div className="space-y-4">
        <Card>
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Mô tả công việc (JD)
          </h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Dán nội dung mô tả công việc vào đây..."
            className="input w-full h-64 resize-none"
          />
          <Button
            onClick={handleMatch}
            loading={isLoading}
            disabled={!jobDescription.trim()}
            className="w-full mt-4"
            size="lg"
          >
            <Target className="w-5 h-5 mr-2" />
            Phân tích độ khớp
          </Button>
        </Card>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {currentJobMatch ? (
          <>
            {/* Score */}
            <Card className="bg-[var(--primary)] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg opacity-90">Độ phù hợp</p>
                  <p className="text-sm opacity-75">Dựa trên kỹ năng và kinh nghiệm</p>
                </div>
                <div className="text-right">
                  <span className="text-5xl font-bold">{currentJobMatch.matchScore}</span>
                  <span className="text-xl opacity-75">%</span>
                </div>
              </div>
            </Card>

            {/* Matched Skills */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-[var(--success)]" />
                <h3 className="font-semibold text-[var(--foreground)]">
                  Kỹ năng phù hợp
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentJobMatch.matchedSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[var(--success)] bg-opacity-10 text-[var(--success)] rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {(!currentJobMatch.matchedSkills ||
                  currentJobMatch.matchedSkills.length === 0) && (
                  <p className="text-[var(--foreground-muted)] text-sm">
                    Không tìm thấy kỹ năng phù hợp
                  </p>
                )}
              </div>
            </Card>

            {/* Missing Skills */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-[var(--warning)]" />
                <h3 className="font-semibold text-[var(--foreground)]">
                  Kỹ năng cần bổ sung
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentJobMatch.missingSkills?.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[var(--warning)] bg-opacity-10 text-[var(--warning)] rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {(!currentJobMatch.missingSkills ||
                  currentJobMatch.missingSkills.length === 0) && (
                  <p className="text-[var(--foreground-muted)] text-sm">
                    Bạn đã có đầy đủ kỹ năng yêu cầu
                  </p>
                )}
              </div>
            </Card>

            {/* Suggestions */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-semibold text-[var(--foreground)]">
                  Gợi ý cải thiện
                </h3>
              </div>
              <ul className="space-y-2">
                {currentJobMatch.suggestions?.map((suggestion, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-[var(--foreground-secondary)]"
                  >
                    <span className="text-[var(--primary)]">•</span>
                    {suggestion}
                  </li>
                ))}
                {(!currentJobMatch.suggestions ||
                  currentJobMatch.suggestions.length === 0) && (
                  <p className="text-[var(--foreground-muted)] text-sm">
                    Không có gợi ý thêm
                  </p>
                )}
              </ul>
            </Card>
          </>
        ) : (
          <Card className="text-center py-12">
            <Target className="w-12 h-12 text-[var(--foreground-muted)] mx-auto mb-4" />
            <p className="text-[var(--foreground-muted)]">
              Dán mô tả công việc để phân tích độ phù hợp
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
