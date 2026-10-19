import { validBuild } from "../player/builds.js";
// Completed build entries are remembered for this match, even if later sold or
// combined. Recommendation changes never spend gold or mutate inventory.
export class BuildPriority {
  constructor(sequence) {
    this.sequence = validBuild(sequence) ? [...sequence] : [];
    this.completed = new Set();
    this.manual = null;
    this.paused = false;
  }
  refresh(inventory) {
    for (const id of this.sequence)
      if (inventory.includes(id)) this.completed.add(id);
    if (this.manual && inventory.includes(this.manual) && this.sequence.length)
      this.manual = null;
    if (this.paused) return null;
    return (
      this.manual || this.sequence.find((id) => !this.completed.has(id)) || null
    );
  }
  prioritize(id) {
    this.manual = id;
    this.paused = id === null;
  }
  resume() {
    this.manual = null;
    this.paused = false;
  }
  snapshot() {
    return {
      sequence: [...this.sequence],
      completed: [...this.completed],
      manual: this.manual,
      paused: this.paused,
    };
  }
}
