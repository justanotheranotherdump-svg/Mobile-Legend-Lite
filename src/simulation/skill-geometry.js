// Swept ground-plane tests. Neither Three.js nor model bounds participate.
export function segmentCircle(a, b, e, r = 0) {
  const dx = b.x - a.x,
    dz = b.z - a.z,
    fx = a.x - e.x,
    fz = a.z - e.z,
    R = e.radius + r,
    A = dx * dx + dz * dz,
    C = fx * fx + fz * fz - R * R;
  if (C <= 0) return 0;
  if (A < 1e-14) return null;
  const B = 2 * (fx * dx + fz * dz),
    D = B * B - 4 * A * C;
  if (D < 0) return null;
  const t = (-B - Math.sqrt(D)) / (2 * A);
  return t >= 0 && t <= 1 ? t : null;
}
export function segmentBox(a, b, box, r = 0) {
  let lo = 0,
    hi = 1;
  for (const [axis, half] of [
    ["x", box.width / 2 + r],
    ["z", box.depth / 2 + r],
  ]) {
    const d = b[axis] - a[axis],
      min = box[axis] - half,
      max = box[axis] + half;
    if (Math.abs(d) < 1e-12) {
      if (a[axis] < min || a[axis] > max) return null;
    } else {
      let t0 = (min - a[axis]) / d,
        t1 = (max - a[axis]) / d;
      if (t0 > t1) [t0, t1] = [t1, t0];
      lo = Math.max(lo, t0);
      hi = Math.min(hi, t1);
      if (lo > hi) return null;
    }
  }
  return lo;
}
export const pointAlong = (a, b, t) => ({
  x: a.x + (b.x - a.x) * t,
  z: a.z + (b.z - a.z) * t,
});
export const canActorAct = (e) => Boolean(e && e.hp > 0 && !e.stunned);
export function distanceMultiplier(source, target, parameters) {
  if (
    parameters.excludedKinds.includes(target.kind) ||
    parameters.excludedKinds.includes(target.type)
  )
    return 1;
  return (
    1 +
    (parameters.maxMultiplier - 1) *
      Math.min(
        1,
        Math.max(
          0,
          Math.hypot(source.x - target.x, source.z - target.z) /
            parameters.referenceDistance,
        ),
      )
  );
}
