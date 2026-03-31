import crypto from "crypto";
import Razorpay from "razorpay";
import User from "../models/User.js";
import { isPremiumActive, serializeUser } from "../utils/userIdentity.js";
import { trackEvent } from "../utils/analytics.js";

export const PRO_PLAN = Object.freeze({
  id: "premium-monthly",
  name: "PrepTube Premium Monthly",
  description: "Monthly premium access with unlimited playlist collaborators while your plan is active.",
  amount: 9900,
  currency: "INR",
});

const PREMIUM_DURATION_MONTHS = 1;
export const paymentStore = new Map();

function getRazorpayClient() {
  const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    const error = new Error("Razorpay credentials are not configured on the server.");
    error.status = 500;
    throw error;
  }

  return new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
}

function generateReceipt() {
  return `preptube_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function safeCompare(left, right) {
  const leftBuffer = Buffer.from(left || "", "utf8");
  const rightBuffer = Buffer.from(right || "", "utf8");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function addMonths(date, months) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + months);
  return nextDate;
}

function sanitizePaymentRecord(record) {
  if (!record) return null;

  return {
    orderId: record.orderId,
    userId: record.userId,
    paymentId: record.paymentId || null,
    receipt: record.receipt,
    planId: record.planId,
    planName: record.planName,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    premiumExpiresAt: record.premiumExpiresAt || null,
    createdAt: record.createdAt,
    verifiedAt: record.verifiedAt || null,
  };
}

export const createOrder = async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    const receipt = generateReceipt();

    const order = await razorpay.orders.create({
      amount: PRO_PLAN.amount,
      currency: PRO_PLAN.currency,
      receipt,
      notes: {
        planId: PRO_PLAN.id,
        planName: PRO_PLAN.name,
        userId: String(req.user._id),
      },
    });

    paymentStore.set(order.id, {
      orderId: order.id,
      userId: String(req.user._id),
      receipt,
      planId: PRO_PLAN.id,
      planName: PRO_PLAN.name,
      amount: order.amount,
      currency: order.currency,
      status: "created",
      createdAt: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt,
      },
      plan: PRO_PLAN,
    });
  } catch (error) {
    console.error("createOrder error:", error);
    return res.status(error.status || 500).json({
      message: error.message || "Unable to create Razorpay order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { RAZORPAY_KEY_SECRET } = process.env;
    const {
      orderId,
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
    } = req.body || {};

    const resolvedOrderId = String(orderId || razorpayOrderId || "").trim();

    if (!resolvedOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        message: "orderId, razorpay_payment_id, and razorpay_signature are required",
      });
    }

    if (!RAZORPAY_KEY_SECRET) {
      return res.status(500).json({
        message: "Razorpay credentials are not configured on the server.",
      });
    }

    if (razorpayOrderId && razorpayOrderId !== resolvedOrderId) {
      return res.status(400).json({
        message: "Order ID mismatch detected during verification",
      });
    }

    const paymentRecord = paymentStore.get(resolvedOrderId);
    if (!paymentRecord) {
      return res.status(404).json({
        message: "Order not found or has expired from the payment store",
      });
    }

    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${resolvedOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isAuthentic = safeCompare(generatedSignature, razorpaySignature);

    paymentRecord.paymentId = razorpayPaymentId;
    paymentRecord.signature = razorpaySignature;
    paymentRecord.verifiedAt = new Date().toISOString();
    paymentRecord.status = isAuthentic ? "paid" : "verification_failed";

    paymentStore.set(resolvedOrderId, paymentRecord);

    if (!isAuthentic) {
      return res.status(400).json({
        message: "Payment signature verification failed",
        payment: sanitizePaymentRecord(paymentRecord),
      });
    }

    if (paymentRecord.userId !== String(req.user._id)) {
      return res.status(403).json({
        message: "This payment does not belong to the authenticated user.",
      });
    }

    const user = await User.findById(req.user._id).select("name email username avatar isPremium plan premiumExpiresAt");

    if (!user) {
      return res.status(404).json({
        message: "User not found while upgrading plan",
      });
    }

    const renewalBaseDate =
      isPremiumActive(user) && user.premiumExpiresAt ? new Date(user.premiumExpiresAt) : new Date();
    const premiumExpiresAt = addMonths(renewalBaseDate, PREMIUM_DURATION_MONTHS);

    user.isPremium = true;
    user.plan = "premium";
    user.premiumExpiresAt = premiumExpiresAt;
    await user.save();

    paymentRecord.premiumExpiresAt = premiumExpiresAt.toISOString();
    paymentStore.set(resolvedOrderId, paymentRecord);

    trackEvent(req.user._id, "premium_purchased", {
      orderId: resolvedOrderId,
      amount: Math.round((paymentRecord.amount || 0) / 100),
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      payment: sanitizePaymentRecord(paymentRecord),
      user: serializeUser(user),
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({
      message: error.message || "Unable to verify payment",
    });
  }
};
