'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Edit2,
  Save,
  X,
  ArrowLeft,
  Camera,
  Award,
  TrendingUp,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import { useAuthStore } from '@/store/useAuthStore';
import { useResumeStore } from '@/store/useResumeStore';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateProfile, isLoading, loadUserProfile } = useAuthStore();
  const { resumes, loadResumes } = useResumeStore();

  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    title: '',
    bio: '',
  });

  useEffect(() => {
    // Load user profile from API
    loadUserProfile();
    loadResumes();
  }, [loadUserProfile, loadResumes]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        title: user.title || user.jobTitle || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
      toast.success('Hồ sơ đã được cập nhật');
    } catch (error) {
      toast.error('Cập nhật thất bại');
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      title: user?.title || '',
      bio: user?.bio || '',
    });
    setIsEditing(false);
  };

  // Stats
  const stats = [
    {
      label: 'CV đã tạo',
      value: resumes?.length || 0,
      icon: FileText,
      color: 'var(--primary)',
    },
    {
      label: 'Điểm TB ATS',
      value: resumes?.length
        ? Math.round(
            resumes.reduce((acc, r) => acc + (r.scores?.atsScore || 0), 0) /
              resumes.length
          )
        : 0,
      icon: Award,
      color: 'var(--success)',
    },
    {
      label: 'Gói hiện tại',
      value: user?.plan === 'premium' ? 'Premium' : user?.plan === 'pro' ? 'Pro' : 'Free',
      icon: TrendingUp,
      color: '#F59E0B',
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)]">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[var(--primary)] flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold text-[var(--foreground)]">
                  Hồ sơ cá nhân
                </span>
              </div>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="sm">
                Cài đặt
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <Card className="mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[var(--background-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--background-secondary)] transition-colors">
                  <Camera className="w-4 h-4 text-[var(--foreground-muted)]" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-[var(--foreground)]">
                      {profileData.name || 'Chưa cập nhật tên'}
                    </h1>
                    <p className="text-[var(--foreground-secondary)]">
                      {profileData.title || 'Chưa cập nhật chức danh'}
                    </p>
                  </div>
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Hủy
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSave}
                        loading={isLoading}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        Lưu
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="flex flex-wrap gap-4 mt-4 text-sm text-[var(--foreground-muted)]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profileData.email}
                  </span>
                  {profileData.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {profileData.phone}
                    </span>
                  )}
                  {profileData.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {profileData.location}
                    </span>
                  )}
                </div>

                {/* Bio */}
                {profileData.bio && !isEditing && (
                  <p className="mt-4 text-[var(--foreground-secondary)]">
                    {profileData.bio}
                  </p>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-[var(--border)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Họ và tên"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    icon={<User className="w-5 h-5" />}
                  />
                  <Input
                    label="Chức danh"
                    name="title"
                    value={profileData.title}
                    onChange={handleChange}
                    placeholder="VD: Frontend Developer"
                    icon={<Briefcase className="w-5 h-5" />}
                  />
                  <Input
                    label="Số điện thoại"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    placeholder="0901234567"
                    icon={<Phone className="w-5 h-5" />}
                  />
                  <Input
                    label="Địa chỉ"
                    name="location"
                    value={profileData.location}
                    onChange={handleChange}
                    placeholder="TP. Hồ Chí Minh"
                    icon={<MapPin className="w-5 h-5" />}
                  />
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
                      Giới thiệu bản thân
                    </label>
                    <textarea
                      name="bio"
                      value={profileData.bio}
                      onChange={handleChange}
                      placeholder="Viết vài dòng giới thiệu về bạn..."
                      className="input w-full h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon
                        className="w-6 h-6"
                        style={{ color: stat.color }}
                      />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-[var(--foreground)]">
                        {stat.value}
                      </p>
                      <p className="text-sm text-[var(--foreground-muted)]">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Recent Resumes */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                CV gần đây
              </h2>
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Xem tất cả
                </Button>
              </Link>
            </div>

            {resumes && resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.slice(0, 5).map((resume, index) => (
                  <div
                    key={resume._id || index}
                    className="flex items-center justify-between p-3 bg-[var(--background-secondary)] rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {resume.parsedData?.personalInfo?.name || 'CV chưa đặt tên'}
                        </p>
                        <p className="text-sm text-[var(--foreground-muted)]">
                          ATS: {resume.scores?.atsScore || 0}% • {' '}
                          {new Date(resume.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard?resume=${resume._id}`}>
                      <Button variant="ghost" size="sm">
                        Xem
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--foreground-muted)]">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chưa có CV nào</p>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="mt-4">
                    Tạo CV đầu tiên
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
