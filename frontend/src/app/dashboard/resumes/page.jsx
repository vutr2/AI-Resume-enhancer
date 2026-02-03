'use client';

import { useState, useEffect } from 'react';
import { useResumeStore } from '@/store/useResumeStore';
import { useDashboard } from '@/contexts/DashboardContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  FileText,
  Search,
  MoreVertical,
  Trash2,
  Download,
  Eye,
  Edit3,
  Calendar,
  TrendingUp,
  Plus,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function ResumesPage() {
  const router = useRouter();
  const { resumes, deleteResume, setCurrentResume, loadResumes, isLoading } = useResumeStore();
  const { setActiveTab } = useDashboard();
  const [searchQuery, setSearchQuery] = useState('');

  // Load resumes từ database khi component mount (chỉ khi chưa có data)
  useEffect(() => {
    if (resumes.length === 0) {
      loadResumes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'score'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [selectedResumes, setSelectedResumes] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  // Filter and sort resumes
  const filteredResumes =
    resumes
      ?.filter((resume) => {
        const name = resume.parsedData?.personalInfo?.name || '';
        const title = resume.parsedData?.personalInfo?.title || '';
        return (
          name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          title.toLowerCase().includes(searchQuery.toLowerCase())
        );
      })
      .sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'name':
            const nameA = a.parsedData?.personalInfo?.name || '';
            const nameB = b.parsedData?.personalInfo?.name || '';
            comparison = nameA.localeCompare(nameB);
            break;
          case 'score':
            comparison = (a.scores?.atsScore || 0) - (b.scores?.atsScore || 0);
            break;
          case 'date':
          default:
            comparison = new Date(a.createdAt) - new Date(b.createdAt);
            break;
        }
        return sortOrder === 'desc' ? -comparison : comparison;
      }) || [];

  const handleViewResume = (resume) => {
    setCurrentResume(resume);
    setActiveTab('review');
    router.push('/dashboard');
  };

  const handleEditResume = (resume) => {
    setCurrentResume(resume);
    setActiveTab('rewrite');
    router.push('/dashboard');
  };

  const handleDeleteClick = (resume) => {
    setResumeToDelete(resume);
    setShowDeleteModal(true);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (resumeToDelete) {
      try {
        await deleteResume(resumeToDelete._id);
        toast.success('Đã xóa CV thành công');
      } catch (error) {
        toast.error('Xóa CV thất bại');
      }
    }
    setShowDeleteModal(false);
    setResumeToDelete(null);
  };

  const handleDownload = async (resume) => {
    setActiveMenu(null);
    toast.loading('Đang tạo PDF...', { id: 'pdf-loading' });

    // Fetch full resume data (bao gồm rawText)
    let fullResume = resume;
    try {
      const response = await fetch(`/api/resumes/${resume._id}`);
      const data = await response.json();
      if (data.success && data.data?.resume) {
        fullResume = data.data.resume;
      }
    } catch (error) {
      console.error('Error fetching resume:', error);
    }

    const parsedData = fullResume.parsedData || {};
    const personalInfo = parsedData.personalInfo || {};

    // Tạo HTML content cho PDF
    const htmlContent = generateResumeHTML(parsedData, fullResume.rawText);

    // Tạo container ẩn để render HTML
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '794px'; // A4 width in pixels at 96 DPI
    container.style.backgroundColor = 'white';
    document.body.appendChild(container);

    try {
      // Chờ fonts load
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
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const pageHeightPx = (pdfHeight / ratio);

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

      pdf.save(`${resume.title || 'CV'}_${new Date().toISOString().split('T')[0]}.pdf`);
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

  // Helper function để tạo HTML cho PDF
  const generateResumeHTML = (parsedData, rawText) => {
    const personalInfo = parsedData.personalInfo || {};

    let html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6;">
    `;

    // Header - Tên
    if (personalInfo.name) {
      html += `<h1 style="text-align: center; font-size: 28px; margin: 0 0 8px 0; color: #1e293b; text-transform: uppercase; letter-spacing: 2px;">${personalInfo.name}</h1>`;
    }

    // Chức danh
    if (personalInfo.title) {
      html += `<p style="text-align: center; font-size: 16px; color: #64748b; margin: 0 0 12px 0;">${personalInfo.title}</p>`;
    }

    // Thông tin liên hệ
    const contactInfo = [];
    if (personalInfo.email) contactInfo.push(personalInfo.email);
    if (personalInfo.phone) contactInfo.push(personalInfo.phone);
    if (personalInfo.address) contactInfo.push(personalInfo.address);

    if (contactInfo.length > 0) {
      html += `<p style="text-align: center; font-size: 12px; color: #64748b; margin: 0 0 8px 0;">${contactInfo.join('  |  ')}</p>`;
    }

    // Links
    const links = [];
    if (personalInfo.linkedin) links.push(`LinkedIn: ${personalInfo.linkedin}`);
    if (personalInfo.github) links.push(`GitHub: ${personalInfo.github}`);
    if (personalInfo.website) links.push(`Web: ${personalInfo.website}`);

    if (links.length > 0) {
      html += `<p style="text-align: center; font-size: 11px; color: #3b82f6; margin: 0 0 20px 0;">${links.join('  |  ')}</p>`;
    }

    // Helper để thêm section
    const addSection = (title, content) => {
      return `
        <div style="margin-top: 20px;">
          <div style="border-bottom: 2px solid #3b82f6; margin-bottom: 12px; padding-bottom: 4px;">
            <h2 style="font-size: 14px; color: #3b82f6; margin: 0; font-weight: bold; text-transform: uppercase;">${title}</h2>
          </div>
          ${content}
        </div>
      `;
    };

    // Tóm tắt
    if (parsedData.summary) {
      html += addSection('Tóm tắt', `<p style="font-size: 12px; color: #334155; margin: 0;">${parsedData.summary}</p>`);
    }

    // Kinh nghiệm
    if (parsedData.experience?.length > 0) {
      let expContent = '';
      parsedData.experience.forEach((exp) => {
        expContent += `
          <div style="margin-bottom: 16px;">
            <p style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 4px 0;">${exp.position || 'Vị trí'} - ${exp.company || 'Công ty'}</p>
            ${exp.startDate || exp.endDate ? `<p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">${exp.startDate || ''} - ${exp.current ? 'Hiện tại' : exp.endDate || ''}</p>` : ''}
            ${exp.description ? `<p style="font-size: 12px; color: #334155; margin: 0 0 6px 0;">${exp.description}</p>` : ''}
            ${exp.achievements?.length > 0 ? `<ul style="margin: 0; padding-left: 20px;">${exp.achievements.map(a => `<li style="font-size: 12px; color: #334155;">${a}</li>`).join('')}</ul>` : ''}
          </div>
        `;
      });
      html += addSection('Kinh nghiệm làm việc', expContent);
    }

    // Học vấn
    if (parsedData.education?.length > 0) {
      let eduContent = '';
      parsedData.education.forEach((edu) => {
        eduContent += `
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 4px 0;">${edu.degree || ''} ${edu.field ? `- ${edu.field}` : ''}</p>
            <p style="font-size: 12px; color: #334155; margin: 0 0 2px 0;">${edu.institution || ''}</p>
            ${edu.startDate || edu.endDate ? `<p style="font-size: 11px; color: #64748b; margin: 0;">${edu.startDate || ''} - ${edu.endDate || ''}</p>` : ''}
            ${edu.gpa ? `<p style="font-size: 11px; color: #334155; margin: 4px 0 0 0;">GPA: ${edu.gpa}</p>` : ''}
          </div>
        `;
      });
      html += addSection('Học vấn', eduContent);
    }

    // Kỹ năng
    if (parsedData.skills) {
      let skillContent = '';
      if (parsedData.skills.technical?.length > 0) {
        skillContent += `<p style="font-size: 12px; color: #334155; margin: 0 0 6px 0;"><strong>Kỹ năng kỹ thuật:</strong> ${parsedData.skills.technical.join(', ')}</p>`;
      }
      if (parsedData.skills.soft?.length > 0) {
        skillContent += `<p style="font-size: 12px; color: #334155; margin: 0 0 6px 0;"><strong>Kỹ năng mềm:</strong> ${parsedData.skills.soft.join(', ')}</p>`;
      }
      if (parsedData.skills.languages?.length > 0) {
        skillContent += `<p style="font-size: 12px; color: #334155; margin: 0;"><strong>Ngôn ngữ:</strong> ${parsedData.skills.languages.map(l => `${l.name} (${l.level})`).join(', ')}</p>`;
      }
      if (skillContent) {
        html += addSection('Kỹ năng', skillContent);
      }
    }

    // Dự án
    if (parsedData.projects?.length > 0) {
      let projContent = '';
      parsedData.projects.forEach((proj) => {
        projContent += `
          <div style="margin-bottom: 12px;">
            <p style="font-size: 13px; font-weight: bold; color: #1e293b; margin: 0 0 4px 0;">${proj.name || 'Dự án'}</p>
            ${proj.description ? `<p style="font-size: 12px; color: #334155; margin: 0 0 4px 0;">${proj.description}</p>` : ''}
            ${proj.technologies?.length > 0 ? `<p style="font-size: 11px; color: #64748b; margin: 0;">Công nghệ: ${proj.technologies.join(', ')}</p>` : ''}
          </div>
        `;
      });
      html += addSection('Dự án', projContent);
    }

    // Chứng chỉ
    if (parsedData.skills?.certifications?.length > 0) {
      let certContent = '';
      parsedData.skills.certifications.forEach((cert) => {
        certContent += `
          <div style="margin-bottom: 8px;">
            <p style="font-size: 12px; color: #334155; margin: 0;">${cert.name}${cert.issuer ? ` - ${cert.issuer}` : ''}</p>
            ${cert.date ? `<p style="font-size: 11px; color: #64748b; margin: 0;">${cert.date}</p>` : ''}
          </div>
        `;
      });
      html += addSection('Chứng chỉ', certContent);
    }

    // Nếu không có parsedData, dùng rawText
    if (!personalInfo.name && rawText) {
      const lines = rawText.split('\n').filter(line => line.trim());
      html += addSection('Nội dung CV', `<div style="font-size: 12px; color: #334155; white-space: pre-wrap;">${lines.join('<br/>')}</div>`);
    }

    html += '</div>';
    return html;
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-[var(--success)]';
    if (score >= 60) return 'text-amber-500';
    return 'text-[var(--error)]';
  };

  const getScoreBgColor = (score) => {
    if (score >= 80) return 'bg-[var(--success)]';
    if (score >= 60) return 'bg-amber-500';
    return 'bg-[var(--error)]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            CV của tôi
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-1">
            Quản lý tất cả CV đã tạo ({filteredResumes.length} CV)
          </p>
        </div>
        <Button
          onClick={() => {
            setActiveTab('upload');
            router.push('/dashboard');
          }}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo CV mới
        </Button>
      </div>

      {/* Toolbar */}
      <Card className="!p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
              <input
                type="text"
                placeholder="Tìm kiếm CV theo tên hoặc chức danh..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--background-secondary)] border border-[var(--border)] rounded-lg text-sm text-[var(--foreground)] placeholder-[var(--foreground-muted)] focus:outline-none focus:border-[var(--primary)]"
              />
            </div>
          </div>

          {/* Sort & View Options */}
          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1 px-3 py-2 bg-[var(--background-secondary)] rounded-lg">
              <span className="text-sm text-[var(--foreground-muted)] hidden sm:inline">
                Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-sm text-[var(--foreground)] focus:outline-none cursor-pointer"
              >
                <option value="date">Ngày tạo</option>
                <option value="name">Tên</option>
                <option value="score">Điểm ATS</option>
              </select>
              <button
                onClick={() =>
                  setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
                }
                className="p-1 hover:bg-[var(--background-tertiary)] rounded"
              >
                {sortOrder === 'asc' ? (
                  <SortAsc className="w-4 h-4 text-[var(--foreground-muted)]" />
                ) : (
                  <SortDesc className="w-4 h-4 text-[var(--foreground-muted)]" />
                )}
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[var(--background-secondary)] rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${
                  viewMode === 'grid'
                    ? 'bg-[var(--background)] text-[var(--foreground)]'
                    : 'text-[var(--foreground-muted)]'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${
                  viewMode === 'list'
                    ? 'bg-[var(--background)] text-[var(--foreground)]'
                    : 'text-[var(--foreground-muted)]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Resume List */}
      {isLoading ? (
        /* Loading State */
        <Card className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-6 animate-pulse">
            <FileText className="w-10 h-10 text-[var(--foreground-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            Đang tải danh sách CV...
          </h3>
        </Card>
      ) : filteredResumes.length > 0 ? (
        viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResumes.map((resume) => (
              <Card key={resume._id} className="relative group">
                {/* Menu Button */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() =>
                      setActiveMenu(
                        activeMenu === resume._id ? null : resume._id
                      )
                    }
                    className="p-1 rounded hover:bg-[var(--background-secondary)] transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[var(--foreground-muted)]" />
                  </button>

                  {/* Dropdown Menu */}
                  {activeMenu === resume._id && (
                    <div className="absolute right-0 mt-1 w-40 bg-[var(--background-elevated)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-10">
                      <button
                        onClick={() => handleViewResume(resume)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                      >
                        <Eye className="w-4 h-4" />
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => handleEditResume(resume)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                      >
                        <Edit3 className="w-4 h-4" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => handleDownload(resume)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--foreground)] hover:bg-[var(--background-secondary)]"
                      >
                        <Download className="w-4 h-4" />
                        Tải xuống
                      </button>
                      <div className="border-t border-[var(--border)]" />
                      <button
                        onClick={() => handleDeleteClick(resume)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--background-secondary)]"
                      >
                        <Trash2 className="w-4 h-4" />
                        Xóa
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div
                  className="cursor-pointer"
                  onClick={() => handleViewResume(resume)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--foreground)] truncate">
                        {resume.parsedData?.personalInfo?.name ||
                          'CV chưa đặt tên'}
                      </h3>
                      <p className="text-sm text-[var(--foreground-muted)] truncate">
                        {resume.parsedData?.personalInfo?.title ||
                          'Chưa có chức danh'}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp
                        className={`w-4 h-4 ${getScoreColor(resume.scores?.atsScore || 0)}`}
                      />
                      <span
                        className={`text-sm font-medium ${getScoreColor(resume.scores?.atsScore || 0)}`}
                      >
                        ATS: {resume.scores?.atsScore || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-[var(--foreground-muted)]">
                      <Calendar className="w-4 h-4" />
                      {new Date(resume.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getScoreBgColor(resume.scores?.atsScore || 0)}`}
                      style={{ width: `${resume.scores?.atsScore || 0}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
                      CV
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => toggleSort('score')}
                    >
                      <div className="flex items-center gap-1">
                        Điểm ATS
                        {sortBy === 'score' &&
                          (sortOrder === 'asc' ? (
                            <SortAsc className="w-3 h-3" />
                          ) : (
                            <SortDesc className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th
                      className="text-left py-3 px-4 text-sm font-medium text-[var(--foreground-muted)] cursor-pointer hover:text-[var(--foreground)]"
                      onClick={() => toggleSort('date')}
                    >
                      <div className="flex items-center gap-1">
                        Ngày tạo
                        {sortBy === 'date' &&
                          (sortOrder === 'asc' ? (
                            <SortAsc className="w-3 h-3" />
                          ) : (
                            <SortDesc className="w-3 h-3" />
                          ))}
                      </div>
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-[var(--foreground-muted)]">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResumes.map((resume) => (
                    <tr
                      key={resume._id}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-[var(--primary)]" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--foreground)]">
                              {resume.parsedData?.personalInfo?.name ||
                                'CV chưa đặt tên'}
                            </p>
                            <p className="text-sm text-[var(--foreground-muted)]">
                              {resume.parsedData?.personalInfo?.title ||
                                'Chưa có chức danh'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${getScoreBgColor(resume.scores?.atsScore || 0)}`}
                              style={{
                                width: `${resume.scores?.atsScore || 0}%`,
                              }}
                            />
                          </div>
                          <span
                            className={`text-sm font-medium ${getScoreColor(resume.scores?.atsScore || 0)}`}
                          >
                            {resume.scores?.atsScore || 0}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-[var(--foreground-muted)]">
                        {new Date(resume.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewResume(resume)}
                            className="p-2 rounded hover:bg-[var(--background-tertiary)] transition-colors"
                            title="Xem chi tiết"
                          >
                            <Eye className="w-4 h-4 text-[var(--foreground-muted)]" />
                          </button>
                          <button
                            onClick={() => handleEditResume(resume)}
                            className="p-2 rounded hover:bg-[var(--background-tertiary)] transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit3 className="w-4 h-4 text-[var(--foreground-muted)]" />
                          </button>
                          <button
                            onClick={() => handleDownload(resume)}
                            className="p-2 rounded hover:bg-[var(--background-tertiary)] transition-colors"
                            title="Tải xuống"
                          >
                            <Download className="w-4 h-4 text-[var(--foreground-muted)]" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(resume)}
                            className="p-2 rounded hover:bg-[var(--error)] hover:bg-opacity-10 transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4 text-[var(--error)]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        /* Empty State */
        <Card className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-[var(--background-secondary)] flex items-center justify-center mb-6">
            <FileText className="w-10 h-10 text-[var(--foreground-muted)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            {searchQuery ? 'Không tìm thấy CV nào' : 'Chưa có CV nào'}
          </h3>
          <p className="text-[var(--foreground-muted)] mb-6 max-w-md mx-auto">
            {searchQuery
              ? 'Thử tìm kiếm với từ khóa khác'
              : 'Hãy tải lên CV đầu tiên của bạn để bắt đầu tối ưu hóa với AI'}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => {
                setActiveTab('upload');
                router.push('/dashboard');
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Tải lên CV đầu tiên
            </Button>
          )}
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowDeleteModal(false)}
          />
          <div className="relative bg-[var(--background-elevated)] rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-2">
              Xác nhận xóa CV
            </h3>
            <p className="text-[var(--foreground-muted)] mb-6">
              Bạn có chắc chắn muốn xóa CV
              <span className="font-medium text-[var(--foreground)]">
                {resumeToDelete?.parsedData?.personalInfo?.name ||
                  'CV chưa đặt tên'}
              </span>
              Hành động này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowDeleteModal(false)}>
                Hủy
              </Button>
              <Button
                onClick={confirmDelete}
                className="bg-[var(--error)] hover:bg-[var(--error)] hover:opacity-90"
              >
                Xóa CV
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
