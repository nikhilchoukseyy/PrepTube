import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receipt: { type: String, required: true },
    planId: { type: String, required: true },
    planName: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    paymentId: { type: String, default: null, unique: true, sparse: true },
    signature: { type: String, default: null, select: false },
    status: {
      type: String,
      enum: ["created", "verification_failed", "paid"],
      default: "created",
      index: true,
    },
    premiumExpiresAt: { type: Date, default: null },
    verifiedAt: { type: Date, default: null },
    lastVerificationAttemptAt: { type: Date, default: null },
  },
  { timestamps: true }
);

paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, verifiedAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;
