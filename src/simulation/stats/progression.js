import { number, integer, keys } from './validation.js';
export function validateProgression(config, path = 'progression') {
  keys(config, ['minLevel','maxLevel','xpThresholds'], path);
  integer(config.minLevel, `${path}.minLevel`, 1, 1);
  integer(config.maxLevel, `${path}.maxLevel`, 2, 100);
  if (!Array.isArray(config.xpThresholds) || config.xpThresholds.length !== config.maxLevel)
    throw Error(`${path}.xpThresholds: expected one cumulative threshold per level`);
  config.xpThresholds.forEach((xp, i) => {
    integer(xp, `${path}.xpThresholds[${i}]`);
    if (i === 0 ? xp !== 0 : xp <= config.xpThresholds[i - 1]) throw Error(`${path}.xpThresholds[${i}]: must start at 0 and strictly increase`);
  });
}
export function validateRanks(a, maxLevel, path) {
  if (a.slot === 'passive') {
    if (a.ranks !== null) throw Error(`${path}.ranks: passive must have null ranks`);
    return;
  }
  keys(a.ranks, ['max','requiredLevels','damage','manaCost','cooldown','bonusDamage'], `${path}.ranks`);
  const expected = a.slot === 'skill-ultimate' ? 3 : 6;
  integer(a.ranks.max, `${path}.ranks.max`, expected, expected);
  for (const key of ['requiredLevels','damage','manaCost','cooldown','bonusDamage']) {
    const values = a.ranks[key];
    if (!Array.isArray(values) || values.length !== expected) throw Error(`${path}.ranks.${key}: expected ${expected} rank values`);
    values.forEach((v, i) => {
      const p = `${path}.ranks.${key}[${i}]`;
      key === 'requiredLevels' ? integer(v, p, 1, maxLevel) : number(v, p, key === 'cooldown' ? .01 : 0, 1e6);
      if (key === 'requiredLevels' && i && v < values[i-1]) throw Error(`${p}: unlock levels must not decrease`);
    });
  }
  if (a.slot === 'skill-ultimate' && a.ranks.requiredLevels.join() !== '4,8,12') throw Error(`${path}.ranks.requiredLevels: ultimate requires levels 4,8,12`);
  for (const k of ['damage','manaCost','cooldown']) if (a[k] !== a.ranks[k][0]) throw Error(`${path}.${k}: must equal rank 1 preview`);
  if (a.effectId === 'orb-mark' && a.parameters.bonusDamage !== a.ranks.bonusDamage[0]) throw Error(`${path}.parameters.bonusDamage: must equal rank 1 preview`);
}
export class HeroProgression {
  constructor(hero) {
    validateProgression(hero.progression);
    this.hero = hero;
    this.setLevel(1);
  }
  get spent() { return Object.values(this.ranks).reduce((a,b) => a+b, 0); }
  get skillPoints() { return this.level - this.spent; }
  grantXp(amount) {
    integer(amount, 'XP grant', 0, Number.MAX_SAFE_INTEGER);
    const thresholds = this.hero.progression.xpThresholds;
    // Saturate BEFORE addition, so huge valid grants cannot overflow precision.
    this.totalXp = Math.min(thresholds.at(-1), this.totalXp + Math.min(amount, thresholds.at(-1)));
    while (this.level < thresholds.length && this.totalXp >= thresholds[this.level]) this.level++;
    return this.snapshot();
  }
  setLevel(level) {
    integer(level, 'Practice level', 1, this.hero.progression.maxLevel);
    this.level = level;
    this.totalXp = this.hero.progression.xpThresholds[level-1];
    this.ranks = Object.fromEntries(this.hero.abilities.filter(a => a.slot !== 'passive').map(a => [a.id, 0]));
    return this.snapshot();
  }
  upgradeReason(id) {
    const a = this.hero.abilities.find(a => a.id === id || a.slot === id);
    if (!a || a.slot === 'passive') return 'invalid-ability';
    const rank = this.ranks[a.id];
    if (rank >= a.ranks.max) return 'max-rank';
    if (this.level < a.ranks.requiredLevels[rank]) return `requires-level-${a.ranks.requiredLevels[rank]}`;
    return this.skillPoints > 0 ? null : 'no-skill-points';
  }
  upgrade(id) {
    const reason = this.upgradeReason(id);
    if (reason) return reason;
    const a = this.hero.abilities.find(a => a.id === id || a.slot === id);
    this.ranks[a.id]++;
    return 'upgraded';
  }
  snapshot() {
    const t = this.hero.progression.xpThresholds, atMax = this.level === t.length;
    return { level: this.level, totalXp: this.totalXp, xp: atMax ? 0 : this.totalXp - t[this.level-1],
      xpToNext: atMax ? 0 : t[this.level] - t[this.level-1], atMax,
      skillPoints: this.skillPoints, ranks: { ...this.ranks } };
  }
}
export function rankedAbility(a, progression) {
  if (a.slot === 'passive') return a;
  const rank = progression.ranks[a.id], index = Math.max(0, rank - 1);
  return { ...a, rank, damage: a.ranks.damage[index], manaCost: a.ranks.manaCost[index], cooldown: a.ranks.cooldown[index],
    parameters: { ...a.parameters, ...(a.effectId === 'orb-mark' ? { bonusDamage: a.ranks.bonusDamage[index] } : {}) } };
}
