import Playlist from "../models/Playlist.js";

const FREE_PLAN_TOTAL_PEOPLE_LIMIT = 6;

function extractInviteToken(rawValue) {
  if (!rawValue || typeof rawValue !== "string") return "";

  const trimmedValue = rawValue.trim();
  if (!trimmedValue) return "";

  try {
    const parsedUrl = new URL(trimmedValue);
    const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
    const joinIndex = pathSegments.findIndex((segment) => segment === "join");

    if (joinIndex !== -1 && pathSegments[joinIndex + 1]) {
      return pathSegments[joinIndex + 1];
    }

    return parsedUrl.searchParams.get("token") || trimmedValue;
  } catch {
    return trimmedValue.split("/").filter(Boolean).pop() || trimmedValue;
  }
}

function hasActivePremium(user) {
  if (typeof user?.isActivePremium === "function") {
    return user.isActivePremium();
  }

  if (!user?.premiumExpiresAt) {
    return false;
  }

  const premiumExpiresAt = new Date(user.premiumExpiresAt);
  const hasPremiumFlag = user?.isPremium === true || user?.plan === "premium";
  return hasPremiumFlag && !Number.isNaN(premiumExpiresAt.getTime()) && premiumExpiresAt.getTime() > Date.now();
}

export async function enforceMemberLimit(req, res, next) {
  try {
    const playlistId = req.params?.playlistId || req.body?.playlistId?.trim();
    const token = extractInviteToken(req.body?.token);

    if (!playlistId && !token) {
      return next();
    }

    let playlist = null;
    if (token) {
      playlist = await Playlist.findOne({ inviteToken: token })
        .select("playlistId owner members")
        .populate("owner", "isPremium plan premiumExpiresAt");
    } else if (playlistId) {
      playlist = await Playlist.findOne({ playlistId, isPublic: true })
        .select("playlistId owner members isPublic")
        .populate("owner", "isPremium plan premiumExpiresAt");
    }

    if (!playlist) {
      return next();
    }

    req.joinTargetPlaylist = playlist;

    if (hasActivePremium(playlist.owner)) {
      return next();
    }

    const totalPeople = (playlist.members?.length || 0) + 1;
    if (totalPeople >= FREE_PLAN_TOTAL_PEOPLE_LIMIT) {
      return res.status(403).json({
        error: "MEMBER_LIMIT_REACHED",
        message: "Upgrade to PrepTube Pro to add more than 6 people to a room.",
        upgradeUrl: "/pricing",
      });
    }

    return next();
  } catch (error) {
    console.error("enforceMemberLimit error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
}
