import { TARGET_MODES } from "../simulation/targeting.js";
import { icon } from "./components/icons.js";
export const TARGET_CATEGORIES = Object.freeze([
  Object.freeze({ id: "dummy", label: "Training targets", available: true }),
  Object.freeze({ id: "minion", label: "Minion priority", available: false }),
  Object.freeze({ id: "tower", label: "Tower priority", available: false }),
]);
export class TargetingControls {
  constructor(elements, simulation, onModeChange, controls = null) {
    const e = elements;
    this.elements = elements;
    this.onModeChange = onModeChange;
    this.simulation = simulation;
    this.priorityInputs = [];
    for (const [value, label] of Object.entries(TARGET_MODES))
      e["target-mode"]?.add(new Option(label, value));
    e["target-mode"]?.addEventListener("change", () => {
      onModeChange(e["target-mode"].value);
      e["target-mode"].blur();
    });
    e["clear-target"]?.addEventListener("click", () => {
      simulation.clearManualTarget();
      e["clear-target"].blur();
    });
    for (const category of TARGET_CATEGORIES.filter((c) => !c.available)) {
      const button = document.createElement("button");
      button.id = `priority-${category.id}`;
      button.className = "category-button";
      button.type = "button";
      button.disabled = !simulation.isMatch;
      button.dataset.controlKind = simulation.isMatch
        ? "functional"
        : "reserved";
      button.dataset.category = category.id;
      button.title = `${category.label} reserved — no ${category.id} units implemented`;
      if (simulation.isMatch) {
        button.title = `Attack with ${category.label}; valid manual pins take precedence`;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          if (!controls?.skillGestureActive)
            simulation.requestAttack?.(null, category.id) ??
              simulation.attack(null, category.id);
          button.blur();
        });
      }
      button.setAttribute("aria-label", button.title);
      button.innerHTML = icon(`${category.id}-crest`);
      const label = document.createElement("span");
      label.className = "category-label";
      label.textContent = category.id.toUpperCase();
      button.append(label);
      e["target-categories"].append(button);
    }
  }
  mountSettings(root) {
    if (!this.elements["clear-target"]) {
      const clear = document.createElement("button");
      clear.type = "button";
      clear.id = "clear-target";
      clear.dataset.controlKind = "functional";
      clear.textContent = "Clear manual target lock";
      clear.addEventListener("click", () => {
        this.simulation.clearManualTarget();
        clear.blur();
      });
      root.parentElement.append(clear);
      this.elements["clear-target"] = clear;
    }
    this.simulation.combatSettings ||= {
      rangeDisplay: "context",
      towerRanges: true,
    };
    const rangeOptions = document.createElement("div");
    rangeOptions.innerHTML =
      '<label class="setting-row">Attack range display<select id="attack-range-display"><option value="context">While targeting / attacking / aiming</option><option value="always">Always</option><option value="off">Off</option></select></label><label class="setting-row">Nearby tower ranges<input id="show-tower-ranges" type="checkbox" checked></label>';
    root.parentElement.append(rangeOptions);
    if (this.simulation.combatHero) {
      const options = document.createElement("div");
      options.innerHTML =
        '<label class="setting-row">Main attack category<select id="basic-category-priority"><option value="hero">Hero priority</option><option value="minion">Minion priority</option><option value="tower">Tower / structure priority</option></select></label><label class="setting-row">Smart basic attack / automatic approach<input id="smart-basic" type="checkbox" checked></label><label class="setting-row">Automatic target switching<input id="automatic-target-switch" type="checkbox" checked></label><label class="setting-row">Smart skill target on tap<input id="smart-skills" type="checkbox" checked></label><label class="setting-row">Skill range indicators<input id="skill-ranges" type="checkbox" checked></label><p>Hold a skill and drag its wheel for directional manual aim. Manual movement cancels an attack approach.</p>';
      root.parentElement.append(options);
      for (const [id, key] of [
        ["basic-category-priority", "categoryPriority"],
        ["smart-basic", "smartBasic"],
        ["automatic-target-switch", "autoSwitch"],
        ["smart-skills", "smartSkills"],
        ["skill-ranges", "skillRanges"],
      ]) {
        const el = options.querySelector("#" + id);
        el.onchange = () => {
          this.simulation.combatSettings[key] =
            el.type === "checkbox" ? el.checked : el.value;
          this.simulation.cancelAttackCommand();
        };
      }
    }
    rangeOptions.querySelector("select").onchange = (e) =>
      (this.simulation.combatSettings.rangeDisplay = e.target.value);
    rangeOptions.querySelector("input").onchange = (e) =>
      (this.simulation.combatSettings.towerRanges = e.target.checked);
    for (const [value, label] of Object.entries(TARGET_MODES)) {
      const option = document.createElement("label");
      option.className = "priority-option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "target-priority";
      input.value = value;
      input.dataset.controlKind = "functional";
      input.addEventListener("change", () => {
        if (input.checked) this.onModeChange(value);
      });
      const text = document.createElement("span");
      text.textContent = label;
      option.append(input, text);
      root.append(option);
      this.priorityInputs.push(input);
    }
  }
  update(mode) {
    if (this.elements["target-mode"]) this.elements["target-mode"].value = mode;
    this.elements["clear-target"].disabled = !this.simulation.manualTargetId;
    for (const input of this.priorityInputs)
      input.checked = input.value === mode;
    if (this.simulation.isMatch)
      for (const b of this.elements["target-categories"].querySelectorAll(
        "button",
      ))
        b.setAttribute(
          "aria-pressed",
          String(this.simulation.targetCategory === b.dataset.category),
        );
  }
}
