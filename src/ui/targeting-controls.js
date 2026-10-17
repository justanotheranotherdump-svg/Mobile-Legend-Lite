import { TARGET_MODES } from "../simulation/targeting.js";
import { icon } from "./components/icons.js";
export const TARGET_CATEGORIES = Object.freeze([
  Object.freeze({ id: "dummy", label: "Training targets", available: true }),
  Object.freeze({ id: "minion", label: "Minion priority", available: false }),
  Object.freeze({ id: "tower", label: "Tower priority", available: false }),
]);
export class TargetingControls {
  constructor(elements, simulation, onModeChange) {
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
      button.disabled = true;
      button.dataset.controlKind = "reserved";
      button.dataset.category = category.id;
      button.title = `${category.label} reserved — no ${category.id} units implemented`;
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
  }
}
