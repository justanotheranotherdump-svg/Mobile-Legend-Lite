import { validateAttributes, calculateAttributes, runtimeAttributes } from '../simulation/stats/attributes.js';
import { validateProgression, validateRanks } from '../simulation/stats/progression.js';
import { validateDamageModel, damagePower } from '../simulation/stats/damage.js';
import { validateCombatAbility } from '../simulation/ability-contract.js';
import { validateEffect } from '../simulation/effects.js';
import { decodeEmbeddedAsset, inspectEmbeddedGlb } from './model-contract.js';

const idPattern = /^[a-z][a-z0-9-]{0,63}$/;
const fail = (path, message) => { throw new Error(`${path}: ${message}`); };
function object(value, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path, 'expected object');
}
function text(value, path, id = false) {
  if (typeof value !== 'string' || !value.trim() || value.length > 128 || (id && !idPattern.test(value))) fail(path, id ? 'expected lowercase kebab-case identifier' : 'expected non-empty string (max 128 characters)');
}
function numeric(value, path, min, max) {
  if (!Number.isFinite(value) || value < min || value > max) fail(path, `expected finite number in [${min}, ${max}]`);
}
function exactKeys(value, keys, path) {
  object(value, path);
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`${path}.${key}`, 'unknown field (possible typo)');
  for (const key of keys) if (!Object.hasOwn(value, key)) fail(`${path}.${key}`, 'required field missing');
}
function freeze(value) {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}

export function validateHeroPack(pack) {
  object(pack, 'hero pack');
  const path = pack.path ?? 'hero pack';
  const h = pack.hero, v = pack.visual, a = pack.animations, abilities = pack.abilities;
  exactKeys(h, h?.schemaVersion===3 ? ['schemaVersion','id','name','role','baseStats','growthStats','runtimeScale','progression','basicAttack','abilityIds','visual','actionLockDuration'] : h?.schemaVersion===2 ? ['schemaVersion','id','name','role','baseStats','basicAttack','abilityIds','visual','actionLockDuration'] : ['schemaVersion', 'id', 'name', 'role', 'baseStats', 'basicAttack', 'abilityIds', 'visual'], `${path}/hero.json`);
  if (![1, 2, 3].includes(h.schemaVersion)) fail(`${path}/hero.json.schemaVersion`, 'unsupported schema version');
  if(h.schemaVersion>=2)numeric(h.actionLockDuration,`${path}/hero.json.actionLockDuration`,.01,5);
  text(h.id, `${path}/hero.json.id`, true);
  text(h.name, `${path}/hero.json.name`); text(h.role, `${path}/hero.json.role`);
  if (h.visual !== 'visual.json') fail(`${path}/hero.json.visual`, 'expected hero-local visual.json');
  if (h.schemaVersion === 3) {
    validateProgression(h.progression, `${path}/hero.json.progression`);
    if (h.progression.maxLevel !== 15) fail(`${path}/hero.json.progression.maxLevel`, 'this combat contract requires level cap 15');
    validateAttributes(h, `${path}/hero.json`);
    exactKeys(h.basicAttack, ['effectId','damage','range','cooldown','projectileSpeed','castTime','damageModel'], `${path}/hero.json.basicAttack`);
    validateEffect(h.basicAttack.effectId, h.basicAttack, `${path}/hero.json.basicAttack`);
    validateDamageModel(h.basicAttack.damageModel, `${path}/hero.json.basicAttack.damageModel`);
    numeric(h.basicAttack.projectileSpeed, `${path}/hero.json.basicAttack.projectileSpeed`, .1, 100);
    numeric(h.basicAttack.castTime, `${path}/hero.json.basicAttack.castTime`, .001, h.actionLockDuration);
    const runtime = runtimeAttributes(h, calculateAttributes(h, 1));
    for (const [field, value] of [['range', runtime.range], ['cooldown', runtime.attackCooldown]])
      if (!Number.isFinite(h.basicAttack[field]) || Math.abs(h.basicAttack[field] - value) > 1e-9)
        fail(`${path}/hero.json.basicAttack.${field}`, 'must match calculated level 1 world conversion / attack interval');
  } else {
  exactKeys(h.baseStats, h.schemaVersion === 2 ? ['maxHp', 'movementSpeed', 'collisionRadius', 'maxMana', 'manaRegen'] : ['maxHp', 'movementSpeed', 'collisionRadius'], `${path}/hero.json.baseStats`);
  if(h.schemaVersion===2){numeric(h.baseStats.maxMana,`${path}/hero.json.baseStats.maxMana`,1,1000000);numeric(h.baseStats.manaRegen,`${path}/hero.json.baseStats.manaRegen`,0,10000);}
  numeric(h.baseStats.maxHp, `${path}/hero.json.baseStats.maxHp`, 1, 10000000);
  numeric(h.baseStats.movementSpeed, `${path}/hero.json.baseStats.movementSpeed`, 0.01, 100);
  numeric(h.baseStats.collisionRadius, `${path}/hero.json.baseStats.collisionRadius`, 0.05, 10);
  exactKeys(h.basicAttack, h.schemaVersion===2 ? ['effectId','damage','range','cooldown','projectileSpeed','castTime'] : ['effectId', 'damage', 'range', 'cooldown'], `${path}/hero.json.basicAttack`);
  if(h.schemaVersion===2){numeric(h.basicAttack.projectileSpeed,`${path}/hero.json.basicAttack.projectileSpeed`,.1,100);numeric(h.basicAttack.castTime,`${path}/hero.json.basicAttack.castTime`,0,5);}
  validateEffect(h.basicAttack.effectId, h.basicAttack, `${path}/hero.json.basicAttack`);
  numeric(h.basicAttack.range, `${path}/hero.json.basicAttack.range`, 0, 1000);
  numeric(h.basicAttack.cooldown, `${path}/hero.json.basicAttack.cooldown`, 0.01, 3600);
  }
  if (!Array.isArray(abilities) || !Array.isArray(h.abilityIds)) fail(`${path}/abilities.json`, 'abilities and hero abilityIds must be arrays');
  const ids = new Set(), slots = new Set();
  for (const ability of abilities) {
    const p = `${path}/abilities.json[${ids.size}]`;
    if(h.schemaVersion>=2){
      if (h.schemaVersion === 3) {
        exactKeys(ability, ['id','name','slot','effectId','range','damage','manaCost','cooldown','castTime','parameters','damageModel','ranks'], p);
        const {damageModel, ranks, ...legacy} = ability;
        validateCombatAbility(legacy,p);
        validateDamageModel(damageModel, `${p}.damageModel`);
        validateRanks(ability, h.progression.maxLevel, p);
      } else validateCombatAbility(ability,p);
      if(ids.has(ability.id)||slots.has(ability.slot))fail(p,'duplicate ability ID or slot');ids.add(ability.id);slots.add(ability.slot);continue;}
    exactKeys(ability, ['id', 'slot', 'name', 'effectId', 'targeting', 'range', 'damage', 'manaCost', 'cooldown'], p);
    text(ability.id, `${p}.id`, true); text(ability.name, `${p}.name`);
    if (!['passive', 'Q', 'E', 'R', 'F', 'B'].includes(ability.slot)) fail(`${p}.slot`, 'unsupported ability slot');
    if (ids.has(ability.id) || slots.has(ability.slot)) fail(p, 'duplicate ability ID or slot');
    ids.add(ability.id); slots.add(ability.slot);
    // Only the existing direct-damage implementation is supported. Future
    // healing/area/projectile mechanics must bring their own approved handler.
    validateEffect(ability.effectId, ability, p);
    exactKeys(ability.targeting, ['team', 'type'], `${p}.targeting`);
    if (ability.targeting.team !== 'enemy' || ability.targeting.type !== 'unit') fail(`${p}.targeting`, 'direct-damage requires an enemy unit');
    numeric(ability.range, `${p}.range`, 0, 1000);
    numeric(ability.manaCost, `${p}.manaCost`, 0, 1000000);
    numeric(ability.cooldown, `${p}.cooldown`, 0, 3600);
  }
  if (h.schemaVersion>=2 && ["passive","skill-1","skill-2","skill-ultimate"].some(slot=>!slots.has(slot))) fail(`${path}/abilities.json`, "combat schema requires four supported combat slots/effects");
  if (h.abilityIds.some(id => !ids.has(id)) || new Set(h.abilityIds).size !== h.abilityIds.length || ids.size !== h.abilityIds.length) fail(`${path}/hero.json.abilityIds`, 'must reference each defined ability exactly once');
  exactKeys(v, ['kind', 'placeholder', 'model', 'scale', 'rotationY', 'offset'], `${path}/visual.json`);
  if (!['placeholder', 'glb'].includes(v.kind)) fail(`${path}/visual.json.kind`, 'expected placeholder or glb');
  if (v.placeholder !== 'training-capsule') fail(`${path}/visual.json.placeholder`, 'unknown placeholder adapter');
  numeric(v.scale, `${path}/visual.json.scale`, 0.001, 1000);
  numeric(v.rotationY, `${path}/visual.json.rotationY`, -Math.PI * 2, Math.PI * 2);
  exactKeys(v.offset, ['x', 'y', 'z'], `${path}/visual.json.offset`);
  for (const axis of ['x', 'y', 'z']) numeric(v.offset[axis], `${path}/visual.json.offset.${axis}`, -1000, 1000);
  exactKeys(a, ['clips'], `${path}/animations.json`); object(a.clips, `${path}/animations.json.clips`);
  let availableClips = [];
  if (v.kind === 'placeholder') {
    if (v.model !== null) fail(`${path}/visual.json.model`, 'placeholder model must be null');
    if (Object.keys(a.clips).length) fail(`${path}/animations.json`, 'placeholder has no animation clips; mappings must be empty');
  } else {
    if (typeof v.model !== 'string' || !/^assets\/[a-zA-Z0-9_-]+\.glb$/.test(v.model)) fail(`${path}/visual.json.model`, 'expected hero-local assets/<name>.glb');
    if (!Object.hasOwn(pack.assets ?? {}, v.model)) fail(`${path}/${v.model}`, 'referenced model not found/bundled');
    availableClips = inspectEmbeddedGlb(decodeEmbeddedAsset(pack.assets[v.model], `${path}/${v.model}`), `${path}/${v.model}`).clips;
  }
  for (const [state, clip] of Object.entries(a.clips)) {
    text(state, `${path}/animations.json state`); text(clip, `${path}/animations.json.clips.${state}`);
    if (!availableClips.includes(clip)) fail(`${path}/animations.json.clips.${state}`, `clip "${clip}" does not exist in the model`);
  }
  return pack;
}

export function discoverHeroPacks(jsonFiles, assets = {}) {
  const paths = Object.keys(jsonFiles).filter(path => /^\.\/[^/]+\/hero\.json$/.test(path)).sort();
  if (!paths.length) fail('src/heroes', 'no hero definitions discovered');
  const packs = paths.map(path => {
    const folder = path.split('/')[1], prefix = `./${folder}/`;
    const read = name => {
      if (!Object.hasOwn(jsonFiles, prefix + name)) fail(`src/heroes/${folder}/${name}`, 'required file missing');
      return jsonFiles[prefix + name];
    };
    const pack = { path: `src/heroes/${folder}`, hero: read('hero.json'), abilities: read('abilities.json'), animations: read('animations.json'), visual: read('visual.json'), assets: {} };
    object(pack.hero, `${pack.path}/hero.json`);
    if (pack.hero.id !== folder) fail(`${pack.path}/hero.json.id`, 'must match its directory name');
    for (const [key, value] of Object.entries(assets)) if (key.startsWith(prefix)) pack.assets[key.slice(prefix.length)] = value;
    return pack;
  });
  for (const key of Object.keys(jsonFiles)) {
    if (!paths.some(path => key.startsWith(path.slice(0, path.lastIndexOf('/') + 1)))) fail(`src/heroes/${key.slice(2)}`, 'orphan hero configuration has no hero.json');
  }
  return packs;
}

export function createHeroRegistry(packs) {
  if (!Array.isArray(packs)) fail('hero registry', 'expected an array of hero packs');
  const records = new Map();
  for (const pack of packs) {
    validateHeroPack(pack);
    if (records.has(pack.hero.id)) fail(`${pack.path}/hero.json.id`, `duplicate hero ID "${pack.hero.id}"`);
    // Binary assets stay outside frozen JSON; strings (bundled URLs) and byte
    // copies are owned by the closure, never exposed for consumer mutation.
    const definition = freeze(structuredClone({ ...pack.hero, abilities: pack.abilities, animations: pack.animations, presentation: pack.visual }));
    const asset = pack.visual.kind === 'glb' ? decodeEmbeddedAsset(pack.assets[pack.visual.model], pack.path).slice() : null;
    records.set(pack.hero.id, { definition, asset });
  }
  if (!records.size) fail('hero registry', 'at least one hero is required');
  const lookup = id => { if (!records.has(id)) fail('hero registry', `unknown hero "${id}"`); return records.get(id); };
  return Object.freeze({
    ids: () => [...records.keys()],
    get: id => lookup(id).definition,
    modelBytes: id => lookup(id).asset?.slice() ?? null,
  });
}

export function createHeroState(hero, spawn) {
  numeric(spawn.x, 'player spawn.x', -100000, 100000);
  numeric(spawn.z, 'player spawn.z', -100000, 100000);
  if (hero.schemaVersion === 3) {
    const attributes = calculateAttributes(hero, 1), runtime = runtimeAttributes(hero, attributes);
    return { x: spawn.x, z: spawn.z, radius: hero.baseStats.collisionRadius, attributes, ...runtime,
      maxHp: attributes.maxHp, hp: attributes.maxHp, hpRegen: attributes.hpRegen,
      maxMana: attributes.maxMana, mana: attributes.maxMana, manaRegen: attributes.manaRegen,
      damage: damagePower(hero.basicAttack.damage, hero.basicAttack.damageModel, attributes), cooldown: 0 };
  }
  return { x: spawn.x, z: spawn.z, radius: hero.baseStats.collisionRadius, speed: hero.baseStats.movementSpeed,
    maxHp: hero.baseStats.maxHp, range: hero.basicAttack.range, attackCooldown: hero.basicAttack.cooldown,
    ...(hero.schemaVersion===2 ? {maxMana:hero.baseStats.maxMana,mana:hero.baseStats.maxMana,manaRegen:hero.baseStats.manaRegen}:{}),
    damage: hero.basicAttack.damage, hp: hero.baseStats.maxHp, cooldown: 0 };
}
