export function number(value, path, min = 0, max = 1e9) {
  if (!Number.isFinite(value) || value < min || value > max)
    throw Error(`${path}: expected finite number in [${min}, ${max}]`);
  return value;
}
export function integer(value, path, min = 0, max = 1e9) {
  number(value, path, min, max);
  if (!Number.isSafeInteger(value)) throw Error(`${path}: expected a safe integer`);
  return value;
}
export function keys(value, expected, path) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error(`${path}: expected object`);
  for (const k of Object.keys(value)) if (!expected.includes(k)) throw Error(`${path}.${k}: unknown field`);
  for (const k of expected) if (!Object.hasOwn(value, k)) throw Error(`${path}.${k}: required field missing`);
}
