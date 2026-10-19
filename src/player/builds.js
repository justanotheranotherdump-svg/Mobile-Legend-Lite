import {validateRoleSetup} from "./role-setup.js";
import { getItem, recipeData } from "../match/recipes.js";
export const buildKey = (name) =>
  "moba-lab.builds.v1:" + encodeURIComponent(name);
export function validBuild(items) {
  return (
    Array.isArray(items) &&
    items.length > 0 &&
    items.length <= 6 &&
    items.every(
      (id) => getItem(id)?.type === "standard_purchase" && recipeData.items[id].tier === "completed",
    ) &&
    new Set(items).size === items.length &&
    items.filter((id) => getItem(id).category === "Movement").length <= 1 &&
    items.filter(id=>getItem(id).effects?.some(e=>["wind-chant","frozen"].includes(e))).length<=1
  );
}
export function validateBuilds(raw, owned = ["layla"]) {
  const out = { version: 1, heroes: {} };
  if (raw?.version !== 1) return out;
  for (const hero of owned) {
    const h = raw.heroes?.[hero];
    if (!h || !Array.isArray(h.builds)) continue;
    const ids = new Set();
    const builds = h.builds
      .filter(
        (b) =>
          b &&
          /^[a-zA-Z0-9_-]{1,64}$/.test(b.id) &&
          typeof b.name === "string" &&
          b.name.trim().length > 0 &&
          b.name.length <= 32 &&
          validBuild(b.items) &&
          !ids.has(b.id) &&
          ids.add(b.id),
      )
      .slice(0, 3)
      .map((b) => ({ id: b.id, name: b.name, items: [...b.items] }));
    out.heroes[hero] = {
      builds,
      roleSetup:validateRoleSetup(h.roleSetup),
      selected: builds.some((b) => b.id === h.selected) ? h.selected : null,
    };
  }
  return out;
}
export class BuildStore {
  constructor(storage, username, owned = ["layla"]) {
    this.storage = storage;
    this.key = buildKey(username);
    this.owned = owned;
    let raw;
    try {
      raw = JSON.parse(storage?.getItem(this.key));
    } catch {}
    this.value = validateBuilds(raw, owned);
  }
  hero(id) {
    return this.value.heroes[id] || { builds: [], selected: null };
  }
  selected(id) {
    const h = this.hero(id);
    return h.builds.find((b) => b.id === h.selected) || null;
  }
  saveBuild(hero, build) {
    if (
      !this.owned.includes(hero) ||
      !validBuild(build.items) ||
      !build.name?.trim() ||
      build.name.length > 32
    )
      return "invalid-build";
    const h = this.hero(hero),
      existing = h.builds.findIndex((b) => b.id === build.id);
    if (existing < 0 && h.builds.length >= 3) return "three-build-limit";
    const b = {
      id:
        existing < 0
          ? "build-" +
            Date.now().toString(36) +
            "-" +
            Math.random().toString(36).slice(2, 7)
          : build.id,
      name: build.name.trim(),
      items: [...build.items],
    };
    if (existing < 0) h.builds.push(b);
    else h.builds[existing] = b;
    h.selected = b.id;
    this.value.heroes[hero] = h;
    this.save();
    return "ok";
  }
  select(hero, id) {
    const h = this.hero(hero);
    if (id !== null && !h.builds.some((b) => b.id === id)) return false;
    h.selected = id;
    this.value.heroes[hero] = h;
    this.save();
    return true;
  }
  setRoleSetup(hero,setup){if(!this.owned.includes(hero))return false;const h=this.hero(hero);h.roleSetup=validateRoleSetup(setup);this.value.heroes[hero]=h;this.save();return true;}
  remove(hero, id) {
    const h = this.hero(hero);
    h.builds = h.builds.filter((b) => b.id !== id);
    if (h.selected === id) h.selected = null;
    this.value.heroes[hero] = h;
    this.save();
  }
  save() {
    this.persistent = false;
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.value));
      this.persistent =
        this.storage?.getItem(this.key) === JSON.stringify(this.value);
    } catch {}
  }
}
