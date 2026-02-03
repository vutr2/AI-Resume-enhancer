'use client';

import { User, Briefcase, GraduationCap, Wrench, Mail, Phone, MapPin } from 'lucide-react';
import Card from '../ui/Card';

export default function ResumePreview({ resume }) {
  if (!resume) {
    return (
      <Card className="text-center py-12">
        <p className="text-[var(--foreground-muted)]">Chưa có dữ liệu CV</p>
      </Card>
    );
  }

  const { personalInfo, experience, education, skills } = resume;

  return (
    <div className="space-y-6">
      {/* Personal Info */}
      <Card>
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[var(--primary)] bg-opacity-10 flex items-center justify-center">
            <User className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-[var(--foreground)]">
              {personalInfo?.name || 'Chưa có tên'}
            </h2>
            <p className="text-[var(--foreground-secondary)]">
              {personalInfo?.title || 'Chưa có chức danh'}
            </p>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-[var(--foreground-muted)]">
              {personalInfo?.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {personalInfo.email}
                </span>
              )}
              {personalInfo?.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-4 h-4" />
                  {personalInfo.phone}
                </span>
              )}
              {personalInfo?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {personalInfo.location}
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Experience */}
      {experience && experience.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Briefcase className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Kinh nghiệm</h3>
          </div>
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-[var(--border)] pl-4">
                <h4 className="font-medium text-[var(--foreground)]">{exp.title}</h4>
                <p className="text-[var(--foreground-secondary)]">{exp.company}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{exp.duration}</p>
                {exp.description && (
                  <p className="text-sm text-[var(--foreground-secondary)] mt-2">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Học vấn</h3>
          </div>
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="border-l-2 border-[var(--border)] pl-4">
                <h4 className="font-medium text-[var(--foreground)]">{edu.degree}</h4>
                <p className="text-[var(--foreground-secondary)]">{edu.school}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{edu.year}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-lg font-semibold text-[var(--foreground)]">Kỹ năng</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-[var(--background-secondary)] text-[var(--foreground)] rounded-full text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
