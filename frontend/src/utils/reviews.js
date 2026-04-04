export const DEFAULT_REVIEW_COLOR = "#1f2937";

export const REVIEW_COLOR_OPTIONS = [
  { label: "Midnight", value: "#111827" },
  { label: "Ember", value: "#7c2d12" },
  { label: "Forest", value: "#14532d" },
  { label: "Ocean", value: "#0f3d5e" },
  { label: "Berry", value: "#581c87" },
  { label: "Slate", value: "#334155" },
  { label: "Sand", value: "#f5e6c8" },
  { label: "Blush", value: "#fde2e4" },
];

function expandShortHex(value = "") {
  if (!/^#[0-9a-f]{3}$/i.test(value)) return value;
  const [, r, g, b] = value;
  return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
}

export function normalizeReviewColor(value) {
  if (typeof value !== "string") return DEFAULT_REVIEW_COLOR;

  const trimmedValue = value.trim();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmedValue)) {
    return DEFAULT_REVIEW_COLOR;
  }

  return expandShortHex(trimmedValue);
}

function getRgbFromHex(value) {
  const normalized = normalizeReviewColor(value).slice(1);

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function getReviewTheme(backgroundColor) {
  const resolvedBackground = normalizeReviewColor(backgroundColor);
  const { r, g, b } = getRgbFromHex(resolvedBackground);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  const isDark = luminance < 0.55;

  return {
    backgroundColor: resolvedBackground,
    textPrimary: isDark ? "#f8fafc" : "#111827",
    textSecondary: isDark ? "rgba(248,250,252,0.72)" : "rgba(17,24,39,0.72)",
    textMuted: isDark ? "rgba(248,250,252,0.56)" : "rgba(17,24,39,0.58)",
    borderColor: isDark ? "rgba(255,255,255,0.14)" : "rgba(15,23,42,0.12)",
    chipBackground: isDark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.55)",
    quoteBackground: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.46)",
    imageRing: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.12)",
    shadowColor: isDark ? "rgba(15,23,42,0.34)" : "rgba(15,23,42,0.18)",
    starActive: "#fbbf24",
    starInactive: isDark ? "rgba(255,255,255,0.2)" : "rgba(15,23,42,0.18)",
  };
}
