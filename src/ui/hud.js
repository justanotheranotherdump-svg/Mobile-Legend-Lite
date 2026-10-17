const messages = {
  'ready': 'Approach the dummy. Left-click to attack.',
  'no-target': 'Click directly on the training dummy to select it.',
  'range': 'Out of range — move within the 6m attack ring.',
  'cooldown': 'Attack cooling down. Wait for Ready, then click again.',
  'dead': 'Dummy defeated. Reset the arena to train again.',
  'hit': 'Hit confirmed · 25 damage',
};

export class Hud {
  constructor(onReset) {
    this.elements = Object.fromEntries([...document.querySelectorAll('[id]')].map(element => [element.id, element]));
    this.elements.reset.addEventListener('click', () => { onReset(); this.elements.reset.blur(); });
  }
  placeLabel(element, point) {
    element.style.display = point.visible ? '' : 'none';
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  }
  update(state, view) {
    const { player, dummy, hits, lastAttack } = state;
    const e = this.elements;
    e['player-health'].textContent = `${player.hp} / ${player.maxHp}`;
    e['dummy-health'].innerHTML = `${dummy.hp} <em>/ ${dummy.maxHp}</em>`;
    e['dummy-meter'].setAttribute('aria-valuenow', dummy.hp);
    e['dummy-bar'].style.width = `${dummy.hp / dummy.maxHp * 100}%`;
    e['world-dummy-bar'].style.width = `${dummy.hp / dummy.maxHp * 100}%`;
    e['world-dummy-hp'].textContent = `${dummy.hp} / ${dummy.maxHp}`;
    e['target-status'].textContent = dummy.hp > 0 ? 'ACTIVE' : 'DEFEATED';
    e.distance.textContent = `${Math.hypot(player.x - dummy.x, player.z - dummy.z).toFixed(1)} m`;
    e.hits.textContent = hits;
    e['attack-status'].textContent = player.cooldown > 0.005 ? `${player.cooldown.toFixed(2)}s cooldown` : 'Ready';
    e['cooldown-bar'].style.width = `${(1 - player.cooldown / player.attackCooldown) * 100}%`;
    e.message.textContent = dummy.hp <= 0 ? messages.dead : messages[lastAttack.reason];
    e.message.classList.toggle('warn', ['range', 'cooldown', 'no-target'].includes(lastAttack.reason) && dummy.hp > 0);
    this.placeLabel(e['dummy-label'], view.project(dummy.x, dummy.hp > 0 ? 2.4 : 0.9, dummy.z));
    this.placeLabel(e['player-label'], view.project(player.x, 2.05, player.z));
  }
  paused(value) { this.elements.pause.hidden = !value; }
}
