import mongoose from 'mongoose';

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      index: true,
    },
    resume: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    title: {
      type: String,
      default: 'Thư ứng tuyển',
      maxlength: [200, 'Tiêu đề không được quá 200 ký tự'],
    },
    jobTitle: {
      type: String,
      required: [true, 'Vui lòng nhập vị trí ứng tuyển'],
    },
    companyName: {
      type: String,
      required: [true, 'Vui lòng nhập tên công ty'],
    },
    jobDescription: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
    },
    tone: {
      type: String,
      enum: ['professional', 'friendly', 'enthusiastic', 'formal', 'startup', 'executive'],
      default: 'professional',
    },
    language: {
      type: String,
      enum: ['vi', 'en'],
      default: 'vi',
    },
    versions: [
      {
        version: Number,
        content: String,
        createdAt: Date,
        tone: String,
      },
    ],
    currentVersion: {
      type: Number,
      default: 1,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Xóa model cache nếu đã tồn tại để đảm bảo schema mới được áp dụng
if (mongoose.models.CoverLetter) {
  delete mongoose.models.CoverLetter;
}

const CoverLetter = mongoose.model('CoverLetter', coverLetterSchema);

export default CoverLetter;
