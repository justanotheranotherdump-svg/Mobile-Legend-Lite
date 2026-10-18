import { utilityCooldown, applyUtilityCooldown } from "./utility-cooldowns.js";
export class UtilityHud {
  constructor(s) {
    this.s = s;
    for (const id of ["recall", "regen"]) {
      const b = document.getElementById(id);
      b.disabled = false;
      b.dataset.controlKind = "functional";
      b.classList.remove("reserved");
      b.querySelector(".reserved-mark")?.remove();
      const state = document.createElement("span");
      state.className = "utility-state";
      b.append(state);
      b.onclick = () => {
        s.lastUtilityResult = s.useUtility(id);
        b.blur();
      };
    }
    const caption = document.querySelector(".reserved-caption");
    if (caption) caption.textContent = "RECALL · REGEN · BATTLE SPELL RESERVED";
  }
  update() {
    const s = this.s,
      u = s.utilities;
    for (const id of ["recall", "regen"]) {
      const b = document.getElementById(id),
        status = b.querySelector(".utility-state"),
        cd = id === "regen" ? Math.max(0, u.regenReadyAt - s.time) : 0;
      const presentation=utilityCooldown(s,id);
      applyUtilityCooldown(b,presentation);
      status.textContent =
        id === "recall" && u.recall
          ? `${Math.max(0, u.recall.endsAt - s.time).toFixed(1)}s`
          : cd
            ? presentation.text
            : "";
      b.classList.toggle(
        "utility-active",
        Boolean(id === "recall" ? u.recall : u.regen),
      );
      b.title =
        id === "recall"
          ? "Recall · 8s channel; move, attack, cast or damage cancels. Return to your own spawn."
          : "Regen · 18% HP / 9% mana over 6s · 60s cooldown · damage cancels.";
      b.setAttribute(
        "aria-label",
        `${id}${status.textContent ? " " + status.textContent + " seconds" : ""}`,
      );
    }
    const active = document.getElementById("wind-chant");
    if (active) {
      const cd = Math.max(0, (s.itemEffects?.t.windReadyAt || 0) - s.time);
      active.textContent = cd ? Math.ceil(cd) : "USE";
      active.title = `Wind Chant · ${cd ? Math.ceil(cd) + "s cooldown" : "2s physical immunity"}`;
    }
  }
}
