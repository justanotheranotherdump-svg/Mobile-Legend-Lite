// Plain numbers only: gameplay does not depend on Three.js or a character mesh.
export function cameraRelativeDirection(horizontal, vertical) {
  const length = Math.hypot(horizontal, vertical);
  if (!length) return { x: 0, z: 0 };
  const scale = 1 / Math.max(1, length);
  const h = horizontal * scale;
  const v = vertical * scale; // positive is screen-up
  return { x: (h - v) * Math.SQRT1_2, z: (-h - v) * Math.SQRT1_2 };
}

export function overlapsBox(x, z, radius, box) {
  const closestX = Math.max(box.x - box.width / 2, Math.min(x, box.x + box.width / 2));
  const closestZ = Math.max(box.z - box.depth / 2, Math.min(z, box.z + box.depth / 2));
  return Math.hypot(x - closestX, z - closestZ) < radius - 1e-8;
}

export function moveEntity(entity, direction, dt, arena, circles = []) {
  if (entity.stunned || entity.hp <= 0) return;
  const distance = entity.speed * dt;
  // Small bounded steps prevent crossing thin obstacles at low render rates.
  const steps = Math.max(1, Math.ceil(distance / (entity.radius * 0.4)));
  const dx = direction.x * distance / steps;
  const dz = direction.z * distance / steps;
  const limit = arena.halfSize - entity.radius;
  const blocked = (x, z) => arena.obstacles.some(box => overlapsBox(x, z, entity.radius, box))
    || circles.some(c => c.hp > 0 && Math.hypot(c.x - x, c.z - z) < c.radius + entity.radius - 1e-8);
  for (let step = 0; step < steps; step++) {
    const x = Math.max(-limit, Math.min(limit, entity.x + dx));
    if (!blocked(x, entity.z)) entity.x = x;
    const z = Math.max(-limit, Math.min(limit, entity.z + dz));
    if (!blocked(entity.x, z)) entity.z = z;
  }
}
