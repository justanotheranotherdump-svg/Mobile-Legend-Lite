import { inAttackRange, distanceTo } from "./targeting.js";
// Current combat uses CENTER-TO-CENTER ranges. Never add collision radii to a
// visual or attack threshold: radii constrain movement/separation independently.
export function rangeSnapshot(s) {
  const p = s.player,
    display = s.combatSettings?.rangeDisplay || "context";
  return {
    player: {
      x: p.x,
      z: p.z,
      radius: p.range,
      visible:
        p.hp > 0 &&
        display !== "off" &&
        (display === "always" ||
          Boolean(s.attackCommand || s.selectedTargetId || s.aiming)),
      targetInRange: Boolean(
        s.selectedTarget && inAttackRange(p, s.selectedTarget),
      ),
    },
    towers: (s.structures || [])
      .filter((t) => t.hp > 0)
      .map((t) => ({
        id: t.id,
        x: t.x,
        z: t.z,
        radius: t.range,
        enemy: t.team !== p.team,
        inside: distanceTo(p, t) <= t.range,
        visible:
          s.combatSettings?.towerRanges !== false &&
          distanceTo(p, t) <= t.range + 8,
      })),
  };
}
