// Shared protection state is consumed by every attack/ability/projectile guard.
export function refreshObjectiveProtection(structures) {
  const byId = new Map(structures.map((o) => [o.id, o]));
  for (const o of structures) {
    o.protected = Boolean(o.requires && byId.get(o.requires).hp > 0);
    o.targetable = o.hp > 0 && !o.protected;
  }
}
