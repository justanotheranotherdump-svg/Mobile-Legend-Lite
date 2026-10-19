import {playableHeroIds} from "../heroes/commerce.js";
import { createMatchConfig } from "../match/config.js";
export function rosterFor(config, profile) {
  const picks = assignTeamHeroes(
    config.availableHeroes || ["layla"],
    config.heroId || "layla",
    config.allyCount ?? config.teamSize - 1,
    config.enemyCount ?? config.teamSize,
  );
  return {
    player: [
      { name: profile.username, kind: "PLAYER", heroId: config.heroId ?? null, hero: config.heroId ? config.heroId[0].toUpperCase()+config.heroId.slice(1) : "Not selected" },
      ...Array.from(
        {
          length:
            config.mode === "practice"
              ? 0
              : (config.allyCount ?? config.teamSize - 1),
        },
        (_, i) => ({
          name: `Ally Computer ${i + 1}`,
          kind: "COMPUTER",
          hero: picks.player[i+1][0].toUpperCase()+picks.player[i+1].slice(1),
          heroId: picks.player[i + 1],
          ready: true,
        }),
      ),
    ],
    enemy:
      config.mode === "practice"
        ? [
            {
              name: "Target Dummies",
              kind: "STATIONARY",
              hero: "Dummy Practice",
            },
          ]
        : Array.from(
            { length: config.enemyCount ?? config.teamSize },
            (_, i) => ({
              name: `Computer ${i + 1}`,
              kind: "COMPUTER",
              hero: picks.enemy[i][0].toUpperCase()+picks.enemy[i].slice(1),
              heroId: picks.enemy[i],
              ready: true,
            }),
          ),
  };
}
export class MatchFlow {
  constructor() {
    this.mode = "ai-training";
    this.difficulty = "normal";
    this.teamSize = 5;
    this.allyCount = 4;
    this.enemyCount = 5;
    this.selectionSeconds = 45;
    this.availableHeroes = [...playableHeroIds];
    this.ownedHeroes=["layla"];
    this.heroId = null;
    this.preparing = false;
    this.result = null;
  }
  chooseMode(mode) {
    createMatchConfig(mode);
    this.mode = mode;
    this.allyCount = mode === "brawl" ? 0 : 4;
    this.enemyCount = mode === "brawl" ? 0 : 5;
    this.heroId = null;
    this.config = null;
    this.confirmedRoster = null;
  }
  configure(difficulty, teamSize = 5) {
    createMatchConfig(this.mode, difficulty, teamSize);
    this.difficulty = difficulty;
    this.teamSize = teamSize;
    if (this.mode !== "brawl") {
      this.allyCount = teamSize - 1;
      this.enemyCount = teamSize;
    }
  }
  startSelection() {
    if (this.preparing) return false;
    if (this.mode !== "practice" && this.enemyCount < 1) return false;
    this.config = createMatchConfig(
      this.mode,
      this.difficulty,
      this.teamSize,
      this.mode === "practice" ? null : this,
    );
    // Draft configuration reads the same nullable selection, never the match
    // factory's default hero. No second stale/default selected-hero field.
    Object.defineProperty(this.config,'heroId',{enumerable:true,get:()=>this.heroId});
    this.config.availableHeroes = [...this.availableHeroes];
    this.selectionEndsAt = Date.now() + this.selectionSeconds * 1000;
    this.heroId = null;
    return true;
  }
  editComputer(team, delta) {
    const key = team === "player" ? "allyCount" : "enemyCount",
      max = team === "player" ? 4 : 5;
    this[key] = Math.max(0, Math.min(max, this[key] + delta));
    return this[key];
  }
  roster(profile) {
    return rosterFor(
      {
        mode: this.mode,
        teamSize: this.teamSize,
        allyCount: this.allyCount,
        enemyCount: this.enemyCount,
        availableHeroes: this.availableHeroes,
        heroId: this.heroId,
      },
      profile,
    );
  }
  selectableHeroes() {
    return this.availableHeroes.filter(id => this.ownedHeroes.includes(id));
  }
  selectHero(id) {
    if (id !== null && !this.availableHeroes.includes(id)) throw Error("Unavailable hero");
    if (id !== null && !this.ownedHeroes.includes(id)) throw Error("Unowned hero: unlock in Shop first");
    this.heroId = id;
  }
  confirm(profile) {
    if (this.preparing) return null;
    if (!this.heroId || !this.ownedHeroes.includes(this.heroId)) throw Error("Choose an owned hero before confirming");
    if (!this.config) throw Error("Start selection from the local room");
    createMatchConfig(
      this.config.mode,
      this.config.difficulty,
      this.config.teamSize,
      this.config.mode === "practice" ? null : this.config,
    );
    this.preparing = true;
    if (profile) this.confirmedRoster = rosterFor({...this.config,heroId:this.heroId}, profile);
    const roster=this.confirmedRoster;
    return { ...this.config, heroId:this.heroId, botHeroIds:roster?{player:roster.player.slice(1).map(a=>a.heroId),enemy:roster.enemy.filter(a=>a.kind!=="STATIONARY").map(a=>a.heroId)}:null };
  }
}

// Team-local uniqueness policy is ready for future REAL hero implementations.
// At <5 available heroes, duplicates are allowed; never fabricate hero assets.
export function assignTeamHeroes(available, humanId, allies, enemies) {
  if (!available.includes(humanId) || !available.length)
    throw Error("Unavailable hero");
  const unique = available.length >= 5,
    blue = [humanId],
    red = [];
  for (let i = 0; i < allies; i++)
    blue.push(
      unique
        ? available.filter((id) => id !== humanId)[i]
        : available[i % available.length],
    );
  for (let i = 0; i < enemies; i++) red.push(available[i % available.length]);
  return { player: blue, enemy: red, duplicatesAllowed: !unique };
}
