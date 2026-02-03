'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Mail, Copy, Check, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useResumeStore } from '@/store/useResumeStore';

const letterStyles = [
  {
    id: 'formal',
    label: 'Trang trọng',
    description: 'Phù hợp tập đoàn, ngân hàng, tổ chức chính phủ',
  },
  {
    id: 'startup',
    label: 'Startup',
    description: 'Năng động, thể hiện đam mê và sự sáng tạo',
  },
  {
    id: 'executive',
    label: 'Cấp cao',
    description: 'Chuyên nghiệp, nhấn mạnh tầm nhìn lãnh đạo',
  },
];

export default function CoverLetterTab({ resume }) {
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('formal');
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [copied, setCopied] = useState(false);

  const { generateCoverLetter, isLoading } = useResumeStore();

  const handleGenerate = async () => {
    if (!resume?._id || !jobTitle.trim() || !companyName.trim()) return;

    const result = await generateCoverLetter({
      resumeId: resume._id,
      jobTitle: jobTitle.trim(),
      companyName: companyName.trim(),
      jobDescription: jobDescription.trim(),
      tone: selectedStyle,
    });

    if (result.success) {
      setGeneratedLetter(result.coverLetter);
    }
  };

  const handleCopy = () => {
    if (generatedLetter?.content) {
      navigator.clipboard.writeText(generatedLetter.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async () => {
    if (!generatedLetter?.content) return;

    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Cấu hình font và margin
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - margin * 2;
      const lineHeight = 7;
      let yPosition = margin;

      // Tiêu đề
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      const title = generatedLetter.title || `Thu ung tuyen - ${jobTitle}`;
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += lineHeight * 2;

      // Nội dung
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');

      // Chia nội dung thành các dòng
      const lines = doc.splitTextToSize(generatedLetter.content, maxWidth);

      for (const line of lines) {
        // Kiểm tra nếu cần sang trang mới
        if (yPosition + lineHeight > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
        doc.text(line, margin, yPosition);
        yPosition += lineHeight;
      }

      // Tải file
      const fileName = `thu-ung-tuyen-${companyName.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to text download
      const blob = new Blob([generatedLetter.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cover-letter.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">
          Vui lòng tải lên CV trước khi tạo thư ứng tuyển
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings */}
      <div className="lg:col-span-1 space-y-6">
        {/* Job Info */}
        <Card>
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Thông tin công việc
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">
                Vị trí ứng tuyển <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="VD: Frontend Developer"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">
                Tên công ty <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="VD: FPT Software"
                className="input w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground-secondary)] mb-1">
                Mô tả công việc (tùy chọn)
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Dán nội dung mô tả công việc để thư ứng tuyển phù hợp hơn..."
                className="input w-full h-32 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Style Selection */}
        <Card>
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Phong cách thư
          </h3>
          <div className="space-y-2">
            {letterStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => setSelectedStyle(style.id)}
                className={clsx(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedStyle === style.id
                    ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                    : 'border-[var(--border)] hover:bg-[var(--background-secondary)]'
                )}
              >
                <p className="font-medium text-[var(--foreground)]">
                  {style.label}
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {style.description}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Button
          onClick={handleGenerate}
          loading={isLoading}
          disabled={!jobTitle.trim() || !companyName.trim()}
          className="w-full"
          size="lg"
        >
          <Mail className="w-5 h-5 mr-2" />
          Tạo thư ứng tuyển
        </Button>
      </div>

      {/* Result */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--foreground)]">
              Thư ứng tuyển
            </h3>
            {generatedLetter && (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Sao chép
                    </>
                  )}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-1" />
                  Tải xuống
                </Button>
              </div>
            )}
          </div>

          {generatedLetter ? (
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-[var(--foreground)] bg-[var(--background-secondary)] p-4 rounded-lg font-sans leading-relaxed">
                {generatedLetter.content}
              </pre>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--foreground-muted)]">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nhập mô tả công việc và chọn phong cách</p>
                <p className="text-sm">để tạo thư ứng tuyển</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
