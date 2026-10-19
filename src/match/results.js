// Combat-derived, match-local values only. Never grant account wallet/rank.
export function matchResult(losingTeam, time, level, stats, gold, score) {
  return {
    outcome: losingTeam === "enemy" ? "Victory" : "Defeat",
    duration: time,
    level,
    ...stats,
    gold,
    score: { ...score },
  };
}
