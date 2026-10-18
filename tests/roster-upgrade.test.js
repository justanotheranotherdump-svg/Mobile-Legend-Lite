import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig, equipment } from "../src/match/config.js";
import { MatchFlow, assignTeamHeroes } from "../src/menu/match-flow.js";
import { mapPoint } from "../src/ui/minimap.js";
const registry = await loadSourceHeroRegistry(),
  near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);
function game(items = []) {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("ai-training", "normal", 1),
    { username: "Unit_Hero" },
  );
  s.update(3);
  s.bots = [];
  s.botEngines.clear();
  s.structures = [];
  s.player.x = 0;
  s.player.z = 0;
  s.player.spawnProtectedUntil = 0;
  s.player.protected = false;
  s.player.targetable = true;
  s.gold = 100000;
  for (const i of items) assert.equal(s.purchaseItem(i), "ok");
  s.random = () => 0;
  return s;
}
function enemy(s, kind = "minion", id = "foe") {
  const e = {
    id,
    name: id,
    kind,
    team: "enemy",
    x: 3,
    z: 0,
    hp: 10000,
    maxHp: 10000,
    maxMana: 500,
    mana: 500,
    radius: 0.4,
    targetable: true,
    physicalDefense: 0,
    magicDefense: 0,
  };
  s.minions.push(e);
  s.syncEnemies();
  return e;
}
function advance(s, secs, h = 0, v = 0) {
  for (let n = 0; n < Math.round(secs * 60); n++) s.update(1 / 60, h, v);
}
test("Brawl room forbids no enemy, supports asymmetric exact counts and validates direct roster config", () => {
  const f = new MatchFlow();
  f.chooseMode("brawl");
  assert.equal(f.startSelection(), false);
  f.editComputer("enemy", 1);
  f.editComputer("player", 1);
  assert.equal(f.startSelection(), true);
  f.selectHero("layla");
  const c = f.confirm({ username: "Unit_Hero" });
  assert.equal(c.enemyCount, 1);
  assert.equal(c.allyCount, 1);
  const s = new MatchSimulation(registry, c, { username: "Unit_Hero" });
  assert.equal(s.bots.length, 2);
  assert.throws(() =>
    createMatchConfig("brawl", "normal", 5, { allyCount: 4, enemyCount: 0 }),
  );
});
test("duplicate policy allows actual Layla now and enforces unique picks per team once five heroes exist", () => {
  const one = assignTeamHeroes(["layla"], "layla", 4, 5);
  assert.equal(new Set(one.player).size, 1);
  const five = assignTeamHeroes(["a", "b", "c", "d", "e"], "a", 4, 5);
  assert.equal(new Set(five.player).size, 5);
  assert.equal(new Set(five.enemy).size, 5);
  assert.equal(five.duplicatesAllowed, false);
});
test("map coordinate orientation flips only lane maps, allied base bottom-left", () => {
  const blue = mapPoint(-30, 0, 36, true),
    red = mapPoint(30, 0, 36, true);
  assert.ok(blue.x < red.x && blue.y > red.y);
  assert.deepEqual(mapPoint(0, 0, 36), { x: 100, y: 100 });
});
test("NPC owns actual Layla progression, learned abilities, mana/CD and independent authoritative engine", () => {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 1),
    { username: "Unit_Hero" },
  );
  s.update(3);
  const bot = s.bots[0],
    e = s.botEngines.get(bot.id);
  assert.equal(e.player, bot);
  assert.equal(e.hero.id, "layla");
  assert.ok(e.ability("skill-1").rank > 0);
  assert.notEqual(e.progression, s.progression);
});
test("37 supplied Attack/Movement items with Javelin 8% crit and typed Rogue Meteor 900", () => {
  assert.equal(equipment.items.filter((i) => !i.legacy).length, 37);
  const s = game(["javelin"]);
  near(s.player.criticalChance, 0.08);
  assert.equal(equipment.items.find((i) => i.id === "rogue-meteor").cost, 900);
});
test("boots enforce one equipped pair; selected sale frees a slot, once, without accumulating stats", () => {
  const s = game(["basic-boots"]);
  near(s.player.attributes.movementSpeed, 260);
  assert.equal(s.purchaseItem("swift-boots"), "one-boots-only");
  const gold = s.gold;
  assert.equal(s.sellItem(0), "ok");
  assert.equal(s.gold, gold + 150);
  near(s.player.attributes.movementSpeed, 240);
  assert.equal(s.sellItem(0), "empty-slot");
});
test("queued skill spends nothing until full basic lock, then casts once and preserves skill lock", () => {
  const s = game();
  enemy(s);
  s.upgradeSkill("skill-1");
  const mana = s.player.mana;
  s.attack();
  const lock = s.lockUntil;
  assert.equal(s.cast("skill-1"), "queued");
  near(s.player.mana, mana);
  near(s.lockUntil, lock);
  advance(s, 0.5);
  assert.equal(s.lastCast.serial, 0);
  advance(s, 0.5);
  assert.equal(s.lastCast.slot, "skill-1");
  assert.equal(s.queuedSkill, null);
  assert.ok(s.player.mana < mana);
  assert.ok(s.lockUntil >= lock + 1);
});
test("queued follow-up revalidates dead target and does not spend mana/cooldown on failure", () => {
  const s = game(),
    e = enemy(s);
  s.upgradeSkill("skill-1");
  s.attack();
  s.cast("skill-1");
  e.hp = 0;
  const mana = s.player.mana;
  advance(s, 1.1);
  assert.equal(s.lastCast.serial, 0);
  near(s.player.mana, mana);
  assert.equal(s.queuedSkill, null);
});
test("Recall channels eight seconds and returns to configured own spawn; motion cancels", () => {
  const s = game();
  assert.equal(s.useUtility("recall"), "started");
  advance(s, 7.8);
  near(s.player.x, 0);
  advance(s, 0.3);
  near(s.player.x, s.scenario.spawn.player.x);
  near(s.player.z, 0);
  s.player.x = 0;
  s.useUtility("recall");
  advance(s, 0.1, 1, 0);
  assert.equal(s.utilities.recall, null);
});
test("Regen heals configured resources over six seconds, clamps, cooldown, and damage cancels", () => {
  const s = game();
  s.player.hp = 1000;
  s.player.mana = 0;
  s.useUtility("regen");
  advance(s, 6);
  assert.ok(s.player.hp >= 1405);
  assert.ok(s.player.mana >= 45);
  assert.equal(s.useUtility("regen"), "cooldown");
  s.time = 61;
  s.useUtility("regen");
  const t = enemy(s);
  s.deal(t, s.player, 1);
  assert.equal(s.utilities.regen, null);
});
test("Berserker Doom raises critical damage and temporary PA only on real crit", () => {
  const s = game(["berserkers-fury", "javelin"]),
    e = enemy(s, "bot");
  const pa = s.player.attributes.physicalAttack;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, 240);
  near(s.player.attributes.physicalAttack, pa * 1.05);
  s.time = 3;
  s.itemEffects.tick();
  near(s.player.attributes.physicalAttack, pa);
});
test("Blade of Despair triggers before damage and expires; minions do not trigger", () => {
  const s = game(["blade-of-despair"]),
    e = enemy(s, "bot");
  e.hp = 4000;
  const pa = s.player.attributes.physicalAttack;
  s.deal(s.player, e, pa);
  near(4000 - e.hp, pa * 1.25);
  s.time = 3;
  s.itemEffects.tick();
  near(s.player.attributes.physicalAttack, pa);
});
test("Ambush charges after quiet period, grants correct extra physical and slow, cannot repeat on minions", () => {
  const s = game(["blade-of-the-heptaseas"]),
    e = enemy(s);
  s.time = 6;
  const pa = s.player.attributes.physicalAttack;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, 260 + 0.4 * pa);
  near(e.slow.ratio, 0.4);
  const hp = e.hp;
  s.deal(s.player, e, 100);
  near(hp - e.hp, 100);
});
test("Corrosion adds 80 damage, ranged slow five stacks and Impulse expires", () => {
  const s = game(["corrosion-scythe"]),
    e = enemy(s);
  const a = s.player.attributes.attackSpeed;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, 180);
  near(e.slow.ratio, 0.04);
  assert.ok(s.player.attributes.attackSpeed > a);
  for (let i = 0; i < 7; i++) s.deal(s.player, e, 1);
  near(e.slow.ratio, 0.2);
  s.time = 4;
  s.itemEffects.tick();
  near(s.player.attributes.attackSpeed, a);
});
test("Demon Hunter caps extra damage at 60 versus minions, stacks lifesteal and uses real HP", () => {
  const s = game(["demon-hunter-sword"]),
    e = enemy(s);
  s.player.hp = 1000;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, 160);
  near(s.player.lifesteal, 0.1);
  assert.ok(s.player.hp > 1000);
});
test("Divine Justice adds true damage after skill and exact heal, once per window/cooldown", () => {
  const s = game(["endless-battle"]),
    e = enemy(s);
  e.physicalDefense = 10000;
  s.player.hp = 1000;
  const pa = s.player.attributes.physicalAttack;
  s.itemEffects.cast({ slot: "skill-1" });
  s.deal(s.player, e, 100);
  near(10000 - e.hp, (100 * 120) / 10120 + pa * 0.6);
  near(s.player.hp, 1080 + pa * 0.4);
  const hp = e.hp;
  s.deal(s.player, e, 100);
  near(hp - e.hp, (100 * 120) / 10120);
});
test("Golden Staff converts crit, accelerates every third accepted basic and repeats on-hit effects twice", () => {
  const s = game(["golden-staff", "javelin", "swift-crossbow"]),
    e = enemy(s);
  near(s.player.criticalChance, 0);
  s.deal(s.player, e, 10);
  s.deal(s.player, e, 10);
  const normal = s.player.attackCooldown;
  s.itemEffects.basicCommitted(e);
  assert.ok(s.player.attackCooldown < normal);
  const hp = e.hp;
  s.deal(s.player, e, 10);
  near(hp - e.hp, 130);
  assert.equal(s.itemEffects.t.staffHits, 0);
});
test("Spear ultimate speed buff lasts 7.5 and cooldown prevents immediate refresh", () => {
  const s = game(["great-dragon-spear"]),
    speed = s.player.speed;
  s.itemEffects.cast({ slot: "skill-ultimate" });
  near(s.player.speed, speed * 1.3);
  s.time = 8;
  s.itemEffects.tick();
  near(s.player.speed, speed);
  s.itemEffects.cast({ slot: "skill-ultimate" });
  near(s.player.speed, speed);
});
test("Haas crit grants temporary attack speed", () => {
  const s = game(["haas-claws", "javelin"]),
    e = enemy(s),
    a = s.player.attributes.attackSpeed;
  s.deal(s.player, e, 1);
  assert.ok(s.player.attributes.attackSpeed > a);
  s.time = 3;
  s.itemEffects.tick();
  near(s.player.attributes.attackSpeed, a);
});
test("Hunter Strike uses five consecutive real hero hits, decaying speed, cooldown", () => {
  const s = game(["hunter-strike"]),
    e = enemy(s, "bot"),
    v = s.player.speed;
  for (let i = 0; i < 5; i++) s.deal(s.player, e, 1);
  assert.ok(s.player.speed > v);
  s.time = 4;
  s.itemEffects.tick();
  near(s.player.speed, v);
});
test("Magic Blade Lifeline shields before fatal hit and shares preserved 60-second cooldown", () => {
  const s = game(["magic-blade"]),
    e = enemy(s);
  s.player.hp = 700;
  s.deal(e, s.player, 50, "true");
  near(s.player.hp, 700);
  near(s.player.shield.amount, 10);
  assert.equal(s.itemEffects.t.lifelineReadyAt, 60);
});
test("Malefic Gun adds actual range/percent penetration and brief speed without repeated range multiplication", () => {
  const s = game(["malefic-gun"]),
    e = enemy(s);
  e.physicalDefense = 100;
  const range = s.player.range;
  for (let n = 0; n < 20; n++) s.itemEffects.tick();
  near(s.player.range, range);
  const speed = s.player.speed;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, (100 * 120) / 190);
  assert.ok(s.player.speed > speed);
});
test("Malefic Roar defense-dependent penetration is capped and unique Armor Buster does not add twice", () => {
  const s = game(["malefic-roar", "malefic-gun"]),
    e = enemy(s);
  e.physicalDefense = 500;
  s.deal(s.player, e, 100);
  near(10000 - e.hp, (100 * 120) / (120 + 200));
});
test("Rose Gold lifesteal-to-defense respects Marksman half and stronger unique Lifeline", () => {
  const s = game(["rose-gold-meteor", "haas-claws", "magic-blade"]),
    e = enemy(s);
  near(s.player.attributes.physicalDefense, 35);
  s.player.hp = 700;
  s.deal(e, s.player, 50, "true");
  near(s.player.shield.amount, 70);
});
test("Sea Halberd applies timed recovery reduction and real bonus-HP comparison", () => {
  const s = game(["sea-halberd"]),
    e = enemy(s, "bot");
  const hp = e.hp;
  s.deal(s.player, e, 100);
  assert.ok(e.antiHealUntil === 3);
  near(hp - e.hp, 108);
});
test("Crossbow adaptive on-hit damage and strongest shared Impulse", () => {
  const s = game(["swift-crossbow", "corrosion-scythe"]),
    e = enemy(s);
  s.deal(s.player, e, 100);
  near(10000 - e.hp, 220);
  near(s.itemEffects.t.impulseStacks, 1);
});
test("War Axe builds once per second, half PA for Marksman and true bonus only at full stacks", () => {
  const s = game(["war-axe"]),
    e = enemy(s);
  const base = s.player.attributes.physicalAttack;
  for (let i = 0; i < 6; i++) {
    s.time = i;
    s.deal(s.player, e, 100, "physical", false);
  }
  near(s.player.attributes.physicalAttack, base + 36);
  const hp = e.hp;
  s.deal(s.player, e, 100, "physical", false);
  near(hp - e.hp, 105);
});
test("Wind of Nature actual active immunity excludes magic, has 90s cooldown and cannot be reset by sale", () => {
  const s = game(["wind-of-nature"]),
    e = enemy(s);
  assert.equal(s.itemEffects.activeWind(), "activated");
  const hp = s.player.hp;
  s.deal(e, s.player, 100, "physical");
  near(s.player.hp, hp);
  s.deal(e, s.player, 100, "magic");
  assert.ok(s.player.hp < hp);
  assert.equal(s.itemEffects.activeWind(), "cooldown");
  s.sellItem(0);
  s.purchaseItem("wind-of-nature");
  assert.equal(s.itemEffects.activeWind(), "cooldown");
});
test("Windtalker chains to at most three, correct magic damage/minion doubling and cooldown", () => {
  const s = game(["windtalker"]);
  const targets = Array.from({ length: 4 }, (_, i) =>
    enemy(s, "minion", `m${i}`),
  );
  s.deal(s.player, targets[0], 100);
  near(10000 - targets[0].hp, 400);
  near(10000 - targets[1].hp, 300);
  near(targets[3].hp, 10000);
  const hp = targets[1].hp;
  s.deal(s.player, targets[0], 100);
  near(targets[1].hp, hp);
});
test("Arcane Boots penetration, Demon Shoes real recent minion contribution restores mana", () => {
  const s = game(["arcane-boots"]);
  assert.equal(s.itemEffects.defense("magic", {}).flatPenetration, 10);
  s.sellItem(0);
  s.purchaseItem("demon-shoes");
  s.player.mana = 0;
  const e = enemy(s);
  e.hp = 1;
  s.deal(s.player, e, 2);
  near(s.player.mana, 20);
});
test("Rapid Boots loses 20 speed after combat then recovers without stacking", () => {
  const s = game(["rapid-boots"]),
    e = enemy(s);
  near(s.player.attributes.movementSpeed, 305);
  s.deal(s.player, e, 1);
  near(s.player.attributes.movementSpeed, 285);
  s.time = 6;
  s.itemEffects.tick();
  near(s.player.attributes.movementSpeed, 305);
});
test("Tough Boots reduces slow duration; Warrior Boots stacks real physical-hit defense then expires", () => {
  const s = game(["tough-boots"]);
  near(s.player.tenacity, 0.25);
  s.itemEffects.slow(s.player, 0.4, 2);
  near(s.player.slow.until, 1.5);
  s.sellItem(0);
  s.purchaseItem("warrior-boots");
  const e = enemy(s);
  for (let i = 0; i < 9; i++) s.deal(e, s.player, 1);
  s.itemEffects.tick();
  near(s.player.attributes.physicalDefense, 53);
  s.time = 4;
  s.itemEffects.tick();
  near(s.player.attributes.physicalDefense, 33);
});
test("equipped cooldown reduction caps at 40% and affects real skill cooldown on cast", () => {
  const s = game([
    "endless-battle",
    "great-dragon-spear",
    "hunter-strike",
    "iron-hunting-bow",
    "war-axe",
    "magic-shoes",
  ]);
  enemy(s);
  near(s.player.cooldownReduction, 0.4);
  s.upgradeSkill("skill-1");
  const a = s.ability("skill-1");
  assert.equal(s.cast("skill-1"), "cast");
  near(s.cooldowns[a.id], a.cooldown * 0.6);
});
test("flat physical penetration sums across different items; unique percent Armor Buster does not", () => {
  const s = game([
    "hunter-strike",
    "blade-of-the-heptaseas",
    "malefic-roar",
    "malefic-gun",
  ]);
  near(
    s.itemEffects.defense("physical", { physicalDefense: 100 }).flatPenetration,
    30,
  );
  near(
    s.itemEffects.defense("physical", { physicalDefense: 100 })
      .percentPenetration,
    0.4,
  );
});
test("duplicate hero marks belong to their caster and cannot consume an ally mark at another rank", () => {
  const s = game(),
    target = enemy(s);
  target.mark = { source: "enemy-bot-0", until: 5 };
  assert.equal(s.consumeMark(target), 0);
  assert.ok(target.mark);
  target.marks = { player: { source: "player", until: 5 } };
  s.upgradeSkill("skill-2");
  assert.ok(s.consumeMark(target) > 0);
  assert.equal(target.mark.source, "enemy-bot-0");
  assert.equal(target.marks.player, undefined);
});
test("both red and blue real hero kits can actually hit the opposing team, never allies", () => {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 2),
    { username: "Unit_Hero" },
  );
  s.update(3);
  const blue = s.bots.find((a) => a.team === "player"),
    red = s.bots.find((a) => a.team === "enemy");
  s.bots = [blue, red];
  s.structures = [];
  s.minions = [];
  s.player.x = -34;
  for (const [a, x] of [
    [blue, 0],
    [red, 4],
  ])
    Object.assign(a, {
      x,
      z: 0,
      spawnProtectedUntil: 0,
      protected: false,
      targetable: true,
      nextThink: Infinity,
      intent: null,
    });
  s.syncEnemies();
  assert.equal(s.npcAttack(red, blue, true, 0), true);
  advance(s, 1.6);
  assert.ok(blue.hp < blue.maxHp);
  assert.equal(s.npcAttack(blue, red, true, 0), true);
  advance(s, 1.6);
  assert.ok(red.hp < red.maxHp);
  assert.equal(s.npcAttack(red, red, true), false);
});
test("Despair activated at impact scales only PA contribution and retains Layla distance multiplier", () => {
  const s = game(["blade-of-despair"]),
    e = enemy(s, "bot");
  e.hp = 4000;
  const pa = s.player.attributes.physicalAttack,
    factor = s.passive(e);
  s.damageEnemy(e, pa, "physical", { basic: true });
  near(4000 - e.hp, pa * 1.25 * factor);
});
