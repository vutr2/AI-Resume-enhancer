import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
    },
    commissionIds: {
      type: [mongoose.Schema.Types.ObjectId],
      required: true,
      ref: 'Commission',
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'totalAmount phải là số nguyên (VND)',
      },
    },
    periodStart: { type: Date, required: true },
    periodEnd: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
    },
    paidAt: { type: Date, default: null },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

payoutSchema.index({ affiliateId: 1 });

const Payout = mongoose.models.Payout || mongoose.model('Payout', payoutSchema);

export default Payout;
