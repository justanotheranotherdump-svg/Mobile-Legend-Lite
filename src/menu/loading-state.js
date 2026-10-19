import presentation from "../data/match/presentation.json" with { type: "json" };
// Two independent requirements: actual readiness and minimum lineup presentation.
// This state owns its ticker/wait; it never starts or advances simulation time.
export class LocalLoadingState {
  constructor({
    minimumMs = presentation.loadingMinimumMs,
    now = () => performance.now(),
    sleep = (ms) => new Promise((r) => setTimeout(r, ms)),
  } = {}) {
    if (!Number.isFinite(minimumMs) || minimumMs < 0)
      throw Error("Invalid loading duration");
    this.minimumMs = minimumMs;
    this.now = now;
    this.sleep = sleep;
    this.startedAt = now();
    this.completed = 0;
    this.ready = false;
    this.disposed = false;
  }
  get elapsed() {
    return Math.max(0, this.now() - this.startedAt);
  }
  get canEnter() {
    return this.ready && this.elapsed >= this.minimumMs && !this.disposed;
  }
  task(completed) {
    this.completed = completed;
    this.ready = completed === 7;
  }
  async finish() {
    if (!this.ready) throw Error("Local resources not ready");
    while (!this.canEnter) {
      if (this.disposed) throw Error("Loading cancelled");
      await this.sleep(Math.max(1, this.minimumMs - this.elapsed));
    }
  }
  dispose() {
    this.disposed = true;
  }
}
