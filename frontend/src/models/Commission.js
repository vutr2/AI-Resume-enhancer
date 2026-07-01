import mongoose from 'mongoose';

const commissionSchema = new mongoose.Schema(
  {
    affiliateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Affiliate',
      required: true,
    },
    referralId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Referral',
      required: true,
    },
    orderId: {
      type: String,
      required: true,
      trim: true,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'grossAmount phải là số nguyên (VND)',
      },
    },
    commissionAmount: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: 'commissionAmount phải là số nguyên (VND)',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid'],
      default: 'pending',
    },
    // Flags this as a first-payment commission; future renewals can set false
    isFirstPayment: {
      type: Boolean,
      default: true,
    },
    payoutId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payout',
      default: null,
    },
  },
  { timestamps: true }
);

commissionSchema.index({ affiliateId: 1, status: 1 });

const Commission = mongoose.models.Commission || mongoose.model('Commission', commissionSchema);

export default Commission;
