import { heroRegistry } from './helpers/heroes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TrainingSimulation } from '../src/simulation/game.js';
import { TARGET_MODES, isEligibleEnemy, selectAutomaticTarget } from '../src/simulation/targeting.js';
const config = JSON.parse(readFileSync(new URL('../src/data/training.json', import.meta.url)));
const arena = { halfSize: 100, obstacles: [] };
function setup() {
  const sim = new TrainingSimulation(arena, config, heroRegistry);
  Object.assign(sim.player, { x: -1.5, z: 1.5 });
  sim.refreshTarget();
  return sim;
}
const enemy = (id, x, z, hp = 100, maxHp = 200) => ({ id, x, z, hp, maxHp, radius: 0.65, team: 'enemy', targetable: true });

for (const [mode, expected] of [['nearest', 'dummy-a'], ['current-hp', 'dummy-b'], ['hp-percent', 'dummy-c'], ['manual', 'dummy-a']]) {
  test(`${TARGET_MODES[mode]} selects ${expected} from meaningful training data`, () => {
    const sim = setup();
    sim.setTargetMode(mode);
    assert.equal(sim.selectedTargetId, expected);
    assert.equal(sim.manualTargetId, null);
  });
}

test('only valid, living, targetable enemy units qualify', () => {
  const valid = enemy('valid', 1, 0);
  for (const patch of [{ hp: 0 }, { hp: -1 }, { hp: NaN }, { hp: Infinity }, { maxHp: 0 }, { maxHp: Infinity }, { x: NaN }, { z: Infinity }, { team: 'ally' }, { targetable: false }, { id: '' }]) {
    assert.equal(isEligibleEnemy({ ...valid, ...patch }), false, JSON.stringify(patch));
  }
  assert.equal(isEligibleEnemy(null), false);
  assert.equal(isEligibleEnemy(valid), true);
});

for (const mode of Object.keys(TARGET_MODES)) {
  test(`${mode}: in-range eligible target is preferred to an out-of-range lower-HP unit`, () => {
    const player = { x: 0, z: 0, range: 6 };
    const enemies = [enemy('distant', 7, 0, 1, 1000), enemy('local', 3, 0, 150, 200)];
    assert.equal(selectAutomaticTarget(player, enemies, mode)?.id, 'local');
    assert.equal(selectAutomaticTarget(player, [enemies[0]], mode), null);
  });
}

for (const mode of Object.keys(TARGET_MODES)) {
  test(`${mode}: ties use distance then stable ID, independent of array order`, () => {
    const player = { x: 0, z: 0, range: 6 };
    const list = [enemy('z', 2, 0), enemy('b', -1, 0), enemy('a', 1, 0)];
    const original = structuredClone(list);
    assert.equal(selectAutomaticTarget(player, list, mode).id, 'a');
    assert.equal(selectAutomaticTarget(player, [...list].reverse(), mode).id, 'a');
    assert.deepEqual(list, original, 'selector must not reorder/mutate simulation array');
  });
}

test('manual click overrides each auto mode and ground attacks preserve that lock', () => {
  for (const mode of ['nearest', 'current-hp', 'hp-percent']) {
    const sim = setup();
    sim.setTargetMode(mode);
    assert.equal(sim.attack('dummy-a'), 'hit');
    assert.equal(sim.manualTargetId, 'dummy-a');
    sim.update(0.65);
    assert.equal(sim.selectedTargetId, 'dummy-a');
    assert.equal(sim.attack(), 'hit');
    assert.equal(sim.lastAttack.targetId, 'dummy-a');
  }
});

test('Manual Target mode pins a specific target and reselects nearest after death', () => {
  const sim = setup();
  sim.setTargetMode('manual');
  sim.attack('dummy-c');
  assert.equal(sim.selectedTargetId, 'dummy-c');
  for (let i = 0; i < 4; i++) { sim.update(0.65); sim.attack(); }
  assert.equal(sim.enemies[2].hp, 0);
  assert.equal(sim.manualTargetId, null);
  assert.equal(sim.selectedTargetId, 'dummy-a');
});

test('changing modes or clearing a lock returns to that automatic policy without resetting cooldown', () => {
  const sim = setup();
  sim.attack('dummy-a');
  sim.setTargetMode('hp-percent');
  assert.equal(sim.manualTargetId, null);
  assert.equal(sim.selectedTargetId, 'dummy-c');
  assert.equal(sim.player.cooldown, 0.65);
  sim.prioritizeTarget('dummy-b');
  sim.clearManualTarget();
  assert.equal(sim.selectedTargetId, 'dummy-c');
});

test('dead/invalid target is never selected; invalid direct clicks do not damage another enemy', () => {
  const sim = setup();
  sim.prioritizeTarget('dummy-b');
  sim.enemies[1].hp = 0;
  sim.update(1 / 60);
  assert.equal(sim.manualTargetId, null);
  assert.equal(sim.selectedTargetId, 'dummy-a');
  const before = sim.enemies.map(enemy => enemy.hp);
  assert.equal(sim.attack('dummy-b'), 'dead');
  assert.equal(sim.attack('no-such-enemy'), 'invalid-target');
  assert.deepEqual(sim.enemies.map(enemy => enemy.hp), before);
  sim.prioritizeTarget('dummy-a');
  sim.enemies[0].targetable = false;
  sim.refreshTarget();
  assert.equal(sim.selectedTargetId, 'dummy-c');
});

test('target removed from the registry releases the pin and falls back using the active mode', () => {
  const sim = setup();
  sim.setTargetMode('current-hp');
  sim.prioritizeTarget('dummy-a');
  sim.enemies.shift();
  sim.refreshTarget();
  assert.equal(sim.manualTargetId, null);
  assert.equal(sim.selectedTargetId, 'dummy-b');
});

test('automatic killing blow immediately reselects according to each policy', () => {
  for (const mode of ['nearest', 'current-hp', 'hp-percent']) {
    const sim = setup();
    sim.setTargetMode(mode);
    const first = sim.selectedTargetId;
    sim.selectedTarget.hp = 1;
    sim.attack();
    assert.equal(sim.enemies.find(enemy => enemy.id === first).hp, 0);
    assert.notEqual(sim.selectedTargetId, first);
    assert.equal(sim.selectedTargetId, selectAutomaticTarget(sim.player, sim.enemies, mode).id);
  }
});

test('out-of-range pinned targets never get attacked, even if another enemy is in range', () => {
  const sim = setup();
  sim.enemies[2].x = 50;
  const before = sim.enemies.map(enemy => enemy.hp);
  assert.equal(sim.attack('dummy-c'), 'range');
  assert.equal(sim.selectedTargetId, 'dummy-c');
  assert.equal(sim.attack(), 'range');
  assert.deepEqual(sim.enemies.map(enemy => enemy.hp), before);
  assert.equal(sim.player.cooldown, 0);
});

test('automatic targeting and attacks never move the player, including empty and out-of-range states', () => {
  const sim = setup();
  const position = { x: sim.player.x, z: sim.player.z };
  for (const mode of Object.keys(TARGET_MODES)) {
    sim.setTargetMode(mode);
    sim.attack();
    sim.update(1);
  }
  assert.deepEqual({ x: sim.player.x, z: sim.player.z }, position);
  sim.enemies.forEach(enemy => { enemy.x = 40; });
  sim.refreshTarget();
  assert.equal(sim.attack(), 'range');
  sim.update(1);
  assert.deepEqual({ x: sim.player.x, z: sim.player.z }, position);
  assert.equal(sim.selectedTargetId, null);
  sim.enemies.forEach(enemy => { enemy.hp = 0; });
  assert.equal(sim.attack(), 'no-enemies');
  assert.equal(sim.selectedTargetId, null);
});

test('reset restores configured HP/max HP, all player and target state, and default selection', () => {
  const sim = setup();
  sim.setTargetMode('hp-percent');
  sim.attack('dummy-b');
  sim.player.hp = 50;
  sim.reset();
  assert.deepEqual(sim.snapshot(), new TrainingSimulation(arena, config, heroRegistry).snapshot());
  assert.deepEqual(sim.enemies.map(enemy => [enemy.hp, enemy.maxHp]), [[200, 200], [90, 120], [120, 400]]);
});

test('default mode is configurable; unsupported modes fail without corrupting selection', () => {
  const custom = structuredClone(config);
  custom.targeting.defaultMode = 'hp-percent';
  custom.player.x = -1.5; custom.player.z = 1.5;
  const sim = new TrainingSimulation(arena, custom, heroRegistry);
  assert.equal(sim.selectedTargetId, 'dummy-c');
  assert.throws(() => sim.setTargetMode('not-a-mode'), /Unknown targeting mode/);
  assert.equal(sim.targetMode, 'hp-percent');
  assert.equal(sim.selectedTargetId, 'dummy-c');
});
