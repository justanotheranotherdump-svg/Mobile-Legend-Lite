import lane from "../data/match/lane.json" with { type: "json" };
import difficulties from "../data/match/difficulty.json" with { type: "json" };
import rules from "../data/match/rules.json" with { type: "json" };
import equipment from "../data/match/items.json" with { type: "json" };
import { number, integer } from "../simulation/stats/validation.js";
export { lane, difficulties, rules, equipment };
export function createMatchConfig(
  mode,
  difficulty = "normal",
  teamSize = 5,
  roster = null,
) {
  if (!Object.hasOwn(rules, mode))
    throw Error("match.mode: unsupported offline mode");
  if (!Object.hasOwn(difficulties, difficulty))
    throw Error("match.difficulty: expected easy, normal or hard");
  integer(teamSize, "match.teamSize", 1, 5);
  integer(rules[mode].level, `rules.${mode}.level`, 1, 15);
  integer(rules[mode].gold, `rules.${mode}.gold`, 0);
  if (typeof rules[mode].tools !== "boolean")
    throw Error(`rules.${mode}.tools: expected boolean`);
  return {
    mode,
    difficulty,
    teamSize,
    ...(roster ? validateRoster(roster) : {}),
    heroId: "layla",
    seed: 20261018,
    ...structuredClone(rules[mode]),
  };
}
export function validateLane(data = lane) {
  number(data.halfSize, "lane.halfSize", 10, 100);
  number(data.laneHalfWidth, "lane.laneHalfWidth", 2, data.halfSize);
  for (const team of ["player", "enemy"])
    for (const key of ["x", "z"])
      number(
        data.spawn[team][key],
        `lane.spawn.${team}.${key}`,
        -data.halfSize,
        data.halfSize,
      );
  for (const key of [
    "countdown",
    "spawnProtection",
    "spawnHealPerSecond",
    "rewardRadius",
    "assistWindow",
  ])
    number(data[key], `lane.${key}`, 0);
  for (const key of ["base", "perCompletedMinute", "cap"])
    number(data.respawn[key], `lane.respawn.${key}`, 0);
  if (data.respawn.cap < data.respawn.base)
    throw Error("Respawn cap below base");
  for (const key of ["gold", "xp"])
    integer(data.heroReward[key], `lane.heroReward.${key}`, 0);
  for (const key of [
    "detectRange",
    "attackRange",
    "abilityRange",
    "abilityBase",
    "abilityScaling",
    "abilityMana",
    "abilityCooldown",
  ])
    number(data.bot[key], `lane.bot.${key}`, 0);
  for (const obstacle of data.obstacles)
    for (const key of ["x", "z", "width", "depth"])
      number(
        obstacle[key],
        `lane.obstacle.${key}`,
        ["width", "depth"].includes(key) ? 0 : -1000,
      );

  number(data.wave.interval, "lane.wave.interval", 1, 120);
  integer(data.wave.size, "lane.wave.size", 1, 10);
  for (const k of [
    "firstAt",
    "hp",
    "physicalDefense",
    "magicDefense",
    "damage",
    "speed",
    "range",
    "cooldown",
    "gold",
    "xp",
  ])
    number(
      data.wave[k],
      `lane.wave.${k}`,
      k === "hp" || k === "cooldown" || k === "speed" ? 0.01 : 0,
    );
  const ids = new Set(data.objectives.map((o) => o.id));
  if (ids.size !== 6)
    throw Error("lane.objectives: six unique structures required");
  for (const team of ["player", "enemy"]) {
    const chain = data.objectives
      .filter((o) => o.team === team)
      .sort((a, b) => a.order - b.order);
    if (chain.map((o) => o.kind).join() !== "tower,tower,core")
      throw Error("lane.objectives: two towers then core per team required");
    chain.forEach((o, i) => {
      if (o.requires !== (i ? chain[i - 1].id : null))
        throw Error(`lane.objectives.${o.id}.requires: invalid progression`);
    });
  }
  for (const team of ["player", "enemy"]) {
    for (const key of ["x", "z"])
      number(
        data.wave.spawn[team][key],
        `lane.wave.spawn.${team}.${key}`,
        -data.halfSize,
        data.halfSize,
      );
    const expected = data.objectives
      .filter((o) => o.team !== team)
      .sort((a, b) => a.order - b.order)
      .map((o) => o.id);
    if (JSON.stringify(data.wave.path[team]) !== JSON.stringify(expected))
      throw Error(
        `lane.wave.path.${team}: expected sequential enemy objective waypoints`,
      );
  }
  for (const o of data.objectives) {
    for (const key of ["x", "z"])
      number(
        o[key],
        `lane.objectives.${o.id}.${key}`,
        -data.halfSize,
        data.halfSize,
      );
    for (const key of ["gold", "xp"])
      integer(o[key], `lane.objectives.${o.id}.${key}`, 0);
  }
  for (const o of data.objectives)
    for (const k of [
      "maxHp",
      "damage",
      "range",
      "cooldown",
      "physicalDefense",
      "magicDefense",
    ])
      number(
        o[k],
        `lane.objectives.${o.id}.${k}`,
        ["maxHp", "cooldown"].includes(k) ? 0.01 : 0,
      );
  for (const [key, value] of Object.entries(data.bot.retreat))
    number(value, `lane.bot.retreat.${key}`, 0);
  if (
    data.bot.retreat.recoverHp <=
    Math.max(...Object.values(difficulties).map((d) => d.retreatHp))
  )
    throw Error("Recovery threshold must exceed retreat thresholds");
  for (const [id, d] of Object.entries(difficulties)) {
    number(d.reaction, `difficulty.${id}.reaction`, 0.01, 5);
    number(d.aimSpread, `difficulty.${id}.aimSpread`, 0, 5);
    number(d.aggression, `difficulty.${id}.aggression`, 0, 1);
    number(d.retreatHp, `difficulty.${id}.retreatHp`, 0, 1);
  }
  return data;
}

// Roster counts are authoritative, may be asymmetric, and cannot exceed five.
export function validateRoster(roster) {
  integer(roster.allyCount, "roster.allyCount", 0, 4);
  integer(roster.enemyCount, "roster.enemyCount", 1, 5);
  return { allyCount: roster.allyCount, enemyCount: roster.enemyCount };
}
