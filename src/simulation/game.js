import { cameraRelativeDirection, moveEntity } from './movement.js';

export class TrainingSimulation {
  constructor(arena, config) {
    this.arena = arena;
    this.config = config;
    this.reset();
  }

  reset() {
    this.time = 0;
    this.player = { ...this.config.player, hp: this.config.player.maxHp, cooldown: 0 };
    this.dummy = { ...this.config.dummy, hp: this.config.dummy.maxHp };
    this.hits = 0;
    this.lastAttack = { reason: 'ready', serial: 0 };
  }

  update(dt, horizontal = 0, vertical = 0) {
    this.time += dt;
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    moveEntity(this.player, cameraRelativeDirection(horizontal, vertical), dt, this.arena, [this.dummy]);
  }

  attack(targetId) {
    let reason = 'hit';
    if (targetId !== 'dummy') reason = 'no-target';
    else if (this.dummy.hp <= 0) reason = 'dead';
    else if (Math.hypot(this.player.x - this.dummy.x, this.player.z - this.dummy.z) > this.player.range + 1e-8) reason = 'range';
    else if (this.player.cooldown > 1e-8) reason = 'cooldown';
    if (reason === 'hit') {
      this.dummy.hp = Math.max(0, this.dummy.hp - this.player.damage);
      this.player.cooldown = this.player.attackCooldown;
      this.hits++;
    }
    this.lastAttack = { reason, serial: this.lastAttack.serial + 1 };
    return reason;
  }

  snapshot() {
    return structuredClone({ player: this.player, dummy: this.dummy, hits: this.hits, time: this.time, lastAttack: this.lastAttack });
  }
}
