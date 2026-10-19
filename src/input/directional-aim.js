export const AIM_WHEEL_RADIUS = 58;
// Relative screen drag -> camera's ground-plane basis, independent of where on
// the screen the skill button was pressed. Circular placement uses stick travel.
export function directionalAim(
  view,
  player,
  range,
  startX,
  startY,
  x,
  y,
  area = false,
) {
  const dx = x - startX,
    dy = y - startY,
    n = Math.hypot(dx, dy);
  if (!Number.isFinite(n) || n < 6 || !player || !(range > 0)) return null;
  const a = view.groundAtClient(startX, startY),
    b = view.groundAtClient(startX + dx, startY + dy);
  if (!a || !b) return null;
  const wx = b.x - a.x,
    wz = b.z - a.z,
    length = Math.hypot(wx, wz);
  if (length < 1e-7) return null;
  const distance = range * (area ? Math.min(1, n / AIM_WHEEL_RADIUS) : 1);
  return {
    x: player.x + (wx / length) * distance,
    z: player.z + (wz / length) * distance,
  };
}
export function aimingShape(a) {
  if (a.targetShape) return a.targetShape;
  if (a.aimStyle === "none") return "none";
  if (a.aimStyle === "area") return "self-area";
  if (a.effectId === "fury-shock") return "self-area";
  if (a.effectId === "orb-mark") return "circle";
  if (a.effectId === "line-blast") return "line";
  return "projectile";
}
