import { number, integer, keys } from './validation.js';
export const ATTRIBUTE_KEYS = Object.freeze(['maxHp','hpRegen','maxMana','manaRegen','physicalAttack','physicalDefense','magicDefense','magicPower','attackSpeed','attackSpeedRatio','criticalDamage','movementSpeed','attackRange']);
const positive = new Set(['maxHp','maxMana','attackSpeed','attackSpeedRatio','criticalDamage','movementSpeed','attackRange']);
export function validateAttributes(hero, path) {
  keys(hero.baseStats, [...ATTRIBUTE_KEYS, 'collisionRadius'], `${path}.baseStats`);
  keys(hero.growthStats, ATTRIBUTE_KEYS, `${path}.growthStats`);
  for (const k of ATTRIBUTE_KEYS) {
    number(hero.baseStats[k], `${path}.baseStats.${k}`, positive.has(k) ? .0001 : 0, 1e7);
    number(hero.growthStats[k], `${path}.growthStats.${k}`, 0, 1e6);
  }
  number(hero.baseStats.collisionRadius, `${path}.baseStats.collisionRadius`, .05, 10);
  keys(hero.runtimeScale, ['movement','range','maximumAttackRate'], `${path}.runtimeScale`);
  number(hero.runtimeScale.movement, `${path}.runtimeScale.movement`, .0001, 100);
  number(hero.runtimeScale.range, `${path}.runtimeScale.range`, .0001, 100);
  number(hero.runtimeScale.maximumAttackRate, `${path}.runtimeScale.maximumAttackRate`, .01, 10);
  // Validate the entire curve, not just level 1. Runtime state never repairs bad data.
  for (let level = 1; level <= hero.progression.maxLevel; level++) {
    try { runtimeAttributes(hero, calculateAttributes(hero, level)); }
    catch (error) { throw Error(`${path}.runtimeScale (level ${level}): ${error.message}`); }
  }
}
function validateModifiers(modifiers) {
  if (!modifiers || typeof modifiers !== 'object' || Array.isArray(modifiers)) throw Error('stat modifiers: expected object');
  for (const [layer, modifier] of Object.entries(modifiers)) {
    if (!['temporary', 'items'].includes(layer)) throw Error(`stat modifiers.${layer}: unknown layer`);
    keys(modifier, ['flat','percent'], `stat modifiers.${layer}`);
    for (const [kind, values] of Object.entries(modifier)) {
      if (!values || typeof values !== 'object' || Array.isArray(values)) throw Error(`stat modifiers.${layer}.${kind}: expected object`);
      for (const [k, v] of Object.entries(values)) {
        if (!ATTRIBUTE_KEYS.includes(k)) throw Error(`stat modifiers.${layer}.${kind}.${k}: unknown attribute`);
        number(v, `stat modifiers.${layer}.${kind}.${k}`, kind === 'percent' ? -1 : -1e7, kind === 'percent' ? 100 : 1e7);
      }
    }
  }
}
// Pure: immutable definition -> independent effective attributes. Equipment is an
// empty extension layer, NOT an inventory/shop implementation.
export function calculateAttributes(hero, level, modifiers = {}) {
  integer(level, 'hero level', hero.progression.minLevel, hero.progression.maxLevel);
  validateModifiers(modifiers);
  const stats = {}, raw = {}, percentages = {};
  for (const k of ATTRIBUTE_KEYS) {
    let flat = 0, percent = 0;
    for (const layer of Object.values(modifiers)) { flat += layer.flat[k] ?? 0; percent += layer.percent[k] ?? 0; }
    raw[k] = hero.baseStats[k] + hero.growthStats[k] * (level - 1) + flat;
    percentages[k] = percent;
  }
  const attackSpeedRatio = raw.attackSpeedRatio * (1 + percentages.attackSpeedRatio);
  for (const k of ATTRIBUTE_KEYS) {
    stats[k] = raw[k] * (1 + percentages[k] * (k === 'attackSpeed' ? attackSpeedRatio : 1));
    number(stats[k], `effective stats.${k}`, positive.has(k) ? .0001 : 0);
  }
  return stats;
}
export function runtimeAttributes(hero, stats) {
  const attackRate = number(Math.min(stats.attackSpeed, hero.runtimeScale.maximumAttackRate), 'effective runtime.attackRate', .01, 10);
  number(stats.movementSpeed * hero.runtimeScale.movement, 'effective runtime.speed', .001, 100);
  number(stats.attackRange * hero.runtimeScale.range, 'effective runtime.range', .001, 1000);
  return { speed: stats.movementSpeed * hero.runtimeScale.movement,
    range: stats.attackRange * hero.runtimeScale.range, attackRate, attackCooldown: 1 / attackRate };
}
export const statText = n => Number(n.toFixed(2)).toString();
