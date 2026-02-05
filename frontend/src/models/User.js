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

// Get plan limits - uses centralized plan config
userSchema.methods.getPlanLimits = function () {
  // Import dynamically to avoid circular deps in model file
  // For atomic credit operations, use lib/credits.js instead
  const limits = {
    free: { resumesPerMonth: 3, aiCreditsPerMonth: 5 },
    basic: { resumesPerMonth: 10, aiCreditsPerMonth: 20 },
    pro: { resumesPerMonth: -1, aiCreditsPerMonth: -1 },
    enterprise: { resumesPerMonth: -1, aiCreditsPerMonth: -1 },
  };
  const planKey = this.isPlanActive() ? (this.plan || 'free') : 'free';
  return limits[planKey] || limits.free;
};

// Lấy số credits còn lại trong tháng
userSchema.methods.getMonthlyCredits = function () {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const planLimits = this.getPlanLimits();
  const maxCredits = planLimits.aiCreditsPerMonth;

  // Unlimited plan
  if (maxCredits === -1) return -1;

  // Nếu là tháng mới, reset credits
  if (this.currentBillingMonth !== currentMonth) {
    return maxCredits;
  }

  return Math.max(0, maxCredits - (this.monthlyCreditsUsed || 0));
};

// Kiểm tra có thể sử dụng credit không
userSchema.methods.canUseCredit = function () {
  const credits = this.getMonthlyCredits();
  return credits === -1 || credits > 0;
};

// Sử dụng 1 credit
// NOTE: For production use, prefer atomicConsumeCredit() from lib/credits.js
// This method is NOT atomic and can have race conditions
userSchema.methods.useCredit = async function () {
  const currentMonth = new Date().toISOString().slice(0, 7);
  const planLimits = this.getPlanLimits();
  const maxCredits = planLimits.aiCreditsPerMonth;

  // Unlimited plan - no credit consumed
  if (maxCredits === -1) return true;

  // Nếu sang tháng mới, reset
  if (this.currentBillingMonth !== currentMonth) {
    this.currentBillingMonth = currentMonth;
    this.monthlyCreditsUsed = 0;
  }

  if (this.monthlyCreditsUsed >= maxCredits) {
    return false; // Hết lượt
  }

  this.monthlyCreditsUsed += 1;
  await this.save();
  return true;
};

// Indexes for performance
userSchema.index({ descopeId: 1 }, { sparse: true });
userSchema.index({ plan: 1, planExpiresAt: 1 });

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
