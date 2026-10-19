import { distance } from "./actions.js";
// Stable individual firing arcs plus continuous movement-only avoidance. Never
// teleport bodies, alter attack range, skip windup or move the human player.
export function firingPosition(actor, target) {
  const sign = actor.team === "player" ? 1 : -1,
    r = Math.max(0.5, actor.range * 0.84),
    z = Math.max(-r * 0.55, Math.min(r * 0.55, actor.laneOffset || 0));
  return {
    x: target.x - sign * Math.sqrt(Math.max(0.1, r * r - z * z)),
    z: target.z + z,
  };
}
export function spacedDirection(actor, goal, actors) {
  let dx = goal.x - actor.x,
    dz = goal.z - actor.z,
    n = Math.hypot(dx, dz),
    x = n > 0.02 ? dx / n : 0,
    z = n > 0.02 ? dz / n : 0,
    spacing = false;
  for (const a of actors) {
    if (a === actor || a.hp <= 0 || !["player", "bot", "hero"].includes(a.kind))
      continue;
    let sx = actor.x - a.x,
      sz = actor.z - a.z,
      d = Math.hypot(sx, sz),
      comfort = (actor.radius || 0.4) + (a.radius || 0.4) + 0.45;
    if (d >= comfort) continue;
    spacing = true;
    if (d < 0.0001) {
      sx = actor.id.localeCompare(a.id) < 0 ? -1 : 1;
      sz = sx * 0.5;
      d = Math.hypot(sx, sz);
    }
    const strength =
      1.7 * Math.max(0.15, (comfort - Math.min(d, comfort)) / comfort);
    x += (sx / d) * strength;
    z += (sz / d) * strength;
  }
  const length = Math.hypot(x, z);
  return {
    x: length > 1e-5 ? x / length : 0,
    z: length > 1e-5 ? z / length : 0,
    distance: n,
    spacing,
  };
}
export const crowded = (actor, actors) =>
  actors.some(
    (a) =>
      a !== actor &&
      a.hp > 0 &&
      ["player", "bot", "hero"].includes(a.kind) &&
      distance(a, actor) < (a.radius || 0.4) + (actor.radius || 0.4) + 0.5,
  );
