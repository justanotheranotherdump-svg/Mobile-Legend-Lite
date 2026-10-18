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
    };
    this.scenario = scenario;
    this.playerName = profile.username;
    this.reset();
  }
  reset() {
    this.resetting = true;
    super.reset();
    this.resetting = false;
    if (!this.matchConfig) return;
    const c = this.matchConfig,
      s = this.scenario;
    this.itemEffects = null;
    this.isMatch = true;
    this.paused = false;
    this.targetCategory = null;
    this.random = seededRandom(c.seed);
    this.phase = "countdown";
    this.countdown = s.countdown;
    this.result = null;
    this.gold = c.gold;
    this.inventory = Array(6).fill(null);
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
    this.syncEnemies();
    this.refreshTarget();
  }
  applyRangeAndSpeed() {
    super.applyRangeAndSpeed();
    this.itemEffects?.applyRuntime();
  }
  onBasicCommitted(target) {
    this.itemEffects?.basicCommitted(target);
  }
  onHeroCast(a) {
    this.itemEffects?.cast(a);
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
      if (this.targetCategory && !this.manualTargetId) {
        const kinds =
          this.targetCategory === "tower" ? ["tower", "core"] : ["minion"];
        this.selectedTargetId =
          selectAutomaticTarget(
            this.player,
            this.enemies.filter((e) => kinds.includes(e.kind)),
            this.targetMode,
          )?.id ?? null;
        return this.selectedTarget;
      }
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
  attack(id = null) {
    if (this.paused) return "paused";
    if (this.isMatch && this.phase !== "running") return this.phase;
    return super.attack(id);
  }
  castAvailability(a) {
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
        source === this.player ? this.itemEffects?.defense(type, target) : {},
      multiplier: crit ? source.attributes.criticalDamage || 2 : 1,
    }).amount;
    if (target === this.player) {
      amount = this.itemEffects.absorb(amount, type, source);
      if (amount > 0) cancelRecovery(this, "damage");
    }
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
    if (source === this.player && !meta.itemProc)
      this.itemEffects?.dealt(target, raw, type, basic, crit, actual);
    if (target.hp === 0) this.onDeath(source, target);
    return actual;
  }
  onDeath(source, target) {
    if (target.deathHandled) return;
    target.deathHandled = true;
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
      target.respawnAt =
        this.time +
        respawnDelay(
          this.scenario,
          target === this.player
            ? this.progression.level
            : target.progression.level,
        );
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
    const recipients = this.actors.filter(
      (a) =>
        a.team === source.team &&
        ["player", "bot"].includes(a.kind) &&
        a.hp > 0 &&
        (teamReward || distance(a, target) <= this.scenario.rewardRadius),
    );
    for (const actor of recipients) {
      if (actor === this.player) {
        this.grantXp(reward.xp);
        this.emit("xp-gained", { amount: reward.xp, reason: target.id });
      } else {
        const before = actor.progression.level;
        actor.progression.grantXp(reward.xp);
        if (before !== actor.progression.level) this.growBot(actor);
      }
    }
    if (teamReward || source === this.player) {
      if (source.team === "player") {
        this.gold += reward.gold;
        this.stats.goldEarned += reward.gold;
        this.emit("gold-gained", { amount: reward.gold, reason: target.id });
      }
    }
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
    this.statModifiers.items = bonus.modifiers;
    this.recalculateStats();
    this.player.hp = Math.min(hp, this.player.maxHp);
    this.player.mana = Math.min(mana, this.player.maxMana);
    this.player.criticalChance = bonus.criticalChance;
    this.player.lifesteal = bonus.lifesteal;
    this.itemEffects?.refresh();
    return "ok";
  }
  purchaseItem(id, replace = null) {
    if (this.paused) return "paused";
    if (this.phase === "ended") return "match-ended";
    const result = this.commitEquipment(
      purchase(this.gold, this.inventory, id, replace),
    );
    if (result === "ok") this.emit("item-purchased", { id });
    return result;
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
    if (n < 0.05) return;
    const brain = this.botEngines?.get(actor.id);
    if (brain) {
      brain.facing = { x: (x - actor.x) / n, z: (z - actor.z) / n };
      actor.facing = { ...brain.facing };
    }
    moveEntity(
      actor,
      { x: (x - actor.x) / n, z: (z - actor.z) / n },
      Math.min(dt, n / actor.speed) *
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
      a.targetable = !a.protected;
      if (distance(a, this.scenario.spawn[a.team]) < 3) {
        a.hp = Math.min(
          a.maxHp,
          a.hp +
            this.scenario.spawnHealPerSecond *
              dt *
              (a.antiHealUntil > this.time ? 0.6 : 1),
        );
        a.mana = Math.min(a.maxMana, a.mana + 50 * dt);
      }
      if (a === this.player) continue;
      a.stunned = Boolean(a.stunnedUntil > this.time);
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
      } else if (!a.actionLocked) this.moveNpc(a, intent.x, intent.z, dt);
    }
  }
  tickMinions(dt) {
    for (const a of this.minions) {
      if (a.hp <= 0) continue;
      a.stunned = Boolean(a.stunnedUntil > this.time);
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
    this.itemEffects?.tick(dt);
    this.updateObjectives();
    this.syncEnemies();
    super.update(dt, v, -h);
    for (const wave of this.waveScheduler.due(this.time)) this.spawnWave(wave);
    this.tickHeroes(dt);
    this.tickMinions(dt);
    this.tickTowers();
    this.tickNpcProjectiles(dt);
    this.syncEnemies();
    this.refreshTarget();
  }
  get renderProjectiles() {
    return [
      ...this.projectiles,
      ...[...this.botEngines.values()].flatMap((e) =>
        e.projectiles.map((p) => ({ ...p, id: `${e.player.id}:${p.id}` })),
      ),
    ];
  }
  snapshot() {
    return structuredClone({
      ...super.snapshot(),
      phase: this.phase,
      countdown: this.countdown,
      matchConfig: this.matchConfig && { ...this.matchConfig },
      gold: this.gold,
      inventory: this.inventory && [...this.inventory],
      score: this.score && { ...this.score },
      stats: this.stats && { ...this.stats },
      wave: this.waveNumber,
      npcProjectiles: this.npcProjectiles?.map((p) => ({ ...p })),
      structures: this.structures?.map((o) => ({ ...o })),
      allies: this.bots
        ?.filter((b) => b.team === "player")
        .map(({ progression, ...a }) => ({ ...a, level: progression.level })),
      result: this.result && structuredClone(this.result),
      itemEffects: this.itemEffects && {
        active: [...this.itemEffects.active],
        timers: { ...this.itemEffects.t },
      },
    });
  }
}
