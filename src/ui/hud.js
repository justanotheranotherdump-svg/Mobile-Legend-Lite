import { SkillControls } from "./skill-controls.js";
import { mountLayout } from "./layout.js";
import { Minimap } from "./minimap.js";
import { TargetingControls } from "./targeting-controls.js";
import { CooldownDisplay } from "./cooldowns.js";
import { PlaceholderPanels } from "./panels.js";
import { CombatNotifications } from "./combat-notifications.js";
import { Joystick } from "../input/joystick.js";
import { distanceTo, inAttackRange } from "../simulation/targeting.js";
const messages = {
  ready: "WASD / joystick to move · Click ground or Space to attack.",
  range:
    "No enemy in attack range — move with WASD or joystick. No automatic chasing.",
  cooldown: "Attack cooling down. Wait for Ready, then click again.",
  dead: "That dummy is defeated. A living target will be chosen if one is in range.",
  "invalid-target": "That target is not eligible. Choose a living enemy.",
  "no-enemies":
    "All training dummies defeated. Reset the arena to train again.",
  hit: "Hit confirmed",
};

export class Hud {
  constructor(simulation, onReset, onModeChange, controls) {
    mountLayout(document.querySelector("#hud-root"));
    this.elements = Object.fromEntries(
      [...document.querySelectorAll("[id]")].map((element) => [
        element.id,
        element,
      ]),
    );
    const e = this.elements;
    document.querySelector(".hero-info .eyebrow").textContent =
      `${simulation.hero.role.toUpperCase()} · PLAYER`;
    document.querySelector(".hero-title").firstChild.textContent =
      `${simulation.hero.name} `;
    this.minimap = new Minimap(e.minimap, simulation.arena, simulation.enemies);
    this.skills = new SkillControls(document.querySelector("#hud-root"));
    this.targeting = new TargetingControls(e, simulation, onModeChange);
    this.cooldowns = new CooldownDisplay(e, simulation.player);
    this.joystick = new Joystick(e.joystick, controls);
    this.panels = new PlaceholderPanels(e, this.joystick, () =>
      controls.clear(),
    );
    this.notifications = new CombatNotifications(
      e["combat-announcements"],
      simulation.events,
    );
    e.reset.addEventListener("click", () => {
      onReset();
      e.reset.blur();
    });
    e.attack.addEventListener("click", () => {
      simulation.attack();
      e.attack.blur();
    });
    e["toggle-map-range"].setAttribute("aria-pressed", "true");
    e["toggle-map-range"].addEventListener("click", () => {
      const hidden = this.minimap.range.classList.toggle("range-hidden");
      e["toggle-map-range"].setAttribute("aria-pressed", String(!hidden));
      e["toggle-map-range"].blur();
    });
    e["toggle-map"].setAttribute("aria-expanded", "true");
    e["toggle-map"].addEventListener("click", () => {
      const collapsed = e["minimap-panel"].classList.toggle("collapsed");
      e["toggle-map"].setAttribute("aria-expanded", String(!collapsed));
      e["toggle-map"].blur();
    });
    this.labels = new Map(
      simulation.enemies.map((enemy) => {
        const label = document.createElement("div");
        label.className = "world-label dummy-label";
        label.dataset.enemyId = enemy.id;
        const name = document.createElement("span");
        name.textContent = enemy.name;
        const track = document.createElement("div");
        track.className = "small-track";
        const bar = document.createElement("i");
        const hp = document.createElement("small");
        track.append(bar);
        label.append(name, track, hp);
        e["enemy-labels"].append(label);
        return [enemy.id, { label, bar, hp }];
      }),
    );
  }
  placeLabel(element, point) {
    element.style.display = point.visible ? "" : "none";
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
  }
  update(state, view) {
    const { player, enemies, hits, lastAttack, selectedTarget: target } = state;
    const e = this.elements;
    e["target-mode"].value = state.targetMode;
    e["clear-target"].disabled = !state.manualTargetId;
    e["selection-source"].textContent = state.manualTargetId
      ? "Manual override pinned"
      : state.targetMode === "manual"
        ? "Nearest fallback · click to pin"
        : "Automatic selection";
    e["target-name"].textContent = target ? target.name : "No target in range";
    e["target-status"].textContent = target
      ? state.manualTargetId
        ? "LOCKED"
        : "AUTO"
      : "NONE";
    e["target-details"].textContent = target
      ? inAttackRange(player, target)
        ? "In attack range · highlighted in gold"
        : "Pinned target out of range · no chasing"
      : "Approach a living training target";
    e["player-health"].textContent = `${player.hp} / ${player.maxHp}`;
    const playerMeter = document.querySelector('[aria-label="Player health"]');
    playerMeter.setAttribute("aria-valuemax", player.maxHp);
    playerMeter.setAttribute("aria-valuenow", player.hp);
    playerMeter.firstElementChild.style.width = `${(player.hp / player.maxHp) * 100}%`;
    e["dummy-health"].textContent = target
      ? `${target.hp} / ${target.maxHp}`
      : "— / —";
    e["dummy-meter"].setAttribute("aria-valuemax", target?.maxHp ?? 1);
    e["dummy-meter"].setAttribute("aria-valuenow", target?.hp ?? 0);
    e["dummy-bar"].style.width =
      `${target ? (target.hp / target.maxHp) * 100 : 0}%`;
    e.distance.textContent = target
      ? `${distanceTo(player, target).toFixed(1)} m`
      : "—";
    e.hits.textContent = hits;
    this.cooldowns.update(player);
    this.minimap.update(state, view.aim);
    this.notifications.update(state.time);
    e["match-timer"].textContent =
      `${String(Math.floor(state.time / 60)).padStart(2, "0")}:${String(Math.floor(state.time % 60)).padStart(2, "0")}`;
    const hitTarget = enemies.find((enemy) => enemy.id === lastAttack.targetId);
    e.message.textContent =
      lastAttack.reason === "hit"
        ? `Hit ${hitTarget?.name ?? "enemy"} · ${player.damage} damage`
        : messages[lastAttack.reason];
    e.message.classList.toggle(
      "warn",
      ["range", "cooldown", "invalid-target"].includes(lastAttack.reason),
    );
    for (const enemy of enemies) {
      const { label, bar, hp } = this.labels.get(enemy.id);
      hp.textContent = `${enemy.hp} / ${enemy.maxHp}`;
      bar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
      label.classList.toggle("selected", state.selectedTargetId === enemy.id);
      this.placeLabel(
        label,
        view.project(enemy.x, enemy.hp > 0 ? 2.4 : 0.9, enemy.z),
      );
    }
    this.placeLabel(e["player-label"], view.project(player.x, 2.05, player.z));
  }
  paused(value) {
    this.elements.pause.hidden = !value;
  }
}
