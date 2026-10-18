export class WaveScheduler {
  constructor(config) {
    this.config = config;
    this.next = config.firstAt;
    this.count = 0;
  }
  due(time) {
    const waves = [];
    while (time + 1e-8 >= this.next) {
      waves.push(++this.count);
      this.next = this.config.firstAt + this.count * this.config.interval;
    }
    return waves;
  }
}
