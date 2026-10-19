import { statText } from '../simulation/stats/attributes.js';
export function attackFeedback(player) {
  const fraction = Math.max(
    0,
    Math.min(1, player.cooldown / player.attackCooldown),
  );
  return {
    fraction,
    text:
      player.cooldown > 0.005
        ? `${player.cooldown.toFixed(2)}s cooldown`
        : "Ready",
    countdown: player.cooldown > 0.005 ? player.cooldown.toFixed(1) : "",
  };
}
export class CooldownDisplay {
  constructor(elements, player) {
    this.e = elements;
    const details = document.querySelector(".attack-panel small");
    details.childNodes[0].textContent = `${player.damage} damage `;
    details.childNodes[2].textContent = ` ${player.range}m range `;
    details.childNodes[4].textContent = ` ${player.attackCooldown}s cooldown`;
  }
  update(player, firingFor = 0) {
    const details = document.querySelector(".attack-panel small");
    if (details && player.attributes) {
      details.childNodes[0].textContent = `${statText(player.damage)} raw damage `;
      details.childNodes[2].textContent = ` ${statText(player.range)} world range `;
      details.childNodes[4].textContent = ` ${statText(player.attackCooldown)}s interval`;
    }
    else if (details) details.childNodes[2].textContent = ` ${player.range}m range `;
    const state = attackFeedback(player),
      e = this.e;
    e["attack-status"].textContent =
      firingFor > 0 ? `Firing · ${firingFor.toFixed(1)}s` : state.text;
    e["attack-countdown"].textContent = state.countdown;
    e.attack.dataset.state = state.countdown ? "cooldown" : "ready";
    e.attack.style.setProperty("--cooldown", `${state.fraction * 360}deg`);
    e["cooldown-bar"].style.width = `${(1 - state.fraction) * 100}%`;
  }
}
