import { distance, validTarget } from "./actions.js";
import { resolveDamage } from "../simulation/stats/damage.js";
// Persistent lane objective. Entry/exit is driven by real wave cover, not by the
// hero crossing the very boundary that the previous movement order selected.
export function towerPlan(actor, actors, time) {
  const tower = actors
    .filter((t) => ["tower", "core"].includes(t.kind) && validTarget(actor, t))
    .sort(
      (a, b) =>
        distance(actor, a) - distance(actor, b) || a.id.localeCompare(b.id),
    )[0];
  if (!tower) {
    actor.lanePlan = null;
    return null;
  }
  let p = actor.lanePlan;
  if (!p || p.towerId !== tower.id) {
    p = actor.lanePlan = {
      towerId: tower.id,
      mode: "hold",
      coverSince: null,
      since: time,
    };
  }
  const cover = actors.some(
    (a) =>
      a.team === actor.team &&
      a.kind === "minion" &&
      a.hp > 0 &&
      distance(a, tower) <= tower.range - 0.2,
  );
  const retaliating =
    tower.retaliateId === actor.id && time < tower.retaliateUntil;
  if (cover && !retaliating) {
    p.coverSince ??= time;
  } else p.coverSince = null;
  const squad = actors.filter(
    (a) =>
      a.team === actor.team &&
      ["player", "bot", "hero"].includes(a.kind) &&
      a.hp / a.maxHp >= 0.6 &&
      distance(a, tower) <= 14,
  );
  const hit = (damage, defense) =>
    resolveDamage({
      base: damage || 0,
      model: { type: "physical", physicalScaling: 0, magicScaling: 0 },
      source: { physicalAttack: 0, magicPower: 0 },
      target:
        typeof defense === "number"
          ? { physicalDefense: defense, magicDefense: 0 }
          : defense,
    }).amount;
  const dps = squad.reduce(
    (sum, a) => sum + hit(a.damage, tower) * (a.attackRate || 1),
    0,
  );
  const incoming = hit(tower.damage, actor.attributes?.physicalDefense || 0);
  const approach =
    Math.max(0, distance(actor, tower) - actor.range) /
    Math.max(1, actor.speed || 1);
  const budget =
    (Math.max(0, actor.hp - actor.maxHp * 0.4) / Math.max(1, incoming)) *
    (tower.cooldown || 1);
  const siege =
    squad.length >= 3 &&
    actor.hp / actor.maxHp >= 0.6 &&
    dps > 0 &&
    approach + tower.hp / dps < budget * 0.8;
  const push =
    ((p.coverSince !== null && time - p.coverSince >= 0.6) || siege) &&
    actor.hp / actor.maxHp >= 0.4;
  p.support = siege ? "calculated-team-siege" : "minion-wave";
  const mode = push ? "push" : "hold";
  if (p.mode !== mode) {
    p.mode = mode;
    p.since = time;
  }
  p.reason = siege
    ? "calculated-team-siege"
    : retaliating
      ? "tower-retaliation"
      : !cover
        ? "wait-for-wave"
        : !push
          ? "form-up"
          : "wave-covered";
  const sign = actor.team === "player" ? 1 : -1,
    z = Math.max(-3.5, Math.min(3.5, actor.laneOffset || 0));
  const safeRadius = tower.range + 2.2;
  const goal = {
    x: tower.x - sign * Math.sqrt(Math.max(1, safeRadius ** 2 - z ** 2)),
    z: tower.z + z,
  };
  p.goal = goal;
  return {
    tower,
    covered: push,
    order: { type: "move", ...goal, reason: p.reason },
  };
}
