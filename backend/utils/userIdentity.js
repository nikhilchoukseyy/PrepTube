import crypto from "crypto";
import User from "../models/User.js";

export const DEFAULT_TIMEZONE = "Asia/Kolkata";
const GENERATED_AVATAR_HOSTS = [
  "api.dicebear.com/9.x/initials",
  "api.dicebear.com/9.x/thumbs",
  "api.dicebear.com/9.x/adventurer",
  "api.dicebear.com/9.x/fun-emoji",
];
const DATA_IMAGE_PREFIX = /^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i;
const MAX_AVATAR_LENGTH = 1_500_000;

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

export function buildAvatarUrl(seed = "PrepTube") {
  const safeSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${safeSeed}`;
}

export function isGeneratedAvatarUrl(value = "") {
  if (typeof value !== "string") return false;
  return GENERATED_AVATAR_HOSTS.some((host) => value.includes(host));
}

export function normalizeAvatarInput(value) {
  if (typeof value !== "string") return null;

  const trimmedValue = value.trim();
  if (!trimmedValue) return "";

  const isRemoteUrl = /^https?:\/\//i.test(trimmedValue);
  const isDataImage = DATA_IMAGE_PREFIX.test(trimmedValue);

  if (!isRemoteUrl && !isDataImage) {
    return null;
  }

  if (trimmedValue.length > MAX_AVATAR_LENGTH) {
    return null;
  }

  return trimmedValue;
}

export function buildUsernameBase({ username, name, email }) {
  const base = slugify(username || name || email?.split("@")[0] || "learner");
  return base || "learner";
}

export async function generateUniqueUsername(profile, excludeUserId = null) {
  const base = buildUsernameBase(profile);
  let candidate = base;
  let attempt = 0;

  while (attempt < 100) {
    const existing = await User.findOne({ username: candidate }).select("_id");
    if (!existing || (excludeUserId && String(existing._id) === String(excludeUserId))) {
      return candidate;
    }

    attempt += 1;
    candidate = `${base}_${attempt + crypto.randomInt(10, 99)}`.slice(0, 28);
  }

  return `${base}_${Date.now().toString().slice(-6)}`.slice(0, 28);
}

export function pickDisplayName(user = {}) {
  return user.username || user.name || user.email || "User";
}

export function serializeUser(user = {}) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    avatar: user.avatar || buildAvatarUrl(pickDisplayName(user)),
    plan: user.plan || "free",
  };
}

export function getDateKeyInTimezone(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

