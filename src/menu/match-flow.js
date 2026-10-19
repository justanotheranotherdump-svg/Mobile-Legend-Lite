import { createMatchConfig } from "../match/config.js";
export function rosterFor(config, profile) {
  const picks = assignTeamHeroes(
    config.availableHeroes || ["layla"],
    "layla",
    config.allyCount ?? config.teamSize - 1,
    config.enemyCount ?? config.teamSize,
  );
  return {
    player: [
      { name: profile.username, kind: "PLAYER", hero: "Layla" },
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
          hero: "Layla",
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
              hero: "Layla",
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
    this.availableHeroes = ["layla"];
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
      },
      profile,
    );
  }
  selectHero(id) {
    if (id !== "layla") throw Error("Only Layla is currently playable");
    this.heroId = id;
  }
  confirm(profile) {
    if (this.preparing) return null;
    if (this.heroId !== "layla") throw Error("Choose Layla before confirming");
    if (!this.config) throw Error("Start selection from the local room");
    createMatchConfig(
      this.config.mode,
      this.config.difficulty,
      this.config.teamSize,
      this.config.mode === "practice" ? null : this.config,
    );
    this.preparing = true;
    if (profile) this.confirmedRoster = rosterFor(this.config, profile);
    return { ...this.config, heroId: this.heroId };
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
