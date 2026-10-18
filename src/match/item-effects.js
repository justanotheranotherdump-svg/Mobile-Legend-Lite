import { inventoryBonuses } from "./equipment.js";
import {
  runtimeAttributes,
  calculateAttributes,
} from "../simulation/stats/attributes.js";
import { validTarget, distance } from "./actions.js";
// Explicit named unique effects. Independent of shop, models and frame rate.
// Timers are match time; sell/rebuy does not reset shared active/passive cooldowns.
export class ItemEffects {
  constructor(s) {
    this.s = s;
    this.t = {};
    this.active = new Set();
    this.refresh();
  }
  has(id) {
    return this.active.has(id);
  }
  refresh() {
    this.bonus = inventoryBonuses(this.s.inventory);
    this.active = new Set(this.bonus.effects);
    this.tick(0);
  }
  heal(a, hp, mana = 0) {
    if (a.hp <= 0) return;
    a.hp = Math.min(
      a.maxHp,
      a.hp + hp * (a.antiHealUntil > this.s.time ? 0.6 : 1),
    );
    a.mana = Math.min(a.maxMana, a.mana + mana);
  }
  tick() {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time,
      b = this.bonus;
    const flat = {},
      percent = {};
    if (this.has("doom") && t.doomUntil > now) percent.physicalAttack = 0.05;
    if (this.has("despair") && t.despairUntil > now)
      percent.physicalAttack = (percent.physicalAttack || 0) + 0.25;
    if (this.has("frenzy") && t.frenzyUntil > now) percent.attackSpeed = 0.2;
    const impulse = this.has("impulse")
      ? 0.06
      : this.has("impulse-small")
        ? 0.03
        : 0;
    if (impulse && t.impulseUntil > now)
      percent.attackSpeed =
        (percent.attackSpeed || 0) +
        Math.min(5, t.impulseStacks || 0) * impulse;
    if (this.has("endless-strike") && t.thirdUntil > now)
      percent.attackSpeed = (percent.attackSpeed || 0) + 0.8;
    if (this.has("supreme-warrior") && t.spearUntil > now)
      percent.movementSpeed = 0.3;
    if (this.has("retribution") && t.hunterUntil > now)
      percent.movementSpeed =
        (percent.movementSpeed || 0) + (0.5 * (t.hunterUntil - now)) / 3;
    if (this.has("malefic-energy") && t.energyUntil > now)
      percent.movementSpeed = (percent.movementSpeed || 0) + 0.1;
    if (
      (this.has("lifeline") || this.has("lifeline-rose")) &&
      t.lifelineUntil > now
    )
      percent.movementSpeed =
        (percent.movementSpeed || 0) + (0.5 * (t.lifelineUntil - now)) / 3;
    if (this.has("side-effect") && t.anyCombatUntil > now)
      flat.movementSpeed = -20;
    const ls =
      b.lifesteal +
      (this.has("devour") && t.devourUntil > now
        ? Math.min(5, t.devourStacks || 0) * 0.02
        : 0);
    if (this.has("dragon-scale")) {
      const defense =
        Math.min(50, ls * 100) * (s.hero.role === "fighter" ? 1 : 0.5);
      flat.physicalDefense = defense;
      flat.magicDefense = defense;
    }
    if (this.has("valor") && t.valorUntil > now)
      flat.physicalDefense =
        (flat.physicalDefense || 0) + Math.min(5, t.valorStacks || 0) * 4;
    if (this.has("fighting-spirit") && t.warUntil > now)
      flat.physicalAttack =
        (flat.physicalAttack || 0) +
        (t.warStacks || 0) *
          (["marksman", "mage", "support"].includes(s.hero.role) ? 6 : 12);
    const signature = JSON.stringify([flat, percent, s.inventory]);
    if (signature !== this.signature) {
      this.signature = signature;
      s.statModifiers.items = b.modifiers;
      s.statModifiers.temporary = { flat, percent };
      s.recalculateStats();
    }
    p.criticalChance = b.criticalChance;
    p.lifesteal = Math.min(0.5, ls);
    p.cooldownReduction = b.cooldownReduction;
    p.spellVamp = b.spellVamp;
    p.tenacity = this.has("fortitude") ? 0.25 : 0;
    if (p.shield && p.shield.until <= now) p.shield = null;
    this.applyRuntime();
  }
  applyRuntime() {
    const s = this.s,
      p = s.player,
      r = runtimeAttributes(s.hero, p.attributes),
      a =
        s.buff && s.time < s.buff.until
          ? s.ability("skill-1").parameters
          : null;
    p.range =
      (r.range + (a?.attackRangeBonus || 0)) *
      (this.has("malefic-energy") ? 1.12 : 1);
    p.speed =
      r.speed *
      (a?.speedMultiplier || 1) *
      (p.slow?.until > s.time ? 1 - p.slow.ratio : 1);
    p.attackRate = r.attackRate;
    p.attackCooldown = r.attackCooldown;
    if (this.has("endless-strike") && this.t.thirdUntil > s.time) {
      p.attackRate = Math.min(5, p.attributes.attackSpeed);
      p.attackCooldown = 1 / p.attackRate;
    }
  }
  prepare(target) {
    const s = this.s;
    if (
      this.has("despair") &&
      target.kind !== "minion" &&
      target.hp < target.maxHp * 0.5
    ) {
      this.t.despairUntil = s.time + 2;
      this.tick();
    }
  }
  basicCommitted(target) {
    this.prepare(target);
    if (this.has("endless-strike") && (this.t.staffHits || 0) >= 2) {
      this.t.thirdUntil = this.s.time + 1.5;
      this.t.third = true;
      this.tick();
    }
  }
  cast(a) {
    const now = this.s.time;
    if (this.has("divine-justice") && now >= (this.t.divineReadyAt || 0))
      this.t.divineUntil = now + 3;
    if (
      this.has("supreme-warrior") &&
      a.slot === "skill-ultimate" &&
      now >= (this.t.spearReadyAt || 0)
    ) {
      this.t.spearUntil = now + 7.5;
      this.t.spearReadyAt = now + 15;
      this.tick();
    }
  }
  defense(type, target) {
    if (type === "magic")
      return { flatPenetration: this.has("arcane-penetration") ? 10 : 0 };
    if (type !== "physical") return {};
    return {
      flatPenetration: this.bonus.physicalPenetration,
      percentPenetration: Math.min(
        0.6,
        (this.has("armor-buster") ? 0.3 : 0) +
          (this.has("breaker")
            ? Math.min(
                0.3,
                (target.attributes?.physicalDefense ||
                  target.physicalDefense ||
                  0) * 0.001,
              )
            : 0),
      ),
    };
  }
  slow(target, ratio, duration) {
    const now = this.s.time,
      old = target.slow;
    target.slow = {
      ratio: old?.until > now ? Math.max(old.ratio, ratio) : ratio,
      until: now + duration * (1 - (target.tenacity || 0)),
    };
  }
  absorb(amount, type, source) {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time;
    if (type === "physical" && p.physicalImmuneUntil > now) return 0;
    if (
      (this.has("lifeline") || this.has("lifeline-rose")) &&
      p.hp - amount < p.maxHp * 0.3 &&
      now >= (t.lifelineReadyAt || 0)
    ) {
      p.shield = {
        amount:
          s.progression.level *
          (this.has("lifeline-rose") ? 120 : 60) *
          (p.antiHealUntil > now ? 0.6 : 1),
        until: now + 3,
      };
      t.lifelineReadyAt = now + 60;
      t.lifelineUntil = now + 3;
    }
    if (p.shield?.until > now) {
      const block = Math.min(amount, p.shield.amount);
      p.shield.amount -= block;
      amount -= block;
    }
    t.anyCombatUntil = now + 5;
    if (source?.kind !== "minion") t.lastNonMinion = now;
    if (type === "physical" && this.has("valor")) {
      t.valorStacks =
        t.valorUntil > now ? Math.min(5, (t.valorStacks || 0) + 1) : 1;
      t.valorUntil = now + 3;
    }
    return amount;
  }
  activeWind() {
    const s = this.s;
    if (!this.has("wind-chant")) return "not-equipped";
    if (s.paused || s.phase !== "running" || s.player.hp <= 0)
      return "cannot-act";
    if (s.time < (this.t.windReadyAt || 0)) return "cooldown";
    this.t.windReadyAt = s.time + 90;
    s.player.physicalImmuneUntil =
      s.time + (s.hero.role === "marksman" ? 2 : 1);
    s.emit("utility", {
      id: "wind-chant",
      point: { x: s.player.x, z: s.player.z },
    });
    return "activated";
  }
  dealt(target, raw, type, basic, crit, actual) {
    const s = this.s,
      p = s.player,
      t = this.t,
      now = s.time;
    if (actual <= 0) return;
    t.anyCombatUntil = now + 5;
    const wasQuiet = now - (t.lastNonMinion ?? 0) >= 5;
    if (target.kind !== "minion") t.lastNonMinion = now;
    if (this.has("lifebane")) target.antiHealUntil = now + 3;
    if (this.has("fighting-spirit")) {
      if (!(t.warUntil > now)) t.warStacks = 0;
      if (now >= (t.warNext || 0)) {
        t.warStacks = Math.min(6, (t.warStacks || 0) + 1);
        t.warNext = now + 1;
      }
      t.warUntil = now + 4;
      if (t.warStacks === 6)
        this.proc(
          target,
          raw *
            (["marksman", "mage", "support"].includes(s.hero.role)
              ? 0.05
              : 0.1),
          "true",
        );
    }
    if (this.has("retribution") && ["player", "bot"].includes(target.kind)) {
      t.hunterHits = t.hunterId === target.id ? (t.hunterHits || 0) + 1 : 1;
      t.hunterId = target.id;
      if (t.hunterHits >= 5 && now >= (t.hunterReadyAt || 0)) {
        t.hunterUntil = now + 3;
        t.hunterReadyAt = now + 8;
        t.hunterHits = 0;
      }
    }
    if (!basic) {
      this.heal(p, actual * p.spellVamp);
      this.tick();
      return;
    }
    if (crit) {
      if (this.has("doom")) t.doomUntil = now + 2;
      if (this.has("frenzy")) t.frenzyUntil = now + 2;
    }
    let extra = 0;
    if (this.has("ambush") && wasQuiet && now >= (t.ambushReadyAt || 0)) {
      t.ambushReadyAt = now + 5;
      extra += this.proc(
        target,
        160 + 0.4 * p.attributes.physicalAttack,
        "physical",
      );
      this.slow(target, 0.4, 1.5);
    }
    const repeats = this.has("endless-strike") && t.third ? 3 : 1;
    for (let i = 0; i < repeats; i++) {
      if (this.has("corrosive")) {
        extra += this.proc(target, 80, "physical");
        target.corrosion =
          target.corrosion?.until > now
            ? {
                stacks: Math.min(5, target.corrosion.stacks + 1),
                until: now + 1.5,
              }
            : { stacks: 1, until: now + 1.5 };
        this.slow(
          target,
          (s.hero.role === "marksman" ? 0.04 : 0.08) * target.corrosion.stacks,
          1.5,
        );
      }
      if (this.has("engulf"))
        extra += this.proc(
          target,
          Math.min(target.kind === "minion" ? 60 : Infinity, target.hp * 0.08),
          "physical",
        );
      if (this.has("crossbow"))
        extra += this.proc(
          target,
          40,
          p.attributes.magicPower > p.attributes.physicalAttack
            ? "magic"
            : "physical",
        );
      if (this.has("devour")) {
        t.devourStacks =
          t.devourUntil > now ? Math.min(5, (t.devourStacks || 0) + 1) : 1;
        t.devourUntil = now + 3;
      }
      if (this.has("impulse") || this.has("impulse-small")) {
        t.impulseStacks =
          t.impulseUntil > now ? Math.min(5, (t.impulseStacks || 0) + 1) : 1;
        t.impulseUntil = now + 3;
      }
    }
    if (
      this.has("divine-justice") &&
      t.divineUntil > now &&
      now >= (t.divineReadyAt || 0)
    ) {
      this.proc(target, p.attributes.physicalAttack * 0.6, "true");
      this.heal(p, 80 + 0.4 * p.attributes.physicalAttack);
      t.divineUntil = 0;
      t.divineReadyAt = now + 1.5;
    }
    if (this.has("malefic-energy")) t.energyUntil = now + 0.5;
    if (this.has("typhoon")) {
      t.typhoonReadyAt = (t.typhoonReadyAt || 0) - 0.2;
      if (now >= t.typhoonReadyAt) {
        const targets = [
          target,
          ...s.actors
            .filter(
              (a) =>
                a !== target && validTarget(p, a) && distance(a, target) <= 5,
            )
            .sort((a, b) => distance(a, target) - distance(b, target))
            .slice(0, 2),
        ];
        for (const victim of targets) {
          const critical = s.random() < p.criticalChance;
          this.proc(
            victim,
            (150 + ((s.progression.level - 1) * 212) / 14) *
              (victim.kind === "minion" ? 2 : 1) *
              (critical ? p.attributes.criticalDamage : 1),
            "magic",
          );
        }
        t.typhoonReadyAt = now + 5 - ((s.progression.level - 1) * 3) / 14;
      }
    }
    this.heal(p, (actual + extra) * p.lifesteal);
    if (this.has("endless-strike")) {
      t.staffHits = t.third ? 0 : (t.staffHits || 0) + 1;
      t.third = false;
      t.thirdUntil = 0;
    }
    this.tick();
  }
  proc(target, damage, type) {
    return this.s.deal(this.s.player, target, damage, type, false, {
      itemProc: true,
    });
  }
  minionDeath(target) {
    const s = this.s;
    if (
      this.has("mysticism") &&
      target.kind === "minion" &&
      target.team !== s.player.team &&
      target.contributors?.player !== undefined &&
      s.time - target.contributors.player <= 2
    )
      this.heal(s.player, 0, s.player.maxMana * 0.04);
  }
}
