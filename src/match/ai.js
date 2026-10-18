import { distance, validTarget } from "./actions.js";
// Decisions only. The simulation executes these intents through shared actions.
export function botDecision(actor, actors, config, difficulty, time, random) {
  const sign = actor.team === "player" ? 1 : -1,
    hp = actor.hp / actor.maxHp;
  if (hp < difficulty.retreatHp || (actor.retreating && hp < 0.8))
    return {
      type: "retreat",
      x: actor.home?.x ?? actor.x,
      z: (actor.home?.z??0)+(actor.laneOffset||0),
    };
  const candidates = actors.filter(
    (t) => validTarget(actor, t) && distance(actor, t) <= config.detectRange,
  );
  candidates.sort((a, b) => {
    const score = (t) =>
      difficulty.targetPolicy === "lowest-hp"
        ? (t.hp / Math.max(1, t.maxHp)) * 4 + distance(actor, t)
        : difficulty.targetPolicy === "threat"
          ? (t.kind === "bot" || t.kind === "player" ? -3 : 0) +
            distance(actor, t)
          : distance(actor, t);
    return score(a) - score(b) || a.id.localeCompare(b.id);
  });
  const target = candidates[0];
  if (target) {
    if (distance(actor, target) <= actor.range)
      return {
        type: "attack",
        targetId: target.id,
        ability:
          time >= actor.abilityReadyAt && actor.mana >= config.abilityMana,
        aimOffset: (random() - 0.5) * 2 * difficulty.aimSpread,
      };
    if (distance(actor, target) <= config.detectRange * difficulty.aggression)
      return {
        type: "move",
        x: target.x - sign * (actor.range - 0.2),
        z: target.z,
      };
  }
  const objective = actors
    .filter((t) => ["tower", "core"].includes(t.kind) && validTarget(actor, t))
    .sort((a, b) => distance(actor, a) - distance(actor, b))[0];
  return {
    type: "move",
    x: objective ? objective.x - sign * (actor.range - 0.2) : sign * 30,
    z: (actor.home?.z ?? 0) + (actor.laneOffset || 0),
  };
}
export function towerTarget(tower, actors, time) {
  const eligible = actors.filter(
    (t) =>
      validTarget(tower, t) &&
      !["tower", "core"].includes(t.kind) &&
      distance(tower, t) <= tower.range,
  );
  const retaliation = eligible.find(
    (t) => t.id === tower.retaliateId && time < tower.retaliateUntil,
  );
  return (
    retaliation ||
    eligible.sort(
      (a, b) =>
        (a.kind === "minion" ? 0 : 1) - (b.kind === "minion" ? 0 : 1) ||
        distance(tower, a) - distance(tower, b) ||
        a.id.localeCompare(b.id),
    )[0] ||
    null
  );
}
