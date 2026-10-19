export function utilityCooldown(s, id) {
  if (id === "battle-spell") {
    const remaining = Math.max(0, s.spells?.readyAt - s.time || 0);
    return {
      remaining,
      text: remaining > 0 ? String(Math.ceil(remaining)) : "",
      channel: false,
    };
  }
  const channel = id === "recall" && Boolean(s.utilities?.recall),
    ends = channel
      ? s.utilities.recall.endsAt
      : id === "regen"
        ? s.utilities?.regenReadyAt
        : 0,
    remaining = Math.max(0, (ends || 0) - s.time);
  return {
    remaining,
    text: remaining > 0 ? String(Math.ceil(remaining)) : "",
    channel,
  };
}
export function applyUtilityCooldown(button, state) {
  button.classList.toggle("cooling-down", state.remaining > 0);
  button.dataset.cooldown = String(state.remaining);
  button.dataset.channel = String(state.channel);
}
