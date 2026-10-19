import test from "node:test";
import assert from "node:assert/strict";
import {
  BuildStore,
  validBuild,
  validateBuilds,
} from "../src/player/builds.js";
const storage = () => {
  const m = new Map();
  return {
    getItem: (k) => m.get(k) || null,
    setItem: (k, v) => m.set(k, v),
    removeItem: (k) => m.delete(k),
  };
};
test("phase1 builds save, edit, order, select and reload independently by hero/account", () => {
  const db = storage(),
    s = new BuildStore(db, "Test");
  assert.equal(
    s.saveBuild("layla", { name: "DPS", items: ["swift-boots", "haas-claws"] }),
    "ok",
  );
  const b = s.selected("layla");
  assert.deepEqual(b.items, ["swift-boots", "haas-claws"]);
  assert.equal(
    s.saveBuild("layla", { ...b, items: ["haas-claws", "swift-boots"] }),
    "ok",
  );
  assert.deepEqual(new BuildStore(db, "Test").selected("layla").items, [
    "haas-claws",
    "swift-boots",
  ]);
  assert.equal(new BuildStore(db, "Other").selected("layla"), null);
  s.select("layla", null);
  assert.equal(s.selected("layla"), null);
});
test("phase1 validates build ownership, completed items, copies, boots and corrupted saves", () => {
  assert.equal(validBuild(["dagger"]), false);
  assert.equal(validBuild(["swift-boots", "tough-boots"]), false);
  assert.equal(validBuild(["haas-claws", "haas-claws"]), true);
  assert.equal(validBuild(["unknown"]), false);
  const s = new BuildStore(null, "Test");
  assert.equal(
    s.saveBuild("unowned", { name: "bad", items: ["haas-claws"] }),
    "invalid-build",
  );
  assert.deepEqual(validateBuilds({ version: 99 }), { version: 1, heroes: {} });
  assert.equal(
    s.saveBuild("layla", { name: "Session", items: ["haas-claws"] }),
    "ok",
  );
  assert.equal(s.persistent, false);
});
import { HistoryStore, validRecord } from "../src/player/history.js";
import {
  resetLocalAccount,
  restoreLocalBackup,
  accountKeys,
} from "../src/player/account-tools.js";
import { ProgressStore } from "../src/menu/progress.js";
import { BattleAccountStore } from "../src/menu/battle-account.js";
test("phase2 history is validated, deduplicated, persistent and derived only from actual completion", () => {
  const db = storage(),
    h = new HistoryStore(db, "Test"),
    c = { heroId: "layla", mode: "brawl" },
    r = {
      outcome: "Victory",
      duration: 123.5,
      eliminations: 2,
      deaths: 1,
      assists: 3,
      level: 6,
    };
  assert.equal(h.record("match1", c, r), true);
  assert.equal(h.record("match1", c, r), false);
  assert.equal(h.record("practice", { ...c, mode: "practice" }, r), false);
  assert.equal(h.record("bad", c, { ...r, deaths: NaN }), false);
  assert.equal(new HistoryStore(db, "Test").stats()[0].wins, 1);
  assert.equal(h.stats()[0].matches, 1);
  assert.equal(validRecord({}), false);
});
test("phase2 explicit reset backs up exactly current player keys and supports restore", () => {
  const db = storage();
  for (const k of accountKeys("Test")) db.setItem(k, "saved");
  db.setItem("unrelated", "keep");
  assert.equal(resetLocalAccount(db, "Test").ok, true);
  for (const k of accountKeys("Test")) assert.equal(db.getItem(k), null);
  assert.equal(db.getItem("unrelated"), "keep");
  assert.equal(restoreLocalBackup(db), true);
  assert.equal(db.getItem(accountKeys("Test")[1]), "saved");
  assert.equal(
    resetLocalAccount(
      {
        getItem() {
          throw Error();
        },
        setItem() {
          throw Error();
        },
      },
      "Test",
    ).ok,
    false,
  );
});
test("phase2 development currency and max account XP stay valid across reload and do not re-grant wallet", () => {
  const db = storage(),
    p = new ProgressStore(db);
  p.loadFor({ username: "Test" });
  assert.equal(p.developerAdd("coins", 1000), "ok");
  assert.equal(p.developerAdd("diamonds", 55), "ok");
  assert.equal(p.developerAdd("coins", -1), "invalid-amount");
  assert.equal(p.developerAdd("coins", Infinity), "invalid-amount");
  assert.equal(
    new ProgressStore(db).loadFor({ username: "Test" }).coins,
    31000,
  );
  assert.equal(p.current.diamonds, 55);
  const a = new BattleAccountStore(db, "Test");
  a.developerMax();
  assert.equal(new BattleAccountStore(db, "Test").level, 25);
  assert.equal(p.current.coins, 31000);
});
import { rangeSnapshot } from "../src/simulation/ranges.js";
import { inAttackRange } from "../src/simulation/targeting.js";
import { towerTarget } from "../src/match/ai.js";
test("phase3 player/tower visual radii and boundary classification match actual simulation", () => {
  const p = {
    id: "player",
    kind: "player",
    team: "player",
    x: 0,
    z: 0,
    hp: 100,
    maxHp: 100,
    range: 6,
    targetable: true,
  };
  const t = {
    id: "tower",
    kind: "tower",
    team: "enemy",
    x: 8,
    z: 0,
    hp: 100,
    maxHp: 100,
    range: 8,
    targetable: true,
  };
  const s = {
    player: p,
    structures: [t],
    selectedTargetId: "tower",
    selectedTarget: t,
  };
  let r = rangeSnapshot(s);
  assert.equal(r.player.radius, 6);
  assert.equal(r.player.targetInRange, inAttackRange(p, t));
  assert.equal(r.towers[0].inside, true);
  assert.equal(towerTarget(t, [p], 0), p);
  p.x = -0.01;
  assert.equal(rangeSnapshot(s).towers[0].inside, false);
  assert.equal(towerTarget(t, [p], 0), null);
  p.range = 10;
  t.range = 9;
  assert.equal(rangeSnapshot(s).player.radius, 10);
  assert.equal(rangeSnapshot(s).towers[0].radius, 9);
  s.combatSettings = { rangeDisplay: "off", towerRanges: false };
  assert.equal(rangeSnapshot(s).player.visible, false);
  assert.equal(rangeSnapshot(s).towers[0].visible, false);
});
import { approachPath } from "../src/simulation/attack-command.js";
import { MatchSimulation } from "../src/match/simulation.js";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { createMatchConfig } from "../src/match/config.js";
const registry = await loadSourceHeroRegistry();
const combat = () => {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 1),
    { username: "Test" },
  );
  s.phase = "running";
  s.player.x = 0;
  s.player.z = 0;
  s.player.protected = false;
  s.player.spawnProtectedUntil = 0;
  s.structures = [];
  s.bots = [];
  s.minions = [];
  s.waveScheduler.due = () => [];
  s.tickMinions = () => {};
  s.tickHeroes = () => {};
  s.syncEnemies();
  return s;
};
const enemy = (id, kind, x, hp = 100000) => ({
  id,
  kind,
  team: "enemy",
  x,
  z: 0,
  hp,
  maxHp: 100000,
  radius: 0.4,
  physicalDefense: 0,
  magicDefense: 0,
  targetable: true,
  level: 3,
});
test("phase4 persistent attack approaches, stops within real center range and repeats at actual interval; movement cancels", () => {
  const s = combat(),
    t = enemy("test-minion", "minion", 12);
  s.minions = [t];
  s.syncEnemies();
  assert.equal(s.requestAttack(null, "minion"), "approaching");
  for (let k = 0; k < 600; k++) s.update(1 / 60);
  assert.ok(s.player.x > 0 && s.player.x < 12);
  assert.ok(inAttackRange(s.player, t));
  assert.ok(distanceTo(s.player, t) >= s.player.radius + t.radius);
  assert.ok(s.hits > 1);
  assert.ok(s.hits < 20);
  s.update(1 / 60, 1, 0);
  assert.equal(s.attackCommand, null);
});
import { distanceTo } from "../src/simulation/targeting.js";
import { overlapsBox } from "../src/simulation/movement.js";
test("phase4 shared command filters, HP settings, manual pins, invalid switching and search leash", () => {
  const s = combat(),
    h = enemy("hero", "bot", 10, 100),
    m = enemy("minion", "minion", 8, 1),
    t = enemy("tower", "tower", 9, 50);
  s.bots = [h];
  s.minions = [m];
  s.structures = [t];
  s.syncEnemies();
  s.requestAttack();
  assert.equal(s.attackCommand.targetId, "hero");
  s.requestAttack(null, "minion");
  assert.equal(s.attackCommand.targetId, "minion");
  s.requestAttack(null, "tower");
  assert.equal(s.attackCommand.targetId, "tower");
  s.requestAttack("minion");
  assert.equal(s.attackCommand.targetId, "minion");
  m.hp = 0;
  s.attackController.vector(1 / 60, 0, 0);
  assert.equal(s.attackCommand.targetId, "hero");
  s.combatSettings.autoSwitch = false;
  h.hp = 0;
  s.attackController.vector(1 / 60, 0, 0);
  assert.equal(s.attackCommand, null);
  h.hp = 100;
  s.combatSettings.autoSwitch = true;
  s.combatSettings.categoryPriority = "tower";
  s.requestAttack();
  assert.equal(s.attackCommand.targetId, "tower");
  t.x = 100;
  s.attackController.vector(1 / 60, 0, 0);
  assert.equal(s.attackCommand.targetId, "hero");
  const h2 = enemy("hero2", "bot", 11, 30);
  s.bots.push(h2);
  s.syncEnemies();
  s.combatSettings.categoryPriority = "hero";
  s.targetMode = "current-hp";
  s.manualTargetId = null;
  s.requestAttack();
  assert.equal(s.attackCommand.targetId, "hero2");
  s.targetMode = "nearest";
  s.requestAttack();
  assert.equal(s.attackCommand.targetId, "hero");
  h.maxHp = 20000;
  h2.maxHp = 40;
  s.targetMode = "hp-percent";
  s.requestAttack();
  assert.equal(s.attackCommand.targetId, "hero");
});
test("phase4 obstacle path respects collisions; bounded unreachable path returns null without teleport", () => {
  const p = { x: -7, z: 0, radius: 0.35, range: 2, speed: 3 },
    t = { x: 7, z: 0, radius: 0.5, hp: 10 };
  const wall = { x: 0, z: 0, width: 2, depth: 6 },
    arena = { halfSize: 10, obstacles: [wall] },
    path = approachPath(p, t, arena, [t]);
  assert.ok(path && path.length > 0);
  assert.ok(path.every((n) => !overlapsBox(n.x, n.z, p.radius, wall)));
  assert.ok(Math.abs(path.find((n) => Math.abs(n.x) < 1.5).z) > 3);
  assert.equal(
    approachPath(p, t, { halfSize: 10, obstacles: [{ ...wall, depth: 20 }] }, [
      t,
    ]),
    null,
  );
});
import { directionalAim, aimingShape } from "../src/input/directional-aim.js";
test("phase5 wheel uses relative direction not absolute mouse world position; circle distance clamped", () => {
  const view = { groundAtClient: (x, y) => ({ x: x + y, z: y - x }) },
    p = { x: 10, z: 20 };
  const a = directionalAim(view, p, 8, 100, 100, 150, 100),
    b = directionalAim(view, p, 8, 500, 350, 550, 350);
  assert.deepEqual(a, b);
  assert.ok(Math.abs(distanceTo(p, a) - 8) < 1e-8);
  assert.equal(directionalAim(view, p, 8, 0, 0, 1, 1), null);
  assert.ok(distanceTo(p, directionalAim(view, p, 8, 0, 0, 20, 0, true)) < 8);
  assert.ok(
    Math.abs(
      distanceTo(p, directionalAim(view, p, 8, 0, 0, 200, 0, true)) - 8,
    ) < 1e-8,
  );
});
test("phase5 all six targeting overlays have explicit data-driven shapes without new hero skills", () => {
  assert.equal(aimingShape({ effectId: "line-projectile" }), "projectile");
  assert.equal(aimingShape({ effectId: "line-blast" }), "line");
  assert.equal(aimingShape({ effectId: "orb-mark" }), "circle");
  assert.equal(aimingShape({ aimStyle: "area" }), "self-area");
  assert.equal(aimingShape({ targetShape: "cone" }), "cone");
  assert.equal(aimingShape({ targetShape: "targeted" }), "targeted");
});
test("phase5 manual directional cast cannot be hijacked by a smart target; canceled aim costs nothing", () => {
  const s = combat();
  s.upgradeSkill("skill-1");
  s.bots = [enemy("hero", "bot", 5)];
  s.syncEnemies();
  s.beginAim("skill-1");
  const mana = s.player.mana;
  s.setDirectionalAim({ x: 0, z: 8 });
  s.cancelAim();
  assert.equal(s.player.mana, mana);
  assert.equal(s.releaseAim(), "cancelled");
  s.beginAim("skill-1");
  s.setDirectionalAim({ x: 5, z: 0 });
  assert.equal(s.releaseAim(), "cast");
  assert.equal(s.pending[0].targetId, null);
  assert.ok(s.player.mana < mana);
});
import { utilityCooldown } from "../src/ui/utility-cooldowns.js";
test("phase6 cooldown display is derived from authoritative spell/utility timers and recall channel", () => {
  const s = {
    time: 10.2,
    spells: { readyAt: 20 },
    utilities: { regenReadyAt: 70, recall: { endsAt: 18 } },
  };
  assert.deepEqual(utilityCooldown(s, "battle-spell"), {
    remaining: 9.8,
    text: "10",
    channel: false,
  });
  assert.equal(utilityCooldown(s, "regen").text, "60");
  assert.equal(utilityCooldown(s, "recall").channel, true);
  s.time = 75;
  assert.equal(utilityCooldown(s, "regen").text, "");
  assert.equal(utilityCooldown(s, "battle-spell").remaining, 0);
  s.utilities.recall = null;
  assert.equal(utilityCooldown(s, "recall").remaining, 0);
});
import { BuildPriority } from "../src/match/build-priority.js";
import {
  priorityStep,
  purchaseQuote,
  recipeQuote,
  recipeDisplayTree,
} from "../src/match/recipes.js";
test("phase7 saved sequence advances on actual purchases, skips completed, manual override/resume and pause are explicit", () => {
  const p = new BuildPriority(["swift-boots", "haas-claws"]),
    i = Array(6).fill(null);
  assert.equal(p.refresh(i), "swift-boots");
  i[0] = "swift-boots";
  assert.equal(p.refresh(i), "haas-claws");
  p.prioritize("blade-of-despair");
  assert.equal(p.refresh(i), "blade-of-despair");
  p.resume();
  assert.equal(p.refresh(i), "haas-claws");
  p.prioritize(null);
  assert.equal(p.refresh(i), null);
  p.resume();
  i[1] = "haas-claws";
  assert.equal(p.refresh(i), null);
  i[0] = null;
  assert.equal(p.refresh(i), null);
  assert.equal(new BuildPriority(["unknown"]).sequence.length, 0);
});
test("phase7 actual saved build enters match, full slots reject atomically, components reduce final gold and stats combine", () => {
  const cfg = {
      ...createMatchConfig("brawl", "normal", 1),
      build: ["haas-claws", "swift-boots"],
    },
    s = new MatchSimulation(registry, cfg, { username: "Test" });
  s.phase = "running";
  assert.equal(s.priorityItem, "haas-claws");
  s.gold = 300;
  const step = priorityStep(s.gold, s.inventory, s.priorityItem);
  assert.notEqual(step.id, "haas-claws");
  const before = recipeQuote("haas-claws", s.inventory).remaining;
  assert.equal(s.purchaseItem(step.id), "ok");
  assert.ok(recipeQuote("haas-claws", s.inventory).remaining < before);
  s.gold = 10000;
  assert.equal(s.purchaseItem("haas-claws"), "ok");
  assert.equal(s.priorityItem, "swift-boots");
  s.prioritizeItem("blade-of-despair");
  assert.equal(s.priorityItem, "blade-of-despair");
  s.resumeBuild();
  assert.equal(s.priorityItem, "swift-boots");
  const inv = [
    "haas-claws",
    "swift-boots",
    "blade-of-despair",
    "malefic-roar",
    "windtalker",
    "golden-staff",
  ];
  assert.equal(purchaseQuote(10000, inv, "dagger").error, "equipment-full");
  assert.deepEqual(inv, [
    "haas-claws",
    "swift-boots",
    "blade-of-despair",
    "malefic-roar",
    "windtalker",
    "golden-staff",
  ]);
});
test("phase7 recipe display expands covered descendants without granting double credit", () => {
  const inv = ["regular-spear", null, null, null, null, null],
    q = recipeQuote("corrosion-scythe", inv),
    display = recipeDisplayTree(q.tree);
  assert.equal(recipeQuote("corrosion-scythe", inv).credit, q.credit);
  assert.ok(JSON.stringify(display).includes("children"));
});
test("phase9 extension saves migrate missing/outdated/malformed fields without touching wallet/profile", () => {
  const db = storage();
  db.setItem(
    "moba-lab.builds.v1:Test",
    JSON.stringify({ version: 0, heroes: {} }),
  );
  db.setItem(
    "moba-lab.history.v1:Test",
    JSON.stringify({ version: 1, matches: [{}, null, { id: "bad" }] }),
  );
  db.setItem("moba-lab.profile.v1", "original");
  const b = new BuildStore(db, "Test");
  assert.equal(b.selected("layla"), null);
  assert.equal(new HistoryStore(db, "Test").value.matches.length, 0);
  assert.equal(db.getItem("moba-lab.profile.v1"), "original");
  assert.equal(
    b.saveBuild("layla", { name: "Safe", items: ["haas-claws"] }),
    "ok",
  );
  assert.equal(db.getItem("moba-lab.profile.v1"), "original");
  const bad = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
  };
  const session = new BuildStore(bad, "Test");
  assert.equal(
    session.saveBuild("layla", { name: "Session", items: ["swift-boots"] }),
    "ok",
  );
  assert.equal(session.selected("layla").name, "Session");
  assert.equal(session.persistent, false);
});
test("phase9 history stays bounded and rejects invalid results/modes, without creating prior statistics", () => {
  const h = new HistoryStore(null, "Test"),
    c = { heroId: "layla", mode: "brawl" },
    r = {
      outcome: "Defeat",
      duration: 10,
      eliminations: 0,
      deaths: 0,
      assists: 0,
      level: 3,
    };
  for (let i = 0; i < 110; i++) h.record("id" + i, c, r, 100 + i);
  assert.equal(h.value.matches.length, 100);
  assert.equal(h.stats()[0].matches, 100);
  assert.equal(h.stats()[0].wins, 0);
  assert.equal(h.stats()[0].losses, 100);
  assert.equal(h.persistent, false);
});
test("phase9 clear manual lock/settings cancels a persistent manual approach instead of retaining a hidden pin", () => {
  const s = combat();
  s.minions = [enemy("m", "minion", 12)];
  s.syncEnemies();
  s.requestAttack("m");
  assert.equal(s.attackCommand.manualId, "m");
  s.clearManualTarget();
  assert.equal(s.attackCommand, null);
  assert.equal(s.manualTargetId, null);
});
import { AimSight } from "../src/rendering/aim-sight.js";
import * as THREE from "three";
test("all six aiming shapes produce finite range geometry from supplied ability data without changing simulation", () => {
  for (const targetShape of [
    "projectile",
    "line",
    "circle",
    "cone",
    "self-area",
    "targeted",
  ]) {
    const scene = new THREE.Scene(),
      sight = new AimSight(scene),
      p = { x: 1, z: 2, hp: 100 },
      a = {
        targetShape,
        effectId: "line-projectile",
        parameters: { radius: 2, blastRadius: 2, width: 1 },
      };
    const state = {
      player: p,
      aiming: { slot: "test", point: { x: 6, z: 2 } },
      ability: () => a,
      abilityRange: () => 8,
      direction: () => ({ x: 1, z: 0 }),
      facing: { x: 1, z: 0 },
    };
    sight.update(state);
    assert.equal(sight.group.visible, true);
    assert.ok(
      [...sight.outline.geometry.attributes.position.array].every(
        Number.isFinite,
      ),
    );
    for (const o of [sight.outline, sight.blast, sight.range]) {
      o.geometry.dispose();
      o.material.dispose();
    }
  }
});
test("manual aimed Execute hits only a valid enemy on the chosen ray and does not fall back off-ray", () => {
  const s = combat();
  s.bots = [enemy("east", "bot", 5), { ...enemy("north", "bot", 0), z: 5 }];
  s.syncEnemies();
  assert.equal(s.beginAim("battle-spell"), true);
  s.setDirectionalAim({ x: 0, z: 6 });
  const hp = s.bots[1].hp;
  assert.equal(s.releaseAim(), "cast");
  assert.ok(s.bots[1].hp < hp);
  assert.equal(s.bots[0].hp, 100000);
  const q = combat();
  q.bots = [enemy("east", "bot", 5)];
  q.syncEnemies();
  q.beginAim("battle-spell");
  q.setDirectionalAim({ x: 0, z: 6 });
  assert.equal(q.releaseAim(), "no-valid-target");
  assert.equal(q.spells.readyAt, 0);
});
test('temporary moving-body path blockage retains tower category and retries a real collision-safe route',()=>{const s=combat(),tower=enemy('tower','tower',8),body=enemy('moving-body','minion',.15);s.bots=[tower,body];s.syncEnemies();s.requestAttack(null,'tower');s.update(.05);assert.equal(s.attackCommand.filter,'tower');assert.equal(s.attackCommand.targetId,'tower');assert.equal(s.player.x,0);body.z=4;for(let n=0;n<100 &&s.lastAttack?.targetId!=='tower';n++)s.update(.05);assert.equal(s.lastAttack.reason,'fired');assert.equal(s.lastAttack.targetId,'tower');assert.equal(s.attackCommand.filter,'tower');assert.equal(s.attackController.blockedSince,null)});
test('permanent world blockage still cancels immediately, not a moving-body retry or teleport',()=>{const s=combat(),tower=enemy('tower','tower',8);s.bots=[tower];s.arena={halfSize:10,obstacles:[{x:3,z:0,width:1,depth:20}]};s.syncEnemies();s.requestAttack(null,'tower');s.update(.05);assert.equal(s.attackCommand,null);assert.equal(s.player.x,0);assert.equal(s.player.z,0)});
test('a moving body that never clears cannot create an unbounded persistent attack wait',()=>{const s=combat(),tower=enemy('tower','tower',8),body=enemy('moving-body','minion',.15);s.bots=[tower,body];s.syncEnemies();s.requestAttack(null,'tower');for(let n=0;n<70 &&s.attackCommand;n++)s.update(.05);assert.equal(s.attackCommand,null);assert.equal(s.player.x,0);assert.equal(s.player.z,0);assert.ok(s.time<=3.5)});
