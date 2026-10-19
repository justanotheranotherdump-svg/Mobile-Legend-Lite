import test from "node:test";
import assert from "node:assert/strict";
import { towerPlan } from "../src/match/tower-plan.js";
import { botDecision } from "../src/match/ai.js";
import { lane, difficulties } from "../src/match/config.js";
const actor = () => ({
  id: "ally",
  kind: "bot",
  team: "player",
  x: 0,
  z: 0,
  hp: 1000,
  maxHp: 1000,
  range: 6,
  radius: 0.5,
  laneOffset: 0,
  home: { x: -30, z: 0 },
  attributes: { physicalAttack: 100 },
});
const tower = () => ({
  id: "red",
  kind: "tower",
  team: "enemy",
  x: 12,
  z: 0,
  hp: 2000,
  maxHp: 2000,
  range: 8,
  targetable: true,
  physicalDefense: 55,
  magicDefense: 40,
  damage: 220,
  cooldown: 1.1,
});
const wave = () => ({
  id: "wave",
  kind: "minion",
  team: "player",
  x: 6,
  z: 0,
  hp: 500,
  maxHp: 500,
});
test("no-wave tower approach keeps one safe destination on both sides of the old oscillation threshold", () => {
  const a = actor(),
    t = tower();
  let goal;
  for (let i = 0; i < 30; i++) {
    a.x = i % 2 ? 1.5 : 3;
    const d = botDecision(
      a,
      [a, t],
      lane.bot,
      difficulties.normal,
      i * 0.4,
      () => 0.5,
    );
    assert.equal(d.reason, "wait-for-wave");
    goal ??= d;
    assert.equal(d.x, goal.x);
    assert.ok(Math.hypot(d.x - t.x, d.z - t.z) > t.range + 2);
  }
  assert.equal(a.lanePlan.mode, "hold");
});
test("wave must establish real interior cover; then push persists, wave loss exits immediately and new wave reforms", () => {
  const a = actor(),
    t = tower(),
    m = wave();
  assert.equal(towerPlan(a, [a, t, m], 0).covered, false);
  assert.equal(towerPlan(a, [a, t, m], 0.7).covered, true);
  a.x = 5;
  assert.equal(towerPlan(a, [a, t, m], 1).covered, true);
  m.hp = 0;
  assert.equal(towerPlan(a, [a, t, m], 1.1).covered, false);
  m.hp = 500;
  assert.equal(towerPlan(a, [a, t, m], 1.2).covered, false);
  assert.equal(towerPlan(a, [a, t, m], 1.9).covered, true);
});
test("high health can push with minions; low health and retaliation cannot keep a suicidal push", () => {
  const a = actor(),
    t = tower(),
    m = wave();
  towerPlan(a, [a, t, m], 0);
  assert.equal(towerPlan(a, [a, t, m], 1).covered, true);
  a.hp = 300;
  assert.equal(towerPlan(a, [a, t, m], 2).covered, false);
  a.hp = 1000;
  t.retaliateId = a.id;
  t.retaliateUntil = 5;
  assert.equal(towerPlan(a, [a, t, m], 3).covered, false);
  a.hp = 30;
  assert.equal(
    botDecision(a, [a, t, m], lane.bot, difficulties.normal, 4, () => 0.5).type,
    "retreat",
  );
});
test("destroyed objective releases tower plan; normal farming/fighting resumes outside enemy tower danger", () => {
  const a = actor(),
    t = tower();
  towerPlan(a, [a, t], 0);
  t.hp = 0;
  assert.equal(towerPlan(a, [a, t], 1), null);
  const e = { ...actor(), id: "foe", team: "enemy", x: 3 };
  assert.equal(
    botDecision(a, [a, e], lane.bot, difficulties.normal, 2, () => 0.5).type,
    "attack",
  );
  const m = { ...e, id: "minion", kind: "minion", hp: 10 };
  assert.equal(
    botDecision(a, [a, m], lane.bot, difficulties.normal, 3, () => 0.5)
      .targetId,
    "minion",
  );
});
test("no-wave coordinated siege is permitted only with actual healthy team DPS and a conservative tank budget", () => {
  const t = tower();
  const team = Array.from({ length: 3 }, (_, i) => ({
    ...actor(),
    id: "siege" + i,
    x: 2,
    z: i * 0.3,
    hp: 4000,
    maxHp: 4000,
    damage: 400,
    attackRate: 1.4,
    speed: 5.5,
  }));
  const a = team[0];
  assert.equal(towerPlan(a, [...team, t], 0).covered, true);
  assert.equal(a.lanePlan.reason, "calculated-team-siege");
  team[1].hp = 100;
  assert.equal(towerPlan(a, [...team, t], 0.4).covered, false);
  assert.equal(a.lanePlan.reason, "wait-for-wave");
});
import { settingsMarkup } from "../src/ui/settings-panel.js";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
const registry = await loadSourceHeroRegistry();
test("Cheats is the final real Settings tab only for matches, with exactly one Gold action", () => {
  assert.ok(!settingsMarkup().includes("cheat-add-gold"));
  const html = settingsMarkup({ cheats: true }),
    tabs = [...html.matchAll(/data-settings-tab="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(tabs.at(-1), "cheats");
  assert.equal((html.match(/id="cheat-add-gold"/g) || []).length, 1);
  assert.match(html, /Add \+9999 Gold/);
});
test("development Gold is additive, repeatable and spent by the ordinary shop; never alters earned income or NPCs", () => {
  const s = new MatchSimulation(
    registry,
    createMatchConfig("brawl", "normal", 1),
    { username: "Gold_Test" },
  );
  assert.equal(s.addDevelopmentGold(), "match-not-running");
  s.update(3.01);
  const before = s.gold,
    npc = s.snapshot().enemies.filter((a) => a.kind === "bot");
  const earned = s.stats.goldEarned;
  assert.equal(s.addDevelopmentGold(), "ok");
  assert.equal(s.gold, before + 9999);
  assert.equal(s.purchaseItem("dagger"), "ok");
  const afterPurchase = s.gold;
  s.paused = true;
  assert.equal(s.addDevelopmentGold(), "ok");
  assert.equal(s.gold, afterPurchase + 9999);
  assert.equal(s.developmentGoldGranted, 19998);
  assert.equal(s.stats.goldEarned, earned);
  assert.equal(s.roleEquipment.progressGold, 0);
  assert.deepEqual(
    s.snapshot().enemies.filter((a) => a.kind === "bot"),
    npc,
  );
  s.phase = "ended";
  assert.equal(s.addDevelopmentGold(), "match-not-running");
});

test("covered pushes keep their objective but still defend against a recent in-range hero attacker", () => {
  const a = actor(),
    t = tower(),
    m = wave();
  a.x = 6;
  const foe = { ...actor(), id: "duelist", team: "enemy", x: 8 };
  const actors = [a, t, m, foe];
  botDecision(a, actors, lane.bot, difficulties.normal, 0, () => 0.5);
  assert.equal(
    botDecision(a, actors, lane.bot, difficulties.normal, 1, () => 0.5)
      .targetId,
    t.id,
  );
  a.contributors = { [foe.id]: 1 };
  assert.equal(
    botDecision(a, actors, lane.bot, difficulties.normal, 1.1, () => 0.5)
      .targetId,
    foe.id,
  );
  assert.equal(
    botDecision(a, actors, lane.bot, difficulties.normal, 3, () => 0.5)
      .targetId,
    t.id,
  );
});
