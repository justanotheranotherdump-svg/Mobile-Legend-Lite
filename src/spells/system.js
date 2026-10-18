import { getSpell, unlocked } from "./catalog.js";
import { validTarget, distance } from "../match/actions.js";
import { selectAutomaticTarget } from "../simulation/targeting.js";
import { segmentCircle, segmentBox } from "../simulation/skill-geometry.js";
import { overlapsBox } from "../simulation/movement.js";
import {
  healActor,
  grantShield,
  slowActor,
  stunActor,
  cleanse,
  tickStatus,
  heroes,
} from "../simulation/status.js";
export function safeDestination(actor, point, arena, actors = []) {
  const dx = point.x - actor.x,
    dz = point.z - actor.z,
    n = Math.hypot(dx, dz);
  let result = { x: actor.x, z: actor.z };
  for (let i = 1; i <= Math.max(1, Math.ceil(n / 0.1)); i++) {
    const f = i / Math.max(1, Math.ceil(n / 0.1)),
      x = actor.x + dx * f,
      z = actor.z + dz * f,
      limit = arena.halfSize - actor.radius;
    if (
      Math.abs(x) > limit ||
      Math.abs(z) >
        (arena.laneHalfWidth ? arena.laneHalfWidth - actor.radius : limit) ||
      arena.obstacles.some((b) => overlapsBox(x, z, actor.radius, b)) ||
      actors.some(
        (a) =>
          a !== actor &&
          a.hp > 0 &&
          ["tower", "core"].includes(a.kind) &&
          Math.hypot(x - a.x, z - a.z) < actor.radius + a.radius,
      )
    )
      break;
    result = { x, z };
  }
  return result;
}
export class BattleSpells {
  constructor(s, { spellId = "execute", accountLevel = 1 } = {}) {
    this.s = s;
    this.accountLevel = Number.isInteger(accountLevel)
      ? Math.max(1, Math.min(25, accountLevel))
      : 1;
    this.id = unlocked(spellId, this.accountLevel) ? spellId : "execute";
    this.readyAt = 0;
    this.active = {};
    this.projectiles = [];
    this.springs = [];
    this.channel = null;
    this.destinationId = null;
    this.progress = 0;
    this.upgradeReady = false;
    this.progressStats = false;
    this.serial = 0;
    this.lastResult = "ready";
  }
  get definition() {
    return getSpell(this.id);
  }
  ability() {
    const d = this.definition;
    return {
      id: "battle-" + d.id,
      name: d.name,
      slot: "battle-spell",
      rank: 1,
      manaCost: 0,
      range: d.parameters.range || d.parameters.radius || 0,
      aimStyle:
        d.target === "direction"
          ? "line"
          : ["self-area", "enemy-area"].includes(d.target)
            ? "area"
            : "none",
      effectId: "line-projectile",
      parameters: { width: 0.4, radius: d.parameters.radius || 0.2 },
      spell: true,
    };
  }
  availability() {
    const s = this.s,
      p = s.player;
    if (s.paused || s.phase !== "running") return s.paused ? "paused" : s.phase;
    if (!unlocked(this.id, this.accountLevel)) return "locked";
    if (!this.definition.modes.includes(s.matchConfig.mode))
      return "mode-unavailable";
    if (p.hp <= 0) return "dead";
    if (p.suppressionUntil > s.time) return "suppressed";
    if (this.channel) return "channeling";
    if (p.stunned && this.id !== "purify") return "stunned";
    if (s.isActionLocked() && this.id !== "purify") return "animation";
    if (s.time < this.readyAt) return "cooldown";
    return null;
  }
  targets(kind) {
    const s = this.s,
      p = s.player;
    return s.actors.filter(
      (a) =>
        validTarget(p, a) &&
        (kind === "hero"
          ? heroes(a)
          : kind === "farm"
            ? ["minion", "creep"].includes(a.kind)
            : true),
    );
  }
  pick(kind) {
    const s = this.s,
      p = s.player,
      range = this.definition.parameters.range || 6,
      actors = this.targets(kind),
      manual = actors.find(
        (a) => a.id === s.manualTargetId && distance(p, a) <= range,
      );
    return (
      manual || selectAutomaticTarget({ ...p, range }, actors, s.targetMode)
    );
  }
  destinations() {
    return this.s.actors.filter(
      (a) =>
        a !== this.s.player &&
        a.team === this.s.player.team &&
        a.hp > 0 &&
        ["tower", "core", "minion", "trap"].includes(a.kind),
    );
  }
  cast(point, explicitId) {
    const s = this.s,
      p = s.player,
      d = this.definition,
      q = d.parameters,
      t = s.time,
      level = s.progression.level;
    let reason = this.availability(),
      target;
    if (!reason && ["execute", "retribution"].includes(this.id)) {
      target = this.pick(this.id === "execute" ? "hero" : "farm");
      if (!target) reason = "no-valid-target";
    }
    if (!point && d.target === "direction") {
      const auto = this.pick("hero");
      point = auto
        ? { x: auto.x, z: auto.z }
        : { x: p.x + s.facing.x * q.range, z: p.z + s.facing.z * q.range };
    }
    if (
      !reason &&
      d.target === "direction" &&
      (!point ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.z) ||
        distance(p, point) < 1e-6)
    )
      reason = "aim-required";
    if (!reason && this.id === "arrival") {
      target = this.destinations().find(
        (a) => a.id === (explicitId || this.destinationId),
      );
      if (!target) reason = "select-allied-destination";
    }
    if (reason) {
      this.lastResult = reason;
      s.emit("spell-feedback", { message: `${d.name}: ${reason}` });
      return reason;
    }
    s.cancelAim();
    s.utilities.recall = null;
    s.utilities.regen = null;
    this.readyAt = t + d.cooldown;
    s.emit("spell-cast", {
      id: this.id,
      point: { x: p.x, z: p.z },
      radius: q.radius || 1,
      color: d.color,
    });
    switch (this.id) {
      case "execute": {
        const before = target.hp;
        s.deal(
          p,
          target,
          q.base + q.perLevel * level + q.lostHp * (target.maxHp - before),
          "true",
          false,
          { spell: true, itemProc: true, ignoreShields: true },
        );
        if (before > 0 && target.hp === 0)
          this.readyAt = t + d.cooldown * (1 - q.killCooldownReduction);
        break;
      }
      case "retribution":
        s.deal(p, target, q.base + q.perLevel * level, "true", false, {
          spell: true,
          itemProc: true,
        });
        break;
      case "inspire":
        this.active.inspire = { until: t + q.duration, charges: q.charges };
        break;
      case "sprint":
        p.slow = null;
        p.slowImmuneUntil = t + q.duration;
        this.active.sprint = t + q.duration;
        break;
      case "revitalize":
        this.springs.push({
          id: ++this.serial,
          until: t + q.duration,
          next: t + q.interval,
          x: p.x,
          z: p.z,
          casterId: p.id,
        });
        this.updateAura();
        break;
      case "aegis":
        grantShield(s, p, q.base + q.perLevel * level, q.duration, "aegis");
        break;
      case "petrify":
        for (const a of this.targets()) {
          if (
            ["tower", "core"].includes(a.kind) ||
            distance(p, a) > q.radius + a.radius
          )
            continue;
          s.deal(p, a, q.base + q.perLevel * level, "magic", false, {
            spell: true,
            itemProc: true,
          });
          if (a.hp > 0 && stunActor(s, a, q.duration))
            a.afterPetrify = {
              at: a.stunnedUntil,
              ratio: q.slow,
              duration: q.slowDuration,
            };
        }
        break;
      case "purify":
        cleanse(p);
        p.controlImmuneUntil = t + q.duration;
        this.active.purify = t + q.duration;
        break;
      case "flameshot": {
        const n = distance(p, point),
          dx = (point.x - p.x) / n,
          dz = (point.z - p.z) / n;
        for (const a of this.targets().filter(
          (a) =>
            ["bot", "player", "hero", "creep"].includes(a.kind) &&
            distance(p, a) <= q.knockbackRadius,
        ))
          this.knockback(a, q.knockback);
        this.projectiles.push({
          id: "spell-" + ++this.serial,
          x: p.x,
          z: p.z,
          dx,
          dz,
          speed: q.speed,
          radius: q.radius,
          effect: "flameshot",
          bornAt: t,
          remaining: q.range,
          travelled: 0,
        });
        break;
      }
      case "flicker": {
        const n = distance(p, point),
          destination = safeDestination(
            p,
            {
              x: p.x + ((point.x - p.x) / n) * q.range,
              z: p.z + ((point.z - p.z) / n) * q.range,
            },
            s.arena,
            s.actors,
          ),
          old = { x: p.x, z: p.z };
        Object.assign(p, destination);
        this.active.flicker = t + q.duration;
        s.emit("spell-arrival", {
          id: "flicker",
          point: destination,
          departure: old,
          color: d.color,
        });
        break;
      }
      case "vengeance":
        this.active.vengeance = t + q.duration;
        break;
      case "arrival":
        this.channel = {
          targetId: target.id,
          endsAt: t + q.channel,
          x: p.x,
          z: p.z,
        };
        break;
    }
    this.s.itemEffects?.tick();
    this.lastResult = "cast";
    return "cast";
  }
  knockback(a, amount) {
    if (a.controlImmuneUntil > this.s.time) return;
    const p = this.s.player,
      n = Math.max(0.001, distance(p, a));
    Object.assign(
      a,
      safeDestination(
        a,
        {
          x: a.x + ((a.x - p.x) / n) * amount,
          z: a.z + ((a.z - p.z) / n) * amount,
        },
        this.s.arena,
        this.s.actors,
      ),
    );
    this.s.emit("spell-impact", {
      id: "knockback",
      point: { x: a.x, z: a.z },
      color: "#ffc47a",
    });
  }
  cancelArrival(reason = "cancelled") {
    if (!this.channel) return false;
    this.readyAt = Math.max(
      this.s.time,
      this.readyAt - this.definition.parameters.refund,
    );
    this.channel = null;
    this.lastResult = reason;
    this.s.emit("spell-feedback", {
      message: "Arrival interrupted: 30s cooldown refunded",
    });
    return true;
  }
  updateAura() {
    const s = this.s,
      q = getSpell("revitalize").parameters;
    for (const a of s.actors) {
      a.recoveryBoost = 1;
      if (
        a.hp > 0 &&
        heroes(a) &&
        a.team === s.player.team &&
        this.springs.some(
          (x) => x.until >= s.time && distance(a, x) <= q.radius,
        )
      )
        a.recoveryBoost = 1 + q.bonus;
    }
  }
  modifiers() {
    const flat = {};
    if (this.progressStats) {
      const q = getSpell("retribution").parameters;
      flat.physicalAttack = q.physicalBonus;
      flat.magicPower = q.magicBonus;
      flat.maxHp = q.hpBonus;
    }
    if (this.active.flicker > this.s.time) {
      const q = getSpell("flicker").parameters;
      flat.physicalDefense =
        q.defenseBase + q.defensePerLevel * this.s.progression.level;
      flat.magicDefense = flat.physicalDefense;
    }
    return flat;
  }
  applyRuntime() {
    const s = this.s,
      p = s.player,
      t = s.time;
    let speed = 0;
    if (this.active.sprint > t) speed += getSpell("sprint").parameters.speed;
    if (this.active.purify > t) speed += getSpell("purify").parameters.speed;
    if (this.active.arrival > t)
      speed +=
        (getSpell("arrival").parameters.speed * (this.active.arrival - t)) /
        getSpell("arrival").parameters.speedDuration;
    p.speed *= 1 + speed;
    const inspiration = this.active.inspire;
    if (inspiration?.until > t && inspiration.charges > 0) {
      p.attackRate = Math.min(
        getSpell("inspire").parameters.cap,
        p.attributes.attackSpeed * getSpell("inspire").parameters.speed,
      );
      p.attackCooldown = 1 / p.attackRate;
    }
  }
  penetration() {
    const a = this.active.inspire,
      q = getSpell("inspire").parameters;
    return a?.until > this.s.time && a.charges > 0
      ? q.penetration + q.penetrationPerLevel * this.s.progression.level
      : 0;
  }
  landedBasic() {
    const a = this.active.inspire;
    if (a?.until > this.s.time && a.charges > 0) {
      a.charges--;
      healActor(this.s, this.s.player, getSpell("inspire").parameters.heal);
      if (a.charges === 0) delete this.active.inspire;
    }
  }
  incoming(source, target, amount, basic) {
    const s = this.s;
    if (target !== s.player) return amount;
    if (this.active.vengeance > s.time)
      amount *= 1 - getSpell("vengeance").parameters.reduction;
    if (this.id === "retribution") {
      if (source.kind === "creep" && basic)
        amount *= 1 - getSpell("retribution").parameters.creepReduction;
      const regions = s.scenario.jungleRegions || [];
      if (
        s.time < getSpell("retribution").parameters.jungleSeconds &&
        regions.some(
          (r) =>
            r.team === target.team &&
            Math.hypot(target.x - r.x, target.z - r.z) <= r.radius,
        )
      )
        amount *= 1 - getSpell("retribution").parameters.jungleReduction;
    }
    return amount;
  }
  reflected(source, target, actual, meta) {
    if (
      target === this.s.player &&
      this.active.vengeance > this.s.time &&
      actual > 0 &&
      !meta.reflected &&
      validTarget(target, source) &&
      source.hp > 0
    )
      this.s.deal(
        target,
        source,
        actual * getSpell("vengeance").parameters.reflection,
        "magic",
        false,
        { spell: true, itemProc: true, reflected: true },
      );
  }
  recordDeath(source, target) {
    if (this.id !== "retribution") return;
    const s = this.s,
      q = this.definition.parameters,
      assist =
        heroes(target) &&
        target.contributors?.player >= s.time - s.scenario.assistWindow;
    if (
      (source === s.player && (target.kind === "creep" || heroes(target))) ||
      assist
    ) {
      this.progress++;
      if (this.progress >= q.upgradeActions) this.upgradeReady = true;
      if (this.progress >= q.statsActions && !this.progressStats) {
        this.progressStats = true;
        s.itemEffects.tick();
      }
    }
  }
  onDeath(a) {
    if (a === this.s.player) {
      this.cancelArrival("death");
      this.active = {};
      this.projectiles = [];
      this.springs = [];
      this.updateAura();
      a.slowImmuneUntil = 0;
      a.controlImmuneUntil = 0;
      a.shields = [];
    }
  }
  tick(dt) {
    const s = this.s,
      p = s.player,
      t = s.time;
    for (const a of s.actors) tickStatus(s, a);
    if (this.active.inspire?.until <= t) delete this.active.inspire;
    for (const spring of this.springs) {
      if (getSpell("revitalize").parameters.followsCaster) {
        spring.x = p.x;
        spring.z = p.z;
      }
    }
    this.updateAura();
    const q = getSpell("revitalize").parameters;
    for (const spring of this.springs) {
      while (spring.next <= t + 1e-8 && spring.next <= spring.until + 1e-8) {
        for (const a of s.actors)
          if (
            a.hp > 0 &&
            heroes(a) &&
            a.team === p.team &&
            distance(a, spring) <= q.radius
          ) {
            const healed = healActor(s, a, a.maxHp * q.heal);
            s.emit("spell-heal", {
              point: { x: a.x, z: a.z },
              amount: healed,
              color: "#77e4b0",
            });
          }
        spring.next += q.interval;
      }
    }
    this.springs = this.springs.filter((x) => x.until > t);
    this.updateAura();
    if (this.channel) {
      const c = this.channel,
        target = this.destinations().find((a) => a.id === c.targetId);
      if (!target || p.hp <= 0 || p.stunned || distance(p, c) > 0.01)
        this.cancelArrival("interrupted");
      else if (t >= c.endsAt) {
        const destination = safeDestination(
          target,
          { x: target.x + (target.team === "player" ? -2 : 2), z: target.z },
          s.arena,
          s.actors.filter((a) => a !== target),
        );
        if (distance(destination, target) > 0.1) {
          Object.assign(p, destination);
          this.channel = null;
          this.active.arrival =
            t + getSpell("arrival").parameters.speedDuration;
          s.emit("spell-arrival", {
            id: "arrival",
            point: destination,
            color: this.definition.color,
          });
        } else this.cancelArrival("no-safe-destination");
      }
    }
    const active = [];
    for (const shot of this.projectiles) {
      const q = getSpell("flameshot").parameters,
        step = Math.min(shot.remaining, shot.speed * dt),
        next = { x: shot.x + shot.dx * step, z: shot.z + shot.dz * step };
      let collision = null;
      for (const a of this.targets().filter(
        (a) => heroes(a) || a.kind === "creep",
      )) {
        const at = segmentCircle(shot, next, a, shot.radius);
        if (at !== null && (!collision || at < collision.at))
          collision = { at, target: a };
      }
      for (const box of s.arena.obstacles) {
        const at = segmentBox(shot, next, box, shot.radius);
        if (at !== null && (!collision || at < collision.at))
          collision = { at, target: null };
      }
      if (collision) {
        shot.travelled += step * collision.at;
        shot.x += (next.x - shot.x) * collision.at;
        shot.z += (next.z - shot.z) * collision.at;
        if (collision.target)
          s.deal(
            p,
            collision.target,
            q.min + (q.max - q.min) * Math.min(1, shot.travelled / q.range),
            "magic",
            false,
            { spell: true, itemProc: true },
          );
        s.emit("spell-impact", {
          point: { x: shot.x, z: shot.z },
          color: "#ff995b",
        });
      } else {
        shot.x = next.x;
        shot.z = next.z;
        shot.travelled += step;
        shot.remaining -= step;
        if (
          shot.remaining > 1e-6 &&
          Math.abs(shot.x) <= s.arena.halfSize &&
          Math.abs(shot.z) <= s.arena.halfSize
        )
          active.push(shot);
      }
    }
    this.projectiles = active;
    s.itemEffects?.tick();
  }
  snapshot() {
    return {
      id: this.id,
      accountLevel: this.accountLevel,
      readyAt: this.readyAt,
      remaining: Math.max(0, this.readyAt - this.s.time),
      active: structuredClone(this.active),
      channel: this.channel && { ...this.channel },
      destinationId: this.destinationId,
      progress: this.progress,
      upgradeReady: this.upgradeReady,
      blessing: "not-configured",
      progressStats: this.progressStats,
      lastResult: this.lastResult,
      springs: this.springs.map((x) => ({ ...x })),
    };
  }
}
