import { IC } from "../pages/Icons";
import AppImage from "./AppImage";
import { getReviewTheme } from "../utils/reviews";

const ReviewCard = ({ r, className = "" }) => {
  const reviewerName = r?.reviewerName || r?.username || "PrepTube user";
  const field = r?.field || r?.role || "Learner";
  const reviewText = r?.review || "";
  const reviewImage = r?.reviewImage || "";
  const starRating = Math.max(1, Math.min(5, Number(r?.starRating || 5)));
  const theme = getReviewTheme(r?.backgroundColor);
  const initials = reviewerName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const widthClassName = className.includes("w-full") ? "" : "w-[78vw] max-w-[280px] sm:w-[320px] sm:max-w-none";

  return (
    <article
      className={`relative ${widthClassName} shrink-0 overflow-hidden rounded-[24px] border p-4 sm:rounded-[28px] sm:p-5 ${className}`.trim()}
      style={{
        backgroundColor: theme.backgroundColor,
        borderColor: theme.borderColor,
        boxShadow: `0 28px 60px ${theme.shadowColor}`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-4 top-0 h-20 rounded-b-full blur-3xl sm:inset-x-6 sm:h-24"
        style={{ background: theme.quoteBackground }}
      />

      <div className="relative z-10 flex h-full flex-col gap-3 sm:gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-2">
            <div
              className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.18em] sm:px-3 sm:text-[10px] sm:tracking-[0.22em]"
              style={{ backgroundColor: theme.chipBackground, color: theme.textMuted }}
            >
              {field}
            </div>
            <div>
              <p className="truncate text-[13px] font-bold sm:text-sm" style={{ color: theme.textPrimary }}>
                {reviewerName}
              </p>
              <p className="truncate text-[11px] font-medium sm:text-xs" style={{ color: theme.textMuted }}>
                PrepTube review
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1">
            {Array.from({ length: 5 }, (_, index) => (
              <IC.Star
                key={`${reviewerName}-star-${index}`}
                className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                style={{ color: index < starRating ? theme.starActive : theme.starInactive }}
              />
            ))}
          </div>
        </div>

        {reviewImage ? (
          <div
            className="flex items-center justify-center overflow-hidden rounded-[20px] p-2.5 sm:rounded-[24px] sm:p-3"
            style={{ backgroundColor: theme.quoteBackground, boxShadow: `0 0 0 1px ${theme.imageRing}` }}
          >
            <div className="w-full max-w-[420px] overflow-hidden rounded-[16px] bg-black/10 aspect-[4/3] sm:rounded-[18px]">
              <AppImage
                src={reviewImage}
                alt={`${reviewerName} review screenshot`}
                width={800}
                height={600}
                sizes="(min-width: 640px) 320px, 78vw"
                className="block h-full w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div
            className="flex h-[180px] items-center justify-center rounded-[20px] text-4xl font-black sm:h-[220px] sm:rounded-[24px] sm:text-5xl"
            style={{ backgroundColor: theme.quoteBackground, color: theme.textPrimary }}
          >
            {initials || "P"}
          </div>
        )}

        {reviewText ? (
          <div
            className="rounded-[20px] p-3 sm:rounded-[24px] sm:p-4"
            style={{ backgroundColor: theme.quoteBackground }}
          >
            <p
              className="text-[13px] leading-relaxed sm:text-sm"
              style={{ color: theme.textSecondary }}
            >
              {reviewText}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
};

export default ReviewCard;
