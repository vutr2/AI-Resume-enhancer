import mongoose from 'mongoose';

const affiliateSchema = new mongoose.Schema(
  {
    descopeUserId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    refCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    payoutInfo: {
      bankName: { type: String, trim: true },
      accountNumber: { type: String, trim: true },
      accountHolder: { type: String, trim: true },
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Affiliate = mongoose.models.Affiliate || mongoose.model('Affiliate', affiliateSchema);

export default Affiliate;
