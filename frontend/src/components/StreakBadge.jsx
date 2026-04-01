const BADGE_TIERS = [
  { key: "fire", days: 10, label: "On Fire", emoji: "🔥" },
  { key: "charged", days: 20, label: "Charged", emoji: "⚡" },
  { key: "diamond", days: 50, label: "Diamond", emoji: "💎" },
  { key: "legend", days: 100, label: "Legend", emoji: "👑" },
  { key: "mythic", days: 200, label: "Mythic", emoji: "🏆" },
];

export function BadgeIcon({ earnedBadges, size = 18 }) {
  if (!earnedBadges || earnedBadges.length === 0) return null;

  const highest = BADGE_TIERS.slice().reverse().find((tier) => earnedBadges.includes(tier.key));
  if (!highest) return null;

  return (
    <span
      title={`${highest.label} badge`}
      aria-label={`${highest.label} badge`}
      className="inline-flex items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/10 align-middle"
      style={{ width: size, height: size, fontSize: Math.max(size - 6, 10) }}
    >
      {highest.emoji}
    </span>
  );
}

const StreakBadge = ({ currentStreak = 0, longestStreak = 0, todayMinutes = 0, timeZone = "Asia/Kolkata", earnedBadges = [] }) => {
  return (
    <div className="bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Study Streak</p>
        <div className="flex items-center gap-2">
          <p className="text-2xl font-black text-white">{currentStreak} day{currentStreak === 1 ? "" : "s"}</p>
          <BadgeIcon earnedBadges={earnedBadges} />
        </div>
      </div>
      <div className="text-right text-sm text-white/70">
        <p>{todayMinutes.toFixed(1)} min today</p>
        <p>Best: {longestStreak} day{longestStreak === 1 ? "" : "s"}</p>
        <p className="text-xs text-white/35">Timezone: {timeZone}</p>
      </div>
    </div>
  );
};

export default StreakBadge;
