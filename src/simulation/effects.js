// Code-owned allowlist: JSON names a handler, never executable code.
const handlers = Object.freeze({
  'direct-damage': Object.freeze({
    validate(parameters, path) {
      if (!Number.isFinite(parameters.damage) || parameters.damage < 0 || parameters.damage > 1000000) {
        throw new Error(`${path}.damage: expected finite number in [0, 1000000]`);
      }
    },
    apply({ target }, parameters) { target.hp = Math.max(0, target.hp - parameters.damage); },
  }),
});
export function validateEffect(effectId, parameters, path = 'effect') {
  if (!Object.hasOwn(handlers, effectId)) throw new Error(`${path}.effectId: unsupported effect "${effectId}"`);
  handlers[effectId].validate(parameters, path);
}
export function executeEffect(effectId, context, parameters) {
  validateEffect(effectId, parameters);
  if (!context.target || !Number.isFinite(context.target.hp) || context.target.hp <= 0) {
    throw new Error('effect.target: requires a living target with finite HP');
  }
  handlers[effectId].apply(context, parameters);
}
