'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { Sparkles, Copy, Check, Download } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useResumeStore } from '@/store/useResumeStore';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';

const styles = [
  {
    id: 'fresher',
    label: 'Fresher/Junior',
    description: 'Phong cách mới ra trường, nhấn mạnh tiềm năng',
  },
  {
    id: 'senior',
    label: 'Senior',
    description: 'Chuyên nghiệp, nhấn mạnh thành tích',
  },
  {
    id: 'manager',
    label: 'Manager',
    description: 'Lãnh đạo, quản lý đội nhóm',
  },
  {
    id: 'executive',
    label: 'Executive',
    description: 'Cấp cao, tầm nhìn chiến lược',
  },
];

const tones = [
  {
    id: 'formal',
    label: 'Trang trọng',
    description: 'Phù hợp tập đoàn, ngân hàng',
  },
  {
    id: 'dynamic',
    label: 'Năng động',
    description: 'Phù hợp startup, công nghệ',
  },
  {
    id: 'ats',
    label: 'Tối ưu ATS',
    description: 'Từ khóa rõ ràng, dễ đọc máy',
  },
  {
    id: 'concise',
    label: 'Ngắn gọn',
    description: 'Thông tin cốt lõi, không thừa',
  },
];

export default function RewriteTab({ resume }) {
  const [selectedStyle, setSelectedStyle] = useState('senior');
  const [selectedTone, setSelectedTone] = useState('formal');
  const [rewrittenContent, setRewrittenContent] = useState(null);
  const [copied, setCopied] = useState(false);

  const { rewriteResume, isLoading } = useResumeStore();

  const handleRewrite = async () => {
    if (!resume?._id) return;

    const result = await rewriteResume(resume._id, selectedStyle, selectedTone);
    if (result.success) {
      setRewrittenContent(result.optimizedVersion);
    }
  };

  const handleCopy = () => {
    if (rewrittenContent?.content) {
      navigator.clipboard.writeText(rewrittenContent.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPDF = async () => {
    if (!rewrittenContent?.content) return;

    toast.loading('Đang tạo PDF...', { id: 'pdf-loading' });

    // Tạo HTML content cho PDF
    const htmlContent = generatePDFHTML(rewrittenContent.content, resume);

    // Tạo container ẩn để render HTML
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px';
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    try {
      await document.fonts.ready;

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pageHeightPx = pdfHeight / pdfWidth * imgWidth;

      let heightLeft = imgHeight;
      let position = 0;

      // Thêm trang đầu tiên
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
      heightLeft -= pageHeightPx;

      // Thêm các trang tiếp theo nếu cần
      while (heightLeft > 0) {
        position -= pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, (imgHeight * pdfWidth) / imgWidth);
        heightLeft -= pageHeightPx;
      }

      const styleName = styles.find((s) => s.id === selectedStyle)?.label || selectedStyle;
      pdf.save(`CV_${styleName}_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.dismiss('pdf-loading');
      toast.success('Đã tải xuống CV dạng PDF!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.dismiss('pdf-loading');
      toast.error('Lỗi khi tạo PDF');
    } finally {
      document.body.removeChild(container);
    }
  };

  const generatePDFHTML = (content, resume) => {
    const personalInfo = resume?.parsedData?.personalInfo || {};

    let html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6;">
    `;

    // Header - Tên
    if (personalInfo.name) {
      html += `<h1 style="text-align: center; font-size: 28px; margin: 0 0 8px 0; color: #1e293b; text-transform: uppercase; letter-spacing: 2px;">${personalInfo.name}</h1>`;
    }

    // Thông tin liên hệ
    const contactInfo = [];
    if (personalInfo.email) contactInfo.push(personalInfo.email);
    if (personalInfo.phone) contactInfo.push(personalInfo.phone);
    if (personalInfo.address) contactInfo.push(personalInfo.address);

    if (contactInfo.length > 0) {
      html += `<p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 20px 0;">${contactInfo.join('  |  ')}</p>`;
    }

    // Đường kẻ phân cách
    html += `<hr style="border: none; border-top: 2px solid #3b82f6; margin: 20px 0;" />`;

    // Nội dung CV đã viết lại
    const formattedContent = content
      .split('\n')
      .map((line) => {
        // Kiểm tra nếu là tiêu đề section (in hoa hoặc có dấu :)
        if (line.match(/^[A-ZÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ\s]+:?$/) ||
            line.match(/^#+\s/) ||
            line.match(/^\*\*.*\*\*$/)) {
          const cleanLine = line.replace(/^#+\s/, '').replace(/\*\*/g, '');
          return `<h2 style="font-size: 14px; color: #3b82f6; margin: 20px 0 10px 0; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">${cleanLine}</h2>`;
        }
        // Bullet points
        if (line.match(/^[-•*]\s/)) {
          return `<li style="font-size: 12px; color: #334155; margin-left: 20px;">${line.replace(/^[-•*]\s/, '')}</li>`;
        }
        // Paragraph thường
        if (line.trim()) {
          return `<p style="font-size: 12px; color: #334155; margin: 6px 0;">${line}</p>`;
        }
        return '';
      })
      .join('');

    html += formattedContent;
    html += '</div>';
    return html;
  };

  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">
          Vui lòng tải lên CV trước khi viết lại
        </p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Settings */}
      <div className="lg:col-span-1 space-y-6">
        {/* Style Selection */}
        <Card>
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Phong cách
          </h3>
          <div className="space-y-2">
            {styles.map((style) => (
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

        {/* Tone Selection */}
        <Card>
          <h3 className="font-semibold text-[var(--foreground)] mb-4">
            Giọng điệu
          </h3>
          <div className="space-y-2">
            {tones.map((tone) => (
              <button
                key={tone.id}
                onClick={() => setSelectedTone(tone.id)}
                className={clsx(
                  'w-full text-left p-3 rounded-lg border transition-colors',
                  selectedTone === tone.id
                    ? 'border-[var(--primary)] bg-[var(--primary)] bg-opacity-5'
                    : 'border-[var(--border)] hover:bg-[var(--background-secondary)]'
                )}
              >
                <p className="font-medium text-[var(--foreground)]">
                  {tone.label}
                </p>
                <p className="text-sm text-[var(--foreground-muted)]">
                  {tone.description}
                </p>
              </button>
            ))}
          </div>
        </Card>

        <Button
          onClick={handleRewrite}
          loading={isLoading}
          className="w-full"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Viết lại CV
        </Button>
      </div>

      {/* Result */}
      <div className="lg:col-span-2">
        <Card className="h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--foreground)]">
              Kết quả viết lại
            </h3>
            {rewrittenContent && (
              <div className="flex gap-2">
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
                <Button variant="primary" size="sm" onClick={handleDownloadPDF}>
                  <Download className="w-4 h-4 mr-1" />
                  Tải PDF
                </Button>
              </div>
            )}
          </div>

          {rewrittenContent ? (
            <div className="space-y-4">
              {/* CV Preview */}
              <div
                id="cv-preview"
                className="bg-white text-gray-800 p-8 rounded-lg shadow-inner border border-[var(--border)] max-h-[600px] overflow-y-auto"
                style={{ fontFamily: 'Georgia, serif' }}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {rewrittenContent.content.split('\n').map((line, index) => {
                    // Detect headers (all caps lines or lines ending with :)
                    const isHeader = /^[A-Z\s]+:?$/.test(line.trim()) ||
                                    /^(PROFESSIONAL SUMMARY|EXPERIENCE|EDUCATION|SKILLS|AWARDS|PROJECTS|REFERENCES|TÓM TẮT|KINH NGHIỆM|HỌC VẤN|KỸ NĂNG|GIẢI THƯỞNG)/.test(line.trim());
                    // Detect name (first line, usually)
                    const isName = index === 0 && line.trim().length > 0;
                    // Detect bullet points
                    const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*');
                    // Detect contact info line
                    const isContact = line.includes('|') && (line.includes('@') || line.includes('(+'));

                    if (isName) {
                      return (
                        <h1 key={index} className="text-2xl font-bold text-center text-gray-900 mb-1 tracking-wide">
                          {line}
                        </h1>
                      );
                    }
                    if (isContact) {
                      return (
                        <p key={index} className="text-center text-xs text-gray-600 mb-4">
                          {line}
                        </p>
                      );
                    }
                    if (isHeader) {
                      return (
                        <h2 key={index} className="text-sm font-bold text-blue-700 mt-4 mb-2 border-b border-blue-200 pb-1 uppercase tracking-wider">
                          {line.replace(':', '')}
                        </h2>
                      );
                    }
                    if (isBullet) {
                      return (
                        <p key={index} className="ml-4 text-gray-700 mb-1">
                          {line}
                        </p>
                      );
                    }
                    if (line.trim() === '') {
                      return <div key={index} className="h-2" />;
                    }
                    return (
                      <p key={index} className="text-gray-700 mb-1">
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>

              {/* Changes & Improvements */}
              {(rewrittenContent.changes?.length > 0 || rewrittenContent.improvements?.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {rewrittenContent.changes?.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-700 mb-2">Thay đổi:</h4>
                      <ul className="text-xs text-blue-600 space-y-1">
                        {rewrittenContent.changes.map((change, i) => (
                          <li key={i}>• {change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rewrittenContent.improvements?.length > 0 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="text-sm font-semibold text-green-700 mb-2">Cải thiện:</h4>
                      <ul className="text-xs text-green-600 space-y-1">
                        {rewrittenContent.improvements.map((imp, i) => (
                          <li key={i}>• {imp}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-[var(--foreground-muted)]">
              <p>Chọn phong cách và giọng điệu, sau đó nhấn Viết lại CV</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
