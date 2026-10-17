import test from "node:test";
import assert from "node:assert/strict";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { HeroCombatSimulation } from "../src/simulation/hero-combat.js";
import { createHeroVisual } from "../src/rendering/heroes/hero-visual.js";
const registry = await loadSourceHeroRegistry();
const enemy = (id, x, z, hp = 1000, maxHp = hp, extra = {}) => ({
  id,
  name: id,
  x,
  z,
  hp,
  maxHp,
  team: "enemy",
  radius: 0.45,
  targetable: true,
  ...extra,
});
const sim = (enemies = [enemy("a", 0, 5)], obstacles = []) =>
  new HeroCombatSimulation(
    { halfSize: 30, obstacles },
    {
      player: { heroId: "layla", x: 0, z: 0 },
      targeting: { defaultMode: "nearest" },
      dummies: enemies,
    },
    registry,
  );
const step = (s, t, h = 0, v = 0) => {
  for (let i = 0; i < Math.round(t * 120); i++) s.update(1 / 120, h, v);
};
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-6, `${a} != ${b}`);

test("movement is locked throughout real Shoot, held WASD resumes after complete clip", async () => {
  const s = sim(),
    visual = await createHeroVisual(
      registry.get("layla"),
      registry.modelBytes("layla"),
    );
  visual.play("basicAttack", true);
  s.attack();
  step(s, 1, 1, 0);
  near(s.player.x, 0);
  near(s.player.z, 0);
  assert.equal(s.isActionLocked(), true);
  visual.update(1, "idle");
  assert.equal(visual.diagnostics().oneShot, true);
  step(s, 0.2, 1, 0);
  assert.equal(s.isActionLocked(), false);
  assert.ok(s.player.x > 0.4);
});
test("all 3 skills stop movement for the complete cast animation, not just windup", () => {
  for (const slot of ["skill-1", "skill-2", "skill-ultimate"]) {
    const s = sim();
    s.cast(slot);
    step(s, 1, 1, 1);
    near(s.player.x, 0);
    near(s.player.z, 0);
    step(s, 0.2, 1, 0);
    assert.ok(s.player.x > 0);
  }
});
test("ready cooldown cannot restart/extend an unfinished animation", () => {
  const s = sim();
  s.attack();
  step(s, 0.7);
  near(s.player.cooldown, 0);
  assert.equal(s.attack(), "animation");
  const before = s.player.mana;
  assert.equal(s.cast("skill-2"), "animation");
  near(s.player.mana, before);
  near(s.lockUntil, 1.05);
});
test("basic lock homes to moving target, passes walls and other enemies, hits exactly once", () => {
  const s = sim(
    [enemy("decoy", 0, 2), enemy("locked", 0, 5)],
    [{ x: 0, z: 3, width: 2, depth: 1 }],
  );
  assert.equal(s.attack("locked"), "fired");
  step(s, 0.3, 1, 0);
  s.enemies[1].x = 5;
  s.enemies[1].z = 8;
  step(s, 1);
  assert.ok(s.enemies[1].hp < 1000);
  near(s.enemies[0].hp, 1000);
  assert.equal(s.hits, 1);
  step(s, 2);
  assert.equal(s.hits, 1);
});
test("range is checked on acceptance, never bypassed on new attack, valid locked shot follows beyond range", () => {
  const s = sim([enemy("a", 0, 5)]);
  s.attack();
  s.enemies[0].z = 12;
  step(s, 2);
  assert.equal(s.hits, 1);
  assert.equal(s.attack("a"), "range");
});
test("invalid/dead/untargetable locked target cancels shot with no retarget damage", () => {
  for (const field of ["hp", "targetable", "team"]) {
    const s = sim([enemy("a", 0, 5), enemy("b", 0, 4)]);
    s.attack("a");
    step(s, 0.3);
    if (field === "hp") s.enemies[0].hp = 0;
    else if (field === "targetable") s.enemies[0].targetable = false;
    else s.enemies[0].team = "player";
    step(s, 1);
    near(s.enemies[1].hp, 1000);
    assert.equal(s.hits, 0);
    assert.equal(s.projectiles.length, 0);
  }
});
test("tap auto-cast uses each skill range, not old mouse aim or basic range", () => {
  const s = sim([enemy("a", 0, 8)]);
  s.setAim({ x: 10, z: 0 });
  assert.equal(s.selectedTarget, null);
  assert.equal(s.cast("skill-1"), "cast");
  assert.equal(s.pending[0].targetId, "a");
  step(s, 1);
  assert.ok(s.enemies[0].hp < 1000);
});
test("tap obeys Settings nearest/current HP/HP percentage, stable ties and manual pins", () => {
  for (const [mode, expected] of [
    ["nearest", "a"],
    ["current-hp", "b"],
    ["hp-percent", "c"],
  ]) {
    const s = sim([
      enemy("a", 0, 3, 200),
      enemy("b", 2, 4, 90, 120),
      enemy("c", 0, 6, 120, 400),
    ]);
    s.setTargetMode(mode);
    assert.equal(s.cast("skill-1"), "cast");
    assert.equal(s.pending[0].targetId, expected);
  }
  const s = sim([enemy("a", 0, 5), enemy("b", 0, 3)]);
  s.prioritizeTarget("a");
  s.cast("skill-2");
  assert.equal(s.pending[0].targetId, "a");
});
test("no eligible auto target never spends mana or cooldown; out-of-range pin never silently switches", () => {
  const s = sim([enemy("a", 0, 20), enemy("b", 0, 4)]);
  s.prioritizeTarget("a");
  assert.equal(s.cast("skill-1"), "no-target");
  near(s.player.mana, 100);
  assert.deepEqual(s.cooldowns, {});
  assert.equal(s.pending.length, 0);
  assert.equal(s.isActionLocked(), false);
});
test("aim preview has no costs, cancellation has no effect and release casts exactly once", () => {
  const s = sim();
  assert.equal(s.beginAim("skill-1"), true);
  s.setAim({ x: 5, z: 0 });
  near(s.player.mana, 100);
  assert.equal(s.pending.length, 0);
  s.cancelAim();
  near(s.player.mana, 100);
  assert.deepEqual(s.cooldowns, {});
  assert.equal(s.releaseAim(), "cancelled");
  s.beginAim("skill-1");
  s.setAim({ x: 0, z: 5 });
  assert.equal(s.releaseAim(), "cast");
  near(s.player.mana, 80);
  assert.equal(s.releaseAim(), "cancelled");
  near(s.player.mana, 80);
});
test("manual hold aim may override pin; enemy under sight locks and homes, ground aim never auto-retargets", () => {
  const s = sim([enemy("a", 0, 5), enemy("b", 5, 0)]);
  s.prioritizeTarget("a");
  s.beginAim("skill-1");
  s.setAim({ x: 5, z: 0 });
  s.releaseAim();
  assert.equal(s.pending[0].targetId, "b");
  s.enemies[1].z = 3;
  step(s, 1);
  near(s.enemies[0].hp, 1000);
  assert.ok(s.enemies[1].hp < 1000);
  const q = sim();
  q.beginAim("skill-1");
  q.setAim({ x: -9, z: 0 });
  q.releaseAim();
  assert.equal(q.pending[0].targetId, null);
  step(q, 1);
  near(q.enemies[0].hp, 1000);
});
test("auto S1/S2 home through objects, ultimate adjusts to locked target at firing instant", () => {
  for (const slot of ["skill-1", "skill-2", "skill-ultimate"]) {
    const s = sim([enemy("a", 0, 5)], [{ x: 0, z: 2, width: 10, depth: 1 }]);
    s.cast(slot);
    s.enemies[0].x = 3;
    step(s, 1);
    assert.ok(s.enemies[0].hp < 1000);
  }
});
test("hover aim no longer controls facing; movement, active aim and shot determine facing", () => {
  const s = sim();
  s.setAim({ x: 10, z: 0 });
  assert.deepEqual(s.currentFacing(), { x: 0, z: 1 });
  step(s, 0.1, 1, 0);
  near(s.currentFacing().x, Math.SQRT1_2);
  near(s.currentFacing().z, -Math.SQRT1_2);
  s.beginAim("skill-1");
  s.setAim({ x: s.player.x, z: s.player.z + 8 });
  near(s.currentFacing().z, 1);
  s.cancelAim();
  near(s.currentFacing().z, -Math.SQRT1_2);
  s.attack();
  assert.ok(s.currentFacing().z > 0);
});
test("reset/death clears preview/action lock and all targeted projectile state", () => {
  const s = sim();
  s.beginAim("skill-1");
  s.reset();
  assert.equal(s.aiming, null);
  assert.equal(s.isActionLocked(), false);
  s.attack();
  s.player.hp = 0;
  step(s, 0.4, 1, 0);
  assert.equal(s.projectiles.length, 0);
  assert.equal(s.pending.length, 0);
  s.reset();
  assert.equal(s.firingTargetId, null);
  near(s.player.mana, 100);
});
