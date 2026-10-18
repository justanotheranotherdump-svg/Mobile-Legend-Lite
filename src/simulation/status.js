export const heroes = (a) => ["player", "bot", "hero"].includes(a.kind);
export const recoveryMultiplier = (s, a) =>
  (a.antiHealUntil > s.time ? 0.6 : 1) * (a.recoveryBoost || 1);
export function healActor(s, a, hp, mana = 0) {
  if (a.hp <= 0) return 0;
  const before = a.hp;
  a.hp = Math.min(a.maxHp, a.hp + Math.max(0, hp) * recoveryMultiplier(s, a));
  if (Number.isFinite(a.maxMana))
    a.mana = Math.min(a.maxMana, a.mana + Math.max(0, mana));
  return a.hp - before;
}
export function grantShield(s, a, amount, duration, id) {
  a.shields ??= [];
  a.shields = a.shields.filter((x) => x.id !== id);
  const shield = {
    id,
    amount: amount * recoveryMultiplier(s, a),
    until: s.time + duration,
  };
  a.shields.push(shield);
  return shield;
}
export function absorbShields(s, a, amount) {
  for (const shield of [a.shield, ...(a.shields || [])])
    if (shield && shield.until > s.time && shield.amount > 0) {
      const block = Math.min(amount, shield.amount);
      shield.amount -= block;
      amount -= block;
    }
  return amount;
}
export const controlImmune = (s, a) => a.controlImmuneUntil > s.time;
export function slowActor(s, a, ratio, duration) {
  if (controlImmune(s, a) || a.slowImmuneUntil > s.time) return false;
  const old = a.slow;
  a.slow = {
    ratio: old?.until > s.time ? Math.max(old.ratio, ratio) : ratio,
    until: s.time + duration * (1 - (a.tenacity || 0)),
  };
  return true;
}
export function stunActor(s, a, duration) {
  if (controlImmune(s, a)) return false;
  a.stunnedUntil = Math.max(
    a.stunnedUntil || 0,
    s.time + duration * (1 - (a.tenacity || 0)),
  );
  a.stunned = true;
  return true;
}
export function cleanse(a) {
  a.slow = null;
  a.stunnedUntil = 0;
  a.stunned = false;
  a.mark = null;
  a.marks = {};
  a.antiHealUntil = 0;
  a.afterPetrify = null; /* suppression deliberately remains */
}
export function tickStatus(s, a) {
  if (a.afterPetrify && s.time >= a.afterPetrify.at) {
    slowActor(s, a, a.afterPetrify.ratio, a.afterPetrify.duration);
    a.afterPetrify = null;
  }
  a.stunned = Boolean(a.stunnedUntil > s.time || a.suppressionUntil > s.time);
  a.shields = (a.shields || []).filter((x) => x.until > s.time && x.amount > 0);
}
