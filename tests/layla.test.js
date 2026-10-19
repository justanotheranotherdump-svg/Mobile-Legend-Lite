import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  loadSourceHeroRegistry,
  readHeroFiles,
} from "../scripts/lib/hero-files.mjs";
import { discoverHeroPacks, validateHeroPack } from "../src/heroes/registry.js";
import { HeroCombatSimulation } from "../src/simulation/hero-combat.js";
import {
  segmentCircle,
  segmentBox,
  distanceMultiplier,
  canActorAct,
} from "../src/simulation/skill-geometry.js";
import { moveEntity } from "../src/simulation/movement.js";
import { createHeroVisual } from "../src/rendering/heroes/hero-visual.js";
import { Box3 } from "three";
const registry = await loadSourceHeroRegistry();
const hero = registry.get("layla");
const arena = { halfSize: 30, obstacles: [] };
const enemy = (id, x, z, hp = 1000, extra = {}) => ({
  id,
  name: id,
  x,
  z,
  hp,
  maxHp: hp,
  radius: 0.45,
  team: "enemy",
  targetable: true,
  physicalDefense: 0,
  magicDefense: 0,
  ...extra,
});
function sim(enemies = [enemy("a", 0, 5)], customArena = arena) {
  const s = new HeroCombatSimulation(
    customArena,
    {
      player: { heroId: "layla", x: 0, z: 0 },
      targeting: { defaultMode: "nearest" },
      dummies: enemies,
    },
    registry,
  );
  learnKit(s);
  return s;
}
// Explicit level-4/rank-1 setup for the existing geometry/control regressions.
// Fresh level-1/XP/skill-point behavior is tested in progression.test.js.
function learnKit(s) {
  s.setPracticeLevel(4);
  for (const slot of ['skill-1','skill-2','skill-ultimate']) assert.equal(s.upgradeSkill(slot), 'upgraded');
}
function step(s, t) {
  for (let i = 0; i < Math.round(t * 120); i++) s.update(1 / 120);
}
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const aim = { x: 0, z: 10 };

test("roster is only approved Layla plus explicitly preserved historical fixture", () => {
  assert.deepEqual(registry.ids(), ["layla", "training"]);
  assert.equal(hero.abilities.length, 4);
  assert.equal(registry.get("training").abilities.length, 0);
});
test("reference stats replace prototype numbers; movement conversion and collider preserved", () => {
  assert.equal(hero.baseStats.maxHp, 2250);
  assert.equal(hero.baseStats.movementSpeed, 240);
  assert.equal(hero.baseStats.collisionRadius, 0.45);
  assert.equal(hero.basicAttack.damage, 0);
  assert.equal(hero.basicAttack.range, 6);
  assert.equal(hero.basicAttack.cooldown, 1 / 1.06);
  assert.equal(sim().player.mana, 800);
});
test("passive close/intermediate/reference/beyond, turret and tower exclusion", () => {
  const p = hero.abilities[0].parameters,
    a = { x: 0, z: 0 };
  for (const [z, k] of [
    [0, 1],
    [3, 1.075],
    [6, 1.15],
    [60, 1.15],
  ])
    near(distanceMultiplier(a, { x: 0, z }, p), k);
  near(distanceMultiplier(a, { x: 0, z: 6, kind: "turret" }, p), 1);
  near(distanceMultiplier(a, { x: 0, z: 6, type: "tower" }, p), 1);
});
test("ranged basic travels authoritatively, damages once on collision, passive once, no chasing", () => {
  const s = sim();
  assert.equal(s.attack(), "fired");
  assert.equal(s.enemies[0].hp, 1000);
  step(s, 0.3);
  assert.ok(s.projectiles.length);
  assert.equal(s.hits, 0);
  step(s, 0.6);
  near(s.enemies[0].hp, 1000 - 158.5 * 1.125);
  assert.equal(s.hits, 1);
  near(s.player.z, 0);
  assert.equal(s.projectiles.length, 0);
});
test("basics respect cooldown, dead/untargetable/ally/invalid pins and range", () => {
  const s = sim([
    enemy("near", 0, 5),
    enemy("far", 0, 20),
    enemy("ally", 0, 2, 1000, { team: "player" }),
    enemy("hidden", 0, 1, 1000, { targetable: false }),
  ]);
  assert.equal(s.attack("far"), "range");
  assert.equal(s.manualTargetId, "far");
  assert.equal(s.attack("ally"), "invalid-target");
  assert.equal(s.attack("hidden"), "invalid-target");
  assert.equal(s.attack("near"), "fired");
  assert.equal(s.attack(), "cooldown");
  s.player.hp = 0;
  assert.equal(s.attack(), "cannot-act");
});
test("swept projectile catches first valid enemy even in large time step, ignores allies/dead/hidden", () => {
  const s = sim([
    enemy("ally", 0, 1, 1000, { team: "player" }),
    enemy("dead", 0, 2, 0),
    enemy("hidden", 0, 2.5, 1000, { targetable: false }),
    enemy("first", 0, 3),
    enemy("second", 0, 6),
  ]);
  s.cast("skill-1", aim);
  s.update(0.5);
  near(s.enemies[3].hp, 1000 - 306.8 * 1.075);
  near(s.enemies[4].hp, 1000);
  assert.equal(s.projectiles.length, 0);
  assert.ok(s.buff);
});
test("S1 success grants exactly timed movement/basic/S2 range buffs, with expiry/reset", () => {
  const s = sim();
  s.cast("skill-1", aim);
  step(s, 1);
  assert.ok(s.buff);
  near(s.player.speed, 6.6);
  near(s.player.range, 8);
  near(s.abilityRange(s.ability("skill-2")), 9);
  step(s, 3.1);
  near(s.player.speed, 5.5);
  near(s.player.range, 6);
  assert.equal(s.buff, null);
  s.reset();
  assert.equal(s.buff, null);
});
test("S1 miss does not grant buffs and leaves pinned target/aim untouched", () => {
  const s = sim();
  s.prioritizeTarget("a");
  assert.equal(s.cast("skill-1", { x: 10, z: 0 }), "cast");
  step(s, 1.2);
  near(s.enemies[0].hp, 1000);
  assert.equal(s.buff, null);
  assert.equal(s.manualTargetId, "a");
});
test("S1 muzzle sweep catches close targets; newly approved shots pass through walls", () => {
  const s = sim([enemy("close", 0, 0.8)]);
  s.cast("skill-1", aim);
  step(s, 0.5);
  assert.ok(s.enemies[0].hp < 1000);
  const w = sim([enemy("far", 0, 5)], {
    ...arena,
    obstacles: [{ x: 0, z: 0.8, width: 2, depth: 0.2 }],
  });
  w.cast("skill-1", aim);
  step(w, 1);
  near(w.enemies[0].hp, 1000-306.8*1.125);
  assert.ok(w.buff);
});
test("basic locked projectile passes walls and damages only on authoritative contact", () => {
  const s = sim(undefined, {
    ...arena,
    obstacles: [{ x: 0, z: 3, width: 2, depth: 0.2 }],
  });
  s.attack();
  step(s, 1);
  near(s.enemies[0].hp, 1000-158.5*1.125);
  assert.equal(s.hits, 1);
});
test("S2 detonates at intended destination with area damage and visible tracked mark", () => {
  const s = sim([
    enemy("a", 1.5, 5),
    enemy("b", -1.5, 5),
    enemy("outside", 4, 5),
  ]);
  s.cast("skill-2", { x: 0, z: 5 });
  step(s, 1);
  for (const e of s.enemies.slice(0, 2)) {
    assert.ok(e.hp < 1000);
    assert.ok(e.mark.until > s.time);
  }
  near(s.enemies[2].hp, 1000);
  assert.equal(s.projectiles.length, 0);
});
test("S2 detonates on first enemy, not through to another distant target", () => {
  const s = sim([enemy("a", 0, 3), enemy("b", 0, 8)]);
  s.cast("skill-2", aim);
  step(s, 1);
  assert.ok(s.enemies[0].mark);
  near(s.enemies[1].hp, 1000);
});
test("S2 destination stays fixed and casting movement is now animation-locked", () => {
  const s = sim([]);
  s.cast("skill-2", { x: 0, z: 5 });
  s.update(0.25, 1, 0);
  near(s.projectiles[0].end.x, 0);
  near(s.projectiles[0].end.z, 5);
});
test("marks expire without proc; expired marked target takes no bonus", () => {
  const s = sim();
  s.cast("skill-2", aim);
  step(s, 5);
  assert.equal(s.enemies[0].mark, undefined);
  const hp = s.enemies[0].hp;
  s.attack();
  step(s, 1);
  near(hp - s.enemies[0].hp, 158.5 * 1.125);
  assert.equal(s.enemies[0].stunned, false);
});
test("marked basic consumes once; bonus and base share a single passive multiplier, nearby stun expires", () => {
  const s = sim([enemy("a", 0, 5), enemy("b", 1, 5), enemy("c", 5, 5)]);
  s.enemies[0].mark = { until: 10 };
  s.attack("a");
  step(s, 0.5);
  near(s.enemies[0].hp, 1000 - (158.5 + 80) * 1.125);
  assert.equal(s.enemies[0].mark, undefined);
  assert.equal(s.enemies[0].stunned, true);
  assert.equal(s.enemies[1].stunned, true);
  assert.ok(!s.enemies[2].stunned);
  assert.equal(canActorAct(s.enemies[1]), false);
  step(s, 1);
  assert.equal(canActorAct(s.enemies[1]), true);
});
test("stun is an enforced movement/action status, not just a VFX ring", () => {
  const e = { ...enemy("a", 0, 0), speed: 5, stunned: true };
  moveEntity(e, { x: 1, z: 0 }, 1, arena);
  near(e.x, 0);
  assert.equal(canActorAct(e), false);
  e.stunned = false;
  moveEntity(e, { x: 1, z: 0 }, 1, arena);
  near(e.x, 5);
});
test("S2 mark-trigger damage cannot recursively trigger same event, survivor receives one new timed mark", () => {
  const s = sim();
  let triggers = 0;
  s.events.subscribe((e) => {
    if (e.type === "mark-trigger") triggers++;
  });
  s.enemies[0].mark = { until: 10 };
  s.cast("skill-2", aim);
  step(s, 1);
  near(s.enemies[0].hp, 1000 - (253.025 + 80) * 1.125);
  assert.equal(triggers, 1);
  assert.ok(s.enemies[0].mark);
});
test("ultimate covers wide line, all valid enemies exactly once, excludes outside/dead/friendly", () => {
  const s = sim([
    enemy("a", 0, 3),
    enemy("b", 0.9, 6),
    enemy("c", 0, 11),
    enemy("side", 3, 5),
    enemy("far", 0, 14),
    enemy("ally", 0, 4, 1000, { team: "player" }),
  ]);
  s.cast("skill-ultimate", aim);
  step(s, 1);
  near(s.enemies[0].hp, 1000 - 687.75 * 1.075);
  near(s.enemies[1].hp, 1000 - 687.75 * 1.15);
  near(s.enemies[2].hp, 1000 - 687.75 * 1.15);
  for (const e of s.enemies.slice(3)) near(e.hp, 1000);
  const hp = s.enemies[0].hp;
  step(s, 1);
  near(s.enemies[0].hp, hp);
});
test("passive excludes turrets for basic AND all three offensive abilities", () => {
  for (const slot of ["basic", "skill-1", "skill-2", "skill-ultimate"]) {
    const s = sim([enemy("a", 0, 5, 1000, { kind: "turret" })]);
    slot === "basic" ? s.attack() : s.cast(slot, aim);
    step(s, 1.5);
    near(
      s.enemies[0].hp,
      1000 -
        { basic: 158.5, "skill-1": 306.8, "skill-2": 253.025, "skill-ultimate": 687.75 }[slot],
    );
  }
});
test("cast invalid aim/death/mana/cooldown/concurrent windup are rejected without double charges", () => {
  const s = sim();
  for (const a of [
    { x: NaN, z: 0 },
    { x: Infinity, z: 0 },
    { x: 0, z: 0 },
  ])
    assert.equal(s.cast("skill-1", a), "invalid-aim");
  assert.equal(s.player.mana, 800);
  assert.equal(s.cast("missing", aim), "invalid-ability");
  assert.equal(s.cast("passive", aim), "invalid-ability");
  s.player.mana = 19;
  assert.equal(s.cast("skill-1", aim), "mana");
  s.player.mana = 800;
  s.player.hp = 0;
  assert.equal(s.cast("skill-1", aim), "cannot-act");
  s.player.hp = 100;
  assert.equal(s.cast("skill-1", aim), "cast");
  near(s.player.mana, 765);
  assert.equal(s.cast("skill-1", aim), "cooldown");
  assert.equal(s.cast("skill-2", aim), "casting");
  near(s.player.mana, 765);
});
test("mana regenerates/caps; per-skill cooldowns expire; reset clears all authoritative state", () => {
  const s = sim();
  s.cast("skill-1", aim);
  step(s, 1);
  near(s.player.mana, 769.6);
  assert.ok(s.cooldowns["malefic-bomb"] > 0);
  step(s, 10);
  near(s.cooldowns["malefic-bomb"], 0);
  near(s.player.mana, 800);
  s.enemies[0].mark = { until: 20 };
  s.enemies[0].stunned = true;
  s.reset();
  assert.deepEqual(s.cooldowns, {});
  assert.equal(s.player.mana, 500);
  assert.equal(s.enemies[0].mark, undefined);
  assert.equal(s.projectiles.length, 0);
  assert.equal(s.pending.length, 0);
  assert.equal(s.buff, null);
  assert.equal(s.aim, null);
});
test("death cancels pending casts/projectiles and movement; reset restores action", () => {
  const s = sim();
  s.cast("skill-ultimate", aim);
  s.player.hp = 0;
  s.update(1, 1, 1);
  near(s.enemies[0].hp, 1000);
  near(s.player.x, 0);
  near(s.player.z, 0);
  assert.equal(s.pending.length, 0);
  s.reset();
  learnKit(s);
  assert.equal(s.cast("skill-1", aim), "cast");
});
test("death event only once and real victim/pin cleared on ability kill", () => {
  const s = sim([enemy("a", 0, 4, 20)]);
  let deaths = 0;
  s.events.subscribe((e) => {
    if (e.type === "death") deaths++;
  });
  s.prioritizeTarget("a");
  s.cast("skill-ultimate", aim);
  step(s, 1);
  assert.equal(deaths, 1);
  assert.equal(s.manualTargetId, null);
  near(s.enemies[0].hp, 0);
});
test("target priority/manual pins are independent of directional skill aim", () => {
  const s = sim([enemy("a", 0, 5), enemy("b", 5, 0, 50)]);
  s.setTargetMode("current-hp");
  assert.equal(s.selectedTargetId, "b");
  s.prioritizeTarget("a");
  s.setAim({ x: 5, z: 0 });
  s.cast("skill-1",{x:5,z:0});
  step(s, 1);
  near(s.enemies[0].hp, 1000);
  assert.ok(s.enemies[1].hp < 50);
  assert.equal(s.manualTargetId, "a");
});
test("swept geometry handles tangent/start overlap/zero segment/box and misses", () => {
  assert.equal(
    segmentCircle({ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 0, z: 5, radius: 1 }),
    0.4,
  );
  assert.equal(
    segmentCircle({ x: 0, z: 0 }, { x: 0, z: 0 }, { x: 0, z: 0, radius: 1 }),
    0,
  );
  assert.equal(
    segmentCircle({ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 3, z: 5, radius: 1 }),
    null,
  );
  assert.equal(
    segmentBox(
      { x: 0, z: 0 },
      { x: 0, z: 10 },
      { x: 0, z: 5, width: 2, depth: 2 },
    ),
    0.4,
  );
});
test("new schema rejects executable/unknown fields, invalid parameters and missing/duplicate slots", async () => {
  const f = await readHeroFiles(),
    original = discoverHeroPacks(f.json, f.assets).find(
      (p) => p.hero.id === "layla",
    );
  for (const mutate of [
    (p) => (p.abilities[1].parameters.speed = 0),
    (p) => (p.abilities[1].parameters.script = "eval()"),
    (p) => (p.abilities[1].effectId = "constructor"),
    (p) => (p.abilities[1].slot = "passive"),
    (p) => p.abilities.pop(),
    (p) => (p.hero.baseStats.manaRegen = NaN),
    (p) => (p.hero.basicAttack.projectileSpeed = -1),
  ]) {
    const p = structuredClone(original);
    mutate(p);
    assert.throws(() => validateHeroPack(p));
  }
});
test("approved GLB immutable; actual loader, clip/bounds and honest idle/death behavior", async () => {
  const bytes = registry.modelBytes("layla");
  assert.equal(bytes.length, 64808);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51",
  );
  const warnings = [],
    visual = await createHeroVisual(hero, bytes, {
      warn: (m) => warnings.push(m),
    });
  assert.equal(visual.status, "glb");
  assert.deepEqual(warnings, []);
  assert.deepEqual(visual.diagnostics().clips, ["Walk", "Shoot"]);
  let bones = 0,
    meshes = 0,
    triangles = 0;
  visual.root.traverse((o) => {
    if (o.isBone) bones++;
    if (o.isMesh) {
      meshes++;
      triangles +=
        (o.geometry.index?.count || o.geometry.attributes.position.count) / 3;
    }
  });
  assert.equal(bones, 0);
  assert.equal(meshes, 8);
  assert.equal(triangles, 396);
  const bounds = new Box3().setFromObject(visual.root);
  near(bounds.min.y, 0);
  near(bounds.max.y - bounds.min.y, 1.96);
  visual.update(0.3, "move");
  assert.equal(visual.diagnostics().current, "Walk");
  visual.update(0.01, "idle");
  assert.equal(visual.diagnostics().current, null);
  visual.play("cast", true);
  visual.update(0.25, "idle");
  assert.equal(visual.diagnostics().current, "Shoot");
  const muzzle = visual.muzzlePosition();
  assert.ok(muzzle.z > 1.3 && muzzle.y > 0.8);
  visual.update(2, "idle");
  visual.update(0.01, "idle");
  assert.equal(visual.diagnostics().current, null);
  visual.play("basicAttack", true);
  visual.update(0.1, "dead");
  assert.equal(visual.diagnostics().current, null);
  visual.reset();
  assert.equal(visual.diagnostics().oneShot, false);
});

test("invalid explicit null aim is rejected; returned snapshots cannot mutate authoritative vectors", () => {
  const s = sim();
  assert.equal(s.cast("skill-1", null), "invalid-aim");
  s.cast("skill-1", aim);
  step(s, 0.3);
  const snap = s.snapshot();
  snap.facing.x = 99;
  snap.projectiles[0].end.x = 99;
  assert.notEqual(s.currentFacing().x, 99);
  assert.notEqual(s.projectiles[0].end.x, 99);
});
test("projectile travel uses only post-windup time; freely aimed sight can pass arena walls", () => {
  const s = sim([]);
  s.cast("skill-1", aim);
  s.update(0.25);
  near(s.projectiles[0].z, 1.53);
  const w = sim([], { halfSize: 3, obstacles: [] });
  let end;
  w.events.subscribe((e) => {
    if (e.type === "impact") end = e.point;
  });
  w.cast("skill-1", aim);
  step(w, 1);
  assert.equal(w.projectiles.length, 0);
  near(end.z, 9);
});
test("ultimate does not hit a target behind caster", () => {
  const s = sim([enemy("behind", 0, -0.2)]);
  s.cast("skill-ultimate", aim);
  step(s, 1);
  near(s.enemies[0].hp, 1000);
});
test("VFX adapter is read-only, resets/disposes all presentation objects without changing combat", async () => {
  const { CombatVfx } = await import("../src/rendering/combat-vfx.js");
  const { Scene } = await import("three");
  const s = sim(),
    scene = new Scene(),
    vfx = new CombatVfx(scene, s);
  s.cast("skill-1", aim);
  step(s, 0.3);
  const before = s.snapshot();
  vfx.update();
  assert.deepEqual(s.snapshot(), before);
  assert.ok(scene.children.length > 0);
  assert.equal(vfx.diagnostics().projectiles, 1);
  step(s, 1);
  const after = s.snapshot();
  vfx.update();
  assert.deepEqual(s.snapshot(), after);
  s.reset();
  assert.equal(scene.children.length, 0);
  assert.equal(vfx.diagnostics().projectiles, 0);
});
