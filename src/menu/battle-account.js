import { getSpell, unlocked } from "../spells/catalog.js";
export const ACCOUNT_RULES = Object.freeze({
  version: 1,
  xpPerLevel: 100,
  xpPerCompletedLaneMatch: 100,
  maxLevel: 25,
});
export const battleAccountKey = (username) =>
  "moba-lab.battle.v1:" + encodeURIComponent(username);
export const accountLevel = (xp) =>
  Math.min(25, 1 + Math.floor(xp / ACCOUNT_RULES.xpPerLevel));
export function validateBattleAccount(raw) {
  if (
    !raw ||
    raw.version !== 1 ||
    !Number.isSafeInteger(raw.xp) ||
    raw.xp < 0 ||
    raw.xp > 2400
  )
    return null;
  const level = accountLevel(raw.xp);
  return {
    version: 1,
    xp: raw.xp,
    selected: unlocked(raw.selected, level) ? raw.selected : "execute",
    completed: Array.isArray(raw.completed)
      ? raw.completed.filter((x) => typeof x === "string").slice(-32)
      : [],
  };
}
export class BattleAccountStore {
  constructor(storage, username) {
    this.storage = storage;
    this.key = battleAccountKey(username);
    let raw;
    try {
      raw = JSON.parse(storage?.getItem(this.key));
    } catch {}
    this.value = validateBattleAccount(raw) || {
      version: 1,
      xp: 0,
      selected: "execute",
      completed: [],
    };
    this.save();
  }
  get level() {
    return accountLevel(this.value.xp);
  }
  save() {
    this.persistent = false;
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.value));
      this.persistent =
        this.storage?.getItem(this.key) === JSON.stringify(this.value);
    } catch {}
  }
  equip(id) {
    if (!unlocked(id, this.level)) return "locked";
    this.value.selected = id;
    this.save();
    return "ok";
  }
  award(id) {
    if (this.value.completed.includes(id)) return false;
    this.value.xp = Math.min(
      2400,
      this.value.xp + ACCOUNT_RULES.xpPerCompletedLaneMatch,
    );
    this.value.completed.push(id);
    this.value.completed = this.value.completed.slice(-32);
    this.save();
    return true;
  }
  snapshot() {
    return {
      ...structuredClone(this.value),
      level: this.level,
      persistent: this.persistent,
    };
  }
}
