import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập họ tên'],
      trim: true,
      maxlength: [100, 'Họ tên không được quá 100 ký tự'],
    },
    email: {
      type: String,
      required: [true, 'Vui lòng nhập email'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ'],
    },
    password: {
      type: String,
      required: [true, 'Vui lòng nhập mật khẩu'],
      minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    plan: {
      type: String,
      enum: ['free', 'basic', 'pro', 'enterprise'],
      default: 'free',
    },
    planExpiresAt: {
      type: Date,
      default: null,
    },
    credits: {
      type: Number,
      default: 10, // Tháng đầu được 10 lượt miễn phí
    },
    // Theo dõi lượt sử dụng theo tháng
    monthlyCreditsUsed: {
      type: Number,
      default: 0,
    },
    // Tháng hiện tại đang tính credits (format: "2024-01")
    currentBillingMonth: {
      type: String,
      default: null,
    },
    // Đánh dấu user đã hết tháng đầu chưa
    isFirstMonth: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastLogin: {
      type: Date,
      default: null,
    },
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
      language: { type: String, default: 'vi' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Check if plan is active
userSchema.methods.isPlanActive = function () {
  if (this.plan === 'free') return true;
  if (!this.planExpiresAt) return false;
  return new Date() < this.planExpiresAt;
};

// Get plan limits
userSchema.methods.getPlanLimits = function () {
  const limits = {
    free: { resumesPerMonth: 3, aiRewritesPerMonth: 5, atsChecksPerMonth: 5 },
    basic: { resumesPerMonth: 10, aiRewritesPerMonth: 20, atsChecksPerMonth: 20 },
    pro: { resumesPerMonth: -1, aiRewritesPerMonth: -1, atsChecksPerMonth: -1 },
    enterprise: { resumesPerMonth: -1, aiRewritesPerMonth: -1, atsChecksPerMonth: -1 },
  };
  return limits[this.plan] || limits.free;
};

// Lấy số credits còn lại trong tháng
userSchema.methods.getMonthlyCredits = function () {
  const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"

  // Nếu là tháng mới, reset credits
  if (this.currentBillingMonth !== currentMonth) {
    return this.isFirstMonth ? 10 : 3;
  }

  // Tính credits còn lại
  const maxCredits = this.isFirstMonth ? 10 : 3;
  return Math.max(0, maxCredits - this.monthlyCreditsUsed);
};

// Kiểm tra có thể sử dụng credit không
userSchema.methods.canUseCredit = function () {
  // User trả phí không giới hạn
  if (['basic', 'pro', 'enterprise'].includes(this.plan) && this.isPlanActive()) {
    return true;
  }
  return this.getMonthlyCredits() > 0;
};

// Sử dụng 1 credit
userSchema.methods.useCredit = async function () {
  const currentMonth = new Date().toISOString().slice(0, 7);

  // User trả phí không cần trừ credit
  if (['basic', 'pro', 'enterprise'].includes(this.plan) && this.isPlanActive()) {
    return true;
  }

  // Nếu sang tháng mới, reset và kiểm tra isFirstMonth
  if (this.currentBillingMonth !== currentMonth) {
    // Nếu đã có billing month trước đó => không còn first month
    if (this.currentBillingMonth !== null) {
      this.isFirstMonth = false;
    }
    this.currentBillingMonth = currentMonth;
    this.monthlyCreditsUsed = 0;
  }

  const maxCredits = this.isFirstMonth ? 10 : 3;

  if (this.monthlyCreditsUsed >= maxCredits) {
    return false; // Hết lượt
  }

  this.monthlyCreditsUsed += 1;
  await this.save();
  return true;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
