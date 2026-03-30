export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
export const API_ROOT = API_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_ROOT;

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

export function setStoredAuth(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function updateStoredUser(userPatch) {
  const existing = getStoredUser() || {};
  const nextUser = { ...existing, ...userPatch };
  localStorage.setItem("user", JSON.stringify(nextUser));
  return nextUser;
}

export function clearStoredAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function requireAuthRedirect(navigate, redirectTo) {
  navigate(`/login?redirect=${encodeURIComponent(redirectTo)}`);
}

