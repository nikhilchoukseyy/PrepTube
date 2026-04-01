import Playlist from "../models/Playlist.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import { PRO_PLAN } from "./paymentController.js";

const ANALYTICS_TIMEZONE = "Asia/Kolkata";
const SIGNUP_WINDOW_DAYS = 30;
const RECENT_PURCHASE_LIMIT = 10;
const REVENUE_PER_PREMIUM_USER = Math.round(PRO_PLAN.amount / 100);

function getUtcWindowStart(days) {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - (days - 1));
  return startDate;
}

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function buildDailySeries(rows = [], startDate, totalDays) {
  const countsByDate = new Map(rows.map((row) => [row._id, row.count]));

  return Array.from({ length: totalDays }, (_, index) => {
    const nextDate = new Date(startDate);
    nextDate.setUTCDate(nextDate.getUTCDate() + index);
    const key = formatDateKey(nextDate);

    return {
      date: key,
      count: countsByDate.get(key) || 0,
    };
  });
}

function buildHourlySeries(signups = [], logins = []) {
  const signupMap = new Map(signups.map((row) => [Number(row._id), row.count]));
  const loginMap = new Map(logins.map((row) => [Number(row._id), row.count]));

  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    signups: signupMap.get(hour) || 0,
    logins: loginMap.get(hour) || 0,
  }));
}

export const getAdminAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const signupsStartDate = getUtcWindowStart(SIGNUP_WINDOW_DAYS);
    const activeSince = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const premiumQuery = {
      $or: [{ isPremium: true }, { plan: "premium" }],
      premiumExpiresAt: { $gt: now },
    };

    const [
      totalUsers,
      totalPlaylists,
      totalPremiumUsers,
      totalActiveUsers,
      signupsRaw,
      loginsRaw,
      hourlySignupRaw,
      hourlyLoginRaw,
      topPlaylistsRaw,
    ] = await Promise.all([
      User.countDocuments({}),
      Playlist.countDocuments({}),
      User.countDocuments(premiumQuery),
      User.countDocuments({ updatedAt: { $gte: activeSince } }),
      User.aggregate([
        { $match: { createdAt: { $gte: signupsStartDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { lastLoginAt: { $gte: signupsStartDate } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$lastLoginAt",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        {
          $group: {
            _id: {
              $hour: {
                date: "$createdAt",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { lastLoginAt: { $ne: null } } },
        {
          $group: {
            _id: {
              $hour: {
                date: "$lastLoginAt",
                timezone: ANALYTICS_TIMEZONE,
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      Playlist.aggregate([
        {
          $addFields: {
            memberCount: {
              $add: [
                { $cond: { if: { $isArray: "$members" }, then: { $size: "$members" }, else: 0 } },
                1
              ],
            },
            videoCount: {
              $cond: { if: { $isArray: "$videos" }, then: { $size: "$videos" }, else: 0 }
            },
          },
        },
        { $sort: { memberCount: -1, createdAt: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: User.collection.name,
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
          },
        },
        {
          $project: {
            _id: 0,
            title: 1,
            memberCount: 1,
            videoCount: 1,
            isPublic: 1,
            owner: {
              $ifNull: [
                { $arrayElemAt: ["$ownerDetails.username", 0] },
                { $arrayElemAt: ["$ownerDetails.name", 0] },
              ],
            },
          },
        },
      ]),
    ]);

    const signups = buildDailySeries(signupsRaw, signupsStartDate, SIGNUP_WINDOW_DAYS);
    const logins = buildDailySeries(loginsRaw, signupsStartDate, SIGNUP_WINDOW_DAYS);
    const hourlyActivity = buildHourlySeries(hourlySignupRaw, hourlyLoginRaw);

    const paidPurchaseRecords = await Payment.find({ status: "paid" })
      .sort({ verifiedAt: -1, createdAt: -1 })
      .limit(RECENT_PURCHASE_LIMIT)
      .lean();

    const purchaseUserIds = Array.from(
      new Set(paidPurchaseRecords.map((record) => String(record.userId || "")).filter(Boolean))
    );

    const purchaseUsers = purchaseUserIds.length
      ? await User.find({ _id: { $in: purchaseUserIds } }).select("username name").lean()
      : [];
    const purchaseUserMap = new Map(
      purchaseUsers.map((user) => [String(user._id), user.username || user.name || "Unknown user"])
    );

    const recentPurchases = paidPurchaseRecords.map((record) => ({
      userId: String(record.userId || ""),
      username: purchaseUserMap.get(String(record.userId || "")) || "Unknown user",
      amount: Math.round((record.amount || 0) / 100),
      date: record.verifiedAt || record.createdAt || null,
    }));

    return res.json({
      overview: {
        totalUsers,
        totalPlaylists,
        totalPremiumUsers,
        totalRevenue: totalPremiumUsers * REVENUE_PER_PREMIUM_USER,
        totalActiveUsers,
      },
      signups,
      logins,
      planBreakdown: {
        free: Math.max(totalUsers - totalPremiumUsers, 0),
        premium: totalPremiumUsers,
      },
      topPlaylists: topPlaylistsRaw,
      recentPurchases,
      hourlyActivity,
      retentionByDay: [],
    });
  } catch (error) {
    console.error("getAdminAnalytics error:", error.message);
    return res.status(500).json({ message: "Unable to load admin analytics right now" });
  }
};
