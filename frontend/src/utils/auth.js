import posthog from "posthog-js";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ROOT = API_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ROOT;

function normalizeStoredUser(user = {}) {
  const resolvedId = String(user?._id || user?.id || "").trim();

  return {
    ...user,
    _id: resolvedId || undefined,
    id: resolvedId || undefined,
    role: user?.role || "user",
    plan: user?.plan || "free",
  };
}

function identifyStoredUser(user) {
  const distinctId = user?._id || user?.id;
  if (!distinctId) return;

  try {
    posthog.identify(String(distinctId), {
      name: user.name,
      email: user.email,
      plan: user.plan || "free",
    });
  } catch {
    // Analytics should never interrupt auth state changes.
  }
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  try {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    return storedUser ? normalizeStoredUser(storedUser) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  const nextUser = normalizeStoredUser(user);
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(nextUser));
  identifyStoredUser(nextUser);
}

export function updateStoredUser(userPatch) {
  const existing = getStoredUser() || {};
  const nextUser = normalizeStoredUser({ ...existing, ...userPatch });
  localStorage.setItem("user", JSON.stringify(nextUser));
  identifyStoredUser(nextUser);
  return nextUser;
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  try {
    posthog.reset();
  } catch {
    // Ignore analytics cleanup issues during logout.
  }
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function requireAuthRedirect(navigate, redirectTo) {
  navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`);
}
