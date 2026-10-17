import { SKILL_SLOTS } from "./skill-controls.js";
import { SkillGestures } from "../input/skill-gestures.js";

// Enabling these buttons is capability-based, not inferred from artwork.
export class HeroSkillHud {
  constructor(simulation, controls, view) {
    this.simulation = simulation;
    this.buttons = [];
    if (!simulation.combatHero) return;
    const info = document.querySelector(".hero-info");
    info.insertAdjacentHTML(
      "beforeend",
      '<div class="mana-caption"><span id="player-mana"></span><span id="hero-buff"></span></div><div class="health-track mana" role="progressbar" aria-label="Player mana" aria-valuemin="0"><i></i></div>',
    );
    this.mana = document.querySelector('[aria-label="Player mana"]');
    for (const slot of SKILL_SLOTS) {
      const a = simulation.ability(slot.id),
        b = document.getElementById(slot.id);
      b.disabled = false;
      b.dataset.controlKind = "functional";
      b.classList.remove("reserved");
      b.classList.add("hero-skill");
      b.querySelector(".reserved-mark")?.remove();
      b.querySelector(".slot-label").textContent = slot.label;
      const status = document.createElement("span");
      status.className = "skill-state";
      b.append(status);
      const cost = document.createElement("span");
      cost.className = "skill-cost";
      cost.textContent = `${a.manaCost} MP`;
      b.append(cost);
      b.setAttribute("aria-label", `${a.name}, ${a.manaCost} mana`);
      b.dataset.abilityName = a.name;
      this.buttons.push({ b, a, status });
    }
    this.gestures = new SkillGestures(simulation, controls, view, this.buttons);
    document.querySelector(".build-note").textContent =
      "LAYLA · RECONSTRUCTED KIT · EDITABLE INITIAL VALUES";
    const passive = simulation.ability("passive");
    document.querySelector(".hero-icon").title =
      `${passive.name}: damage scales with distance, up to ${Math.round(passive.parameters.maxMultiplier * 100)}% at ${passive.parameters.referenceDistance}m. Turrets excluded.`;
  }
  update() {
    if (!this.mana) return;
    const s = this.simulation,
      p = s.player;
    document.getElementById("player-mana").textContent =
      `MP ${Math.floor(p.mana)} / ${p.maxMana}`;
    document.getElementById("hero-buff").textContent = s.buff
      ? "RANGE + SPEED"
      : "";
    this.mana.setAttribute("aria-valuemax", p.maxMana);
    this.mana.setAttribute("aria-valuenow", p.mana.toFixed(2));
    this.mana.firstElementChild.style.width = `${(p.mana / p.maxMana) * 100}%`;
    for (const { b, a, status } of this.buttons) {
      const cd = s.cooldowns[a.id] || 0,
        reason =
          p.hp <= 0
            ? "DEAD"
            : p.stunned
              ? "STUN"
              : cd > 0.005
                ? `${cd.toFixed(1)}s`
                : p.mana < a.manaCost
                  ? "NO MP"
                  : s.isActionLocked()
                    ? "FIRING"
                    : "READY";
      status.textContent = reason === "READY" ? "" : reason;
      b.dataset.state = reason === "READY" ? "ready" : "unavailable";
      b.setAttribute("aria-disabled", String(reason !== "READY"));
      b.style.setProperty(
        "--cooldown",
        `${Math.min(1, cd / a.cooldown) * 360}deg`,
      );
    }
  }
}
