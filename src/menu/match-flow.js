import { createMatchConfig } from "../match/config.js";
export function rosterFor(config, profile) {
  return {
    player: [
      { name: profile.username, kind: "PLAYER", hero: "Layla" },
      ...Array.from(
        { length: config.mode === "practice" ? 0 : config.teamSize - 1 },
        (_, i) => ({
          name: `Ally Training Bot ${i + 1}`,
          kind: "COMPUTER",
          hero: "Training Bot",
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
        : Array.from({ length: config.teamSize }, (_, i) => ({
            name: `Enemy Training Bot ${i + 1}`,
            kind: "COMPUTER",
            hero: "Training Bot",
          })),
  };
}
export class MatchFlow {
  constructor() {
    this.mode = "ai-training";
    this.difficulty = "normal";
    this.teamSize = 5;
    this.heroId = null;
    this.preparing = false;
    this.result = null;
  }
  chooseMode(mode) {
    createMatchConfig(mode);
    this.mode = mode;
    this.heroId = null;
    this.config = null;
    this.confirmedRoster = null;
  }
  configure(difficulty, teamSize = 5) {
    createMatchConfig(this.mode, difficulty, teamSize);
    this.difficulty = difficulty;
    this.teamSize = teamSize;
  }
  startSelection() {
    if (this.preparing) return false;
    this.config = createMatchConfig(this.mode, this.difficulty, this.teamSize);
    this.heroId = null;
    return true;
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
    );
    this.preparing = true;
    if (profile) this.confirmedRoster = rosterFor(this.config, profile);
    return { ...this.config, heroId: this.heroId };
  }
}
