import { validateRoleSetup } from "../player/role-setup.js";
import { getItem } from "./recipes.js";
import { getCatalogItem } from "./catalog.js";
import { distance, validTarget } from "./actions.js";
import { heroes, healActor } from "../simulation/status.js";
import { calculateAttributes } from "../simulation/stats/attributes.js";
// Coherent, explicitly versioned classic prototype rules. Newer public guides
// conflict on unlock/economy/Dire Hit; never combine their incompatible formulas.
export const ROLE_RULES = Object.freeze({
  version: "classic-boots-600-v1",
  unlock: 600,
  cap: 1500,
  devotion: 480,
  interval: 5,
  gold: 8,
  xp: 20,
  selfBonus: 1.25,
  assistBonus: 0.45,
  radius: 5,
  concealCooldown: 80,
  concealDuration: 5,
  direCooldown: 30,
  favorCooldown: 15,
});
export class RoleEquipment {
  constructor(s, setup) {
    this.s = s;
    this.setup = validateRoleSetup(setup);
    this.progressGold = 0;
    this.nextThriving = s.time + 5;
    this.readyAt = 0;
    this.favorReadyAt = 0;
    this.direReadyAt = 0;
    this.steal = null;
    this.drains = [];
    this.lastReason = null;
  }
  equipmentChanged() {
    const now = this.compatible;
    if (now && !this.previousCompatible) this.nextThriving = this.s.time + 5;
    this.previousCompatible = now;
  }
  get definition() {
    return getCatalogItem(this.setup.blessingId);
  }
  get hasBoots() {
    return this.s.inventory.some((id) => getItem(id)?.category === "Movement");
  }
  get compatible() {
    return (
      this.setup.kind !== "none" &&
      this.hasBoots &&
      (this.setup.kind === "jungle"
        ? this.s.spells?.id === "retribution"
        : this.s.spells?.id !== "retribution")
    );
  }
  get jungleReady() {
    return (
      this.compatible &&
      this.setup.kind === "jungle" &&
      this.s.spells.progress >= 5
    );
  }
  get roamReady() {
    return (
      this.compatible &&
      this.setup.kind === "roam" &&
      this.progressGold >= ROLE_RULES.unlock
    );
  }
  get scale() {
    return Math.max(0, Math.min(1, (this.progressGold - 600) / 900));
  }
  reason() {
    if (this.setup.kind === "none") return "No blessing selected";
    if (!this.hasBoots) return "Requires equipped boots";
    if (!this.compatible)
      return this.setup.kind === "jungle"
        ? "Requires Retribution"
        : "Roaming is incompatible with Retribution";
    return this.setup.kind === "jungle"
      ? this.jungleReady
        ? "Active"
        : `${this.s.spells.progress}/5 real creep kills / hero kills / assists`
      : this.roamReady
        ? "Active"
        : `${this.progressGold}/600 Thriving Gold`;
  }
  actorModifiers(actor) {
    const flat = {},
      percent = {},
      s = this.s,
      p = s.player;
    if (this.steal?.until > s.time) {
      const v = this.steal;
      if (actor === p) {
        for (const [k, n] of Object.entries(v.gain))
          flat[k] = (flat[k] || 0) + n;
      } else if (actor.id === v.targetId) {
        for (const [k, n] of Object.entries(v.loss))
          flat[k] = (flat[k] || 0) - n;
      }
    }
    if (
      this.roamReady &&
      this.setup.blessingId === "encourage" &&
      p.hp > 0 &&
      actor.hp > 0 &&
      actor.team === p.team &&
      heroes(actor) &&
      distance(p, actor) <= 5
    ) {
      flat.physicalAttack = (flat.physicalAttack || 0) + 12 + 18 * this.scale;
      flat.magicPower = (flat.magicPower || 0) + 12 + 18 * this.scale;
      percent.attackSpeed = 0.15;
    }
    if (actor.concealUntil > s.time && actor.hp > 0)
      percent.movementSpeed = 0.24 + 0.36 * (actor.concealScale || 0);
    return { flat, percent };
  }
  adjustedReward(actor, source, target, reward) {
    if (
      actor !== this.s.player ||
      !this.compatible ||
      this.setup.kind !== "roam" ||
      this.s.time >= 480 ||
      !["minion", "creep"].includes(target.kind)
    )
      return reward;
    const near = this.s.actors.some(
      (a) =>
        a !== actor &&
        heroes(a) &&
        a.team === actor.team &&
        a.hp > 0 &&
        distance(a, target) <= this.s.scenario.rewardRadius,
    );
    return near ? { ...reward, gold: 0, xp: 0 } : reward;
  }
  grant(actor, gold, xp, progress = 0) {
    const s = this.s;
    if (actor === s.player) {
      s.gold += gold;
      s.stats.goldEarned += gold;
      if (xp) s.grantXp(xp);
      this.progressGold = Math.min(1500, this.progressGold + progress);
    } else {
      actor.earnedGold = (actor.earnedGold || 0) + gold;
      if (xp) {
        const before = actor.progression.level;
        actor.progression.grantXp(xp);
        if (before !== actor.progression.level) s.growBot(actor);
      }
    }
    s.emit("roam-income", {
      id: actor.id,
      gold,
      xp,
      progress: this.progressGold,
    });
  }
  tick() {
    const s = this.s,
      p = s.player,
      t = s.time;
    for (const a of s.actors) {
      if (a.concealUntil <= t || a.hp <= 0) {
        a.camouflaged = false;
        a.concealUntil = 0;
      } else if (a.concealUntil > t) a.camouflaged = true;
    }
    if (
      this.compatible &&
      this.setup.kind === "roam" &&
      this.progressGold < 1500
    ) {
      while (this.nextThriving <= t) {
        this.nextThriving += 5;
        const team = [p, ...s.bots.filter((a) => a.team === p.team)].filter(
          (a) => a.hp > 0,
        );
        if (!team.length) continue;
        const income = (a) =>
          a === p ? s.stats.goldEarned : a.earnedGold || 0;
        const goldActor = [...team].sort(
          (a, b) =>
            income(a) - income(b) ||
            (a === p ? -1 : b === p ? 1 : a.id.localeCompare(b.id)),
        )[0];
        const xpActor = [...team].sort(
          (a, b) =>
            a.progression.totalXp - b.progression.totalXp || (a === p ? -1 : 1),
        )[0];
        const gold = goldActor === p ? 10 : 8,
          xp = xpActor === p ? 25 : 20;
        this.grant(goldActor, gold, 0, goldActor === p ? gold : 0);
        this.grant(xpActor, 0, xp);
      }
    } else this.nextThriving = t + 5;
    this.drains = this.drains.filter((d) => {
      if (d.target.hp <= 0 || p.hp <= 0) return false;
      while (d.next <= t && d.next <= d.until) {
        d.next += 1;
        const actual = s.deal(p, d.target, d.amount / 4, "true", false, {
          itemProc: true,
          blessing: true,
        });
        healActor(s, p, actual);
      }
      return d.next <= d.until;
    });
  }
  onDeath(source, target) {
    const s = this.s,
      p = s.player;
    if (
      this.compatible &&
      this.setup.kind === "roam" &&
      s.time < 480 &&
      heroes(target) &&
      source.team === p.team &&
      source !== p &&
      target.contributors?.player >= s.time - s.scenario.assistWindow
    ) {
      const bonusGold = Math.floor(s.scenario.heroReward.gold * 0.45),
        bonusXp = Math.floor(s.scenario.heroReward.xp * 0.45);
      this.grant(p, s.scenario.heroReward.gold + bonusGold, bonusXp, bonusGold);
    }
  }
  castRetribution(target, raw) {
    const s = this.s,
      p = s.player;
    if (!this.jungleReady)
      return s.deal(p, target, raw, "true", false, {
        spell: true,
        itemProc: true,
      });
    if (!heroes(target))
      return s.deal(p, target, raw * 1.5, "true", false, {
        spell: true,
        itemProc: true,
      });
    const actual = s.deal(p, target, 100, "true", false, {
      spell: true,
      itemProc: true,
      blessing: true,
    });
    if (target.hp <= 0) return actual;
    const id = this.setup.blessingId,
      level = s.progression.level;
    if (id === "bloody-retribution") {
      const extra = p.maxHp - calculateAttributes(s.hero, level).maxHp;
      this.drains.push({
        target,
        amount: 250 + 0.2 * Math.max(0, extra),
        next: s.time + 1,
        until: s.time + 4,
      });
    } else {
      const gain = {},
        loss = {};
      const amount =
        id === "flame-retribution"
          ? 58 + 3 * (level - 1)
          : 72 + 2 * (level - 1);
      for (const k of id === "flame-retribution"
        ? ["physicalAttack", "magicPower"]
        : ["movementSpeed"]) {
        gain[k] = amount;
        loss[k] = Math.min(
          amount,
          Math.max(
            0,
            (target.attributes?.[k] || 0) - (k === "movementSpeed" ? 1 : 0),
          ),
        );
      }
      this.steal = { targetId: target.id, gain, loss, until: s.time + 4 };
      s.itemEffects.tick();
    }
    return actual;
  }
  activateConceal() {
    const s = this.s,
      p = s.player;
    if (!this.roamReady || this.setup.blessingId !== "conceal")
      return this.reason();
    if (
      s.paused ||
      s.phase !== "running" ||
      p.hp <= 0 ||
      p.stunned ||
      s.isActionLocked()
    )
      return "cannot-act";
    if (s.time < this.readyAt) return "cooldown";
    this.readyAt = s.time + 80;
    for (const a of s.actors.filter(
      (a) => a.team === p.team && heroes(a) && a.hp > 0 && distance(p, a) <= 5,
    )) {
      a.concealUntil = s.time + 5;
      a.concealScale = this.scale;
      a.camouflaged = true;
    }
    s.emit("utility", { id: "conceal", point: { x: p.x, z: p.z } });
    s.itemEffects.tick();
    return "activated";
  }
  breakCamouflage(actor) {
    if (actor?.camouflaged) {
      actor.camouflaged = false;
      actor.concealUntil = 0;
    }
  }
  dealt(source, target, actual, meta) {
    const s = this.s;
    if (actual <= 0) return;
    this.breakCamouflage(source);
    this.breakCamouflage(target);
    if (
      source !== s.player ||
      !this.roamReady ||
      this.setup.blessingId !== "dire-hit" ||
      meta.blessing ||
      !heroes(target) ||
      target.hp <= 0 ||
      target.hp / target.maxHp >= 0.35 ||
      s.time < this.direReadyAt
    )
      return;
    this.direReadyAt = s.time + 30;
    const damage = (target.maxHp * (0.07 + 0.11 * this.scale)) / 2;
    s.deal(source, target, damage, "physical", false, {
      itemProc: true,
      blessing: true,
    });
    if (target.hp > 0)
      s.deal(source, target, damage, "magic", false, {
        itemProc: true,
        blessing: true,
      });
  }
  supportSkill() {
    const s = this.s,
      p = s.player;
    if (
      !this.roamReady ||
      this.setup.blessingId !== "favor" ||
      s.time < this.favorReadyAt
    )
      return;
    const ally = s.actors
      .filter(
        (a) =>
          a.team === p.team && heroes(a) && a.hp > 0 && distance(a, p) <= 5,
      )
      .sort(
        (a, b) => a.hp / a.maxHp - b.hp / b.maxHp || a.id.localeCompare(b.id),
      )[0];
    if (ally) {
      healActor(s, ally, 480 + 720 * this.scale);
      this.favorReadyAt = s.time + 15;
      s.emit("favor-heal", { targetId: ally.id });
    }
  }
  snapshot() {
    return {
      ...this.setup,
      ruleset: ROLE_RULES.version,
      compatible: this.compatible,
      active: this.jungleReady || this.roamReady,
      progressGold: this.progressGold,
      qualifyingActions: this.s.spells.progress,
      reason: this.reason(),
      cooldown: Math.max(0, this.readyAt - this.s.time),
    };
  }
}
