// Target policy is mesh/UI independent. Distances use ground-plane centers.
export const TARGET_MODES = Object.freeze({
  nearest: 'Nearest Enemy',
  'current-hp': 'Lowest Current HP',
  'hp-percent': 'Lowest HP Percentage',
  manual: 'Manual Target',
});
export const distanceTo = (player, enemy) => Math.hypot(player.x - enemy.x, player.z - enemy.z);
export const isEligibleEnemy = enemy => Boolean(enemy
  && typeof enemy.id === 'string' && enemy.id.length
  && enemy.team === 'enemy' && enemy.targetable !== false
  && Number.isFinite(enemy.x) && Number.isFinite(enemy.z)
  && Number.isFinite(enemy.hp) && enemy.hp > 0
  && Number.isFinite(enemy.maxHp) && enemy.maxHp > 0);
export const inAttackRange = (player, enemy) => distanceTo(player, enemy) <= player.range + 1e-8;

export function validateTargetMode(mode) {
  if (!Object.hasOwn(TARGET_MODES, mode)) throw new Error(`Unknown targeting mode: ${mode}`);
}

export function selectAutomaticTarget(player, enemies, mode) {
  validateTargetMode(mode);
  const score = enemy => mode === 'current-hp' ? enemy.hp
    : mode === 'hp-percent' ? enemy.hp / enemy.maxHp : distanceTo(player, enemy);
  return enemies.filter(enemy => isEligibleEnemy(enemy) && inAttackRange(player, enemy))
    .sort((a, b) => score(a) - score(b) || distanceTo(player, a) - distanceTo(player, b)
      || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))[0] ?? null;
}
