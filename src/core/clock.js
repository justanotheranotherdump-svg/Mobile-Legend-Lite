export class FixedClock {
  constructor(step = 1 / 60) { this.step = step; this.reset(); }
  reset() { this.last = null; this.accumulator = 0; }
  advance(timestamp, update) {
    if (this.last === null) { this.last = timestamp; return; }
    this.accumulator += Math.max(0, Math.min((timestamp - this.last) / 1000, 0.1));
    this.last = timestamp;
    let ticks = 0;
    while (this.accumulator + 1e-10 >= this.step && ticks < 6) {
      update(this.step);
      this.accumulator -= this.step;
      ticks++;
    }
    if (ticks === 6) this.accumulator = Math.max(0, Math.min(this.accumulator, this.step));
  }
}
