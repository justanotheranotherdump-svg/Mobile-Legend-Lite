import { inAttackRange } from "../simulation/targeting.js";
import { distance, validTarget } from "./actions.js";
import { segmentCircle } from "../simulation/skill-geometry.js";
import { firingPosition } from "./ai-spacing.js";
// Intent-only Tank / Roam policy. Uses the engine's actual availability/ranges;
// it cannot change stats, cooldowns, hitboxes, targets, resources or damage.
export function francoPolicy(actor, actors, lane, time, difficulty, random) {
  const hostile = actors.filter((t) => validTarget(actor, t)),
    allies = actors.filter(
      (t) =>
        t !== actor &&
        t.team === actor.team &&
        t.hp > 0 &&
        ["player", "bot"].includes(t.kind),
    );
  const hook = actor.skillOptions?.find(
      (s) => s.effect === "iron-hook" && s.ready,
    ),
    fury = actor.skillOptions?.find(
      (s) => s.effect === "fury-shock" && s.ready,
    ),
    hunt = actor.skillOptions?.find(
      (s) => s.effect === "bloody-hunt" && s.ready,
    );
  const enemyHeroes = hostile
    .filter((t) => ["player", "bot"].includes(t.kind))
    .sort((a, b) => {
      const score = (t) =>
        distance(actor, t) -
        allies
          .filter((a) => distance(a, t) < 3)
          .reduce((n, a) => n + (a.hp / a.maxHp < 0.5 ? 7 : 2), 0);
      return score(a) - score(b) || a.id.localeCompare(b.id);
    });
  const safe = (t) =>
    !lane ||
    lane.covered ||
    distance(lane.tower, t) > lane.tower.range + 0.4 ||
    distance(actor, lane.tower) > lane.tower.range + 0.5;
  const t = enemyHeroes.find(
    (t) =>
      safe(t) &&
      ((hunt && distance(actor, t) <= hunt.range) ||
        (fury && distance(actor, t) <= fury.range) ||
        (hook &&
          distance(actor, t) <= hook.range &&
          !hostile.some(
            (b) =>
              b !== t &&
              !["tower", "core"].includes(b.kind) &&
              segmentCircle(actor, t, b, hook.radius) !== null &&
              distance(actor, b) < distance(actor, t),
          ))),
  );
  if (t)
    return {
      type: "attack",
      targetId: t.id,
      ability: true,
      skillFirst: true,
      aimOffset: (random() - 0.5) * 2 * difficulty.aimSpread,
      reason: allies.some((a) => distance(a, t) < 3)
        ? "peel-ally"
        : "catch-opportunity",
    };
  if (lane && !lane.covered)
    return { ...lane.order, reason: "respect-objective-cover" };
  const close = hostile
    .filter((t) => inAttackRange(actor, t))
    .sort(
      (a, b) =>
        distance(actor, a) - distance(actor, b) || a.id.localeCompare(b.id),
    )[0];
  if (close)
    return {
      type: "attack",
      targetId: close.id,
      ability: !!fury,
      skillFirst: true,
      reason: "frontline-control",
    };
  // Hold an objective/farm goal, not a moving Layla-follow target. Hysteresis keeps
  // symmetric allies from rapidly swapping flanks or orbiting the human.
  let goal = actor.roleGoal;
  if (!goal || time >= goal.until) {
    const wave = hostile
        .filter((t) => t.kind === "minion")
        .sort(
          (a, b) =>
            distance(actor, a) - distance(actor, b) || a.id.localeCompare(b.id),
        )[0],
      target = lane?.covered ? lane.tower : wave;
    const point = target
      ? firingPosition(actor, target)
      : {
          x: (actor.team === "player" ? 1 : -1) * 27,
          z: actor.laneOffset || 0,
        };
    goal = actor.roleGoal = { ...point, until: time + 1.25 };
  }
  return { type: "move", x: goal.x, z: goal.z, reason: "objective-roam" };
}
