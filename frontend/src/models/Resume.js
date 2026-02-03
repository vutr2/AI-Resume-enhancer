import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: 'CV chưa đặt tên',
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    originalFileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      default: null,
    },
    rawText: {
      type: String,
      default: '',
    },
    parsedData: {
      personalInfo: {
        name: String,
        email: String,
        phone: String,
        address: String,
        linkedin: String,
        github: String,
        website: String,
        avatar: String,
      },
      summary: String,
      experience: [
        {
          company: String,
          position: String,
          location: String,
          startDate: String,
          endDate: String,
          current: Boolean,
          description: String,
          achievements: [String],
        },
      ],
      education: [
        {
          institution: String,
          degree: String,
          field: String,
          startDate: String,
          endDate: String,
          gpa: String,
          achievements: [String],
        },
      ],
      skills: {
        technical: [String],
        soft: [String],
        languages: [
          {
            name: String,
            level: String,
          },
        ],
        certifications: [
          {
            name: String,
            issuer: String,
            date: String,
            url: String,
          },
        ],
      },
      projects: [
        {
          name: String,
          description: String,
          technologies: [String],
          url: String,
          startDate: String,
          endDate: String,
        },
      ],
      awards: [
        {
          title: String,
          issuer: String,
          date: String,
          description: String,
        },
      ],
      references: [
        {
          name: String,
          position: String,
          company: String,
          email: String,
          phone: String,
        },
      ],
    },
    scores: {
      overall: { type: Number, default: 0 },
      atsScore: { type: Number, default: 0 },
      contentScore: { type: Number, default: 0 },
      formatScore: { type: Number, default: 0 },
      keywordScore: { type: Number, default: 0 },
      readabilityScore: { type: Number, default: 0 },
    },
    analysis: {
      strengths: [String],
      weaknesses: [String],
      suggestions: [String],
      keywords: {
        found: [String],
        missing: [String],
        recommended: [String],
      },
      atsIssues: [
        {
          issueType: { type: String },
          severity: { type: String, enum: ['low', 'medium', 'high'] },
          description: { type: String },
          suggestion: { type: String },
        },
      ],
    },
    versions: [
      {
        version: Number,
        createdAt: Date,
        rawText: String,
        parsedData: Object,
        scores: Object,
        changeDescription: String,
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'analyzing', 'analyzed', 'error'],
      default: 'draft',
    },
    tags: [String],
    isFavorite: {
      type: Boolean,
      default: false,
    },
    lastModified: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for searching
resumeSchema.index({ title: 'text', 'parsedData.personalInfo.name': 'text' });

// Update lastModified on save
resumeSchema.pre('save', function (next) {
  this.lastModified = new Date();
  next();
});

// Xóa model cache nếu đã tồn tại để đảm bảo schema mới được áp dụng
if (mongoose.models.Resume) {
  delete mongoose.models.Resume;
}

const Resume = mongoose.model('Resume', resumeSchema);

export default Resume;
