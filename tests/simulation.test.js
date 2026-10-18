import { heroRegistry } from './helpers/heroes.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cameraRelativeDirection, moveEntity, overlapsBox } from '../src/simulation/movement.js';
import { TrainingSimulation } from '../src/simulation/game.js';
import { FixedClock } from '../src/core/clock.js';
const arena = JSON.parse(readFileSync(new URL('../src/data/arena.json', import.meta.url)));
const config = JSON.parse(readFileSync(new URL('../src/data/training.json', import.meta.url)));
const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`);
const empty = { halfSize: 100, obstacles: [] };
const actor = () => ({ x: 0, z: 0, radius: 0.45, speed: 5.5 });

test('WASD is camera relative; every cardinal and diagonal has unit speed', () => {
  for (const [h, v] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
    const d = cameraRelativeDirection(h, v);
    near(Math.hypot(d.x, d.z), 1);
  }
  assert.deepEqual(cameraRelativeDirection(0, 0), { x: 0, z: 0 });
  const w = cameraRelativeDirection(0, 1);
  assert.ok(w.x < 0 && w.z < 0);
  const d = cameraRelativeDirection(1, 0);
  assert.ok(d.x > 0 && d.z < 0);
});

test('diagonal displacement equals cardinal displacement', () => {
  const cardinal = actor(), diagonal = actor();
  for (let i = 0; i < 60; i++) {
    moveEntity(cardinal, cameraRelativeDirection(0, 1), 1 / 60, empty);
    moveEntity(diagonal, cameraRelativeDirection(1, 1), 1 / 60, empty);
  }
  near(Math.hypot(cardinal.x, cardinal.z), 5.5);
  near(Math.hypot(diagonal.x, diagonal.z), 5.5);
});

test('boundaries retain the entire player collider on all four sides', () => {
  for (const direction of [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }]) {
    const entity = actor();
    for (let i = 0; i < 300; i++) moveEntity(entity, direction, 1 / 60, arena);
    assert.ok(Math.abs(entity.x) <= arena.halfSize - entity.radius + 1e-8);
    assert.ok(Math.abs(entity.z) <= arena.halfSize - entity.radius + 1e-8);
  }
});

test('solid obstacles stop movement from every side without tunneling', () => {
  const box = { x: 0, z: 0, width: 2, depth: 2 };
  for (const [x, z, dx, dz] of [[-3, 0, 1, 0], [3, 0, -1, 0], [0, -3, 0, 1], [0, 3, 0, -1]]) {
    const entity = { ...actor(), x, z };
    for (let i = 0; i < 20; i++) moveEntity(entity, { x: dx, z: dz }, 0.1, { ...empty, obstacles: [box] });
    assert.ok(!overlapsBox(entity.x, entity.z, entity.radius, box));
    assert.ok(Math.hypot(entity.x, entity.z) >= 1.45 - 1e-7);
    assert.ok(entity.x * x >= 0 && entity.z * z >= 0);
  }
  const fast = { ...actor(), x: -3, speed: 40 };
  moveEntity(fast, { x: 1, z: 0 }, 0.25, { ...empty, obstacles: [{ ...box, width: 0.05 }] });
  assert.ok(fast.x < 0, 'cannot cross even a thin obstacle in a long update');
});

test('collision permits sliding along an obstacle and handles rounded corners', () => {
  const box = { x: 0, z: 0, width: 2, depth: 4 };
  const entity = { ...actor(), x: -1.5, z: 0 };
  moveEntity(entity, { x: Math.SQRT1_2, z: Math.SQRT1_2 }, 0.2, { ...empty, obstacles: [box] });
  assert.ok(!overlapsBox(entity.x, entity.z, entity.radius, box));
  assert.ok(entity.z > 0.7);
  assert.ok(!overlapsBox(1.4, 2.4, 0.45, box), 'circle can clear a corner outside its radius');
});

test('living dummy blocks movement; dead dummy does not', () => {
  const sim = new TrainingSimulation(empty, config, heroRegistry);
  sim.player.x = sim.enemies[0].x - 2;
  sim.player.z = sim.enemies[0].z;
  for (let i = 0; i < 60; i++) moveEntity(sim.player, { x: 1, z: 0 }, 1 / 60, empty, [sim.enemies[0]]);
  assert.ok(Math.hypot(sim.player.x - sim.enemies[0].x, sim.player.z - sim.enemies[0].z) >= sim.player.radius + sim.enemies[0].radius - 1e-8);
  sim.enemies[0].hp = 0;
  const before = sim.player.x;
  moveEntity(sim.player, { x: 1, z: 0 }, 0.2, empty, [sim.enemies[0]]);
  assert.ok(sim.player.x > before + 1);
});

test('attack rejects invalid target and out-of-range dummy without consuming cooldown', () => {
  const sim = new TrainingSimulation(arena, config, heroRegistry);
  assert.equal(sim.attack('missing-id'), 'invalid-target');
  assert.equal(sim.attack(), 'range');
  assert.equal(sim.attack('dummy-a'), 'range');
  assert.equal(sim.enemies[0].hp, 200);
  assert.equal(sim.player.cooldown, 0);
});

test('attack accepts exact range, rejects beyond it, and enforces cooldown', () => {
  const sim = new TrainingSimulation(arena, config, heroRegistry);
  sim.player.x = sim.enemies[0].x - sim.player.range - 0.001;
  sim.player.z = sim.enemies[0].z;
  assert.equal(sim.attack('dummy-a'), 'range');
  sim.player.x += 0.001;
  assert.equal(sim.attack('dummy-a'), 'hit');
  assert.equal(sim.enemies[0].hp, 175);
  assert.equal(sim.attack('dummy-a'), 'cooldown');
  assert.equal(sim.hits, 1);
  for (let i = 0; i < 39; i++) sim.update(1 / 60);
  assert.equal(sim.attack('dummy-a'), 'hit');
  assert.equal(sim.enemies[0].hp, 150);
});

test('dummy death clamps health, rejects attacks, and reset restores all match state', () => {
  const sim = new TrainingSimulation(arena, config, heroRegistry);
  sim.player.x = sim.enemies[0].x - 2;
  sim.player.z = sim.enemies[0].z;
  for (let i = 0; i < 8; i++) { assert.equal(sim.attack('dummy-a'), 'hit'); sim.update(0.65); }
  assert.equal(sim.enemies[0].hp, 0);
  assert.equal(sim.hits, 8);
  assert.equal(sim.attack('dummy-a'), 'dead');
  sim.reset();
  assert.deepEqual(sim.snapshot(), new TrainingSimulation(arena, config, heroRegistry).snapshot());
  const snapshot = sim.snapshot();
  snapshot.player.hp = 0;
  assert.equal(sim.player.hp, 100, 'diagnostics cannot mutate gameplay');
});

test('fixed timestep gives the same displacement at 30, 60, and 144 render FPS', () => {
  const distances = [30, 60, 144].map(fps => {
    const clock = new FixedClock();
    const entity = actor();
    for (let frame = 0; frame <= fps * 2; frame++) clock.advance(frame * 1000 / fps, dt => moveEntity(entity, { x: 1, z: 0 }, dt, empty));
    return entity.x;
  });
  for (const distance of distances) near(distance, 11);
});

test('clock clamps catch-up and reset removes suspended-tab time', () => {
  const clock = new FixedClock();
  let ticks = 0;
  clock.advance(0, () => ticks++);
  clock.advance(60000, () => ticks++);
  assert.equal(ticks, 6);
  clock.reset();
  clock.advance(120000, () => ticks++);
  assert.equal(ticks, 6);
});
