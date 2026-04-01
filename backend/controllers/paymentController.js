import crypto from "crypto";
import Razorpay from "razorpay";
import Payment from "../models/Payment.js";
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
const WEBHOOK_PREMIUM_DURATION_DAYS = 30;

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

function addDays(date, days) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function toIsoString(value) {
  if (!value) return null;

  const normalizedValue = value instanceof Date ? value : new Date(value);
  return Number.isNaN(normalizedValue.getTime()) ? null : normalizedValue.toISOString();
}

function sanitizePaymentRecord(record) {
  if (!record) return null;

  return {
    orderId: record.orderId,
    userId: String(record.userId || ""),
    paymentId: record.paymentId || null,
    receipt: record.receipt,
    planId: record.planId,
    planName: record.planName,
    amount: record.amount,
    currency: record.currency,
    status: record.status,
    premiumExpiresAt: toIsoString(record.premiumExpiresAt),
    createdAt: toIsoString(record.createdAt),
    verifiedAt: toIsoString(record.verifiedAt),
  };
}

async function loadCurrentUser(userId) {
  return User.findById(userId).select("name email username avatar isPremium plan premiumExpiresAt");
}

async function applyPremiumUpgrade({
  userId,
  orderId,
  extensionDateCalculator,
}) {
  const user = await User.findById(userId).select(
    "name email username avatar isPremium plan premiumExpiresAt +processedPaymentOrderIds"
  );

  if (!user) {
    return {
      status: "missing_user",
      user: null,
      premiumExpiresAt: null,
    };
  }

  if (user.processedPaymentOrderIds?.includes(orderId)) {
    return {
      status: "already_applied",
      user,
      premiumExpiresAt: user.premiumExpiresAt || null,
    };
  }

  const premiumExpiresAt = extensionDateCalculator(user);

  const updatedUser = await User.findOneAndUpdate(
    {
      _id: userId,
      processedPaymentOrderIds: { $ne: orderId },
    },
    {
      $set: {
        isPremium: true,
        plan: "premium",
        premiumExpiresAt,
      },
      $addToSet: {
        processedPaymentOrderIds: orderId,
      },
    },
    {
      new: true,
    }
  ).select("name email username avatar isPremium plan premiumExpiresAt");

  if (!updatedUser) {
    const currentUser = await loadCurrentUser(userId);

    return {
      status: "already_applied",
      user: currentUser,
      premiumExpiresAt: currentUser?.premiumExpiresAt || null,
    };
  }

  return {
    status: "applied",
    user: updatedUser,
    premiumExpiresAt,
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

    await Payment.findOneAndUpdate(
      { orderId: order.id },
      {
        $set: {
          userId: req.user._id,
          receipt,
          planId: PRO_PLAN.id,
          planName: PRO_PLAN.name,
          amount: order.amount,
          currency: order.currency,
          status: "created",
          paymentId: null,
          premiumExpiresAt: null,
          verifiedAt: null,
          lastVerificationAttemptAt: null,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

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

    const paymentRecord = await Payment.findOne({ orderId: resolvedOrderId }).select("+signature");
    if (!paymentRecord) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    if (String(paymentRecord.userId) !== String(req.user._id)) {
      return res.status(403).json({
        message: "This payment does not belong to the authenticated user.",
      });
    }

    if (paymentRecord.status === "paid") {
      if (paymentRecord.paymentId && paymentRecord.paymentId !== razorpayPaymentId) {
        return res.status(409).json({
          message: "This order was already verified with a different payment reference.",
        });
      }

      const currentUser = await loadCurrentUser(req.user._id);

      return res.status(200).json({
        message: "Payment already verified",
        payment: sanitizePaymentRecord(paymentRecord),
        user: currentUser ? serializeUser(currentUser) : null,
      });
    }

    const verificationAttemptedAt = new Date();
    const generatedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(`${resolvedOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    const isAuthentic = safeCompare(generatedSignature, razorpaySignature);

    if (!isAuthentic) {
      paymentRecord.paymentId = razorpayPaymentId;
      paymentRecord.signature = razorpaySignature;
      paymentRecord.lastVerificationAttemptAt = verificationAttemptedAt;
      paymentRecord.verifiedAt = verificationAttemptedAt;
      paymentRecord.status = "verification_failed";
      await paymentRecord.save();

      return res.status(400).json({
        message: "Payment signature verification failed",
        payment: sanitizePaymentRecord(paymentRecord),
      });
    }

    const upgradeResult = await applyPremiumUpgrade({
      userId: req.user._id,
      orderId: resolvedOrderId,
      extensionDateCalculator: (user) => {
        const renewalBaseDate =
          isPremiumActive(user) && user.premiumExpiresAt
            ? new Date(user.premiumExpiresAt)
            : verificationAttemptedAt;
        return addMonths(renewalBaseDate, PREMIUM_DURATION_MONTHS);
      },
    });

    if (upgradeResult.status === "missing_user") {
      return res.status(404).json({
        message: "User not found while upgrading plan",
      });
    }

    if (upgradeResult.status === "already_applied") {
      paymentRecord.paymentId = razorpayPaymentId;
      paymentRecord.signature = razorpaySignature;
      paymentRecord.lastVerificationAttemptAt = verificationAttemptedAt;
      paymentRecord.verifiedAt = verificationAttemptedAt;
      paymentRecord.status = "paid";
      paymentRecord.premiumExpiresAt = upgradeResult.premiumExpiresAt || paymentRecord.premiumExpiresAt;
      await paymentRecord.save();

      return res.status(200).json({
        message: "Payment already verified",
        payment: sanitizePaymentRecord(paymentRecord),
        user: upgradeResult.user ? serializeUser(upgradeResult.user) : null,
      });
    }

    paymentRecord.paymentId = razorpayPaymentId;
    paymentRecord.signature = razorpaySignature;
    paymentRecord.lastVerificationAttemptAt = verificationAttemptedAt;
    paymentRecord.verifiedAt = verificationAttemptedAt;
    paymentRecord.status = "paid";
    paymentRecord.premiumExpiresAt = upgradeResult.premiumExpiresAt;
    await paymentRecord.save();

    trackEvent(req.user._id, "premium_purchased", {
      orderId: resolvedOrderId,
      amount: Math.round((paymentRecord.amount || 0) / 100),
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      payment: sanitizePaymentRecord(paymentRecord),
      user: serializeUser(upgradeResult.user),
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    return res.status(500).json({
      message: error.message || "Unable to verify payment",
    });
  }
};

export const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.warn("Razorpay webhook secret is missing. Webhook events are being ignored.");
    return res.status(200).json({ received: true, ignored: true });
  }

  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(req.body || "");
    const signatureHeader = String(req.headers["x-razorpay-signature"] || "");

    if (!signatureHeader) {
      console.warn("Received Razorpay webhook without x-razorpay-signature header.");
      return res.status(200).json({ received: true, ignored: true });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (!safeCompare(expectedSignature, signatureHeader)) {
      console.warn("Received Razorpay webhook with invalid signature.");
      return res.status(200).json({ received: true, ignored: true });
    }

    const event = JSON.parse(rawBody.toString("utf8"));

    if (event?.event !== "payment.captured") {
      return res.status(200).json({ received: true, ignored: true });
    }

    const paymentEntity = event?.payload?.payment?.entity;
    const orderId = String(paymentEntity?.order_id || "").trim();
    const razorpayPaymentId = String(paymentEntity?.id || "").trim();

    if (!orderId) {
      console.warn("Received payment.captured webhook without an order_id.");
      return res.status(200).json({ received: true, ignored: true });
    }

    const paymentRecord = await Payment.findOne({ orderId });
    if (!paymentRecord) {
      console.warn(`Received payment.captured webhook for unknown order ${orderId}.`);
      return res.status(200).json({ received: true, ignored: true });
    }

    if (paymentRecord.status === "paid") {
      return res.status(200).json({ received: true, ignored: true });
    }

    const capturedAt = new Date();
    const upgradeResult = await applyPremiumUpgrade({
      userId: paymentRecord.userId,
      orderId,
      extensionDateCalculator: (user) => {
        const renewalBaseDate =
          isPremiumActive(user) && user.premiumExpiresAt
            ? new Date(user.premiumExpiresAt)
            : capturedAt;
        return addDays(renewalBaseDate, WEBHOOK_PREMIUM_DURATION_DAYS);
      },
    });

    if (upgradeResult.status === "missing_user") {
      console.warn(`Received payment.captured webhook for order ${orderId}, but user was not found.`);
      return res.status(200).json({ received: true, ignored: true });
    }

    paymentRecord.paymentId = razorpayPaymentId || paymentRecord.paymentId;
    paymentRecord.lastVerificationAttemptAt = capturedAt;
    paymentRecord.verifiedAt = capturedAt;
    paymentRecord.status = "paid";
    paymentRecord.premiumExpiresAt = upgradeResult.premiumExpiresAt || paymentRecord.premiumExpiresAt;
    await paymentRecord.save();

    if (upgradeResult.status === "applied") {
      trackEvent(paymentRecord.userId, "premium_purchased", {
        orderId,
        amount: Math.round((paymentRecord.amount || 0) / 100),
      });
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("handleWebhook error:", error);
    return res.status(200).json({ received: true, ignored: true });
  }
};
