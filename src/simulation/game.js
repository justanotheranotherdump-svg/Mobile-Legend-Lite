import { createHeroState } from '../heroes/registry.js';
import { executeEffect } from './effects.js';
import { cameraRelativeDirection, moveEntity } from './movement.js';
import { inAttackRange, isEligibleEnemy, selectAutomaticTarget, validateTargetMode } from './targeting.js';

export class TrainingSimulation {
  constructor(arena, config, heroRegistry) {
    this.arena = arena;
    this.config = config;
    this.hero = heroRegistry.get(config.player.heroId);
    this.reset();
  }

  reset() {
    this.time = 0;
    this.player = createHeroState(this.hero, this.config.player);
    this.enemies = this.config.dummies.map(dummy => ({ ...dummy }));
    this.targetMode = this.config.targeting.defaultMode;
    validateTargetMode(this.targetMode);
    this.manualTargetId = null;
    this.selectedTargetId = null;
    this.hits = 0;
    this.lastAttack = { reason: 'ready', serial: 0, targetId: null };
    this.refreshTarget();
  }

  get selectedTarget() { return this.enemies.find(enemy => enemy.id === this.selectedTargetId) ?? null; }

  refreshTarget() {
    const manual = this.enemies.find(enemy => enemy.id === this.manualTargetId);
    if (isEligibleEnemy(manual)) this.selectedTargetId = manual.id;
    else {
      this.manualTargetId = null;
      this.selectedTargetId = selectAutomaticTarget(this.player, this.enemies, this.targetMode)?.id ?? null;
    }
    return this.selectedTarget;
  }

  setTargetMode(mode) {
    validateTargetMode(mode);
    this.targetMode = mode;
    this.clearManualTarget();
  }

  clearManualTarget() { this.manualTargetId = null; this.refreshTarget(); }

  prioritizeTarget(id) {
    const enemy = this.enemies.find(candidate => candidate.id === id);
    if (!isEligibleEnemy(enemy)) return false;
    this.manualTargetId = enemy.id;
    this.refreshTarget();
    return true;
  }

  update(dt, horizontal = 0, vertical = 0) {
    this.time += dt;
    this.player.cooldown = Math.max(0, this.player.cooldown - dt);
    moveEntity(this.player, cameraRelativeDirection(horizontal, vertical), dt, this.arena, this.enemies);
    this.refreshTarget();
  }

  // A null click/attack button requests smart targeting. A direct ID pins only
  // an eligible living enemy. No targeting action ever calls movement.
  attack(clickedId = null) {
    this.refreshTarget();
    const clicked = this.enemies.find(enemy => enemy.id === clickedId);
    let reason = null;
    if (clickedId !== null && !this.prioritizeTarget(clickedId)) reason = clicked?.hp <= 0 ? 'dead' : 'invalid-target';
    const target = this.selectedTarget;
    if (!reason && !target) reason = this.enemies.some(isEligibleEnemy) ? 'range' : 'no-enemies';
    if (!reason && !inAttackRange(this.player, target)) reason = 'range';
    if (!reason && this.player.cooldown > 1e-8) reason = 'cooldown';
    if (!reason) {
      executeEffect(this.hero.basicAttack.effectId, { source: this.player, target }, { damage: this.player.damage });
      this.player.cooldown = this.player.attackCooldown;
      this.hits++;
      reason = 'hit';
    }
    this.lastAttack = { reason, serial: this.lastAttack.serial + 1, targetId: reason === 'hit' ? target.id : clickedId ?? target?.id ?? null };
    this.refreshTarget(); // Death immediately releases invalid pins and reselects.
    return reason;
  }

  snapshot() {
    return structuredClone({ player: this.player, enemies: this.enemies, hits: this.hits, time: this.time,
      targetMode: this.targetMode, manualTargetId: this.manualTargetId, selectedTargetId: this.selectedTargetId, lastAttack: this.lastAttack });
  }
}
