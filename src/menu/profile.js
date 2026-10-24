export const PROFILE_KEY = "moba-lab.profile.v1";
export const COUNTRIES = Object.freeze({
  PH: "Philippines",
  US: "United States",
  JP: "Japan",
});
export const GENDERS = Object.freeze(["Male", "Female"]);
export function usernameError(value) {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) return "Enter a username to begin.";
  if (name.length < 4 || name.length > 20) return "Use 4–20 characters.";
  if (!/^[A-Za-z0-9_]+$/.test(name))
    return "Use letters, numbers and underscores only.";
  return "";
}
export function validateProfile(value) {
  if (!value || typeof value !== "object" || typeof value.username !== "string")
    return null;
  if (
    usernameError(value.username) ||
    !Object.hasOwn(COUNTRIES, value.country) ||
    !GENDERS.includes(value.gender)
  )
    return null;
  return {
    username: value.username.trim(),
    country: value.country,
    gender: value.gender,
  };
}
export class ProfileStore {
  constructor(storage) {
    this.storage = storage;
    this.profile = null;
    this.persistent = false;
  }
  load() {
    try {
      this.profile = validateProfile(
        JSON.parse(this.storage?.getItem(PROFILE_KEY) || "null"),
      );
      this.persistent = Boolean(this.profile);
    } catch {
      this.profile = null;
      this.persistent = false;
    }
    return this.profile;
  }
  save(value) {
    const profile = validateProfile(value);
    if (!profile) throw new Error("Invalid local profile");
    this.profile = profile;
    this.persistent = false;
    try {
      this.storage?.setItem(PROFILE_KEY, JSON.stringify(profile));
      const read = validateProfile(
        JSON.parse(this.storage?.getItem(PROFILE_KEY) || "null"),
      );
      this.persistent = Boolean(
        read && JSON.stringify(read) === JSON.stringify(profile),
      );
    } catch {
      /* Private/file-origin storage can be unavailable. Session stays usable. */
    }
    return this.profile;
  }
}
export function browserStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
