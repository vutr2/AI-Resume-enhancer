'use client';

// resumeId: MongoDB _id of the resume (to fetch PDF)
// resume: parsedData (fallback text rendering)
// fileHtml: HTML string converted from Word file for preview
export default function ResumePreview({ resume, resumeId, fileHtml }) {
  if (resumeId) {
    // Word file: render converted HTML
    if (fileHtml) {
      return (
        <div
          className="w-full h-full rounded-lg bg-white overflow-y-auto p-8 text-gray-800 text-sm leading-relaxed"
          style={{ minHeight: '600px' }}
          dangerouslySetInnerHTML={{ __html: fileHtml }}
        />
      );
    }
    // PDF: use iframe
    return (
      <iframe
        src={`/api/resumes/${resumeId}/file`}
        className="w-full h-full rounded-lg bg-white"
        style={{ minHeight: '600px', border: 'none' }}
        title="Resume PDF"
      />
    );
  }

  // Fallback: text-based preview
  if (!resume) {
    return (
      <div className="bg-white rounded-lg p-8 text-center text-gray-400 min-h-[400px] flex items-center justify-center">
        <p>Chưa có dữ liệu CV</p>
      </div>
    );
  }

  const { personalInfo, experience, education, skills } = resume;

  return (
    <div className="bg-white rounded-lg overflow-y-auto h-full font-serif text-gray-800 text-sm leading-relaxed">
      <div className="p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold uppercase tracking-widest text-gray-900">
            {personalInfo?.name || 'Họ và Tên'}
          </h1>
          {personalInfo?.title && (
            <p className="text-sm text-gray-600 mt-1">{personalInfo.title}</p>
          )}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-600">
            {personalInfo?.email && <span>Email: <a href={`mailto:${personalInfo.email}`} className="text-blue-600">{personalInfo.email}</a></span>}
            {personalInfo?.email && personalInfo?.phone && <span>|</span>}
            {personalInfo?.phone && <span>Phone: {personalInfo.phone}</span>}
            {personalInfo?.location && <><span>|</span><span>{personalInfo.location}</span></>}
          </div>
        </div>

        {education && education.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-gray-300 pb-1 mb-3">Education</h2>
            {education.map((edu, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">{edu.school || edu.institution}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{edu.year || edu.duration}</span>
                </div>
                <p className="text-gray-700">{edu.degree}</p>
                {edu.gpa && <p className="text-xs text-gray-500">GPA: {edu.gpa}</p>}
              </div>
            ))}
          </div>
        )}

        {experience && experience.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-gray-300 pb-1 mb-3">Experience</h2>
            {experience.map((exp, i) => (
              <div key={i} className="mb-3">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-gray-900">{exp.title}</span>
                  <span className="text-xs text-gray-500 shrink-0 ml-2">{exp.duration}</span>
                </div>
                <p className="text-gray-700 font-medium">{exp.company}</p>
                {exp.description && <p className="text-xs text-gray-600 mt-1">{exp.description}</p>}
              </div>
            ))}
          </div>
        )}

        {skills && skills.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-gray-300 pb-1 mb-3">Skills</h2>
            <p className="text-gray-700">{skills.join(', ')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
