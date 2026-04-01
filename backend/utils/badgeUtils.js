export const BADGE_TIERS = [
  { key: "fire", days: 10, label: "On Fire", emoji: "🔥" },
  { key: "charged", days: 20, label: "Charged", emoji: "⚡" },
  { key: "diamond", days: 50, label: "Diamond", emoji: "💎" },
  { key: "legend", days: 100, label: "Legend", emoji: "👑" },
  { key: "mythic", days: 200, label: "Mythic", emoji: "🏆" },
];

export function getNewlyEarnedBadges(longestStreak, alreadyEarned = []) {
  return BADGE_TIERS
    .filter((tier) => longestStreak >= tier.days && !alreadyEarned.includes(tier.key))
    .map((tier) => tier.key);
}

export function getHighestBadge(earnedBadges = []) {
  if (!earnedBadges.length) return null;

  const earnedSet = new Set(earnedBadges);
  let highest = null;

  for (const tier of BADGE_TIERS) {
    if (earnedSet.has(tier.key)) {
      highest = tier;
    }
  }

  return highest;
}
