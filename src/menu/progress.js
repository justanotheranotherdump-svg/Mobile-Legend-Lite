// Separate from the validated identity profile. No purchases/earning API exists yet.
export const STARTING_COINS = 30000;
export const STARTING_DIAMONDS = 0;
export const progressKey = (username) =>
  `moba-lab.progress.v1:${encodeURIComponent(username)}`;
const balance = (n) => Number.isSafeInteger(n) && n >= 0;
export function validateProgress(value) {
  if (
    !value ||
    value.version !== 1 ||
    value.starterGrantApplied !== true ||
    !balance(value.coins) ||
    !balance(value.diamonds) ||
    !Array.isArray(value.ownedHeroes)
  )
    return null;
  return {
    version: 1,
    starterGrantApplied: true,
    coins: value.coins,
    diamonds: value.diamonds,
    ownedHeroes: ["layla"],
  };
}
export class ProgressStore {
  constructor(storage) {
    this.storage = storage;
    this.sessions = new Map();
    this.current = null;
    this.persistent = false;
    this.recovered = false;
  }
  loadFor(profile) {
    const key = progressKey(profile.username);
    if (this.sessions.has(key)) {
      const cached = this.sessions.get(key);
      Object.assign(this, cached);
      return this.snapshot();
    }
    let raw = null;
    try {
      raw = this.storage?.getItem(key) ?? null;
    } catch {}
    let existing = null;
    try {
      existing = validateProgress(JSON.parse(raw));
    } catch {}
    this.recovered = Boolean(raw && !existing);
    // A missing record gets the one-time grant, including migration of old profiles.
    // A corrupt existing wallet is recovered at zero, never re-granted repeatedly.
    this.current = existing || {
      version: 1,
      starterGrantApplied: true,
      coins: this.recovered ? 0 : STARTING_COINS,
      diamonds: STARTING_DIAMONDS,
      ownedHeroes: ["layla"],
    };
    this.persistent = false;
    try {
      this.storage?.setItem(key, JSON.stringify(this.current));
      this.persistent =
        JSON.stringify(
          validateProgress(JSON.parse(this.storage?.getItem(key) || "null")),
        ) === JSON.stringify(this.current);
    } catch {}
    this.sessions.set(key, {
      current: this.current,
      persistent: this.persistent,
      recovered: this.recovered,
    });
    return this.snapshot();
  }
  snapshot() {
    return (
      this.current && {
        ...this.current,
        ownedHeroes: [...this.current.ownedHeroes],
      }
    );
  }
}
