import {playableHeroIds} from "../heroes/commerce.js";
export const historyKey = (name) =>
  "moba-lab.history.v1:" + encodeURIComponent(name);
export function validRecord(r) {
  return (
    r &&
    typeof r.id === "string" &&
    r.id.length < 128 &&
    playableHeroIds.includes(r.hero) &&
    ["brawl", "vs-ai", "ai-training", "custom"].includes(r.mode) &&
    ["Victory", "Defeat"].includes(r.result) &&
    Number.isFinite(r.duration) &&
    r.duration >= 0 &&
    r.duration < 86400 &&
    Number.isSafeInteger(r.at) &&
    r.at > 0 &&
    ["kills", "deaths", "assists", "level"].every(
      (k) => Number.isSafeInteger(r[k]) && r[k] >= 0,
    ) &&
    r.level >= 1 &&
    r.level <= 15
  );
}
export class HistoryStore {
  constructor(storage, name) {
    this.storage = storage;
    this.key = historyKey(name);
    let raw;
    try {
      raw = JSON.parse(storage?.getItem(this.key));
    } catch {}
    const ids = new Set();
    this.value = {
      version: 1,
      matches:
        raw?.version === 1 && Array.isArray(raw.matches)
          ? raw.matches
              .filter((r) => validRecord(r) && !ids.has(r.id) && ids.add(r.id))
              .slice(-100)
          : [],
    };
  }
  record(id, config, result, at = Date.now()) {
    const r = {
      id,
      hero: config.heroId,
      mode: config.mode,
      result: result.outcome,
      duration: result.duration,
      kills: result.eliminations,
      deaths: result.deaths,
      assists: result.assists,
      level: result.level,
      at,
    };
    if (!validRecord(r) || this.value.matches.some((x) => x.id === id))
      return false;
    this.value.matches.push(r);
    this.value.matches = this.value.matches.slice(-100);
    this.save();
    return true;
  }
  save() {
    this.persistent = false;
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.value));
      this.persistent =
        this.storage?.getItem(this.key) === JSON.stringify(this.value);
    } catch {}
  }
  stats() {
    const heroes = new Map();
    for (const r of this.value.matches) {
      const h = heroes.get(r.hero) || {
        hero: r.hero,
        matches: 0,
        wins: 0,
        losses: 0,
        last: 0,
      };
      h.matches++;
      h.wins += r.result === "Victory" ? 1 : 0;
      h.losses += r.result === "Defeat" ? 1 : 0;
      h.last = Math.max(h.last, r.at);
      heroes.set(r.hero, h);
    }
    return [...heroes.values()].sort(
      (a, b) => b.matches - a.matches || b.last - a.last,
    );
  }
}
