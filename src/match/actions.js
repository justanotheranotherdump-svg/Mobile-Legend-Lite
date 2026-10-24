import { attackReach } from "../simulation/targeting.js";
import { canActorAct } from "../simulation/skill-geometry.js";
export const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
export function validTarget(source, target) {
  return Boolean(
    target &&
      source &&
      (["player", "enemy"].includes(source.team) || source.team === "neutral" && source.kind === "creep" && ["player","bot"].includes(target.kind)) &&
      (["player", "enemy"].includes(target.team) || target.team === "neutral" && target.kind === "creep" && ["player","bot"].includes(source.kind)) &&
      source.team !== target.team &&
      target.hp > 0 &&
      target.targetable !== false &&
      !target.protected &&
      (!target.camouflaged||distance(source,target)<=2) &&
      Number.isFinite(target.x) &&
      Number.isFinite(target.z),
  );
}
export function attackReason(
  source,
  target,
  time,
  { range = source?.range ?? 0, readyAt = source?.readyAt || 0 } = {},
) {
  if (!canActorAct(source)) return "cannot-act";
  if (!validTarget(source, target)) return "invalid-target";
  if (distance(source, target) > attackReach(source, target, range) + 1e-8) return "range";
  if (time + 1e-8 < readyAt) return "cooldown";
  return null;
}
export function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
