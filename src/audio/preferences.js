export const PREFERENCES_KEY = "moba-lab.preferences.v1";
export const DEFAULT_PREFERENCES = Object.freeze({
  masterMuted: false,
  musicEnabled: true,
  effectsEnabled: true,
  masterVolume: 0.65,
  musicVolume: 0.5,
  effectsVolume: 0.6,
  reduceMotion: false,
});
export function normalizePreferences(value) {
  const result = { ...DEFAULT_PREFERENCES };
  if (!value || typeof value !== "object") return result;
  for (const key of [
    "masterMuted",
    "musicEnabled",
    "effectsEnabled",
    "reduceMotion",
  ])
    if (typeof value[key] === "boolean") result[key] = value[key];
  for (const key of ["masterVolume", "musicVolume", "effectsVolume"])
    if (typeof value[key] === "number" && Number.isFinite(value[key]))
      result[key] = Math.max(0, Math.min(1, value[key]));
  return result;
}
export class PreferenceStore {
  constructor(storage) {
    this.storage = storage;
    this.listeners = new Set();
    this.persistent = false;
    let raw = null;
    try {
      raw = JSON.parse(storage?.getItem(PREFERENCES_KEY) || "null");
    } catch {}
    this.value = normalizePreferences(raw);
    this.persistent = Boolean(raw);
  }
  update(patch) {
    this.value = normalizePreferences({ ...this.value, ...patch });
    this.persistent = false;
    try {
      this.storage?.setItem(PREFERENCES_KEY, JSON.stringify(this.value));
      this.persistent =
        JSON.stringify(
          normalizePreferences(
            JSON.parse(this.storage?.getItem(PREFERENCES_KEY) || "null"),
          ),
        ) === JSON.stringify(this.value) &&
        this.storage?.getItem(PREFERENCES_KEY) != null;
    } catch {}
    for (const callback of this.listeners) callback({ ...this.value });
    return { ...this.value };
  }
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }
}
