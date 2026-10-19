import {
  selectAutomaticTarget,
  isEligibleEnemy,
  inAttackRange,
  distanceTo,
} from "./targeting.js";
import { overlapsBox } from "./movement.js";
export const COMBAT_DEFAULTS = Object.freeze({
  smartBasic: true,
  autoSwitch: true,
  categoryPriority: "hero",
  smartSkills: true,
  skillRanges: true,
  rangeDisplay: "context",
  towerRanges: true,
  searchExtra: 10,
});
const category = (a) =>
  ["hero", "bot", "player"].includes(a.kind)
    ? "hero"
    : ["minion", "creep"].includes(a.kind)
      ? "minion"
      : ["tower", "core"].includes(a.kind)
        ? "tower"
        : "other";
const alive = (s, a) => isEligibleEnemy(a, s.player) && !a.protected;
// Bounded A* on a local grid. Every traversed edge is swept against the same
// world boxes and actor circles as movement; this never writes player position.
export function approachPath(player, target, arena, circles = []) {
  const step = 0.65,
    pad = 0.06,
    range = player.range - 0.08,
    min = player.radius + target.radius + pad;
  if (range < min) return null;
  const clear = (x, z) =>
    Math.abs(x) <= arena.halfSize - player.radius &&
    Math.abs(z) <= arena.halfSize - player.radius &&
    !arena.obstacles.some((b) => overlapsBox(x, z, player.radius, b)) &&
    !circles.some(
      (c) =>
        c !== player &&
        c.hp > 0 &&
        Math.hypot(x - c.x, z - c.z) < player.radius + c.radius + pad,
    );
  const edge = (a, b) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.2);
    for (let k = 1; k <= n; k++)
      if (!clear(a.x + ((b.x - a.x) * k) / n, a.z + ((b.z - a.z) * k) / n))
        return false;
    return true;
  };
  const heuristic = (n) =>
    Math.max(0, Math.hypot(n.x - target.x, n.z - target.z) - range);
  const start = { i: 0, j: 0, x: player.x, z: player.z, g: 0, parent: null },
    open = [start],
    best = new Map([["0,0", 0]]),
    closed = new Set();
  const dirs = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
    [1, 1],
    [1, -1],
    [-1, 1],
    [-1, -1],
  ];
  for (let count = 0; open.length && count < 5000; count++) {
    let k = 0;
    for (let n = 1; n < open.length; n++)
      if (open[n].g + heuristic(open[n]) < open[k].g + heuristic(open[k]))
        k = n;
    const n = open.splice(k, 1)[0],
      key = n.i + "," + n.j;
    if (closed.has(key)) continue;
    closed.add(key);
    const d = Math.hypot(n.x - target.x, n.z - target.z);
    if (d <= range && d >= min) {
      const path = [];
      for (let a = n; a.parent; a = a.parent) path.unshift({ x: a.x, z: a.z });
      return path;
    }
    for (const [i, j] of dirs) {
      const a = {
          i: n.i + i,
          j: n.j + j,
          x: player.x + (n.i + i) * step,
          z: player.z + (n.j + j) * step,
          g: n.g + step * Math.hypot(i, j),
          parent: n,
        },
        key = a.i + "," + a.j;
      if (closed.has(key) || a.g >= (best.get(key) ?? Infinity) || !edge(n, a))
        continue;
      best.set(key, a.g);
      open.push(a);
    }
  }
  return null;
}
export class AttackController {
  constructor(s) {
    this.s = s;
    this.command = null;
    this.path = [];
    this.nextPlan = 0;
    this.lastPosition = null;
    this.stuck = 0;
    this.blockedSince = null;
  }
  cancel(reason = "canceled") {
    this.command = null;
    this.s.attackCommand = null;
    this.path = [];
    this.stuck = 0;
    this.blockedSince = null;
    if (reason === "unreachable")
      this.s.emit?.("attack-feedback", {
        reason,
        message: "Target unreachable. Attack command canceled.",
      });
  }
  request(id = null, filter = null) {
    const s = this.s;
    if (s.paused) return "paused";
    if (s.phase && s.phase !== "running") return s.phase;
    if (s.player.hp <= 0) return "cannot-act";
    if (!s.combatSettings?.smartBasic) return s.attack(id, filter);
    s.targetCategory = filter;
    const pin = id || s.manualTargetId,
      selected = s.enemies.find((a) => a.id === pin);
    this.command = {
      filter,
      manualId:
        selected && (!filter || category(selected) === filter) ? pin : null,
      targetId: null,
      origin: { x: s.player.x, z: s.player.z },
    };
    s.attackCommand = this.command;
    this.nextPlan = 0;
    this.path = [];
    this.stuck = 0;
    this.blockedSince = null;
    this.lastPosition = null;
    const target = this.choose();
    if (!target) {
      this.cancel();
      s.emit?.("attack-feedback", {
        reason: "no-enemies",
        message: "No eligible target within smart attack search range.",
      });
      return "no-enemies";
    }
    this.command.targetId = target.id;
    s.selectedTargetId = target.id;
    if (this.command.manualId) s.manualTargetId = target.id;
    if (inAttackRange(s.player, target)) return s.attack(target.id, filter);
    return "approaching";
  }
  choose() {
    const s = this.s,
      c = this.command;
    if (!c) return null;
    const radius = s.player.range + (s.combatSettings?.searchExtra ?? 10),
      eligible = s.enemies.filter(
        (a) =>
          alive(s, a) &&
          distanceTo(s.player, a) <= radius &&
          distanceTo(c.origin, a) <= radius * 1.7 &&
          (!c.filter || category(a) === c.filter),
      );
    const pin = eligible.find((a) => a.id === c.manualId);
    if (pin) return pin;
    const current = eligible.find((a) => a.id === c.targetId);
    if (c.manualId) {
      c.manualId = null;
      s.manualTargetId = null;
    }
    if (!s.combatSettings.autoSwitch && c.targetId) return current || null;
    const preferred = eligible.filter(
      (a) =>
        category(a) ===
        (c.filter || s.combatSettings.categoryPriority || "hero"),
    );
    return selectAutomaticTarget(
      { ...s.player, range: radius },
      preferred.length ? preferred : eligible,
      s.targetMode,
    );
  }
  waitForMovingUnits(target, circles) {
    const s = this.s;
    // Moving bodies can briefly engulf a start/grid edge. Do not confuse that
    // with a permanently unreachable world route, or discard the user's filter.
    const fixed = circles.filter(a => !["player", "hero", "bot", "minion", "creep"].includes(a.kind));
    if (!approachPath(s.player, target, s.arena, fixed)) {
      this.cancel("unreachable");
      return { h: 0, v: 0 };
    }
    this.blockedSince ??= s.time;
    if (s.time - this.blockedSince >= 2.5) this.cancel("unreachable");
    else { this.path = []; this.nextPlan = s.time + 0.15; }
    return { h: 0, v: 0 };
  }
  vector(dt, h, v) {
    const s = this.s,
      c = this.command;
    if (!c) return { h, v };
    if (Math.hypot(h, v) > 0.05) {
      this.cancel("manual-movement");
      return { h, v };
    }
    if (s.player.hp <= 0) {
      this.cancel("death");
      return { h: 0, v: 0 };
    }
    if (s.player.stunned || s.isActionLocked() || s.aiming || s.paused)
      return { h: 0, v: 0 };
    const target = this.choose();
    if (!target) {
      this.cancel("invalid");
      return { h: 0, v: 0 };
    }
    if (target.id !== c.targetId) {
      this.path = [];
      this.nextPlan = 0;
      c.targetId = target.id;
      this.stuck = 0;
      this.blockedSince = null;
    }
    s.selectedTargetId = target.id;
    if (inAttackRange(s.player, target)) {
      this.path = [];
      this.stuck = 0;
      this.blockedSince = null;
      if (s.player.cooldown <= 1e-8 && !s.pending.length)
        s.attack(target.id, c.filter);
      return { h: 0, v: 0 };
    }
    // Nonmanual auto target selection must not turn into a pin after each shot.
    const circles = s.isMatch ? s.actors : s.enemies;
    if (!this.path.length && this.blockedSince !== null && s.time < this.nextPlan)
      return { h: 0, v: 0 };
    if (s.time >= this.nextPlan || !this.path.length) {
      this.path = approachPath(s.player, target, s.arena, circles);
      this.nextPlan = s.time + 0.6;
      if (!this.path) return this.waitForMovingUnits(target, circles);
    }
    while (this.path.length && distanceTo(s.player, this.path[0]) < 0.07)
      this.path.shift();
    if (!this.path.length) return { h: 0, v: 0 };
    if (this.lastPosition && distanceTo(s.player, this.lastPosition) < 0.001)
      this.stuck += dt;
    else { this.stuck = 0; this.blockedSince = null; }
    this.lastPosition = { x: s.player.x, z: s.player.z };
    if (this.stuck > 1) return this.waitForMovingUnits(target, circles);
    const n = this.path[0],
      d = distanceTo(s.player, n),
      scale = Math.min(1, d / Math.max(0.0001, s.player.speed * dt)),
      dx = ((n.x - s.player.x) / d) * scale,
      dz = ((n.z - s.player.z) / d) * scale;
    return { h: (dx - dz) * Math.SQRT1_2, v: (-dx - dz) * Math.SQRT1_2 };
  }
}
