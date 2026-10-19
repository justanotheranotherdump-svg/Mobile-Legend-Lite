import {
  EnemyInfo,
  isHeroActor,
  heroNameplate,
  syncHeroNameplate,
} from "./enemy-info.js";
import { ProgressionHud } from "./progression.js";
import { statText } from "../simulation/stats/attributes.js";
import { HeroSkillHud } from "./hero-skills.js";
import { KeyBindings } from "../input/key-bindings.js";
import { ButtonShortcuts } from "./button-shortcuts.js";
import { mountLayout } from "./layout.js";
import { Minimap } from "./minimap.js";
import { TargetingControls } from "./targeting-controls.js";
import { CooldownDisplay } from "./cooldowns.js";
import { PlaceholderPanels } from "./panels.js";
import { CombatNotifications } from "./combat-notifications.js";
import { Joystick } from "../input/joystick.js";
import { distanceTo, inAttackRange } from "../simulation/targeting.js";
export class Hud {
  constructor(simulation, onReset, onModeChange, controls, view) {
    mountLayout(document.querySelector("#hud-root"));
    const root = document.querySelector("#hud-root");
    root.classList.toggle("keyboard-only", Boolean(simulation.combatHero));
    if (simulation.combatHero) {
      root.querySelector(".target-panel").remove();
      if (!matchMedia("(pointer: coarse)").matches)
        root.querySelector(".movement-dock").remove();
      else root.classList.add("touch-controls");
    }
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
    this.bindings = new KeyBindings();
    this.targeting = new TargetingControls(
      e,
      simulation,
      onModeChange,
      controls,
    );
    this.cooldowns = new CooldownDisplay(e, simulation.player);
    this.joystick =
      simulation.combatHero && !root.classList.contains("touch-controls")
        ? null
        : new Joystick(e.joystick, controls);
    this.skills = new HeroSkillHud(simulation, controls, view);
    this.progression = new ProgressionHud(simulation, controls);
    this.panels = new PlaceholderPanels(
      e,
      this.joystick,
      controls,
      this.bindings,
      simulation,
    );
    this.targeting.mountSettings(
      e["settings-dialog"].querySelector("[data-priority-options]"),
    );
    this.shortcuts = new ButtonShortcuts(
      document.querySelector("#hud-root"),
      this.bindings,
      this.skills.gestures,
      controls,
    );
    this.bindings.subscribe(() => this.skills.gestures?.cancel());
    this.notifications = new CombatNotifications(
      e["combat-announcements"],
      simulation.events,
    );
    e.reset.addEventListener("click", () => {
      onReset();
      e.reset.blur();
    });
    e.attack.addEventListener("click", () => {
      if (!controls.skillGestureActive) (simulation.requestAttack?.() ?? simulation.attack());
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
    if (simulation.combatHero) {
      e["player-label"].classList.add("player-overhead");
      e["player-label"].innerHTML =
        '<span class="overhead-name"></span><div class="overhead-row"><b class="overhead-level"></b><div class="overhead-bars"><i class="overhead-hp"></i><i class="overhead-mana"></i></div></div><small class="overhead-values"></small>';
    }
    if (simulation.isMatch) this.enemyInfo = new EnemyInfo(root);
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
    const { player, enemies, hits, selectedTarget: target } = state;
    const e = this.elements;
    this.targeting.update(state.targetMode);
    if (e["target-mode"]) {
      e["clear-target"].disabled = !state.manualTargetId;
      e["selection-source"].textContent = state.manualTargetId
        ? "Manual override pinned"
        : state.targetMode === "manual"
          ? "Nearest fallback · click to pin"
          : "Automatic selection";
      e["target-name"].textContent = target
        ? target.name
        : "No target in range";
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
    }
    e["player-health"].textContent =
      `${statText(player.hp)} / ${statText(player.maxHp)}`;
    const playerMeter = document.querySelector('[aria-label="Player health"]');
    playerMeter.setAttribute("aria-valuemax", player.maxHp);
    playerMeter.setAttribute("aria-valuenow", player.hp);
    playerMeter.firstElementChild.style.width = `${(player.hp / player.maxHp) * 100}%`;
    if (e["target-mode"]) {
      e["dummy-health"].textContent = target
        ? `${Math.ceil(target.hp)} / ${target.maxHp}`
        : "— / —";
      e["dummy-meter"].setAttribute("aria-valuemax", target?.maxHp ?? 1);
      e["dummy-meter"].setAttribute("aria-valuenow", target?.hp ?? 0);
      e["dummy-bar"].style.width =
        `${target ? (target.hp / target.maxHp) * 100 : 0}%`;
      e.distance.textContent = target
        ? `${distanceTo(player, target).toFixed(1)} m`
        : "—";
      e.hits.textContent = hits;
    }
    this.cooldowns.update(
      player,
      state.combatHero ? Math.max(0, state.lockUntil - state.time) : 0,
    );
    this.skills.update();
    this.progression.update();
    const face = state.combatHero ? state.currentFacing() : null;
    this.minimap.update(
      state,
      face ? { x: player.x + face.x, z: player.z + face.z } : view.aim,
    );
    this.notifications.update(state.time);
    e["match-timer"].textContent =
      `${String(Math.floor(state.time / 60)).padStart(2, "0")}:${String(Math.floor(state.time % 60)).padStart(2, "0")}`;
    const displayActors = state.isMatch
      ? state.actors.filter((a) => a !== player)
      : enemies;
    for (const [id, entry] of this.labels)
      if (!displayActors.some((a) => a.id === id)) {
        entry.label.remove();
        this.labels.delete(id);
      }
    for (const enemy of displayActors) {
      if (!this.labels.has(enemy.id)) {
        const label = document.createElement("div");
        label.className = "world-label dummy-label";
        label.dataset.enemyId = enemy.id;
        const name = document.createElement("span");
        name.textContent = enemy.name;
        const track = document.createElement("div");
        track.className = "small-track";
        const bar = document.createElement("i");
        track.append(bar);
        const hp = document.createElement("small");
        label.append(name, track, hp);
        e["enemy-labels"].append(label);
        this.labels.set(enemy.id, { label, bar, hp });
      }
      const { label, bar, hp } = this.labels.get(enemy.id);
      if (state.isMatch)
        label.classList.add("actor-label", `${enemy.kind}-label`);
      if (state.isMatch && isHeroActor(enemy)) {
        if (!label.classList.contains("hero-nameplate")) heroNameplate(label);
        syncHeroNameplate(label, enemy);
        label.classList.toggle("allied-label", enemy.team === "player");
        label.classList.toggle("selected", state.selectedTargetId === enemy.id);
        const point = view.project(enemy.x, 2.75, enemy.z);
        if (enemy.hp <= 0) point.visible = false;
        this.placeLabel(label, point);
        continue;
      }
      label.classList.toggle("allied-label", enemy.team === "player");
      label.classList.toggle("protected-objective", Boolean(enemy.protected));
      hp.textContent = `${Math.ceil(enemy.hp)} / ${enemy.maxHp}`;
      bar.style.width = `${(enemy.hp / enemy.maxHp) * 100}%`;
      label.classList.toggle("selected", state.selectedTargetId === enemy.id);
      this.placeLabel(
        label,
        view.project(
          enemy.x,
          enemy.hp > 0
            ? enemy.kind === "core"
              ? 4.5
              : enemy.kind === "tower"
                ? 4
                : 2.4
            : 0.9,
          enemy.z,
        ),
      );
    }
    this.enemyInfo?.update(state);
    if (state.combatHero) {
      const label = e["player-label"];
      label.querySelector(".overhead-name").textContent =
        state.playerName || state.hero.name;
      label.querySelector(".overhead-level").textContent =
        state.progression.level;
      label.querySelector(".overhead-hp").style.width =
        `${(player.hp / player.maxHp) * 100}%`;
      label.querySelector(".overhead-mana").style.width =
        `${(player.mana / player.maxMana) * 100}%`;
      label.querySelector(".overhead-values").textContent =
        `${Math.ceil(player.hp)}/${player.maxHp} HP · ${Math.floor(player.mana)}/${player.maxMana} MP`;
    }
    this.placeLabel(
      e["player-label"],
      view.project(player.x, state.combatHero ? 2.75 : 2.05, player.z),
    );
  }
  paused(value) {
    this.elements.pause.hidden = !value;
  }
}
