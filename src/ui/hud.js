import { TARGET_MODES, distanceTo, inAttackRange } from '../simulation/targeting.js';
const messages = {
  ready: 'Approach the dummies. Ground click = smart attack.',
  range: 'No enemy in attack range — move with WASD. No automatic chasing.',
  cooldown: 'Attack cooling down. Wait for Ready, then click again.',
  dead: 'That dummy is defeated. A living target will be chosen if one is in range.',
  'invalid-target': 'That target is not eligible. Choose a living enemy.',
  'no-enemies': 'All training dummies defeated. Reset the arena to train again.',
  hit: 'Hit confirmed',
};

export class Hud {
  constructor(simulation, onReset, onModeChange) {
    this.elements = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
    const e = this.elements;
    document.querySelector('.hero-title').firstChild.textContent = `${simulation.hero.name} `;
    const attack = simulation.hero.basicAttack;
    const details = document.querySelector('.attack-panel small');
    details.childNodes[0].textContent = `${attack.damage} damage `;
    details.childNodes[2].textContent = ` ${attack.range}m range `;
    details.childNodes[4].textContent = ` ${attack.cooldown}s cooldown`;
    for (const [value, label] of Object.entries(TARGET_MODES)) e['target-mode'].add(new Option(label, value));
    e['target-mode'].addEventListener('change', () => { onModeChange(e['target-mode'].value); e['target-mode'].blur(); });
    e.reset.addEventListener('click', () => { onReset(); e.reset.blur(); });
    e.attack.addEventListener('click', () => { simulation.attack(); e.attack.blur(); });
    e['clear-target'].addEventListener('click', () => { simulation.clearManualTarget(); e['clear-target'].blur(); });
    this.labels = new Map(simulation.enemies.map(enemy => {
      const label = document.createElement('div');
      label.className = 'world-label dummy-label';
      label.dataset.enemyId = enemy.id;
      const name = document.createElement('span');
      name.textContent = enemy.name;
      const track = document.createElement('div');
      track.className = 'small-track';
      const bar = document.createElement('i');
      const hp = document.createElement('small');
      track.append(bar);
      label.append(name, track, hp);
      e['enemy-labels'].append(label);
      return [enemy.id, { label, bar, hp }];
    }));
  }
  placeLabel(element, point) {
    element.style.display = point.visible ? '' : 'none';
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  }
  update(state, view) {
    const { player, enemies, hits, lastAttack, selectedTarget: target } = state;
    const e = this.elements;
    e['target-mode'].value = state.targetMode;
    e['clear-target'].disabled = !state.manualTargetId;
    e['selection-source'].textContent = state.manualTargetId ? 'Manual override pinned' : state.targetMode === 'manual' ? 'Nearest fallback · click to pin' : 'Automatic selection';
    e['target-name'].textContent = target ? target.name : 'No target in range';
    e['target-status'].textContent = target ? state.manualTargetId ? 'LOCKED' : 'AUTO' : 'NONE';
    e['target-details'].textContent = target ? inAttackRange(player, target) ? 'In attack range · highlighted in gold' : 'Pinned target out of range · no chasing' : 'Use WASD to approach a living dummy';
    e['player-health'].textContent = `${player.hp} / ${player.maxHp}`;
    const playerMeter = document.querySelector('[aria-label="Player health"]');
    playerMeter.setAttribute('aria-valuemax', player.maxHp);
    playerMeter.setAttribute('aria-valuenow', player.hp);
    playerMeter.firstElementChild.style.width = `${player.hp / player.maxHp * 100}%`;
    e['dummy-health'].textContent = target ? `${target.hp} / ${target.maxHp}` : '— / —';
    e['dummy-meter'].setAttribute('aria-valuemax', target?.maxHp ?? 1);
    e['dummy-meter'].setAttribute('aria-valuenow', target?.hp ?? 0);
    e['dummy-bar'].style.width = `${target ? target.hp / target.maxHp * 100 : 0}%`;
    e.distance.textContent = target ? `${distanceTo(player, target).toFixed(1)} m` : '—';
    e.hits.textContent = hits;
    e['attack-status'].textContent = player.cooldown > 0.005 ? `${player.cooldown.toFixed(2)}s cooldown` : 'Ready';
    e['cooldown-bar'].style.width = `${(1 - player.cooldown / player.attackCooldown) * 100}%`;
    const hitTarget = enemies.find(enemy => enemy.id === lastAttack.targetId);
    e.message.textContent = lastAttack.reason === 'hit' ? `Hit ${hitTarget?.name ?? 'enemy'} · ${player.damage} damage` : messages[lastAttack.reason];
    e.message.classList.toggle('warn', ['range', 'cooldown', 'invalid-target'].includes(lastAttack.reason));
    for (const enemy of enemies) {
      const { label, bar, hp } = this.labels.get(enemy.id);
      hp.textContent = `${enemy.hp} / ${enemy.maxHp}`;
      bar.style.width = `${enemy.hp / enemy.maxHp * 100}%`;
      label.classList.toggle('selected', state.selectedTargetId === enemy.id);
      this.placeLabel(label, view.project(enemy.x, enemy.hp > 0 ? 2.4 : 0.9, enemy.z));
    }
    this.placeLabel(e['player-label'], view.project(player.x, 2.05, player.z));
  }
  paused(value) { this.elements.pause.hidden = !value; }
}
