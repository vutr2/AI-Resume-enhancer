'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Briefcase, MapPin, Phone,
  ArrowRight, Check, X, Sparkles, Shield, Mail,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import DauViecLogo from '@/components/ui/DauViecLogo';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import ResumeUploader from '@/components/resume/ResumeUploader';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  const { uploadResume, isUploading, uploadProgress, scores, analysis } = useResumeStore();

  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: '',
    location: '',
    jobTitle: '',
    experience: '',
    industry: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/complete-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, onboardingCompleted: true }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.data.user);
        toast.success('Hoàn thành hồ sơ!');
        setStep(3);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch {
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file) => {
    const result = await uploadResume(file);
    if (result.success) {
      setStep(4);
    }
  };

  const atsScore = scores?.atsScore ?? scores?.overall ?? null;
  const scoreColor =
    atsScore >= 80 ? 'text-[var(--success)]' : atsScore >= 60 ? 'text-amber-500' : 'text-[var(--error)]';
  const scoreBg =
    atsScore >= 80 ? 'bg-[var(--success)]' : atsScore >= 60 ? 'bg-amber-500' : 'bg-[var(--error)]';
  const scoreLabel =
    atsScore >= 80 ? 'CV của bạn tương thích tốt!' : atsScore >= 60 ? 'Có thể cải thiện thêm' : 'Cần tối ưu nhiều hơn';

  // Progress phases: phase 1 = steps 1-2, phase 2 = step 3, phase 3 = steps 4-5
  const phase = step <= 2 ? 1 : step === 3 ? 2 : 3;

  const experienceOptions = [
    { value: 'fresher', label: 'Fresher (0-1 năm)' },
    { value: 'junior', label: 'Junior (1-3 năm)' },
    { value: 'middle', label: 'Middle (3-5 năm)' },
    { value: 'senior', label: 'Senior (5-10 năm)' },
    { value: 'expert', label: 'Expert (10+ năm)' },
  ];

  const industryOptions = [
    { value: 'it', label: 'Công nghệ thông tin' },
    { value: 'finance', label: 'Tài chính - Ngân hàng' },
    { value: 'marketing', label: 'Marketing - Truyền thông' },
    { value: 'sales', label: 'Kinh doanh - Bán hàng' },
    { value: 'hr', label: 'Nhân sự' },
    { value: 'education', label: 'Giáo dục' },
    { value: 'healthcare', label: 'Y tế - Sức khỏe' },
    { value: 'manufacturing', label: 'Sản xuất' },
    { value: 'retail', label: 'Bán lẻ' },
    { value: 'other', label: 'Khác' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <DauViecLogo size={40} />
          <span className="text-2xl font-bold text-[var(--foreground)]">Đậu Việc</span>
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">
              {step <= 2 ? 'Hoàn thành hồ sơ' : step === 3 ? 'Tải lên CV của bạn' : step === 4 ? 'Kết quả ATS của bạn' : 'Bắt đầu tối ưu hóa'}
            </h1>
            <p className="text-center text-[var(--foreground-secondary)] text-sm">
              {step <= 2 ? 'Giúp chúng tôi hiểu bạn hơn để tối ưu CV tốt hơn' : step === 3 ? 'AI sẽ phân tích và chấm điểm CV của bạn ngay lập tức' : step === 4 ? 'Đây là điểm số và nhận xét ban đầu cho CV của bạn' : 'Chọn tính năng bạn muốn khám phá trước'}
            </p>
          </div>

          {/* 3-phase progress bar */}
          <div className="flex items-center justify-center gap-1 mb-8">
            {[1, 2, 3].map((p, i) => (
              <div key={p} className="flex items-center gap-1">
                <div className={`w-3 h-3 rounded-full transition-colors ${phase >= p ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                {i < 2 && (
                  <div className={`w-12 h-0.5 transition-colors ${phase > p ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-[var(--foreground-muted)] -mt-6 mb-6 px-1">
            <span className={phase >= 1 ? 'text-[var(--primary)]' : ''}>Hồ sơ</span>
            <span className={phase >= 2 ? 'text-[var(--primary)]' : ''}>Tải CV</span>
            <span className={phase >= 3 ? 'text-[var(--primary)]' : ''}>Kết quả</span>
          </div>

          {/* ── Step 1: Basic info ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
              <div className="space-y-4">
                <Input label="Họ và tên" type="text" name="name" value={formData.name}
                  onChange={handleChange} placeholder="Nguyễn Văn A" required
                  icon={<User className="w-5 h-5" />} />
                <Input label="Số điện thoại" type="tel" name="phone" value={formData.phone}
                  onChange={handleChange} placeholder="0912 345 678"
                  icon={<Phone className="w-5 h-5" />} />
                <Input label="Địa điểm" type="text" name="location" value={formData.location}
                  onChange={handleChange} placeholder="Hà Nội, Việt Nam"
                  icon={<MapPin className="w-5 h-5" />} />
                <Button type="submit" className="w-full mt-6" size="lg">
                  Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </form>
          )}

          {/* ── Step 2: Job preferences ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <Input label="Vị trí công việc mong muốn" type="text" name="jobTitle"
                  value={formData.jobTitle} onChange={handleChange}
                  placeholder="Software Engineer, Marketing Manager..."
                  icon={<Briefcase className="w-5 h-5" />} />
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Kinh nghiệm làm việc
                  </label>
                  <select name="experience" value={formData.experience} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="">Chọn kinh nghiệm</option>
                    {experienceOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Ngành nghề
                  </label>
                  <select name="industry" value={formData.industry} onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]">
                    <option value="">Chọn ngành nghề</option>
                    {industryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="flex gap-3 mt-6">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1" size="lg">
                    Quay lại
                  </Button>
                  <Button type="submit" loading={isLoading} className="flex-1" size="lg">
                    {isLoading ? 'Đang lưu...' : 'Hoàn thành'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* ── Step 3: Upload CV ── */}
          {step === 3 && (
            <div className="space-y-4">
              <ResumeUploader onUpload={handleUpload} isLoading={isUploading} />
              {isUploading && uploadProgress?.message && (
                <p className="text-sm text-center text-[var(--foreground-muted)] animate-pulse">
                  {uploadProgress.message}
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setStep(5)}
                disabled={isUploading}
              >
                Bỏ qua, làm sau
              </Button>
            </div>
          )}

          {/* ── Step 4: ATS Score ── */}
          {step === 4 && (
            <div className="space-y-5">
              {/* Score circle */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold ${scoreBg}`}>
                  {atsScore ?? '—'}
                </div>
                <p className={`text-sm font-medium ${scoreColor}`}>{scoreLabel}</p>
                <p className="text-xs text-[var(--foreground-muted)]">Điểm ATS / 100</p>
              </div>

              {/* Strengths */}
              {analysis?.strengths?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-2">Điểm mạnh</p>
                  <ul className="space-y-1">
                    {analysis.strengths.slice(0, 3).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <Check className="w-4 h-4 text-[var(--success)] mt-0.5 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Weaknesses */}
              {(analysis?.weaknesses?.length > 0 || analysis?.atsIssues?.length > 0) && (
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground-muted)] uppercase mb-2">Cần cải thiện</p>
                  <ul className="space-y-1">
                    {(analysis.weaknesses ?? analysis.atsIssues ?? []).slice(0, 3).map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--foreground)]">
                        <X className="w-4 h-4 text-[var(--error)] mt-0.5 flex-shrink-0" />
                        {typeof w === 'string' ? w : w.description ?? w.issueType ?? ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="ghost" className="flex-1" onClick={() => router.push('/dashboard')}>
                  Bỏ qua
                </Button>
                <Button className="flex-1" onClick={() => setStep(5)}>
                  Tiếp tục <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 5: What's next ── */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:bg-opacity-5 transition-all text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--primary)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Viết lại CV với AI</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Tối ưu nội dung theo phong cách bạn muốn</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--foreground-muted)] ml-auto" />
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-4 rounded-xl border border-[var(--border)] hover:border-[var(--success)] hover:bg-[var(--success)] hover:bg-opacity-5 transition-all text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[var(--success)] bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-[var(--success)]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Kiểm tra ATS chi tiết</p>
                    <p className="text-xs text-[var(--foreground-muted)]">Phân tích đầy đủ các vấn đề định dạng và từ khóa</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--foreground-muted)] ml-auto" />
                </button>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="p-4 rounded-xl border border-[var(--border)] hover:border-amber-500 hover:bg-amber-500 hover:bg-opacity-5 transition-all text-left flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500 bg-opacity-10 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">Tạo thư ứng tuyển</p>
                    <p className="text-xs text-[var(--foreground-muted)]">AI viết thư riêng cho từng công ty bạn ứng tuyển</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[var(--foreground-muted)] ml-auto" />
                </button>
              </div>

              <Button className="w-full mt-2" size="lg" onClick={() => router.push('/dashboard')}>
                Vào Dashboard ngay
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step <= 2 && (
            <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
              Bạn có thể cập nhật thông tin này sau trong phần Hồ sơ cá nhân
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
