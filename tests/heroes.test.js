import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createHeroRegistry, discoverHeroPacks, validateHeroPack, createHeroState } from '../src/heroes/registry.js';
import { inspectEmbeddedGlb, decodeEmbeddedAsset } from '../src/heroes/model-contract.js';
import { createHeroVisual } from '../src/rendering/heroes/hero-visual.js';
import { executeEffect, validateEffect } from '../src/simulation/effects.js';
import { TrainingSimulation } from '../src/simulation/game.js';
import { readHeroFiles } from '../scripts/lib/hero-files.mjs';
import { heroRegistry } from './helpers/heroes.js';
import { replayFoundation } from './helpers/replay.js';
import { glbDocument, animatedTestGlb } from './helpers/glb.js';
const files = await readHeroFiles();
const original = discoverHeroPacks(files.json, files.assets)[0];
const pack = () => structuredClone(original);
const training = JSON.parse(readFileSync(new URL('../src/data/training.json', import.meta.url)));
const arena = JSON.parse(readFileSync(new URL('../src/data/arena.json', import.meta.url)));
const baseline = JSON.parse(readFileSync(new URL('./fixtures/foundation-baseline.json', import.meta.url)));
const withModel = () => {
  const value = pack();
  value.visual.kind = 'glb'; value.visual.model = 'assets/fixture.glb';
  value.assets = { 'assets/fixture.glb': animatedTestGlb() };
  value.animations.clips = { idle: 'FixtureMotion' };
  return value;
};
const ability = () => ({ id: 'fixture-effect', slot: 'Q', name: 'Schema-only test', effectId: 'direct-damage', targeting: { team: 'enemy', type: 'unit' }, range: 6, damage: 25, manaCost: 0, cooldown: 1 });

test('39 complete simulation snapshots match pre-refactor baseline exactly', () => {
  const trace = replayFoundation(new TrainingSimulation(arena, training, heroRegistry));
  assert.equal(trace.length, baseline.snapshots);
  assert.equal(createHash('sha256').update(JSON.stringify(trace)).digest('hex'), baseline.sha256);
});

test('migrated hero produces the identical player fields/values; world data owns spawn only', () => {
  const state = createHeroState(heroRegistry.get('training'), training.player);
  assert.deepEqual(state, { ...baseline.player, hp: 100, cooldown: 0 });
  assert.deepEqual(Object.keys(training.player).sort(), ['heroId', 'x', 'z']);
  assert.deepEqual(heroRegistry.ids(), ['training'], 'no additional playable heroes');
  assert.deepEqual(heroRegistry.get('training').abilities, []);
  assert.deepEqual(heroRegistry.get('training').animations.clips, {});
});

test('hero directory auto-discovery supports adding definitions without a central roster', () => {
  const json = structuredClone(files.json);
  for (const [path, value] of Object.entries(files.json)) json[path.replace('/training/', '/fixture/')] = structuredClone(value);
  json['./fixture/hero.json'].id = 'fixture';
  const registry = createHeroRegistry(discoverHeroPacks(json));
  assert.deepEqual(registry.ids(), ['fixture', 'training']);
  assert.equal(registry.get('fixture').name, 'Test hero');
  assert.deepEqual(heroRegistry.ids(), ['training'], 'fixture is test data only');
});

test('duplicate registry IDs, unknown IDs and empty registry give clear errors', () => {
  assert.throws(() => createHeroRegistry([pack(), pack()]), /duplicate hero ID/);
  assert.throws(() => heroRegistry.get('missing'), /unknown hero "missing"/);
  assert.throws(() => heroRegistry.get('constructor'), /unknown hero/);
  assert.throws(() => createHeroRegistry([]), /at least one hero/);
});

test('registry definitions are immutable; independent state/reset cannot mutate definitions', () => {
  const definition = heroRegistry.get('training');
  assert.throws(() => { definition.baseStats.maxHp = 1; }, TypeError);
  const state = createHeroState(definition, training.player); state.hp = 1;
  const sim = new TrainingSimulation(arena, training, heroRegistry); sim.player.damage = 999; sim.reset();
  assert.equal(definition.basicAttack.damage, 25);
  assert.equal(sim.player.damage, 25);
  assert.equal(createHeroState(definition, training.player).hp, 100);
});

for (const file of ['hero.json', 'abilities.json', 'animations.json', 'visual.json']) {
  test(`missing ${file} reports its hero-local file path`, () => {
    const json = { ...files.json }; delete json[`./training/${file}`];
    assert.throws(() => discoverHeroPacks(json), file === 'hero.json' ? /no hero definitions|orphan/ : new RegExp(`training/${file}.*required file`));
  });
}

test('orphan data, folder/ID mismatch and unexpected fields are rejected', () => {
  assert.throws(() => discoverHeroPacks({ ...files.json, './orphan/abilities.json': [] }), /orphan/);
  const json = structuredClone(files.json); json['./training/hero.json'].id = 'other';
  assert.throws(() => discoverHeroPacks(json), /must match its directory/);
  const value = pack(); value.hero.baseStats.maxHP = 100;
  assert.throws(() => validateHeroPack(value), /baseStats.maxHP.*unknown field/);
});

for (const [label, mutate, expected] of [
  ['missing identity', p => { delete p.hero.id; }, /hero.json.id.*required/],
  ['invalid ID', p => { p.hero.id = '../escape'; }, /identifier/],
  ['schema version', p => { p.hero.schemaVersion = 2; }, /schema version/],
  ['zero max HP', p => { p.hero.baseStats.maxHp = 0; }, /baseStats.maxHp/],
  ['infinite speed', p => { p.hero.baseStats.movementSpeed = Infinity; }, /movementSpeed/],
  ['negative radius', p => { p.hero.baseStats.collisionRadius = -1; }, /collisionRadius/],
  ['negative damage', p => { p.hero.basicAttack.damage = -1; }, /basicAttack.damage/],
  ['NaN range', p => { p.hero.basicAttack.range = NaN; }, /basicAttack.range/],
  ['zero cooldown', p => { p.hero.basicAttack.cooldown = 0; }, /basicAttack.cooldown/],
  ['unknown effect', p => { p.hero.basicAttack.effectId = 'eval'; }, /unsupported effect/],
  ['inherited effect', p => { p.hero.basicAttack.effectId = 'constructor'; }, /unsupported effect/],
  ['missing reference', p => { p.hero.abilityIds = ['missing']; }, /abilityIds/],
  ['unknown placeholder', p => { p.visual.placeholder = 'invented'; }, /unknown placeholder/],
  ['invalid visual scale', p => { p.visual.scale = 0; }, /visual.json.scale/],
  ['external model reference', p => { p.visual.kind = 'glb'; p.visual.model = 'https://invalid/model.glb'; }, /hero-local/],
  ['missing model', p => { p.visual.kind = 'glb'; p.visual.model = 'assets/missing.glb'; }, /model not found/],
  ['invented placeholder clips', p => { p.animations.clips.idle = 'InventedIdle'; }, /no animation clips/],
]) {
  test(`invalid hero data: ${label}`, () => {
    const value = pack(); mutate(value); assert.throws(() => validateHeroPack(value), expected);
  });
}

test('ability schema validates required fields, slot/effect/target/ranges and exact references', () => {
  const valid = pack(); valid.abilities = [ability()]; valid.hero.abilityIds = ['fixture-effect'];
  validateHeroPack(valid);
  for (const [mutate, expected] of [
    [p => { delete p.abilities[0].name; }, /name.*required/],
    [p => { p.abilities[0].slot = 'X'; }, /slot/],
    [p => { p.abilities[0].effectId = 'script-string'; }, /unsupported effect/],
    [p => { p.abilities[0].targeting.team = 'ally'; }, /enemy unit/],
    [p => { p.abilities[0].manaCost = -1; }, /manaCost/],
    [p => { p.abilities[0].cooldown = Infinity; }, /cooldown/],
    [p => { p.abilities.push(ability()); }, /duplicate ability/],
    [p => { p.hero.abilityIds.push('fixture-effect'); }, /abilityIds/],
  ]) { const value = structuredClone(valid); mutate(value); assert.throws(() => validateHeroPack(value), expected); }
});

test('shared damage effect preserves clamping and rejects arbitrary handlers/invalid input', () => {
  const target = { hp: 10 };
  executeEffect('direct-damage', { target }, { damage: 25 });
  assert.equal(target.hp, 0);
  assert.throws(() => executeEffect('direct-damage', { target }, { damage: 1 }), /living target/);
  assert.throws(() => validateEffect('globalThis.bad = true', { damage: 1 }), /unsupported effect/);
  assert.throws(() => validateEffect('__proto__', { damage: 1 }), /unsupported effect/);
  assert.throws(() => validateEffect('direct-damage', { damage: NaN }), /finite number/);
});

test('GLB contract rejects invalid headers, truncated binary, external resources and decoders', () => {
  assert.throws(() => inspectEmbeddedGlb(new Uint8Array(20)), /header/);
  const valid = animatedTestGlb(); assert.deepEqual(inspectEmbeddedGlb(valid).clips, ['FixtureMotion']);
  assert.throws(() => inspectEmbeddedGlb(valid.subarray(0, valid.length - 1)), /header/);
  for (const property of ['buffers', 'images']) {
    for (const uri of ['relative.png', 'https://invalid/texture.png', 'file:///model.bin']) {
      assert.throws(() => inspectEmbeddedGlb(glbDocument({ asset: { version: '2.0' }, [property]: [{ uri }] })), /external buffer\/image/);
    }
  }
  assert.throws(() => inspectEmbeddedGlb(glbDocument({ asset: { version: '2.0' }, extensionsUsed: ['KHR_draco_mesh_compression'] })), /external decoder/);
  assert.throws(() => decodeEmbeddedAsset('file:///model.glb', 'fixture'), /bundled base64/);
  const url = `data:application/octet-stream;base64,${Buffer.from(valid).toString('base64')}`;
  assert.deepEqual(decodeEmbeddedAsset(url, 'fixture'), valid);
});

test('actual GLB clip names are required; runtime asset bytes are registry-owned copies', () => {
  const value = withModel(); const registry = createHeroRegistry([value]);
  registry.modelBytes('training')[0] = 0;
  assert.equal(registry.modelBytes('training')[0], 0x67);
  value.animations.clips.idle = 'NotInTheModel';
  assert.throws(() => validateHeroPack(value), /does not exist/);
});

test('placeholder adapter keeps exact existing mesh and contains no animation claims', async () => {
  const visual = await createHeroVisual(heroRegistry.get('training'), null);
  assert.equal(visual.status, 'placeholder');
  const model = visual.root.children[0].children[0];
  assert.equal(model.children.length, 4);
  assert.equal(model.children[0].geometry.type, 'CapsuleGeometry');
  assert.equal(model.children[0].position.y, 0.91);
  assert.equal(model.children[1].geometry.type, 'CylinderGeometry');
  visual.update(1 / 60, 'move'); visual.reset();
});

test('real GLTFLoader parses synthetic in-memory GLB and AnimationMixer plays verified clip', async () => {
  const value = withModel(); const registry = createHeroRegistry([value]);
  const visual = await createHeroVisual(registry.get('training'), registry.modelBytes('training'));
  assert.equal(visual.status, 'glb');
  visual.update(0.5, 'idle');
  const animatedNode = visual.root.getObjectByName('FixtureNode');
  assert.ok(Math.abs(animatedNode.position.x - 0.5) < 1e-6);
  assert.equal(visual.root.position.x, 0, 'clip does not move authoritative root');
  visual.reset(); assert.equal(animatedNode.position.x, 0);
});

test('runtime model parse or actual clip mismatch retains a working placeholder and reports it', async () => {
  const value = withModel(); const registry = createHeroRegistry([value]); const warnings = [];
  const visual = await createHeroVisual(registry.get('training'), registry.modelBytes('training'), {
    loader: { async parseAsync() { throw new Error('fixture decode failure'); } }, warn: message => warnings.push(message),
  });
  assert.equal(visual.status, 'placeholder-fallback');
  assert.match(warnings[0], /fixture decode failure.*Retaining/);
  const mismatch = await createHeroVisual(registry.get('training'), registry.modelBytes('training'), {
    loader: { async parseAsync() { return { scene: { isObject3D: true }, animations: [] }; } }, warn: message => warnings.push(message),
  });
  assert.equal(mismatch.status, 'placeholder-fallback');
  assert.match(warnings[1], /Actual loaded animation clip missing/);
});

test('presentation adapter supports mapped basic-attack one-shots and reset independently of combat', async () => {
  const value = withModel(); value.animations.clips.basicAttack = 'FixtureMotion';
  const registry = createHeroRegistry([value]);
  const visual = await createHeroVisual(registry.get('training'), registry.modelBytes('training'));
  visual.play('basicAttack', true);
  visual.update(0.5, 'move');
  assert.ok(Math.abs(visual.root.getObjectByName('FixtureNode').position.x - 0.5) < 1e-6);
  visual.update(0.5, 'idle');
  assert.equal(visual.root.getObjectByName('FixtureNode').position.x, 1);
  visual.reset();
  assert.equal(visual.root.getObjectByName('FixtureNode').position.x, 0);
});

test('null/malformed hero files produce clear file-scoped validation errors', () => {
  const json = structuredClone(files.json); json['./training/hero.json'] = null;
  assert.throws(() => discoverHeroPacks(json), /training\/hero.json: expected object/);
  for (const field of ['hero', 'visual', 'animations', 'abilities']) {
    const value = pack(); value[field] = null;
    assert.throws(() => validateHeroPack(value), /src\/heroes\/training/);
  }
});

test('invalid registry input and malformed GLB records fail explicitly', () => {
  assert.throws(() => createHeroRegistry(null), /expected an array/);
  assert.throws(() => createHeroRegistry([null]), /hero pack: expected object/);
  for (const key of ['buffers', 'images', 'animations', 'extensionsUsed']) {
    assert.throws(() => inspectEmbeddedGlb(glbDocument({ asset: { version: '2.0' }, [key]: {} }), 'fixture.glb'), /fixture.glb:.*must be an array/);
  }
  assert.throws(() => inspectEmbeddedGlb(glbDocument({ asset: { version: '2.0' }, animations: [null] })), /invalid animation record/);
});
