import{spacedDirection}from"./ai-spacing.js";
import{validateRoleSetup}from"../player/role-setup.js";
import {ExpandedItemEffects}from"./expanded-item-effects.js";
import {RoleEquipment} from "./role-equipment.js";
import {getItem,purchaseQuote} from "./recipes.js";
import { BuildPriority } from "./build-priority.js";
import { BattleSpells } from "../spells/system.js";
import { absorbShields, healActor } from "../simulation/status.js";
import { resolveMatchTarget, attackFeedback } from "./targeting.js";
import { ItemEffects } from "./item-effects.js";
import { cancelRecovery } from "../simulation/utilities.js";
import {
  makeHeroBot,
  advanceHeroBot,
  commandHeroBot,
  learnBotSkills,
} from "./hero-bots.js";
import { refreshObjectiveProtection } from "./objectives.js";
import { respawnDelay, restoreActor } from "./respawn.js";
import { matchResult } from "./results.js";
import { selectAutomaticTarget } from "../simulation/targeting.js";
import { HeroCombatSimulation } from "../simulation/hero-combat.js";
import { HeroProgression } from "../simulation/stats/progression.js";
import {
  calculateAttributes,
  runtimeAttributes,
} from "../simulation/stats/attributes.js";
import { resolveDamage } from "../simulation/stats/damage.js";
import { moveEntity } from "../simulation/movement.js";
import {
  lane,
  equipment,
  difficulties,
  createMatchConfig,
  validateLane,
} from "./config.js";
import {
  inventoryBonuses,
  purchase,
  sell,
  validateEquipment,
} from "./equipment.js";
import {
  attackReason,
  validTarget,
  distance,
  seededRandom,
} from "./actions.js";
import { WaveScheduler } from "./waves.js";
import { botDecision, towerTarget } from "./ai.js";

// Authoritative lane simulation. All clocks, rewards, AI intents and objectives
// are numbers/data here; rendering/DOM never decide combat or completion.
export class MatchSimulation extends HeroCombatSimulation {
  constructor(registry, config, profile, scenario = lane) {
    const checked = createMatchConfig(
      config.mode,
      config.difficulty,
      config.teamSize,
      config.allyCount !== undefined ? config : null,
    );
    if (checked.mode === "practice")
      throw Error("Practice must use the separate dummy sandbox");
    if (config.heroId !== "layla")
      throw Error("match.heroId: only Layla is playable");
    validateLane(scenario);
    validateEquipment(registry.get("layla"));
    super(
      scenario,
      {
        player: { heroId: "layla", ...scenario.spawn.player },
        targeting: { defaultMode: "nearest" },
        dummies: [],
      },
      registry,
    );
    this.registry = registry;
    this.matchConfig = {
      ...checked,
      ...(config.allyCount !== undefined
        ? { allyCount: config.allyCount, enemyCount: config.enemyCount }
        : {}),
      seed: config.seed ?? checked.seed,
      build: Array.isArray(config.build) ? [...config.build] : [],
      spellId: config.spellId || "execute",
      accountLevel: config.accountLevel || 1,
      roleSetup:validateRoleSetup(config.roleSetup),
    };
    this.scenario = scenario;
    this.playerName = profile.username;
    this.reset();
  }
  reset() {
    this.resetting = true;
    this.itemEffects=null;this.spells=null;this.roleEquipment=null;this.expandedEffects=null;this.potion=null;
    super.reset();
    this.resetting = false;
    if (!this.matchConfig) return;
    const c = this.matchConfig,
      s = this.scenario;
    this.itemEffects = null;
    this.spells = null;
    this.isMatch = true;
    this.paused = false;
    this.targetCategory = null;
    this.random = seededRandom(c.seed);
    this.phase = "countdown";
    this.countdown = s.countdown;
    this.result = null;
    this.gold = c.gold;
    this.inventory = Array(6).fill(null);
    this.buildPriority = new BuildPriority(c.build);
    this.priorityItem = this.buildPriority.refresh(this.inventory);
    this.score = { player: 0, enemy: 0 };
    this.stats = {
      eliminations: 0,
      deaths: 0,
      assists: 0,
      goldEarned: 0,
      structures: 0,
    };
    this.rewardLog = [];
    this.minions = [];
    this.bots = [];
    this.botEngines = new Map();
    this.structures = [];
    this.npcProjectiles = [];
    this.shotSerial = 0;
    this.waveScheduler = new WaveScheduler(s.wave);
    this.waveNumber = 0;
    this.setPracticeLevel(c.level);
    Object.assign(this.player, {
      id: "player",
      kind: "player",
      team: "player",
      name: this.playerName,
      targetable: true,
      spawnProtectedUntil: s.spawnProtection,
      criticalChance: 0,
      lifesteal: 0,
    });
    this.structures = s.objectives.map((o) => ({
      ...structuredClone(o),
      hp: o.maxHp,
      radius: o.kind === "core" ? 1.1 : 0.8,
      speed: 0,
      targetable: o.order === 0,
      protected: o.order !== 0,
      readyAt: 0,
    }));
    for (const team of ["player", "enemy"])
      for (
        let i = 0;
        i <
        (team === "player"
          ? (c.allyCount ?? c.teamSize - 1)
          : (c.enemyCount ?? c.teamSize));
        i++
      )
        this.bots.push(this.makeBot(team, i));
    this.itemEffects = new ItemEffects(this);
    this.spells = new BattleSpells(this, this.matchConfig);
    this.roleEquipment=new RoleEquipment(this,c.roleSetup);
    this.expandedEffects=new ExpandedItemEffects(this);
    this.syncEnemies();
    this.refreshTarget();
  }
  ability(slot) {
    return slot === "battle-spell" && this.spells
      ? this.spells.ability()
      : super.ability(slot);
  }
  beginAim(slot) {
    if (slot !== "battle-spell") return super.beginAim(slot);
    const why = this.spells?.availability();
    if (why) {
      this.lastCastResult = why;
      return false;
    }
    this.cancelAttackCommand();
    const a = this.spells.ability();
    this.aiming = {
      slot,
      point: {
        x: this.player.x + this.facing.x * a.range,
        z: this.player.z + this.facing.z * a.range,
      },
    };
    this.aim = { ...this.aiming.point };
    return true;
  }
  releaseAim() {
    if (this.aiming?.slot !== "battle-spell") return super.releaseAim();
    const { point, directional } = this.aiming;
    let target = null;
    if (directional && ["execute", "retribution"].includes(this.spells.id)) {
      const d = this.direction(point),
        range = this.spells.ability().range;
      target = this.spells
        .targets(this.spells.id === "execute" ? "hero" : "farm")
        .filter((a) => {
          const x = a.x - this.player.x,
            z = a.z - this.player.z;
          return (
            distance(this.player, a) <= range &&
            x * d.x + z * d.z > 0 &&
            Math.abs(x * d.z - z * d.x) <= a.radius + 0.65
          );
        })
        .sort((a, b) => distance(this.player, a) - distance(this.player, b))[0];
    }
    this.cancelAim();
    return this.spells.cast(
      point,
      target?.id || null,
      Boolean(directional && this.spells.ability().targetShape === "targeted"),
    );
  }
  cast(slot, point, targetId) {
    if (slot === "battle-spell")
      return this.spells?.cast(point, targetId) || "unavailable";
    return super.cast(slot, point, targetId);
  }
  applyRangeAndSpeed() {
    super.applyRangeAndSpeed();
    this.itemEffects?.applyRuntime();
  }
  onBasicCommitted(target) {
    this.spells?.cancelArrival("attacking");
    this.itemEffects?.basicCommitted(target);
  }
  onHeroCast(a) {
    this.spells?.cancelArrival("casting");
    this.itemEffects?.cast(a);
    this.expandedEffects?.cast(a);
  }
  passive(target) {
    return target.kind === "core" ? 1 : super.passive(target);
  }
  get actors() {
    return [
      this.player,
      ...(this.bots || []),
      ...(this.minions || []),
      ...(this.structures || []),
    ];
  }
  makeBot(team, index) {
    return makeHeroBot(this, team, index);
  }
  syncEnemies() {
    this.enemies = this.actors.filter((a) => a.team === "enemy");
  }
  refreshTarget() {
    if (this.isMatch && !this.resetting) {
      this.syncEnemies();
      const commandTarget = this.enemies.find(
        (a) =>
          a.id === this.attackCommand?.targetId && validTarget(this.player, a),
      );
      if (commandTarget) {
        this.selectedTargetId = commandTarget.id;
        return commandTarget;
      }
      const result = resolveMatchTarget(
        this.player,
        this.enemies,
        this.targetMode,
        this.targetCategory || "hero",
        this.manualTargetId,
      );
      this.manualTargetId = result.manualTargetId;
      this.selectedTargetId = result.target?.id ?? null;
      return this.selectedTarget;
    }
    return super.refreshTarget();
  }
  setTargetCategory(category) {
    if (![null, "minion", "tower"].includes(category))
      throw Error("Unknown target category");
    this.targetCategory = category;
    this.clearManualTarget();
  }
  restoreResources() {
    const dead = this.player.hp <= 0;
    super.restoreResources();
    if (this.isMatch && dead) {
      this.player.deathHandled = false;
      this.player.targetable = true;
      this.player.protected = false;
      this.player.stunned = false;
      this.player.stunnedUntil = 0;
      this.player.mark = null;
      this.player.respawnAt = null;
    }
  }
  updateObjectives() {
    refreshObjectiveProtection(this.structures);
  }
  upgradeSkill(slot) {
    if (this.paused || this.phase !== "running")
      return this.paused ? "paused" : this.phase;
    return super.upgradeSkill(slot);
  }
  attack(id = null, category = null) {
    if (this.paused) {
      this.emit("attack-feedback", {
        message: attackFeedback("paused"),
        reason: "paused",
      });
      return "paused";
    }
    if (this.phase !== "running") {
      this.emit("attack-feedback", {
        message: attackFeedback(this.phase),
        reason: this.phase,
      });
      return this.phase;
    }
    if (![null, "minion", "tower"].includes(category))
      throw Error("Unknown attack category");
    this.targetCategory = category;
    let reason;
    if (this.paused) reason = "paused";
    else if (this.phase !== "running") reason = this.phase;
    else if (id !== null) {
      const explicit = this.enemies.find((a) => a.id === id);
      if (!validTarget(this.player, explicit)) reason = "invalid-target";
      else if (distance(this.player, explicit) > this.player.range)
        reason = "range";
    }
    if (reason) {
      this.manualTargetId = null;
      this.refreshTarget();
      this.lastAttack = {
        ...this.lastAttack,
        serial: this.lastAttack.serial + 1,
        reason,
        targetId: id,
      };
    } else {
      const pin = this.manualTargetId;
      reason = super.attack(id);
      if (this.attackCommand && !this.attackCommand.manualId)
        this.manualTargetId = pin;
    }
    const message = attackFeedback(reason);
    if (message && !["cooldown", "animation", "casting"].includes(reason))
      this.emit("attack-feedback", { message, reason });
    return reason;
  }

  castAvailability(a) {
    if (a?.spell) return this.spells?.availability() || null;
    if (this.paused) return "paused";
    if (this.isMatch && this.phase !== "running") return this.phase;
    return super.castAvailability(a);
  }
  damageEnemy(target, base, type = "physical", meta = {}) {
    if (
      !validTarget(this.player, target) ||
      this.phase !== "running" ||
      this.paused
    )
      return;
    const raw = (base + this.consumeMark(target)) * this.passive(target);
    this.deal(this.player, target, raw, type, Boolean(meta.basic), {
      ...meta,
      physicalScaling:
        (meta.physicalScaling ?? (meta.basic ? 1 : 0)) * this.passive(target),
    });
    this.refreshTarget();
  }
  spellDefense(type, target, basic) {
    const d = this.itemEffects?.defense(type, target) || {};
    const extra=this.expandedEffects?.defense(type,target)||{};d.flatReduction=extra.flatReduction||0;if(type==='magic'){d.flatPenetration=(d.flatPenetration||0)+(extra.flatPenetration||0);d.percentPenetration=extra.percentPenetration||0}
    if (basic && type !== "true")
      d.percentPenetration =
        1 -
        (1 - (d.percentPenetration || 0)) *
          (1 - (this.spells?.penetration() || 0));
    return d;
  }
  deal(source, target, raw, type = "physical", basic = true, meta = {}) {
    if (
      this.phase !== "running" ||
      this.paused ||
      !validTarget(source, target) ||
      source.hp <= 0
    )
      return 0;
    if (source === this.player && !meta.itemProc) {
      const oldPA = source.attributes.physicalAttack;
      this.itemEffects?.prepare(target);
      raw +=
        (source.attributes.physicalAttack - oldPA) *
        (meta.physicalScaling ?? (basic ? 1 : 0));
      if (
        this.itemEffects?.has("punish") &&
        ["player", "bot"].includes(target.kind)
      ) {
        const ownBonus =
          source.maxHp -
          calculateAttributes(this.hero, this.progression.level).maxHp;
        const enemyBonus =
          target.maxHp -
          calculateAttributes(this.hero, target.progression?.level || 1).maxHp;
        if (enemyBonus > ownBonus) raw *= 1.08;
      }
    }
    raw=this.expandedEffects?.outgoing(source,raw,type)??raw;
    const crit =
      basic &&
      source.criticalChance > 0 &&
      this.random() < source.criticalChance;
    let amount = resolveDamage({
      base: raw,
      model: { type, physicalScaling: 0, magicScaling: 0 },
      source: source.attributes || { physicalAttack: 0, magicPower: 0 },
      target: target.attributes || target,
      defenseModifiers:
        source === this.player ? this.spellDefense(type, target, basic) : {flatReduction:this.expandedEffects?.defense(type,target).flatReduction||0},
      multiplier: crit ? source.attributes.criticalDamage || 2 : 1,
    }).amount;
    amount = this.spells?.incoming(source, target, amount, basic) ?? amount;
    if (target === this.player) {
      amount = this.itemEffects.absorb(amount, type, source);
      amount = this.expandedEffects?.absorb(amount,type,source,basic,raw,{...meta,critical:crit})??amount;
      if (amount > 0) {
        cancelRecovery(this, "damage");
        this.spells?.cancelArrival("damage");
      }
    }
    const landed = amount > 0;
    if (!meta.ignoreShields) amount = absorbShields(this, target, amount);
    const actual = Math.min(target.hp, amount);
    if (
      actual > 0 &&
      source === this.player &&
      this.itemEffects?.has("lifebane")
    )
      target.antiHealUntil = this.time + 3;
    target.hp = Math.max(0, target.hp - amount);
    if (["player", "bot"].includes(source.kind)) {
      source.spawnProtectedUntil = 0;
      source.protected = false;
      source.targetable = true;
    }
    target.contributors ??= {};
    target.contributors[source.id] = this.time;
    if (source !== this.player && basic && source.lifesteal && source.hp > 0)
      source.hp = Math.min(source.maxHp, source.hp + actual * source.lifesteal);
    this.emit("hit", {
      point: { x: target.x, z: target.z },
      damage: actual,
      sourceId: source.id,
      targetId: target.id,
      critical: crit,
    });
    if (
      ["player", "bot"].includes(source.kind) &&
      ["player", "bot"].includes(target.kind)
    )
      for (const tower of this.structures) {
        if (
          tower.team === target.team &&
          tower.hp > 0 &&
          distance(tower, target) <= tower.range
        ) {
          tower.retaliateId = source.id;
          tower.retaliateUntil = this.time + 3;
        }
      }
    const attackEffectRepeats=this.itemEffects?.has('endless-strike')&&this.itemEffects.t.third?3:1;
    if (source === this.player && !meta.itemProc)
      this.itemEffects?.dealt(target, raw, type, basic, crit, actual);
    if(source===this.player)this.expandedEffects?.dealt(target,raw,type,basic,actual,{...meta,attackEffectRepeats});
    if (source === this.player && basic && landed) this.spells?.landedBasic();
    this.spells?.reflected(source, target, actual, meta);
    this.roleEquipment?.dealt(source,target,actual,meta);
    if(target===this.player)this.expandedEffects?.afterDamage();
    if (target.hp === 0&&!(target===this.player&&this.expandedEffects?.tryImmortal())) this.onDeath(source, target);
    return actual;
  }
  onDeath(source, target) {
    if (target.deathHandled) return;
    target.deathHandled = true;
    this.spells?.recordDeath(source, target);
    this.roleEquipment?.onDeath(source,target);
    this.expandedEffects?.onDeath(source,target);
    this.spells?.onDeath(target);
    this.itemEffects?.minionDeath(target);
    target.targetable = false;
    delete target.mark;
    delete target.marks;
    target.stunned = false;
    this.npcProjectiles = this.npcProjectiles.filter(
      (p) => p.sourceId !== target.id,
    );
    const brain = this.botEngines?.get(target.id);
    if (brain) {
      brain.pending = [];
      brain.projectiles = [];
      brain.queuedSkill = null;
      brain.cancelAim();
      brain.lockUntil = this.time;
    }
    target.diedAt = this.time;
    const hero = ["player", "bot"].includes(target.kind),
      structure = ["tower", "core"].includes(target.kind);
    const reward = hero
      ? this.scenario.heroReward
      : target.kind === "minion"
        ? this.scenario.wave
        : target;
    if (hero) {
      this.score[source.team]++;
      target.respawnAt = this.time + respawnDelay(this.scenario, this.time);
      target.respawnDuration = target.respawnAt - this.time;
      if (target === this.player) {
        this.stats.deaths++;
        this.cancelAim();
        this.pending = [];
        this.projectiles = [];
        this.queuedSkill = null;
      }
      if (source === this.player) this.stats.eliminations++;
      else if (
        source.team === "player" &&
        target.contributors?.player >= this.time - this.scenario.assistWindow
      )
        this.stats.assists++;
    }
    if (structure) {
      if (source.team === "player") this.stats.structures++;
      this.updateObjectives();
    }
    if (target.kind !== "core") this.award(source, target, reward, structure);
    this.emit("death", {
      actor: {
        id: source.id,
        name: source.name,
        team: source.team,
        kind: source.kind === "bot" ? "hero" : source.kind,
      },
      victim: {
        id: target.id,
        name: target.name,
        team: target.team,
        kind: target === this.player ? "player" : hero ? "hero" : target.kind,
        hp: 0,
      },
    });
    if (structure)
      this.emit("objective-destroyed", {
        id: target.id,
        team: target.team,
        kind: target.kind,
      });
    if (target.kind === "core") {
      this.phase = "ended";
      this.result = matchResult(
        target.team,
        this.time,
        this.progression.level,
        this.stats,
        this.gold,
        this.score,
      );
      this.emit("match-ended", { result: this.result });
    }
  }
  award(source, target, reward, teamReward = false) {
    if (
      this.spells?.id === "retribution" &&
      source === this.player &&
      target.kind === "creep"
    )
      reward = {
        ...reward,
        gold: Math.floor(
          reward.gold * (1 + this.spells.definition.parameters.creepReward),
        ),
        xp: Math.floor(
          reward.xp * (1 + this.spells.definition.parameters.creepReward),
        ),
      };
    const recipients = this.actors.filter(
      (a) =>
        a.team === source.team &&
        ["player", "bot"].includes(a.kind) &&
        a.hp > 0 &&
        (teamReward || distance(a, target) <= this.scenario.rewardRadius),
    );
    for (const actor of recipients) {
      if (
        this.spells?.id === "retribution" &&
        this.time < this.spells.definition.parameters.noShareSeconds &&
        target.kind === "minion" &&
        source !== actor &&
        (source === this.player || actor === this.player)
      )
        continue;
      if (actor === this.player) {
        const adjusted=this.roleEquipment?.adjustedReward(actor,source,target,reward)||reward;
        this.grantXp(adjusted.xp);
        this.emit("xp-gained", { amount: adjusted.xp, reason: target.id });
      } else {
        const before = actor.progression.level;
        actor.progression.grantXp(reward.xp);
        if (before !== actor.progression.level) this.growBot(actor);
      }
    }
    if (teamReward || source === this.player) {
      if (source.team === "player") {
        const adjusted=this.roleEquipment?.adjustedReward(this.player,source,target,reward)||reward;
        this.gold += adjusted.gold;
        this.stats.goldEarned += adjusted.gold;
        this.emit("gold-gained", { amount: adjusted.gold, reason: target.id });
      }
    }
    if(source.kind==='bot')source.earnedGold=(source.earnedGold||0)+reward.gold;
    this.rewardLog.push({
      targetId: target.id,
      sourceId: source.id,
      xp: reward.xp,
      gold: reward.gold,
      time: this.time,
    });
  }
  growBot(bot) {
    const brain = this.botEngines.get(bot.id);
    if (brain) {
      brain.recalculateStats();
      learnBotSkills(brain);
      return;
    }
    const oldHp = bot.maxHp,
      oldMana = bot.maxMana;
    bot.attributes = calculateAttributes(this.hero, bot.progression.level);
    const a = bot.attributes;
    Object.assign(bot, runtimeAttributes(this.hero, a), {
      range: this.scenario.bot.attackRange,
      maxHp: a.maxHp,
      maxMana: a.maxMana,
      physicalDefense: a.physicalDefense,
      magicDefense: a.magicDefense,
    });
    bot.hp = Math.min(bot.maxHp, bot.hp + bot.maxHp - oldHp);
    bot.mana = Math.min(bot.maxMana, bot.mana + bot.maxMana - oldMana);
  }
  commitEquipment(transaction) {
    if (transaction.error) return transaction.error;
    const hp = this.player.hp,
      mana = this.player.mana,
      bonus = inventoryBonuses(transaction.inventory);
    this.gold = transaction.gold;
    this.inventory = transaction.inventory;
    this.roleEquipment?.equipmentChanged();
    this.statModifiers.items = bonus.modifiers;
    this.recalculateStats();
    this.player.hp = Math.min(hp, this.player.maxHp);
    this.player.mana = Math.min(mana, this.player.maxMana);
    this.player.criticalChance = bonus.criticalChance;
    this.player.lifesteal = bonus.lifesteal;
    this.itemEffects?.refresh();
    this.refreshPriority();
    return "ok";
  }
  quotePurchase(id){
    const item=getItem(id);
    if(item?.type!=='consumable')return purchaseQuote(this.gold,this.inventory,id);
    const remaining=item.cost,error=this.potion?.id===id&&this.potion.until>this.time?'potion-active':this.gold<remaining?'insufficient-gold':null;
    return {remaining,total:remaining,credit:0,consumed:[],...(error?{error}:{})};
  }
  purchaseItem(id, replace = null) {
    if (this.paused) return "paused";
    if (this.phase === "ended") return "match-ended";
    if(getItem(id)?.type==='consumable'){
      if(replace!==null)return 'manual-replacement-removed';
      const quote=this.quotePurchase(id);if(quote.error)return quote.error;
      this.gold-=quote.remaining;this.potion={id,until:this.time+120};this.itemEffects.tick();this.emit('potion-consumed',{id});return 'ok';
    }
    const result = this.commitEquipment(
      purchase(this.gold, this.inventory, id, replace),
    );
    if (result === "ok") this.emit("item-purchased", { id });
    return result;
  }
  prioritizeItem(id) {
    if (this.paused || this.phase === "ended") return "cannot-prioritize";
    if (id !== null && !equipment.items.some((i) => i.id === id&&i.type==='standard_purchase'))
      return "unknown-item";
    this.buildPriority.prioritize(id);
    this.priorityItem = id;
    return "ok";
  }
  refreshPriority() {
    this.priorityItem = this.buildPriority?.refresh(this.inventory) ?? null;
  }
  resumeBuild() {
    this.buildPriority.resume();
    this.refreshPriority();
  }
  sellItem(slot) {
    if (this.paused) return "paused";
    if (this.phase === "ended") return "match-ended";
    return this.commitEquipment(sell(this.gold, this.inventory, slot));
  }
  spawnWave(number) {
    const w = this.scenario.wave;
    for (const team of ["player", "enemy"])
      for (let i = 0; i < w.size; i++)
        this.minions.push({
          id: `wave-${number}-${team}-${i}`,
          name: `${team === "player" ? "Blue" : "Red"} minion`,
          kind: "minion",
          team,
          x: w.spawn[team].x,
          z: w.spawn[team].z + (i - (w.size - 1) / 2) * 1.2,
          radius: 0.3,
          hp: w.hp,
          maxHp: w.hp,
          physicalDefense: w.physicalDefense,
          magicDefense: w.magicDefense,
          speed: w.speed,
          range: w.range,
          damage: w.damage,
          readyAt: 0,
          targetable: true,
        });
    this.waveNumber = number;
    this.emit("wave-spawned", { wave: number });
  }
  npcAttack(actor, target, ability = false, aimOffset = 0) {
    if (this.botEngines?.has(actor.id))
      return commandHeroBot(this, actor, target, ability, aimOffset);
    const range = ability ? this.scenario.bot.abilityRange : actor.range;
    const readyAt = ability ? actor.abilityReadyAt : actor.readyAt;
    if (attackReason(actor, target, this.time, { range, readyAt }))
      return false;
    if (ability) {
      if (actor.mana < this.scenario.bot.abilityMana) return false;
      actor.mana -= this.scenario.bot.abilityMana;
      actor.abilityReadyAt = this.time + this.scenario.bot.abilityCooldown;
    } else
      actor.readyAt =
        this.time + (actor.attackCooldown || this.scenario.wave.cooldown);
    this.launchNpc(
      actor,
      target,
      ability
        ? this.scenario.bot.abilityBase +
            actor.attributes.physicalAttack * this.scenario.bot.abilityScaling
        : actor.attributes?.physicalAttack || actor.damage,
      ability,
      aimOffset,
    );
    return true;
  }
  launchNpc(source, target, damage, ability, offset) {
    this.npcProjectiles.push({
      id: `npc-shot-${++this.shotSerial}`,
      sourceId: source.id,
      targetId: target.id,
      x: source.x,
      z: source.z,
      dx: 0,
      dz: 1,
      speed: source.kind === "tower" || source.kind === "core" ? 13 : 16,
      radius: ability ? 0.18 : 0.12,
      effect: ability ? "orb-mark" : "basic-projectile",
      damage,
      basic: !ability,
      miss: ability && Math.abs(offset) > target.radius + 0.45,
      expires: this.time + 2,
    });
    this.emit("launch", {
      source: { x: source.x, z: source.z },
      effect: ability ? "orb-mark" : "basic-projectile",
    });
  }
  tickNpcProjectiles(dt) {
    const active = [];
    for (const shot of this.npcProjectiles) {
      const source = this.actors.find((a) => a.id === shot.sourceId),
        target = this.actors.find((a) => a.id === shot.targetId);
      if (
        !source ||
        source.hp <= 0 ||
        !validTarget(source, target) ||
        this.time >= shot.expires
      )
        continue;
      const n = distance(shot, target);
      shot.dx = (target.x - shot.x) / Math.max(n, 0.0001);
      shot.dz = (target.z - shot.z) / Math.max(n, 0.0001);
      if (n <= shot.speed * dt + target.radius) {
        if (!shot.miss)
          this.deal(source, target, shot.damage, "physical", shot.basic);
      } else {
        shot.x += shot.dx * shot.speed * dt;
        shot.z += shot.dz * shot.speed * dt;
        active.push(shot);
      }
    }
    this.npcProjectiles = active;
  }
  moveNpc(actor, x, z, dt) {
    const n = Math.hypot(x - actor.x, z - actor.z);
    const steering=actor.kind==='bot'?spacedDirection(actor,{x,z},this.actors):{x:(x-actor.x)/Math.max(n,.001),z:(z-actor.z)/Math.max(n,.001),spacing:false};
    if(n<.05&&!steering.spacing)return;
    const brain = this.botEngines?.get(actor.id);
    if (brain) {
      brain.facing = { x: steering.x, z: steering.z };
      actor.facing = { ...brain.facing };
    }
    moveEntity(
      actor,
      { x: steering.x, z: steering.z },
      Math.min(dt, (steering.spacing?Math.max(1,n):n) / actor.speed) *
        (actor.kind === "minion" && actor.slow?.until > this.time
          ? 1 - actor.slow.ratio
          : 1),
      this.arena,
    );
    actor.z = Math.max(
      -this.scenario.laneHalfWidth + actor.radius,
      Math.min(this.scenario.laneHalfWidth - actor.radius, actor.z),
    );
  }
  tickHeroes(dt) {
    const difficulty = difficulties[this.matchConfig.difficulty];
    for (const a of [this.player, ...this.bots]) {
      if (a.hp <= 0) {
        if (this.time >= a.respawnAt) {
          restoreActor(
            a,
            this.scenario.spawn[a.team],
            this.time,
            this.scenario.spawnProtection,
          );
          if (a === this.player) {
            this.player.cooldown = 0;
            this.lockUntil = this.time;
            this.cancelAim();
          }
          this.emit("respawn", { id: a.id, point: { x: a.x, z: a.z } });
        }
        continue;
      }
      a.protected = Boolean(this.time < a.spawnProtectedUntil);
      a.targetable = !a.protected&&!a.frozen&&!(a===this.player&&this.expandedEffects?.t.immortalPendingUntil);
      if (distance(a, this.scenario.spawn[a.team]) < 3) {
        a.hp = Math.min(
          a.maxHp,
          a.hp +
            this.scenario.spawnHealPerSecond *
              dt *
              (a.antiHealUntil > this.time ? 0.6 : 1) *
              (a.recoveryBoost || 1),
        );
        a.mana = Math.min(a.maxMana, a.mana + 50 * dt);
      }
      if (a === this.player) continue;
      a.stunned = Boolean(
        a.stunnedUntil > this.time || a.suppressionUntil > this.time,
      );
      advanceHeroBot(this, a, dt);
      if (a.stunned) continue;
      if (this.time >= a.nextThink) {
        a.intent = botDecision(
          a,
          this.actors,
          this.scenario.bot,
          difficulty,
          this.time,
          this.random,
        );
        a.nextThink = this.time + difficulty.reaction;
      }
      const intent = a.intent;
      if (!intent) continue;
      a.retreating = intent.type === "retreat";
      if (intent.type === "attack") {
        const target = this.actors.find((t) => t.id === intent.targetId);
        this.npcAttack(a, target);
        if (intent.ability) this.npcAttack(a, target, true, intent.aimOffset);
        if(intent.reposition&&!this.botEngines.get(a.id)?.isActionLocked())this.moveNpc(a,intent.x,intent.z,dt);
      } else if (!a.actionLocked) this.moveNpc(a, intent.x, intent.z, dt);
    }
  }
  tickMinions(dt) {
    for (const a of this.minions) {
      if (a.hp <= 0) continue;
      a.stunned = Boolean(
        a.stunnedUntil > this.time || a.suppressionUntil > this.time,
      );
      if (a.stunned) continue;
      const candidates = this.actors
        .filter((t) => validTarget(a, t) && distance(a, t) <= 7)
        .sort(
          (x, y) => distance(a, x) - distance(a, y) || x.id.localeCompare(y.id),
        );
      const target =
        candidates[0] ||
        this.scenario.wave.path[a.team]
          .map((id) => this.structures.find((t) => t.id === id))
          .find((t) => validTarget(a, t));
      if (!target) continue;
      if (distance(a, target) <= a.range) this.npcAttack(a, target);
      else this.moveNpc(a, target.x, target.z, dt);
    }
    this.minions = this.minions.filter(
      (a) => a.hp > 0 || this.time - a.diedAt < 1.2,
    );
  }
  tickTowers() {
    for (const tower of this.structures) {
      if (tower.hp <= 0) continue;
      const target = towerTarget(tower, this.actors, this.time);
      tower.targetId = target?.id || null;
      if (!target || attackReason(tower, target, this.time)) continue;
      tower.readyAt = this.time + tower.cooldown;
      this.launchNpc(tower, target, tower.damage, false, 0);
    }
  }
  update(dt, h = 0, v = 0) {
    if (!Number.isFinite(dt) || dt < 0)
      throw Error("match.dt: expected finite nonnegative timestep");
    if (this.phase === "ended" || this.paused) return;
    if (this.phase === "countdown") {
      this.countdown = Math.max(0, this.countdown - dt);
      if (this.countdown === 0) {
        this.phase = "running";
        this.emit("match-started");
      }
      return;
    }
    this.spells?.updateAura();
    this.itemEffects?.tick(dt);
    this.updateObjectives();
    this.syncEnemies();
    super.update(dt, v, -h);
    this.spells?.tick(dt);
    this.roleEquipment?.tick();
    this.expandedEffects?.tick(dt);
    for (const wave of this.waveScheduler.due(this.time)) this.spawnWave(wave);
    this.tickHeroes(dt);
    this.tickMinions(dt);
    this.tickTowers();
    this.tickNpcProjectiles(dt);
    this.syncEnemies();
    this.refreshTarget();
    this.refreshPriority();
  }
  get renderProjectiles() {
    return [
      ...this.projectiles,
      ...(this.spells?.projectiles || []),
      ...[...this.botEngines.values()].flatMap((e) =>
        e.projectiles.map((p) => ({ ...p, id: `${e.player.id}:${p.id}` })),
      ),
    ];
  }
  snapshot() {
    return structuredClone({
      ...super.snapshot(),
      phase: this.phase,
      targetCategory: this.targetCategory,
      countdown: this.countdown,
      matchConfig: this.matchConfig && { ...this.matchConfig },
      gold: this.gold,
      inventory: this.inventory && [...this.inventory],
      priorityItem: this.priorityItem,
      buildPriority: this.buildPriority?.snapshot(),
      attackCommand: this.attackCommand && structuredClone(this.attackCommand),
      combatSettings: { ...this.combatSettings },
      score: this.score && { ...this.score },
      stats: this.stats && { ...this.stats },
      wave: this.waveNumber,
      npcProjectiles: this.npcProjectiles?.map((p) => ({ ...p })),
      structures: this.structures?.map((o) => ({ ...o })),
      allies: this.bots
        ?.filter((b) => b.team === "player")
        .map(({ progression, ...a }) => ({ ...a, level: progression.level })),
      result: this.result && structuredClone(this.result),
      battleSpell: this.spells?.snapshot(),
      roleEquipment:this.roleEquipment?.snapshot(),
      expandedItemEffects:this.expandedEffects?{timers:{...this.expandedEffects.t}}:null,
      potion:this.potion?{...this.potion,remaining:Math.max(0,this.potion.until-this.time)}:null,
      itemEffects: this.itemEffects && {
        active: [...this.itemEffects.active],
        timers: { ...this.itemEffects.t },
      },
    });
  }
}
