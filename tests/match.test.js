import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import {
  createMatchConfig,
  validateLane,
  lane,
  difficulties,
  equipment,
} from "../src/match/config.js";
import { purchase, sell, inventoryBonuses } from "../src/match/equipment.js";
import {
  attackReason,
  validTarget,
  seededRandom,
} from "../src/match/actions.js";
import { WaveScheduler } from "../src/match/waves.js";
import { botDecision, towerTarget } from "../src/match/ai.js";
import { MatchFlow, rosterFor } from "../src/menu/match-flow.js";
const registry = await loadSourceHeroRegistry();
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const make = (mode = "ai-training", difficulty = "normal", size = 5) =>
  new MatchSimulation(registry, createMatchConfig(mode, difficulty, size), {
    username: "Unit_Hero",
  });
const start = (s) => {
  s.update(3.01);
  assert.equal(s.phase, "running");
  return s;
};
const step = (s, seconds) => {
  for (let n = 0; n < Math.ceil(seconds * 60); n++) s.update(1 / 60);
};
const isolate = (s) => {
  s.bots = [];
  s.minions = [];
  s.waveScheduler.due = () => [];
  for (const o of s.structures) o.readyAt = Infinity;
  s.syncEnemies();
  return s;
};
const hostile = (id = "target", props = {}) => ({
  id,
  name: id,
  kind: "minion",
  team: "enemy",
  x: 0,
  z: 0,
  radius: 0.4,
  hp: 1000,
  maxHp: 1000,
  targetable: true,
  physicalDefense: 0,
  magicDefense: 0,
  ...props,
});

test("all configured modes, default Normal, separate starts, invalid modes/difficulties/rosters", () => {
  for (const mode of ["practice", "ai-training", "vs-ai", "custom", "brawl"])
    assert.equal(createMatchConfig(mode).difficulty, "normal");
  assert.equal(createMatchConfig("brawl").level, 3);
  assert.equal(createMatchConfig("brawl").gold, 800);
  assert.equal(createMatchConfig("ai-training").level, 1);
  for (const args of [
    ["classic"],
    ["ranked"],
    ["ai-training", "nightmare"],
    ["custom", "normal", 0],
    ["custom", "normal", 6],
  ])
    assert.throws(() => createMatchConfig(...args));
  assert.throws(() => make("practice"), /separate dummy/);
  assert.throws(
    () =>
      new MatchSimulation(
        registry,
        { ...createMatchConfig("brawl"), heroId: "made-up" },
        {},
      ),
    /unsupported playable hero/,
  );
});
test("validated original continuous lane has six sequenced objective IDs and bounded spawn/wave data", () => {
  assert.equal(validateLane(), lane);
  assert.equal(lane.objectives.length, 6);
  for (const mutate of [
    (d) => d.objectives.pop(),
    (d) => (d.objectives[1].requires = null),
    (d) => (d.wave.interval = 0),
    (d) => (d.objectives[0].maxHp = -1),
  ]) {
    const d = structuredClone(lane);
    mutate(d);
    assert.throws(() => validateLane(d));
  }
});
test("flow requires explicit selection, double-confirm guarded, confirmed roster has one human plus nine bots", () => {
  const f = new MatchFlow();
  assert.equal(f.startSelection(), true);
  assert.throws(() => f.confirm(), /Choose an owned hero/);
  assert.throws(() => f.selectHero("another"));
  f.selectHero("layla");
  const c = f.confirm({ username: "Unit_Hero" });
  assert.equal(c.heroId, "layla");
  assert.equal(f.confirm(), null);
  assert.equal(f.startSelection(), false);
  assert.equal(f.confirmedRoster.player.length, 5);
  assert.equal(f.confirmedRoster.enemy.length, 5);
  assert.equal(
    f.confirmedRoster.player.filter((a) => a.kind === "PLAYER").length,
    1,
  );
  assert.equal(
    rosterFor(createMatchConfig("practice"), { username: "Hero" }).enemy[0]
      .kind,
    "STATIONARY",
  );
  f.chooseMode("custom");
  assert.throws(() => f.configure("normal", 8));
});
test("fresh simulation initialized exactly once: ten heroes, six objectives, no starting minions; countdown owns clock and input", () => {
  const s = make();
  assert.equal(s.bots.length, 9);
  assert.equal(s.structures.length, 6);
  assert.equal(s.minions.length, 0);
  assert.equal(s.player.name, "Unit_Hero");
  assert.equal(s.player.hp, 2250);
  assert.equal(s.progression.level, 1);
  assert.equal(s.progression.skillPoints, 1);
  assert.equal(s.gold, 350);
  assert.equal(s.inventory.length, 6);
  const pos = { x: s.player.x, z: s.player.z };
  s.update(1, 1, 1);
  assert.equal(s.time, 0);
  assert.equal(s.countdown, 2);
  assert.deepEqual({ x: s.player.x, z: s.player.z }, pos);
  assert.equal(s.attack(), "countdown");
  assert.equal(s.cast("skill-1"), "countdown");
  assert.equal(s.player.mana, 500);
  s.update(2.01);
  s.update(1 / 60);
  assert.equal(s.waveNumber, 1);
  assert.equal(s.minions.length, 6);
  assert.equal(s.time, 1 / 60);
});
test("wave scheduler emits accumulated deterministic waves once, never per render, reset restarts schedule", () => {
  const scheduler = new WaveScheduler(lane.wave);
  assert.deepEqual(scheduler.due(0), [1]);
  assert.deepEqual(scheduler.due(0), []);
  assert.deepEqual(scheduler.due(54), [2, 3, 4]);
  assert.deepEqual(scheduler.due(54), []);
  const a = start(make()),
    b = start(make());
  step(a, 2);
  step(b, 2);
  assert.equal(a.minions.length, 6);
  assert.deepEqual(a.minions, b.minions);
  a.reset();
  assert.equal(a.waveNumber, 0);
  assert.equal(a.minions.length, 0);
});
for (const mode of ["vs-ai", "custom", "ai-training", "brawl"])
  test(`${mode} uses its real starting rules and actor roster`, () => {
    const s = make(mode, "easy", 3);
    assert.equal(s.bots.length, 5);
    assert.equal(s.progression.level, createMatchConfig(mode).level);
    assert.equal(s.gold, createMatchConfig(mode).gold);
  });
test("shared action guards block dead, stunned, allied, protected, destroyed, out-of-range and cooldown targets", () => {
  const source = { team: "player", hp: 100, range: 5, readyAt: 10, x: 0, z: 0 };
  const t = hostile("x", { x: 4 });
  assert.equal(attackReason(source, t, 10), null);
  assert.equal(attackReason({ ...source, hp: 0 }, t, 10), "cannot-act");
  assert.equal(attackReason({ ...source, stunned: true }, t, 10), "cannot-act");
  for (const p of [
    { team: "player" },
    { protected: true },
    { targetable: false },
    { hp: 0 },
  ])
    assert.equal(validTarget(source, { ...t, ...p }), false);
  assert.equal(attackReason(source, { ...t, x: 6 }, 10), "range");
  assert.equal(attackReason(source, t, 9), "cooldown");
});
test("protected inner/core reject direct, ability and NPC damage until each preceding objective dies", () => {
  const s = isolate(start(make())),
    outer = s.structures.find((o) => o.id === "enemy-0"),
    inner = s.structures.find((o) => o.id === "enemy-1"),
    core = s.structures.find((o) => o.id === "enemy-2");
  const hp = core.hp;
  assert.equal(s.deal(s.player, core, 1e6), 0);
  s.damageEnemy(inner, 1e6);
  assert.equal(inner.hp, inner.maxHp);
  const ally = { ...s.player, id: "ally", kind: "bot" };
  assert.equal(s.deal(ally, core, 1e6), 0);
  s.deal(s.player, outer, 1e6);
  assert.equal(outer.hp, 0);
  assert.equal(inner.targetable, true);
  assert.equal(core.targetable, false);
  s.deal(s.player, inner, 1e6);
  assert.equal(core.targetable, true);
  s.deal(s.player, core, 1e6);
  assert.equal(s.result.outcome, "Victory");
  assert.equal(s.result.structures, 3);
  assert.equal(s.result.goldEarned, 200);
  assert.equal(s.phase, "ended");
  assert.equal(s.stats.eliminations, 0);
  const time = s.time;
  s.update(100);
  assert.equal(s.time, time);
  assert.equal(s.deal(s.player, s.structures[0], 100), 0);
});
test("own core destruction produces a real Defeat with no invented eliminations or account currency", () => {
  const s = isolate(start(make()));
  const red = {
    id: "red",
    name: "Enemy",
    team: "enemy",
    kind: "bot",
    hp: 100,
    attributes: s.player.attributes,
  };
  for (const target of s.structures
    .filter((o) => o.team === "player")
    .sort((a, b) => a.order - b.order))
    s.deal(red, target, 1e6);
  assert.equal(s.result.outcome, "Defeat");
  assert.equal(s.result.eliminations, 0);
  assert.equal(s.result.goldEarned, 0);
  assert.equal(s.gold, 350);
});
test("towers prefer minions then nearest heroes; legitimate allied-hero attack triggers timed retaliation", () => {
  const tower = {
    team: "enemy",
    x: 0,
    z: 0,
    range: 8,
    retaliateId: "hero",
    retaliateUntil: 0,
  };
  const hero = hostile("hero", { team: "player", kind: "player", x: 1 }),
    minion = hostile("minion", { team: "player", x: 5 });
  assert.equal(towerTarget(tower, [hero, minion], 1).id, "minion");
  tower.retaliateUntil = 5;
  assert.equal(towerTarget(tower, [hero, minion], 1).id, "hero");
  assert.equal(towerTarget(tower, [hero, minion], 6).id, "minion");
  assert.equal(
    towerTarget(
      tower,
      [
        { ...hero, hp: 0 },
        { ...minion, protected: true },
      ],
      1,
    ),
    null,
  );
  const s = start(make());
  const defender = s.bots.find((b) => b.team === "enemy"),
    t = s.structures.find((o) => o.id === "enemy-0");
  Object.assign(defender, {
    x: t.x,
    z: t.z,
    spawnProtectedUntil: 0,
    protected: false,
  });
  Object.assign(s.player, { x: t.x - 4, z: 0 });
  s.deal(s.player, defender, 10);
  assert.equal(t.retaliateId, "player");
  assert.equal(towerTarget(t, s.actors, s.time).id, "player");
});
test("tower shots travel, obey cooldown, revalidate targets and cannot kill their own team", () => {
  const s = isolate(start(make()));
  const tower = s.structures[0];
  tower.readyAt = 0;
  Object.assign(s.player, { x: tower.x + 1, z: 0, protected: false });
  const target = hostile("m", { x: tower.x + 5, z: 0 });
  s.minions = [target];
  s.tickTowers();
  assert.equal(target.hp, 1000);
  assert.equal(s.npcProjectiles.length, 1);
  s.tickTowers();
  assert.equal(s.npcProjectiles.length, 1);
  s.tickNpcProjectiles(0.5);
  assert.ok(target.hp < 1000);
  assert.equal(s.npcProjectiles.length, 0);
  const hp = s.player.hp;
  assert.equal(s.deal(tower, s.player, 999), 0);
  assert.equal(s.player.hp, hp);
});
test("minion motion, pursuit, defense, attack/cooldown, death rewards and removal are real events", () => {
  const s = isolate(start(make()));
  s.spawnWave(1);
  const minion = s.minions.find((m) => m.team === "enemy");
  Object.assign(minion, { x: s.player.x + 1, z: 0 });
  Object.assign(s.player, { protected: false, spawnProtectedUntil: 0 });
  const hp = s.player.hp;
  s.tickMinions(0.1);
  assert.ok(s.npcProjectiles.length > 0);
  s.tickNpcProjectiles(0.1);
  assert.ok(s.player.hp < hp);
  const initial = s.gold;
  Object.assign(s.player, { x: minion.x - 1, z: minion.z });
  s.damageEnemy(minion, 1e6);
  assert.equal(s.gold, initial + lane.wave.gold);
  assert.equal(s.progression.totalXp, lane.wave.xp);
  s.damageEnemy(minion, 1e6);
  assert.equal(s.gold, initial + lane.wave.gold);
  assert.equal(s.rewardLog.length, 1);
  s.time += 2;
  s.tickMinions(0);
  assert.ok(!s.minions.includes(minion));
});
test("nearby bot minion kill grants real XP but not player last-hit gold; distant player gets neither", () => {
  const s = isolate(start(make()));
  const ally = {
    ...s.player,
    id: "ally",
    kind: "bot",
    team: "player",
    progression: s.progression,
  };
  const a = hostile("a", { x: s.player.x + 1 });
  s.minions = [a];
  s.deal(ally, a, 1e6);
  assert.equal(s.progression.totalXp, 80);
  assert.equal(s.gold, 350);
  const b = hostile("b", { x: 20 });
  s.minions.push(b);
  s.deal({ ...ally, x: 20 }, b, 1e6);
  assert.equal(s.progression.totalXp, 80);
  assert.equal(s.gold, 350);
});
test("hero death increments real score/rewards once, cancels player actions, respawns at own spawn/resources with protection", () => {
  const s = start(make());
  const bot = s.bots.find((b) => b.team === "enemy");
  Object.assign(bot, { x: s.player.x + 1, z: 0, protected: false });
  s.deal(s.player, bot, 1e6);
  assert.equal(s.stats.eliminations, 1);
  assert.equal(s.score.player, 1);
  assert.equal(s.gold, 530);
  assert.equal(s.progression.totalXp, 250);
  assert.equal(s.progression.level, 2);
  s.deal(s.player, bot, 1e6);
  assert.equal(s.score.player, 1);
  s.time = bot.respawnAt;
  s.tickHeroes(0);
  assert.equal(bot.hp, bot.maxHp);
  assert.equal(bot.x, lane.spawn.enemy.x);
  assert.ok(bot.spawnProtectedUntil > s.time);
  assert.equal(bot.deathHandled, false);
  bot.protected = false;
  const red = { ...bot, x: s.player.x };
  s.deal(red, s.player, 1e6);
  assert.equal(s.stats.deaths, 1);
  assert.equal(s.pending.length, 0);
  assert.equal(s.projectiles.length, 0);
  const gold = s.gold;
  s.update(0.01, 1, 1);
  assert.equal(s.gold, gold);
  s.time = s.player.respawnAt;
  s.tickHeroes(0);
  assert.equal(s.player.hp, s.player.maxHp);
  assert.equal(s.player.mana, s.player.maxMana);
  assert.equal(s.player.x, s.scenario.spawn.player.x);
  assert.ok(s.player.spawnProtectedUntil > s.time);
});
test("assist counts only recent real player contribution before an allied hero elimination", () => {
  const s = start(make());
  const target = s.bots.find((b) => b.team === "enemy"),
    ally = s.bots.find((b) => b.team === "player");
  target.protected = false;
  s.deal(s.player, target, 10);
  s.deal(ally, target, 1e6);
  assert.equal(s.stats.assists, 1);
  assert.equal(s.stats.eliminations, 0);
  assert.equal(s.score.player, 1);
});
for (const difficulty of ["easy", "normal", "hard"])
  test(`${difficulty} decisions consume mana and cooldown, advance, detect, retreat, heal and resume without hidden damage cheats`, () => {
    const s = start(make("brawl", difficulty)),
      bot = s.bots.find((b) => b.team === "enemy");
    assert.equal(
      bot.attributes.physicalAttack,
      s.player.attributes.physicalAttack,
    );
    const decision = botDecision(
      bot,
      s.actors,
      lane.bot,
      difficulties[difficulty],
      s.time,
      () => 0.5,
    );
    assert.equal(decision.type, "move");
    Object.assign(bot, {
      x: s.player.x + 2,
      z: s.player.z,
      protected: false,
      spawnProtectedUntil: 0,
    });
    s.player.spawnProtectedUntil = 0;
    s.player.protected = false;
    s.bots = [bot];
    s.syncEnemies();
    const before = bot.mana;
    s.tickHeroes(0);
    const brain = s.botEngines.get(bot.id);
    assert.ok(
      brain.queuedSkill || Object.values(brain.cooldowns).some((v) => v > 0),
    );
    const skill = brain.ability(brain.queuedSkill?.slot || "skill-2");
    if (brain.queuedSkill) {
      assert.equal(bot.mana, before);
      s.time = brain.lockUntil + 0.001;
      s.tickHeroes(0);
    }
    assert.equal(bot.mana, before - skill.manaCost);
    assert.ok(Object.values(brain.cooldowns).some((v) => v > 0));
    const serial = brain.lastCast.serial;
    s.tickHeroes(0);
    assert.equal(brain.lastCast.serial, serial);
    bot.hp = bot.maxHp * 0.1;
    bot.nextThink = 0;
    s.tickHeroes(0.01);
    assert.equal(bot.intent.type, "retreat");
    Object.assign(bot, { ...s.scenario.spawn.enemy });
    s.tickHeroes(1);
    assert.ok(bot.hp > bot.maxHp * 0.1);
    bot.hp = bot.maxHp;
    s.time = bot.aiState.commitUntil + 0.01;
    bot.nextThink = 0;
    s.tickHeroes(0);
    assert.notEqual(bot.intent.type, "retreat");
  });
test("difficulty central reaction, aim spread and target/retreat policy genuinely differ", () => {
  assert.ok(
    difficulties.easy.reaction > difficulties.normal.reaction &&
      difficulties.normal.reaction > difficulties.hard.reaction,
  );
  assert.ok(difficulties.easy.aimSpread > difficulties.hard.aimSpread);
  assert.equal(difficulties.easy.damageMultiplier, undefined);
  const actor = {
    id: "b",
    team: "player",
    hp: 100,
    maxHp: 100,
    x: 0,
    z: 0,
    range: 5,
    laneOffset: 0,
    mana: 100,
    abilityReadyAt: 0,
  };
  const minion = hostile("m", { x: 3 }),
    hero = hostile("h", { kind: "bot", x: 4 });
  assert.equal(
    botDecision(
      actor,
      [actor, minion, hero],
      lane.bot,
      difficulties.easy,
      1,
      () => 1,
    ).targetId,
    "m",
  );
  assert.equal(
    botDecision(
      actor,
      [actor, minion, hero],
      lane.bot,
      difficulties.hard,
      1,
      () => 1,
    ).targetId,
    "h",
  );
  assert.equal(
    botDecision(
      { ...actor, hp: 30 },
      [actor, minion],
      lane.bot,
      difficulties.easy,
      1,
      () => 1,
    ).type,
    "attack",
  );
  assert.equal(
    botDecision(
      { ...actor, hp: 30 },
      [actor, minion],
      lane.bot,
      difficulties.hard,
      1,
      () => 1,
    ).type,
    "attack",
  );
});
for (const item of equipment.items)
  test(`item ${item.name}: real cost, one equip copy, stat bonus and exact sale removal without healing`, () => {
    const s = start(make());
    s.gold = 5000;
    s.player.hp = 1000;
    const attributes = structuredClone(s.player.attributes),
      hp = s.player.hp;
    if(item.type==='consumable'){
      const beforeInventory=[...s.inventory];assert.equal(s.purchaseItem(item.id),'ok');assert.equal(s.gold,5000-item.cost);assert.deepEqual(s.inventory,beforeInventory);assert.equal(s.player.hp,hp);assert.equal(s.purchaseItem(item.id),'potion-active');assert.equal(s.gold,5000-item.cost);assert.equal(s.sellItem(0),'empty-slot');assert.equal(s.potion.until,s.time+120);s.time+=121;s.itemEffects.tick();assert.deepEqual(s.player.attributes,attributes);assert.equal(s.player.hp,hp);return;
    }
    assert.equal(s.purchaseItem(item.id), "ok");
    assert.equal(s.gold, 5000 - item.cost);
    assert.equal(s.player.hp, hp);
    assert.equal(s.purchaseItem(item.id), "unique-item");
    for (const [key, v] of Object.entries(item.modifiers.flat))
      near(s.player.attributes[key], (attributes[key] + v)*(item.id==='holy-crystal'&&key==='magicPower'?1.21:1));
    for (const [key, v] of Object.entries(item.modifiers.percent))
      near(s.player.attributes[key], attributes[key] * (1 + v));
    if (item.criticalChance)
      assert.equal(s.player.criticalChance, item.criticalChance);
    if (item.lifesteal) assert.equal(s.player.lifesteal, item.lifesteal);
    assert.equal(s.sellItem(0), "ok");
    assert.equal(s.gold, 5000 - item.cost + Math.floor(item.cost * 0.6));
    assert.deepEqual(s.player.attributes, attributes);
    assert.equal(s.player.hp, hp);
    assert.equal(s.player.criticalChance, 0);
    assert.equal(s.player.lifesteal, 0);
  });
test("six-slot atomic transactions: no free gold, invalid sale, full/insufficient/unknown reject; manual replacement is rejected; explicit sale refunds once", () => {
  const blank = Array(6).fill(null);
  assert.equal(purchase(0, blank, "edge").error, "insufficient-gold");
  assert.equal(purchase(1000, blank, "bad").error, "unknown-item");
  assert.equal(
    purchase(1000, blank, "edge", 8).error,
    "manual-replacement-removed",
  );
  let gold = 5000,
    inventory = blank;
  for (const item of equipment.items.slice(0, 6)) {
    const tx = purchase(gold, inventory, item.id);
    ({ gold, inventory } = tx);
  }
  assert.equal(inventory.filter(Boolean).length, 6);
  assert.equal(purchase(gold, inventory, "boots").error, "equipment-full");
  assert.equal(sell(gold, inventory, 6).error, "invalid-slot");
  assert.equal(sell(gold, blank, 0).error, "empty-slot");
  assert.equal(
    purchase(gold, inventory, "boots", 0).error,
    "manual-replacement-removed",
  );
  const sold = sell(gold, inventory, 0);
  const replaced = purchase(sold.gold, sold.inventory, "boots");
  assert.equal(replaced.gold, gold + 180 - 250);
  assert.equal(replaced.inventory[0], "boots");
  assert.equal(inventory[0], "edge");
  assert.deepEqual(blank, Array(6).fill(null));
  assert.equal(
    inventoryBonuses(replaced.inventory).modifiers.flat.physicalAttack,
    undefined,
  );
});
test("critical chance and lifesteal affect only real basic hits; abilities never crit or lifesteal; dead/friendly/protected reject", () => {
  const s = isolate(start(make()));
  s.player.hp = 1000;
  s.gold = 10000;
  s.purchaseItem("lens");
  s.purchaseItem("haas-claws");
  s.random = () => 0;
  const target = hostile("target", { x: s.player.x + 1 });
  s.minions = [target];
  near(s.deal(s.player, target, 100, "physical", true), 200);
  near(s.player.hp, 1040);
  near(s.deal(s.player, target, 100, "physical", false), 100);
  near(s.player.hp, 1040);
  near(
    s.deal(
      s.player,
      { ...target, physicalDefense: 120 },
      100,
      "physical",
      false,
    ),
    50,
  );
  near(
    s.deal(s.player, { ...target, magicDefense: 120 }, 100, "magic", false),
    50,
  );
  near(
    s.deal(s.player, { ...target, physicalDefense: 999 }, 100, "true", false),
    100,
  );
  assert.equal(s.deal(s.player, { ...target, protected: true }, 100), 0);
  assert.equal(s.deal({ ...s.player, hp: 0 }, target, 100), 0);
});
test("actual Layla projectile adapter identifies basic hits for item crit/lifesteal without altering approved skills", () => {
  const s = isolate(start(make()));
  s.player.x = 0;
  s.player.z = 0;
  s.player.hp = 1000;
  s.gold = 10000;
  s.purchaseItem("lens");
  s.purchaseItem("haas-claws");
  s.random = () => 0;
  const target = hostile("target", { x: 4 });
  s.minions = [target];
  s.syncEnemies();
  const hp = target.hp;
  assert.equal(s.attack(target.id), "fired");
  step(s, 1);
  assert.ok(hp - target.hp > 250);
  assert.ok(s.player.hp > 1040);
});
test("minion-only / structure-only category filters change automatic targets; explicit manual pin retains precedence", () => {
  const s = isolate(start(make()));
  s.player.x = 10;
  s.player.z = 0;
  const minion = hostile("m", { x: 11 });
  s.minions = [minion];
  s.syncEnemies();
  s.setTargetCategory("tower");
  assert.equal(s.selectedTargetId, "enemy-0");
  s.setTargetCategory("minion");
  assert.equal(s.selectedTargetId, "m");
  s.prioritizeTarget("enemy-0");
  assert.equal(s.selectedTargetId, "enemy-0");
  assert.throws(() => s.setTargetCategory("fake"));
});
test("reset/replay restores initial waves, actor HP, objectives, inventory, gold, ranks, death counters and result", () => {
  const s = isolate(start(make("brawl")));
  s.gold = 9999;
  s.purchaseItem("edge");
  s.stats.deaths = 7;
  s.upgradeSkill("skill-1");
  s.structures[0].hp = 0;
  s.phase = "ended";
  s.result = { outcome: "Defeat" };
  s.reset();
  assert.equal(s.phase, "countdown");
  assert.equal(s.time, 0);
  assert.equal(s.gold, 800);
  assert.equal(s.player.hp, s.player.maxHp);
  assert.equal(s.progression.level, 3);
  assert.equal(s.progression.skillPoints, 3);
  assert.equal(s.bots.length, 9);
  assert.equal(s.minions.length, 0);
  assert.deepEqual(s.inventory, Array(6).fill(null));
  assert.equal(s.stats.deaths, 0);
  assert.equal(s.result, null);
  assert.ok(s.structures.every((o) => o.hp === o.maxHp));
});
test("seeded replay stable, explicit pause freezes all clocks/waves/AI/resources; illegal timestep rejects", () => {
  const a = seededRandom(42),
    b = seededRandom(42);
  for (let n = 0; n < 10; n++) assert.equal(a(), b());
  const s = start(make());
  s.paused = true;
  const before = s.snapshot();
  s.update(99, 1, 1);
  assert.deepEqual(s.snapshot(), before);
  s.paused = false;
  assert.throws(() => s.update(-1));
  assert.throws(() => s.update(NaN));
});
test("full deterministic unattended local match reaches a legitimate sequential core result and bounds live units", () => {
  const s = start(make("brawl"));
  let max = 0;
  for (let n = 0; n < 60 * 1000 && s.phase !== "ended"; n++) {
    s.update(1 / 60);
    max = Math.max(max, s.minions.length);
  }
  assert.equal(s.phase, "ended");
  assert.ok(["Victory", "Defeat"].includes(s.result.outcome));
  const losing = s.result.outcome === "Victory" ? "enemy" : "player";
  assert.ok(
    s.structures.filter((o) => o.team === losing).every((o) => o.hp === 0),
  );
  assert.ok(max < 100);
  assert.ok(s.result.duration > 60);
  assert.equal(s.result.duration, s.time);
});
test("death notices distinguish real hero eliminations from minions/structures and correctly classify player death", async () => {
  const { describeCombatEvent } = await import(
    "../src/ui/combat-notifications.js"
  );
  const s = isolate(start(make()));
  let death;
  s.events.subscribe((e) => {
    if (e.type === "death") death = e;
  });
  const m = hostile("minion", { x: s.player.x });
  s.minions = [m];
  s.deal(s.player, m, 1e6);
  assert.equal(describeCombatEvent(death), null);
  s.deal(
    s.player,
    s.structures.find((o) => o.id === "enemy-0"),
    1e6,
  );
  assert.equal(describeCombatEvent(death), null);
  s.deal(
    { id: "red", name: "Enemy Bot", kind: "bot", team: "enemy", hp: 100 },
    s.player,
    1e6,
  );
  assert.equal(death.victim.kind, "player");
  assert.equal(describeCombatEvent(death).title, "You have fallen");
});
test("paused commands cannot queue attacks, spend resources/points or transact match gold", () => {
  const s = start(make("brawl"));
  s.paused = true;
  const before = s.snapshot();
  assert.equal(s.attack(), "paused");
  assert.equal(s.cast("skill-1"), "paused");
  assert.equal(s.upgradeSkill("skill-1"), "paused");
  assert.equal(s.purchaseItem("edge"), "paused");
  assert.equal(s.sellItem(0), "paused");
  before.lastCastResult = "paused";
  assert.deepEqual(s.snapshot(), before);
  assert.equal(attackReason(null, null, 0), "cannot-act");
  assert.equal(validTarget({ team: "unknown" }, hostile()), false);
});
test("protected towers and cores may defend without dropping their sequential objective shield", () => {
  const s = isolate(start(make()));
  const target = hostile("intruder", { x: 25 });
  s.minions = [target];
  for (const structure of s.structures.filter(
    (o) => o.team === "player" && o.requires,
  )) {
    assert.equal(structure.protected, true);
    assert.equal(structure.targetable, false);
    s.deal(structure, target, 10);
    assert.equal(structure.protected, true);
    assert.equal(structure.targetable, false);
    assert.equal(s.deal({ ...s.player, team: "enemy" }, structure, 1e6), 0);
  }
});
test("configured hero/wave spawns and objective waypoint route are authoritative, including bot retreat and respawn", async () => {
  const scenario = structuredClone(lane);
  scenario.spawn.enemy = { x: 32, z: -1.5 };
  scenario.wave.spawn.player = { x: -27, z: 1 };
  const s = new MatchSimulation(
    registry,
    createMatchConfig("ai-training", "normal", 1),
    { username: "Config_Hero" },
    scenario,
  );
  start(s);
  s.spawnWave(1);
  const minion = s.minions.find((m) => m.team === "player");
  assert.equal(minion.x, -27);
  near(minion.z, -0.2);
  const bot = s.bots[0];
  bot.hp = bot.maxHp * 0.1;
  const intent = botDecision(
    bot,
    s.actors,
    scenario.bot,
    difficulties.normal,
    s.time,
    () => 0.5,
  );
  assert.equal(intent.x, 32);
  near(intent.z, scenario.spawn.enemy.z + bot.laneOffset);
  const { restoreActor } = await import("../src/match/respawn.js");
  bot.x = 0;
  bot.z = 0;
  restoreActor(bot, scenario.spawn.enemy, 20, 4);
  assert.equal(bot.x, 32);
  near(bot.z, scenario.spawn.enemy.z + bot.laneOffset);
  assert.equal(bot.spawnProtectedUntil, 24);
  const invalid = structuredClone(scenario);
  invalid.wave.path.player.reverse();
  assert.throws(() => validateLane(invalid), /waypoints/);
});
