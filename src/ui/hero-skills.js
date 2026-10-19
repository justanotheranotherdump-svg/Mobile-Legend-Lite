import {heroArt,heroSkillArt} from "../heroes/art.js";
import { COMBAT_ART } from "./combat-art.js";
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
      const wrapper = document.createElement("div");
      wrapper.id = `control-${slot.id}`;
      wrapper.className = "skill-control";
      b.before(wrapper);
      wrapper.append(b);
      const art = b.querySelector(".icon");
      if (art) {
        const img = document.createElement("img");
        img.src = heroSkillArt(simulation.hero.id,slot.id);
        img.alt = "";
        img.className = "skill-png";
        art.replaceWith(img);
      }
      const upgrade = document.createElement("button");
      upgrade.type = "button";
      upgrade.id = `upgrade-${slot.id}`;
      upgrade.className = "skill-upgrade";
      upgrade.textContent = "+";
      for (const type of ["pointerdown", "pointerup"])
        upgrade.addEventListener(type, (event) => event.stopPropagation());
      upgrade.addEventListener("click", (event) => {
        event.stopPropagation();
        simulation.upgradeSkill(slot.id);
        upgrade.blur();
      });
      for (const type of ["keydown", "keyup"])
        upgrade.addEventListener(type, (event) => {
          if (["Space", "Enter"].includes(event.code)) event.stopPropagation();
        });
      wrapper.append(upgrade);
      this.buttons.push({ b, a, status });
    }
    for (const id of ["recall", "regen"]) {
      const art = document.querySelector(`#${id} .icon`);
      if (art) {
        const img = document.createElement("img");
        img.src = COMBAT_ART[id];
        img.alt = "";
        img.className = "utility-png";
        art.replaceWith(img);
      }
    }
    document.querySelector(".hero-icon").innerHTML =
      `<img class="portrait-png" src="${heroArt(simulation.hero.id)}" alt="${simulation.hero.name}">`;
    const gestureButtons = [...this.buttons];
    if (simulation.spells) {
      const b = document.getElementById("battle-spell");
      b.disabled = false;
      b.dataset.controlKind = "functional";
      gestureButtons.push({ b, a: simulation.spells.ability() });
    }
    this.gestures = new SkillGestures(
      simulation,
      controls,
      view,
      gestureButtons,
    );
    document.querySelector(".build-note").textContent =
      `${simulation.hero.name.toUpperCase()} · LOCAL PROTOTYPE BALANCE`;
    const passive = simulation.ability("passive");
    document.querySelector(".hero-icon").title =
      passive.effectId==="wasteland-force" ? `${passive.name}: after ${passive.parameters.noDamageSeconds}s without damage, +10% speed, 1% maximum HP/second and up to 10 skill-damage stacks.` : `${passive.name}: damage scales with distance, up to ${Math.round(passive.parameters.maxMultiplier * 100)}% at ${passive.parameters.referenceDistance}m. Turrets excluded.`;
  }
  update() {
    if (!this.mana) return;
    const s = this.simulation,
      p = s.player;
    document.getElementById("player-mana").textContent =
      `MP ${Math.floor(p.mana)} / ${p.maxMana}`;
    document.getElementById("hero-buff").textContent = s.hero.id==="franco" ? `${s.francoReady?"WASTELAND · ":""}${s.francoStacks||0}/10 stacks` : s.buff
      ? "RANGE + SPEED"
      : "";
    this.mana.setAttribute("aria-valuemax", p.maxMana);
    this.mana.setAttribute("aria-valuenow", p.mana.toFixed(2));
    this.mana.firstElementChild.style.width = `${(p.mana / p.maxMana) * 100}%`;
    for (const entry of this.buttons) {
      const { b, status } = entry,
        a = s.ability(entry.a.slot);
      b.querySelector(".skill-cost").textContent = `${a.manaCost} MP`;
      b.querySelector(".slot-label").textContent =
        `${SKILL_SLOTS.find((slot) => slot.id === a.slot).label}${a.rank !== undefined ? ` · ${a.rank}/${a.ranks.max}` : ""}`;
      b.setAttribute(
        "aria-label",
        `${a.name}, rank ${a.rank ?? 1}, ${a.manaCost} mana${a.rank === 0 ? ", unlearned" : ""}`,
      );
      const cd = s.cooldowns[a.id] || 0,
        reason =
          s.queuedSkill?.slot === a.slot
            ? "QUEUED"
            : a.rank === 0
              ? "LOCKED"
              : p.hp <= 0
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
      status.textContent = a.rank === 0 || reason === "READY" ? "" : reason;
      b.classList.toggle("unlearned", a.rank === 0);
      b.disabled = a.rank === 0;
      b.dataset.state = reason === "READY" ? "ready" : "unavailable";
      b.setAttribute("aria-disabled", String(reason !== "READY"));
      b.style.setProperty(
        "--cooldown",
        `${Math.min(1, cd / a.cooldown) * 360}deg`,
      );
    }
  }
}
