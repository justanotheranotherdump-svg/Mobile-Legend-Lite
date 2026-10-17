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
    for (const [value, label] of Object.entries(TARGET_MODES))
      e["target-mode"].add(new Option(label, value));
    e["target-mode"].addEventListener("change", () => {
      onModeChange(e["target-mode"].value);
      e["target-mode"].blur();
    });
    e["clear-target"].addEventListener("click", () => {
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
}
