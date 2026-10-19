import { keys, number } from './validation.js';
export function validateDamageModel(model, path = 'damageModel') {
  keys(model, ['type','physicalScaling','magicScaling'], path);
  if (!['physical','magic','true'].includes(model.type)) throw Error(`${path}.type: expected physical, magic or true`);
  number(model.physicalScaling, `${path}.physicalScaling`, 0, 100);
  number(model.magicScaling, `${path}.magicScaling`, 0, 100);
}
export function damagePower(base, model, attributes) {
  number(base, 'damage.base');
  validateDamageModel(model);
  number(attributes.physicalAttack, 'damage.source.physicalAttack');
  number(attributes.magicPower, 'damage.source.magicPower');
  return number(base + attributes.physicalAttack * model.physicalScaling + attributes.magicPower * model.magicScaling, 'damage.raw');
}
export function effectiveDefense(defense, modifiers = {}) {
  // This prototype intentionally clamps negative defense to zero: no undocumented
  // amplification formula or singularities at -120. Percent values are fractions.
  number(defense, 'damage.target.defense', -1e7);
  for (const [key, value] of Object.entries(modifiers)) {
    if (!['flatReduction','percentReduction','percentPenetration','flatPenetration'].includes(key)) throw Error(`damage.defenseModifiers.${key}: unknown field`);
    number(value, `damage.defenseModifiers.${key}`, 0, key.startsWith('percent') ? 1 : 1e7);
  }
  return Math.max(0, (defense - (modifiers.flatReduction ?? 0)) * (1 - (modifiers.percentReduction ?? 0)) * (1 - (modifiers.percentPenetration ?? 0)) - (modifiers.flatPenetration ?? 0));
}
// Shared by any future attacker/recipient; no Three.js, UI, enemy-only policy or
// hero identity. Caller validates action/target eligibility before this function.
export function resolveDamage({ base, model, source, target, multiplier = 1, defenseModifiers = {} }) {
  number(multiplier, 'damage.multiplier', 0, 100);
  const raw = number(damagePower(base, model, source) * multiplier, 'damage.scaled');
  const defense = model.type === 'true' ? 0 : effectiveDefense(model.type === 'physical' ? target.physicalDefense : target.magicDefense, defenseModifiers);
  return { raw, defense, multiplier: model.type === 'true' ? 1 : 120 / (120 + defense), amount: raw * (model.type === 'true' ? 1 : 120 / (120 + defense)) };
}
