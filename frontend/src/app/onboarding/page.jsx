'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, User, Briefcase, MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import toast from 'react-hot-toast';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          onboardingCompleted: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local user state
        setUser(data.data.user);
        toast.success('Hoàn thành hồ sơ!');
        router.push('/dashboard');
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Complete profile error:', error);
      toast.error('Có lỗi xảy ra');
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-[var(--foreground)]">
            ResuMax VN
          </span>
        </div>

        <Card>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-center text-[var(--foreground)] mb-2">
              Hoàn thành hồ sơ
            </h1>
            <p className="text-center text-[var(--foreground-secondary)]">
              Giúp chúng tôi hiểu bạn hơn để tối ưu CV tốt hơn
            </p>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
            <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-[var(--primary)]' : 'bg-[var(--border)]'}`} />
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4">
                <Input
                  label="Họ và tên"
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Nguyễn Văn A"
                  required
                  icon={<User className="w-5 h-5" />}
                />

                <Input
                  label="Số điện thoại"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="0912 345 678"
                  icon={<Phone className="w-5 h-5" />}
                />

                <Input
                  label="Địa điểm"
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Hà Nội, Việt Nam"
                  icon={<MapPin className="w-5 h-5" />}
                />

                <Button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full mt-6"
                  size="lg"
                >
                  Tiếp tục
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <Input
                  label="Vị trí công việc mong muốn"
                  type="text"
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  placeholder="Software Engineer, Marketing Manager..."
                  icon={<Briefcase className="w-5 h-5" />}
                />

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Kinh nghiệm làm việc
                  </label>
                  <select
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">Chọn kinh nghiệm</option>
                    {experienceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                    Ngành nghề
                  </label>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-[var(--background)] border border-[var(--border)] rounded-lg text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="">Chọn ngành nghề</option>
                    {industryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    size="lg"
                  >
                    Quay lại
                  </Button>
                  <Button
                    type="submit"
                    loading={isLoading}
                    className="flex-1"
                    size="lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      'Hoàn thành'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <p className="mt-6 text-center text-xs text-[var(--foreground-muted)]">
            Bạn có thể cập nhật thông tin này sau trong phần Hồ sơ cá nhân
          </p>
        </Card>
      </div>
    </div>
  );
}
