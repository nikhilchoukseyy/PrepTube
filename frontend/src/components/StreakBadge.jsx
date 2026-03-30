const StreakBadge = ({ currentStreak = 0, longestStreak = 0, todayMinutes = 0, timeZone = "Asia/Kolkata" }) => {
  return (
    <div className="bg-gradient-to-br from-amber-500/20 to-red-500/10 border border-amber-500/30 rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-amber-200/70">Study Streak</p>
        <p className="text-2xl font-black text-white">{currentStreak} day{currentStreak === 1 ? "" : "s"}</p>
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

