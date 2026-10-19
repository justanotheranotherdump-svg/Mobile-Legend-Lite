import { validTarget, distance } from "./actions.js";
import {
  heroes,
  healActor,
  grantShield,
  slowActor,
} from "../simulation/status.js";
import { calculateAttributes } from "../simulation/stats/attributes.js";
// Extra equipment hooks share the existing authoritative damage/status/clock.
// Local radii and bounded proc rules are labeled in catalog/docs, not presented
// as certification of a commercial game's live patch.
export class ExpandedItemEffects {
  constructor(s) {
    this.s = s;
    this.t = {};
    this.burns = new Map();
    this.butterfly = new Map();
    this.oasis = new Map();
    this.reflections = [];
  }
  has(id) {
    return this.s.itemEffects?.has(id);
  }
  nearby(radius = 3) {
    return this.s.actors.filter(
      (a) =>
        validTarget(this.s.player, a) && distance(this.s.player, a) <= radius,
    );
  }
  stack(key, max, duration, interval = 0) {
    const t = this.t,
      now = this.s.time;
    if (now < (t[key + "Next"] || 0)) return;
    t[key] =
      (t[key + "Until"] || 0) > now ? Math.min(max, (t[key] || 0) + 1) : 1;
    t[key + "Until"] = now + duration;
    t[key + "Next"] = now + interval;
  }
  count(key) {
    return this.t[key + "Until"] > this.s.time ? this.t[key] || 0 : 0;
  }
  modifiers() {
    const s = this.s,
      p = s.player,
      t = this.t,
      l = s.progression.level,
      flat = {},
      percent = {};
    const add = (k, v) => (flat[k] = (flat[k] || 0) + v);
    if (this.has("mystery")) percent.magicPower = 0.21 + 0.01 * (l - 1);
    if (this.has("recharge")) add("magicPower", this.count("recharge") * 5);
    if (this.has("brute-force")) {
      const n = this.count("brute");
      add("physicalAttack", 8 * n);
      percent.movementSpeed = 0.02 * n;
    }
    const defense =
      (this.has("destiny") ? this.count("destiny") * (4.5 + 0.5 * l) : 0) +
      (this.has("thunderbolt") ? t.thunderDefense || 0 : 0);
    add("physicalDefense", defense);
    add(
      "magicDefense",
      defense +
        (this.has("holy-blessing") ? this.count("radiant") * (5 + l) : 0),
    );
    if (this.has("fortress") || this.has("fortress-small")) {
      const big = this.has("fortress"),
        n = this.nearby(big ? 5 : 3.55).filter(heroes).length,
        v = Math.min(5, n) * (big ? 8 : 4);
      add("physicalDefense", v);
      add("magicDefense", v);
    }
    return { flat, percent };
  }
  runtime() {
    const s = this.s,
      p = s.player,
      t = this.t,
      guard = (p.shields || []).find(
        (x) => x.id === "guard" && x.amount > 0 && x.until > s.time,
      );
    if (this.has("guard"))
      p.speed +=
        (guard ? 30 : t.guardBurstUntil > s.time ? 150 : 0) *
        s.hero.runtimeScale.movement;
    if (this.has("bless"))
      p.recoveryBoost =
        (s.spells?.springs.some(
          (x) =>
            x.until >= s.time &&
            distance(p, x) <= s.spells.definition.parameters.radius,
        )
          ? 1.25
          : 1) * 1.25;
    if (this.has("brute-force") && this.count("brute") === 6)
      p.tenacity = 1 - (1 - (s.itemEffects.has("fortitude") ? 0.25 : 0)) * 0.75;
    if (p.chastisedUntil > s.time) {
      p.attackRate *= 0.75;
      p.attackCooldown = 1 / p.attackRate;
    }
  }
  defense(type, target) {
    const t = this.s.time,
      curse = target.curseShred?.until > t ? target.curseShred.stacks * 3 : 0,
      genius =
        type === "magic" && target.geniusShred?.until > t
          ? target.geniusShred.amount * target.geniusShred.stacks
          : 0;
    return {
      flatReduction: curse + genius,
      ...(type === "magic"
        ? {
            flatPenetration: this.has("genius-magic") ? 10 : 0,
            percentPenetration: this.has("spellbreaker")
              ? 0.4 +
                Math.min(
                  0.2,
                  (target.attributes?.magicDefense ||
                    target.magicDefense ||
                    0) * 0.001,
                )
              : 0,
          }
        : {}),
    };
  }
  outgoing(source, raw, type) {
    const s = this.s,
      p = s.player;
    if (type === "physical" && source.deter?.until > s.time)
      raw *= 1 - source.deter.ratio * source.deter.stacks;
    if (source === p) {
      if (this.has("defiance"))
        raw *= 1 + Math.min(0.15, (1 - p.hp / p.maxHp) * 0.25);
      if (
        type === "magic" &&
        this.has("recharge") &&
        this.count("recharge") === 6
      )
        raw *= 1.12;
    }
    return raw;
  }
  proc(target, amount, type = "magic", cascade = false, extra = {}) {
    return this.s.deal(this.s.player, target, amount, type, false, {
      itemProc: true,
      expandedProc: true,
      noItemCascade: !cascade,
      ...extra,
    });
  }
  cast() {
    if (this.has("judgement") || this.has("crisis"))
      this.t.judgementUntil = this.s.time + 3;
  }
  reduceCooldowns(seconds, ultimateOnly = false, fraction = null) {
    const s = this.s;
    for (const a of s.hero.abilities.filter(
      (a) =>
        a.slot !== "passive" && (!ultimateOnly || a.slot === "skill-ultimate"),
    ))
      s.cooldowns[a.id] = Math.max(
        0,
        fraction !== null
          ? (s.cooldowns[a.id] || 0) * (1 - fraction)
          : (s.cooldowns[a.id] || 0) - seconds,
      );
  }
  supportSkill() {
    if (!this.has("oasis-blessing")) return;
    const s = this.s;
    for (const a of s.actors.filter(
      (a) =>
        a.team === s.player.team &&
        heroes(a) &&
        a.hp > 0 &&
        distance(a, s.player) <= s.spells.definition.parameters.radius,
    )) {
      const old = this.oasis.get(a.id);
      this.oasis.set(a.id, {
        actor: a,
        until: s.time + 3,
        readyAt: old?.readyAt || 0,
      });
    }
  }
  receivedHealingScale() {
    return this.has("oasis-blessing") ? 1.12 : 1;
  }
  dealt(target, raw, type, basic, actual, meta = {}) {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time;
    if (actual <= 0) return;
    if (!meta.itemProc && this.has("brute-force")) this.stack("brute", 6, 4, 1);
    if (type === "magic" && !meta.noItemCascade) {
      if (this.has("destiny") && heroes(target))
        this.stack("destiny", 6, 5, 0.4);
      if (this.has("recharge")) this.stack("recharge", 6, 5, 0.4);
      if (this.has("genius-magic") && heroes(target)) {
        const old = target.geniusShred;
        target.geniusShred = {
          until: now + 2,
          stacks: old?.until > now ? Math.min(3, old.stacks + 1) : 1,
          amount: 2.5 + 0.5 * s.progression.level,
        };
      }
      if (
        this.has("scorch") &&
        target.hp > 0 &&
        !["tower", "core"].includes(target.kind)
      ) {
        const old = this.burns.get(target.id);
        this.burns.set(target.id, {
          target,
          until: now + 3,
          next: old?.next > now ? old.next : now + 1,
        });
      }
      if (this.has("butterfly") && heroes(target)) {
        let bank = (this.butterfly.get(target.id) || 0) + raw;
        while (bank >= 900 && target.hp > 0) {
          bank -= 900;
          this.proc(target, target.hp * 0.08);
        }
        this.butterfly.set(target.id, bank);
      }
    }
    if (
      !meta.itemProc &&
      !basic &&
      heroes(target) &&
      this.has("ice-bound") &&
      now >= (t.iceNext || 0)
    ) {
      const old = target.iceBound;
      target.iceBound = {
        stacks: old?.until > now ? Math.min(3, old.stacks + 1) : 1,
        until: now + 2,
      };
      slowActor(s, target, 0.1 * target.iceBound.stacks, 2);
      t.iceNext = now + 0.4;
    }
    if (
      !meta.itemProc &&
      !basic &&
      this.has("resonate") &&
      now >= (t.resonateReadyAt || 0)
    ) {
      t.resonateReadyAt = now + 6;
      for (const a of s.actors.filter(
        (a) => validTarget(p, a) && distance(a, target) <= 3,
      ))
        this.proc(a, 255 + 0.85 * p.attributes.magicPower, "magic", true);
    }
    if (!meta.itemProc && basic && target.hp > 0) {
      if (this.has("affliction")) {
        const repeats = meta.attackEffectRepeats || 1;
        for (let n = 0; n < repeats && target.hp > 0; n++) {
          const extra = this.proc(
            target,
            50 + 0.3 * p.attributes.magicPower,
            "magic",
            true,
          );
          healActor(s, p, extra * p.lifesteal);
        }
      }
      if (
        (this.has("judgement") || this.has("crisis")) &&
        t.judgementUntil > now &&
        now >= (t.judgementReadyAt || 0)
      ) {
        t.judgementUntil = 0;
        t.judgementReadyAt = now + 1.5;
        this.proc(
          target,
          this.has("crisis") ? 90 + 0.6 * p.attributes.magicPower : 50,
          "true",
        );
        if (this.has("crisis")) slowActor(s, target, 0.15, 1.5);
      }
      if (this.has("thunderbolt") && now >= (t.thunderReadyAt || 0)) {
        t.thunderReadyAt = now + 4;
        const base = calculateAttributes(s.hero, s.progression.level),
          damage =
            50 +
            Math.max(0, p.attributes.physicalDefense - base.physicalDefense) +
            Math.max(0, p.attributes.magicDefense - base.magicDefense);
        for (const a of s.actors.filter(
          (a) => validTarget(p, a) && distance(a, target) <= 2,
        )) {
          this.proc(a, damage, "true");
          slowActor(s, a, 0.99, 0.25);
          if (heroes(a))
            t.thunderDefense =
              (t.thunderDefense || 0) +
              (["marksman", "mage"].includes(s.hero.role) ? 0.5 : 1);
        }
      }
    }
    if (
      this.has("lethality") &&
      heroes(target) &&
      target.hp > 0 &&
      target.hp / target.maxHp < 0.04 + 0.001 * (t.lethality || 0)
    )
      this.proc(target, target.hp, "true", false, {
        ignoreShields: true,
        execute: true,
      });
  }
  absorb(amount, type, source, basic, raw, meta = {}) {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time;
    if (p.frozenUntil > now) return 0;
    const hero = heroes(source);
    if (hero) t.lastHeroDamage = now;
    t.lastDamage = now;
    if (type === "magic" && hero && this.has("athena-shield")) {
      if (now >= (t.athenaReadyAt || 0) && !(t.athenaUntil > now)) {
        t.athenaUntil = now + 3;
        t.athenaReadyAt = Infinity;
      }
      if (t.athenaUntil > now) amount *= 0.75;
    }
    if (type === "magic" && this.has("holy-blessing"))
      this.stack("radiant", 6, 5, 0.4);
    if (
      !basic &&
      !meta.itemProc &&
      hero &&
      (this.has("deter") || this.has("deter-small"))
    ) {
      const old = source.deter;
      source.deter = {
        stacks: old?.until > now ? Math.min(3, old.stacks + 1) : 1,
        until: now + 2,
        ratio: this.has("deter") ? 0.06 : 0.04,
      };
    }
    if (basic && this.has("bladed-armor") && !meta.reflected) {
      if (meta.critical) amount *= 0.8;
      this.reflections.push({
        target: source,
        amount: raw * (0.3 + 0.0002 * p.attributes.physicalDefense),
      });
      slowActor(s, source, 0.15, 1);
    }
    if (this.has("chastise")) source.chastisedUntil = now + 2;
    if (
      this.has("redemption") &&
      p.hp - amount < p.maxHp * 0.3 &&
      now >= (t.redemptionReadyAt || 0)
    ) {
      t.redemptionReadyAt = now + 60;
      t.redemptionUntil = now + 2;
    }
    if (
      this.has("demonize") &&
      p.hp - amount < p.maxHp * 0.4 &&
      now >= (t.demonReadyAt || 0)
    ) {
      t.demonReadyAt = now + 60;
      t.demonUntil = now + 3;
      this.reduceCooldowns(2);
    }
    if (type !== "true" && t.demonUntil > now) amount *= 0.7;
    const guard = (p.shields || []).find(
      (x) => x.id === "guard" && x.amount > 0,
    );
    if (this.has("guard") && guard) {
      t.guardReadyAt = now + 20;
      t.guardWasPositive = true;
    }
    if (this.has("defender") && amount > 500)
      t.defenderHeal =
        (t.defenderHeal || 0) +
        (amount - 500) * Math.min(1, 0.3 + 0.00003 * p.maxHp);
    return amount;
  }
  afterDamage() {
    const s = this.s,
      p = s.player,
      t = this.t;
    const reflected = this.reflections.splice(0);
    for (const r of reflected)
      if (r.target.hp > 0)
        this.proc(r.target, r.amount, "physical", false, { reflected: true });
    if (t.defenderHeal) {
      healActor(s, p, t.defenderHeal);
      t.defenderHeal = 0;
    }
    if (t.guardWasPositive) {
      if (!(p.shields || []).some((x) => x.id === "guard" && x.amount > 0))
        t.guardBurstUntil = s.time + 1;
      t.guardWasPositive = false;
    }
  }
  tryImmortal() {
    const s = this.s,
      p = s.player,
      t = this.t;
    if (!this.has("immortal") || s.time < (t.immortalReadyAt || 0))
      return false;
    t.immortalReadyAt = s.time + 210;
    t.immortalPendingUntil = s.time + 2.5;
    p.respawnAt = Infinity;
    p.targetable = false;
    p.protected = true;
    s.emit("immortality-pending", { point: { x: p.x, z: p.z } });
    return true;
  }
  onDeath(source, target) {
    const s = this.s,
      p = s.player,
      t = this.t;
    if (target === p) {
      t.lethality = Math.floor((t.lethality || 0) * 0.7);
      return;
    }
    if (!heroes(target)) return;
    const credited =
      source === p ||
      (source.team === p.team &&
        target.contributors?.player >= s.time - s.scenario.assistWindow);
    if (credited && this.has("timestream")) this.reduceCooldowns(0, true, 0.3);
    if (source === p && this.has("lethality"))
      t.lethality = Math.min(80, (t.lethality || 0) + 10);
    this.butterfly.delete(target.id);
    this.burns.delete(target.id);
  }
  activeFrozen() {
    const s = this.s,
      p = s.player,
      t = this.t;
    if (!this.has("frozen")) return "not-equipped";
    if (
      s.paused ||
      s.phase !== "running" ||
      p.hp <= 0 ||
      p.stunned ||
      s.isActionLocked()
    )
      return "cannot-act";
    if (s.time < (t.frozenReadyAt || 0)) return "cooldown";
    t.frozenReadyAt = s.time + 100;
    p.frozenUntil = s.time + 2;
    p.frozen = true;
    p.targetable = false;
    s.cancelAim();
    s.cancelAttackCommand();
    s.emit("utility", { id: "frozen", point: { x: p.x, z: p.z } });
    return "activated";
  }
  tick(dt = 0) {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time;
    if (p.frozen && !(p.frozenUntil > now)) {
      p.frozen = false;
      p.targetable = !p.protected;
    }
    if (t.immortalPendingUntil && now >= t.immortalPendingUntil) {
      t.immortalPendingUntil = 0;
      p.hp = p.maxHp * 0.16;
      p.targetable = true;
      p.protected = false;
      p.respawnAt = null;
      p.deathHandled = false;
      grantShield(s, p, 150 + 70 * s.progression.level, 3, "immortal");
      s.emit("immortality-revive", { point: { x: p.x, z: p.z } });
    }
    if (!this.has("guard"))
      p.shields = (p.shields || []).filter((x) => x.id !== "guard");
    else if (
      p.hp > 0 &&
      now >= (t.guardReadyAt || 0) &&
      !(p.shields || []).some((x) => x.id === "guard" && x.amount > 0)
    ) {
      grantShield(s, p, 800 + p.attributes.magicPower, 99999, "guard");
      t.guardReadyAt = Infinity;
    }
    if (
      this.has("guard") &&
      Number.isFinite(t.guardReadyAt) &&
      now >= t.guardReadyAt &&
      p.hp > 0
    ) {
      grantShield(s, p, 800 + p.attributes.magicPower, 99999, "guard");
      t.guardReadyAt = Infinity;
    }
    if (
      now - (t.lastHeroDamage ?? -Infinity) >= 5 &&
      now >= (t.athenaUntil || 0)
    )
      t.athenaReadyAt = now;
    if (
      p.hp > 0 &&
      this.has("recovery") &&
      now - (t.lastDamage ?? -Infinity) >= 5
    )
      healActor(s, p, p.maxHp * 0.025 * dt);
    if (this.has("mana-spring") && !Number.isFinite(t.manaReadyAt))
      t.manaReadyAt = now + 10;
    if (p.hp > 0 && this.has("mana-spring") && now >= t.manaReadyAt) {
      p.mana = Math.min(p.maxMana, p.mana + p.maxMana * 0.15);
      t.manaReadyAt = now + 10;
    }
    if (p.hp > 0 && this.has("gift")) {
      for (const key of ["hp", "mana"]) {
        const max = key === "hp" ? p.maxHp : p.maxMana;
        if (p[key] < max * 0.5 && now >= (t[key + "GiftReadyAt"] || 0)) {
          t[key + "GiftReadyAt"] = now + 60;
          t[key + "GiftUntil"] = now + 3;
        }
        const span=Math.max(0,Math.min(dt,(t[key+"GiftUntil"]||0)-(now-dt)));
        if (span>0)
          healActor(
            s,
            p,
            key === "hp" ? max * 0.05 * span : 0,
            key === "mana" ? max * 0.05 * span : 0,
          );
      }
    }
    if (p.hp > 0 && t.redemptionUntil > now)
      healActor(s, p, p.maxHp * 0.1 * dt);
    if (
      p.hp > 0 &&
      (this.has("burning-soul") || this.has("burning-small")) &&
      now >= (t.burningReadyAt || 0)
    ) {
      t.burningReadyAt = now + 1;
      for (const a of this.nearby()) {
        const multiplier = ["creep", "minion"].includes(a.kind)
          ? 2.25 + 0.15 * s.progression.level
          : 1;
        this.proc(
          a,
          p.maxHp * (this.has("burning-soul") ? 0.012 : 0.006) * multiplier,
        );
        if (this.has("curse")) {
          const old = a.curseShred;
          a.curseShred = {
            stacks: old?.until > now ? Math.min(3, old.stacks + 1) : 1,
            until: now + 3,
          };
        }
      }
    }
    if (p.hp > 0 && this.has("lifebane-aura"))
      for (const a of this.nearby(5)) a.antiHealUntil = now + 1;
    for (const [id, b] of this.burns) {
      if (!this.has("scorch") || b.target.hp <= 0 || p.hp <= 0) {
        this.burns.delete(id);
        continue;
      }
      while (b.next <= now && b.next <= b.until) {
        b.next += 1;
        this.proc(b.target, b.target.maxHp * 0.01);
      }
      if (b.next > b.until) this.burns.delete(id);
    }
    for (const [id, b] of this.oasis) {
      if (b.until < now || !this.has("oasis-blessing")) {
        if (b.readyAt < now) this.oasis.delete(id);
        continue;
      }
      if (
        b.actor.hp > 0 &&
        b.actor.hp / b.actor.maxHp < 0.35 &&
        now >= b.readyAt
      ) {
        grantShield(s, b.actor, 100 * s.progression.level, 3, "oasis-" + p.id);
        b.readyAt = now + 60;
        b.until = 0;
        this.reduceCooldowns(2);
      }
    }
  }
}
