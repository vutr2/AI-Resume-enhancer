import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
    },
    refCode: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    referredUserId: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['signed_up', 'converted'],
      default: 'signed_up',
    },
    clickedAt: { type: Date, default: null },
    signedUpAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

referralSchema.index({ affiliateId: 1 });
referralSchema.index({ referredUserId: 1, affiliateId: 1 });

const Referral = mongoose.models.Referral || mongoose.model('Referral', referralSchema);

export default Referral;
