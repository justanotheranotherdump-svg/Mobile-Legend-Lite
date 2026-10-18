import { calculateAttributes, runtimeAttributes } from './stats/attributes.js';
import { HeroProgression, rankedAbility } from './stats/progression.js';
import { damagePower, resolveDamage } from './stats/damage.js';
import { number } from './stats/validation.js';
import { TrainingSimulation } from "./game.js";
import {
  isEligibleEnemy,
  inAttackRange,
  selectAutomaticTarget,
} from "./targeting.js";
import {
  segmentCircle,
  segmentBox,
  pointAlong,
  canActorAct,
  distanceMultiplier,
} from "./skill-geometry.js";

// Extends the preserved training combat foundation. All damage, casts, timers,
// projectile collisions and marks are authoritative here, never in the renderer.
export class HeroCombatSimulation extends TrainingSimulation {
  reset() {
    super.reset();
    this.combatHero = true;
    this.aim = null;
    this.aiming = null;
    this.firingTargetId = null;
    this.facing = { x: 0, z: 1 };
    this.firing = null;
    this.lockUntil = 0;
    this.cooldowns = {};
    this.projectiles = [];
    this.pending = [];
    this.buff = null;
    this.serial = 0;
    this.lastCast = { serial: 0, slot: null };
    this.lastCastResult = "ready";
    if (this.hero.schemaVersion === 3) {
      this.progression = new HeroProgression(this.hero);
      this.statModifiers = {};
      this.recalculateStats();
      for (const enemy of this.enemies) {
        for (const k of ['physicalDefense', 'magicDefense']) number(enemy[k], `training.dummies.${enemy.id}.${k}`);
      }
    }
  }
  ability(slot) {
    const a = this.hero.abilities.find((a) => a.slot === slot || a.id === slot);
    return a && this.progression ? rankedAbility(a, this.progression) : a;
  }
  // All progression mutations enter the simulation, never UI/render callbacks.
  recalculateStats() {
    const p = this.player, oldHp = p.maxHp, oldMana = p.maxMana;
    const attributes = calculateAttributes(this.hero, this.progression.level, this.statModifiers);
    const runtime = runtimeAttributes(this.hero, attributes);
    Object.assign(p, runtime, { attributes, maxHp: attributes.maxHp, maxMana: attributes.maxMana,
      hpRegen: attributes.hpRegen, manaRegen: attributes.manaRegen,
      damage: damagePower(this.hero.basicAttack.damage, this.hero.basicAttack.damageModel, attributes) });
    // Level gains preserve missing numeric resources; never heal a dead actor.
    p.hp = Math.max(0, Math.min(p.maxHp, p.hp <= 0 ? 0 : p.hp + p.maxHp - oldHp));
    p.mana = Math.max(0, Math.min(p.maxMana, p.mana + p.maxMana - oldMana));
    this.applyRangeAndSpeed();
    this.refreshTarget();
  }
  applyRangeAndSpeed() {
    const active = this.buff && this.time < this.buff.until;
    const runtime = this.progression ? runtimeAttributes(this.hero, this.player.attributes)
      : { speed: this.hero.baseStats.movementSpeed, range: this.hero.basicAttack.range };
    this.player.speed = runtime.speed * (active ? this.ability('skill-1').parameters.speedMultiplier : 1);
    this.player.range = runtime.range + (active ? this.ability('skill-1').parameters.attackRangeBonus : 0);
  }
  grantXp(amount) {
    const result = this.progression.grantXp(amount);
    this.recalculateStats();
    return result;
  }
  upgradeSkill(slot) { return this.progression.upgrade(slot); }
  setPracticeLevel(level) {
    this.progression.setLevel(level);
    // Explicit debug command: cancel in-flight actions/aim/status and cooldowns,
    // preserving positions, pins, time, dummy HP and numerical resource deficit.
    this.cancelAim(); this.pending = []; this.projectiles = []; this.buff = null;
    this.cooldowns = {}; this.player.cooldown = 0; this.lockUntil = this.time;
    this.firingTargetId = null; this.firing = null;
    this.recalculateStats();
    return this.progression.snapshot();
  }
  restoreResources() { this.player.hp = this.player.maxHp; this.player.mana = this.player.maxMana; }
  abilityRange(a) {
    return (
      a.range +
      (a.effectId === "orb-mark" && this.buff && this.time < this.buff.until
        ? this.ability("skill-1").parameters.skill2RangeBonus
        : 0)
    );
  }
  setAim(p) {
    if (
      p &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      Math.hypot(p.x - this.player.x, p.z - this.player.z) > 1e-7
    ) {
      this.aim = { x: p.x, z: p.z };
      if (this.aiming) this.aiming.point = { ...this.aim };
    }
  }
  direction(p) {
    const dx = p.x - this.player.x,
      dz = p.z - this.player.z,
      n = Math.hypot(dx, dz);
    return n > 1e-7 ? { x: dx / n, z: dz / n } : null;
  }
  isActionLocked() {
    return this.time + 1e-8 < this.lockUntil;
  }
  targetForAbility(a) {
    const pin = this.enemies.find((e) => e.id === this.manualTargetId);
    const source = { ...this.player, range: this.abilityRange(a) };
    if (isEligibleEnemy(pin)) return inAttackRange(source, pin) ? pin : null;
    return selectAutomaticTarget(source, this.enemies, this.targetMode);
  }
  beginAim(slot) {
    const a = this.ability(slot),
      reason = this.castAvailability(a);
    if (reason) {
      this.lastCastResult = reason;
      return false;
    }
    const target = this.targetForAbility(a);
    this.aiming = {
      slot,
      point: target
        ? { x: target.x, z: target.z }
        : {
            x: this.player.x + this.facing.x * this.abilityRange(a),
            z: this.player.z + this.facing.z * this.abilityRange(a),
          },
    };
    this.aim = { ...this.aiming.point };
    return true;
  }
  cancelAim() {
    this.aiming = null;
    this.aim = null;
  }
  releaseAim() {
    if (!this.aiming) return "cancelled";
    const { slot, point } = this.aiming,
      a = this.ability(slot);
    const target = this.enemies
      .filter(
        (e) =>
          isEligibleEnemy(e) &&
          Math.hypot(e.x - this.player.x, e.z - this.player.z) <=
            this.abilityRange(a) + 1e-8 &&
          Math.hypot(e.x - point.x, e.z - point.z) <= e.radius + 0.6,
      )
      .sort(
        (a, b) =>
          Math.hypot(a.x - point.x, a.z - point.z) -
            Math.hypot(b.x - point.x, b.z - point.z) ||
          a.id.localeCompare(b.id),
      )[0];
    this.cancelAim();
    return this.cast(slot, point, target?.id || null);
  }
  castAvailability(a) {
    if (!a || a.slot === "passive") return "invalid-ability";
    if (this.progression && a.rank === 0) return "unlearned";
    if (!canActorAct(this.player)) return "cannot-act";
    if (this.cooldowns[a.id] > 1e-8) return "cooldown";
    if (this.pending.length) return "casting";
    if (this.isActionLocked()) return "animation";
    if (this.player.mana + 1e-8 < a.manaCost) return "mana";
    return null;
  }
  currentFacing() {
    if (this.isActionLocked() && this.firing) return this.firing;
    if (this.aiming) return this.direction(this.aiming.point) || this.facing;
    return this.facing;
  }
  emit(type, data = {}) {
    this.events.emit({ type, time: this.time, ...data });
  }
  update(dt, h = 0, v = 0) {
    if (!Number.isFinite(dt) || dt < 0) throw Error("Invalid combat timestep");
    this.player.stunned = Boolean(this.player.stunnedUntil > this.time);
    if (!canActorAct(this.player) || this.isActionLocked()) {
      h = 0;
      v = 0;
    }
    const before = { x: this.player.x, z: this.player.z };
    if (this.player.hp <= 0) {
      this.cancelAim();
      this.pending = [];
      this.projectiles = [];
      this.buff = null;
    }
    this.applyRangeAndSpeed();
    super.update(dt, h, v);
    if (
      !this.aiming &&
      Math.hypot(this.player.x - before.x, this.player.z - before.z) > 1e-7
    )
      this.facing =
        this.direction({
          x: this.player.x + (this.player.x - before.x),
          z: this.player.z + (this.player.z - before.z),
        }) || this.facing;
    if (this.player.hp > 0 && this.progression) this.player.hp = Math.min(this.player.maxHp, this.player.hp + this.player.hpRegen * dt);
    if (this.player.hp > 0)
      this.player.mana = Math.min(
        this.player.maxMana,
        this.player.mana + this.player.manaRegen * dt,
      );
    if (this.isActionLocked() && this.firingTargetId) {
      const target = this.enemies.find((e) => e.id === this.firingTargetId);
      if (isEligibleEnemy(target)) {
        this.firing = this.direction(target) || this.firing;
        this.facing = { ...this.firing };
      }
    }
    for (const id of Object.keys(this.cooldowns))
      this.cooldowns[id] = Math.max(0, this.cooldowns[id] - dt);
    for (const e of this.enemies) {
      if (e.mark && e.mark.until <= this.time) delete e.mark;
      e.stunned = Boolean(e.hp > 0 && e.stunnedUntil > this.time);
    }
    if (this.buff && this.time >= this.buff.until) {
      this.buff = null;
      this.applyRangeAndSpeed();
      this.refreshTarget();
    }
    const due = this.pending.filter((c) => c.at <= this.time);
    this.pending = this.pending.filter((c) => c.at > this.time);
    for (const cast of due)
      if (canActorAct(this.player)) this.executeCast(cast);
    for (const p of [...this.projectiles]) {
      if (!this.projectiles.includes(p)) continue;
      if (p.targetId) {
        const target = this.enemies.find((e) => e.id === p.targetId);
        if (!isEligibleEnemy(target)) {
          this.projectiles = this.projectiles.filter((q) => q !== p);
          continue;
        }
        p.end = { x: target.x, z: target.z };
        const dx = target.x - p.x,
          dz = target.z - p.z,
          n = Math.hypot(dx, dz);
        p.dx = n ? dx / n : 0;
        p.dz = n ? dz / n : 0;
      }
      const distance = Math.min(
          p.targetId ? Math.hypot(p.end.x - p.x, p.end.z - p.z) : p.remaining,
          p.speed * Math.min(dt, Math.max(0, this.time - p.bornAt)),
        ),
        next = { x: p.x + p.dx * distance, z: p.z + p.dz * distance };
      this.advanceProjectile(p, next);
    }
  }
  cast(slot, aim = undefined, targetId = null) {
    const a = this.ability(slot);
    let reason = this.castAvailability(a);
    let point = aim;
    if (!reason && aim === undefined) {
      const target = this.targetForAbility(a);
      if (!target) reason = "no-target";
      else {
        targetId = target.id;
        point = { x: target.x, z: target.z };
      }
    }
    if (!reason && (!point || typeof point !== "object"))
      reason = "invalid-aim";
    if (!reason && targetId) {
      const target = this.enemies.find((e) => e.id === targetId);
      if (
        !isEligibleEnemy(target) ||
        Math.hypot(target.x - this.player.x, target.z - this.player.z) >
          this.abilityRange(a) + 1e-8
      )
        reason = "invalid-target";
    }
    let d;
    if (!reason) {
      if (
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.z) ||
        !(d = this.direction(point))
      )
        reason = "invalid-aim";
    }
    if (reason) {
      this.lastCastResult = reason;
      return reason;
    }
    const range = this.abilityRange(a),
      distance =
        a.effectId === "orb-mark"
          ? Math.min(
              range,
              Math.hypot(point.x - this.player.x, point.z - this.player.z),
            )
          : range;
    const cast = {
      id: ++this.serial,
      targetId,
      a: this.progression ? { ...a, damage: damagePower(a.damage, a.damageModel, this.player.attributes) } : a,
      dir: d,
      distance,
      at: this.time + a.castTime,
      ...(a.effectId === "orb-mark"
        ? {
            destination: {
              x: this.player.x + d.x * distance,
              z: this.player.z + d.z * distance,
            },
          }
        : {}),
    };
    this.player.mana = Math.max(0, this.player.mana - a.manaCost);
    this.cooldowns[a.id] = a.cooldown;
    this.pending.push(cast);
    this.facing = { ...d };
    this.firing = { ...d };
    this.lockUntil =
      this.time + Math.max(this.hero.actionLockDuration, a.castTime);
    this.firingTargetId = targetId;
    this.cancelAim();
    this.lastCast = { serial: this.serial, slot: a.slot };
    this.lastCastResult = "cast";
    this.emit("cast", {
      effect: a.effectId,
      source: { x: this.player.x, z: this.player.z },
      end: {
        x: this.player.x + d.x * distance,
        z: this.player.z + d.z * distance,
      },
      width: a.parameters.width || a.parameters.blastRadius || 0.3,
      duration: a.castTime,
    });
    return "cast";
  }
  passive(target) {
    return distanceMultiplier(
      this.player,
      target,
      this.ability("passive").parameters,
    );
  }
  consumeMark(target) {
    if (!target.mark || target.mark.until <= this.time) return 0;
    delete target.mark;
    const p = this.ability("skill-2").parameters;
    for (const e of this.enemies)
      if (
        isEligibleEnemy(e) &&
        Math.hypot(e.x - target.x, e.z - target.z) <= p.stunRadius + e.radius
      ) {
        e.stunnedUntil = Math.max(
          e.stunnedUntil || 0,
          this.time + p.stunDuration,
        );
        e.stunned = true;
      }
    this.emit("mark-trigger", {
      point: { x: target.x, z: target.z },
      radius: p.stunRadius,
    });
    return p.bonusDamage;
  }
  attack(id = null) {
    this.refreshTarget();
    let reason = null;
    if (!canActorAct(this.player)) reason = "cannot-act";
    if (!reason && id !== null && !this.prioritizeTarget(id))
      reason = "invalid-target";
    const t = this.selectedTarget;
    if (!reason && !t)
      reason = this.enemies.some(isEligibleEnemy) ? "range" : "no-enemies";
    if (!reason && !inAttackRange(this.player, t)) reason = "range";
    if (!reason && this.player.cooldown > 1e-8) reason = "cooldown";
    if (!reason && this.pending.length) reason = "casting";
    if (!reason && this.isActionLocked()) reason = "animation";
    if (!reason) {
      const dir = this.direction(t) || this.facing,
        b = this.progression ? { ...this.hero.basicAttack, damage: this.player.damage, cooldown: this.player.attackCooldown,
          castTime: this.hero.basicAttack.castTime * this.player.attackCooldown / this.hero.actionLockDuration } : this.hero.basicAttack;
      const a = {
        ...b,
        effectId: "basic-projectile",
        parameters: {
          speed: b.projectileSpeed,
          radius: 0.1,
          collidesWithWalls: false,
        },
      };
      this.pending.push({
        id: ++this.serial,
        targetId: t.id,
        a,
        dir,
        distance: this.player.range,
        at: this.time + b.castTime,
      });
      this.player.cooldown = b.cooldown;
      this.facing = { ...dir };
      this.firing = { ...dir };
      this.lockUntil =
        this.time + (this.progression ? b.cooldown : Math.max(this.hero.actionLockDuration, b.castTime));
      this.firingTargetId = t.id;
      this.cancelAim();
      reason = "fired";
    }
    this.lastAttack = {
      reason,
      serial: this.lastAttack.serial + 1,
      targetId: t?.id || id,
      duration: this.progression ? this.player.attackCooldown : this.hero.actionLockDuration,
    };
    return reason;
  }

  damageEnemy(target, base, type = "physical") {
    if (!isEligibleEnemy(target)) return;
    const raw = base + this.consumeMark(target);
    const damage = this.progression ? resolveDamage({ base: raw,
      model: { type, physicalScaling: 0, magicScaling: 0 }, source: this.player.attributes,
      target, multiplier: this.passive(target) }).amount : raw * this.passive(target);
    const before = target.hp;
    target.hp = Math.max(0, before - damage);
    this.emit("hit", { point: { x: target.x, z: target.z }, damage });
    if (before > 0 && target.hp === 0) {
      delete target.mark;
      target.stunned = false;
      this.emit("death", {
        actor: {
          id: "player",
          name: this.hero.name,
          team: "player",
          kind: "player",
        },
        victim: {
          id: target.id,
          name: target.name,
          team: target.team,
          kind: "training-dummy",
          hp: 0,
        },
      });
    }
    this.refreshTarget();
  }
  executeCast(cast) {
    const { a, distance } = cast,
      center = { x: this.player.x, z: this.player.z };
    const target = cast.targetId
      ? this.enemies.find((e) => e.id === cast.targetId)
      : null;
    if (cast.targetId && !isEligibleEnemy(target)) return;
    const end = target
      ? { x: target.x, z: target.z }
      : cast.destination || {
          x: center.x + cast.dir.x * distance,
          z: center.z + cast.dir.z * distance,
        };
    const lengthFromCenter = Math.hypot(end.x - center.x, end.z - center.z);
    const dir =
      (target || cast.destination) && lengthFromCenter > 1e-8
        ? {
            x: (end.x - center.x) / lengthFromCenter,
            z: (end.z - center.z) / lengthFromCenter,
          }
        : cast.dir;
    this.firing = { ...dir };
    const offset = Math.min(1.53, lengthFromCenter),
      origin = {
        x: center.x + dir.x * offset + dir.z * 0.13,
        z: center.z + dir.z * offset - dir.x * 0.13,
      };
    if (a.effectId === "line-blast") {
      for (const e of this.enemies)
        if (
          isEligibleEnemy(e) &&
          (e.x - center.x) * dir.x + (e.z - center.z) * dir.z >= 0 &&
          segmentCircle(center, end, e, a.parameters.width / 2) !== null
        )
          this.damageEnemy(e, a.damage, a.damageModel?.type);
      this.emit("beam", { source: origin, end, width: a.parameters.width });
      return;
    }
    const length = Math.hypot(end.x - origin.x, end.z - origin.z),
      p = {
        id: cast.id,
        targetId: cast.targetId || null,
        bornAt: cast.at,
        effect: a.effectId,
        a,
        x: center.x,
        z: center.z,
        dx: length ? (end.x - origin.x) / length : dir.x,
        dz: length ? (end.z - origin.z) / length : dir.z,
        speed: a.parameters.speed,
        radius: a.parameters.radius,
        remaining: length,
        end,
      };
    this.projectiles.push(p);
    this.emit("launch", { id: p.id, effect: p.effect, source: origin, end });
    // Sweep the muzzle offset too: close targets/walls cannot be skipped by a
    // long decorative barrel. This sweep is collision-only, not visual damage.
    this.advanceProjectile(p, origin, true);
    if (this.projectiles.includes(p) && length < 1e-8)
      this.finishProjectile(p, null);
  }
  advanceProjectile(p, next, initial = false) {
    const start = { x: p.x, z: p.z };
    let best = 2,
      target = null;
    for (const e of this.enemies)
      if (isEligibleEnemy(e) && (!p.targetId || e.id === p.targetId)) {
        const t = segmentCircle(start, next, e, p.radius);
        if (
          t !== null &&
          (t < best || (t === best && e.id < (target?.id || "")))
        ) {
          best = t;
          target = e;
        }
      }
    if (p.a.parameters.collidesWithWalls)
      for (const box of this.arena.obstacles) {
        const t = segmentBox(start, next, box, p.radius);
        if (t !== null && t < best) {
          best = t;
          target = null;
        }
      }
    if (p.a.parameters.collidesWithWalls) {
      const limit = this.arena.halfSize - p.radius;
      for (const axis of ["x", "z"])
        if (Math.abs(next[axis]) > limit) {
          const d = next[axis] - start[axis],
            t = d ? ((next[axis] > 0 ? limit : -limit) - start[axis]) / d : 0;
          if (t >= 0 && t < best) {
            best = t;
            target = null;
          }
        }
    }
    if (best <= 1) {
      const hit = pointAlong(start, next, best);
      p.x = hit.x;
      p.z = hit.z;
      this.finishProjectile(p, target);
      return;
    }
    if (!initial && !p.targetId)
      p.remaining = Math.max(
        0,
        p.remaining - Math.hypot(next.x - p.x, next.z - p.z),
      );
    p.x = next.x;
    p.z = next.z;
    if (!initial && !p.targetId && p.remaining <= 1e-8)
      this.finishProjectile(p, null);
  }
  finishProjectile(p, target) {
    this.projectiles = this.projectiles.filter((q) => q !== p);
    const point = { x: p.x, z: p.z },
      a = p.a;
    if (a.effectId === "orb-mark") {
      for (const e of this.enemies)
        if (
          isEligibleEnemy(e) &&
          Math.hypot(e.x - point.x, e.z - point.z) <=
            a.parameters.blastRadius + e.radius
        ) {
          this.damageEnemy(e, a.damage, a.damageModel?.type);
          if (e.hp > 0)
            e.mark = {
              until: this.time + a.parameters.markDuration,
              source: "player",
            };
        }
      this.emit("explosion", { point, radius: a.parameters.blastRadius });
    } else {
      if (target) {
        this.damageEnemy(target, a.damage, a.damageModel?.type, {basic:a.effectId === 'basic-projectile'});
        if (a.effectId === "basic-projectile") this.hits++;
        if (a.effectId === "line-projectile") {
          this.buff = { until: this.time + a.parameters.buffDuration };
          this.applyRangeAndSpeed();
          this.refreshTarget();
        }
      }
      this.emit("impact", { point, effect: a.effectId });
    }
  }
  snapshot() {
    return structuredClone({
      ...super.snapshot(),
      ...(this.progression ? { progression: this.progression.snapshot() } : {}),
      mana: this.player.mana,
      abilityCooldowns: { ...this.cooldowns },
      projectiles: this.projectiles.map(({ a, ...p }) => p),
      pendingCasts: this.pending.map((c) => ({
        id: c.id,
        slot: c.a.slot,
        at: c.at,
      })),
      buff: this.buff && { ...this.buff },
      lastCast: { ...this.lastCast },
      lastCastResult: this.lastCastResult,
      facing: this.currentFacing(),
      actionLocked: this.isActionLocked(),
      lockUntil: this.lockUntil,
      aiming: this.aiming,
    });
  }
}
