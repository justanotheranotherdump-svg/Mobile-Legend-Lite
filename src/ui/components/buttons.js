import { icon } from "./icons.js";
// Only code-owned labels/IDs enter these templates; runtime names use textContent.
export function reservedButton(id, label, symbol, key = "") {
  return `<button id="${id}" class="orb reserved" type="button" disabled data-control-kind="reserved" title="${label} — reserved; gameplay not implemented" aria-label="${label} — reserved, not implemented">${icon(symbol)}<span class="slot-key">${key || "—"}</span><span class="slot-label">${label}</span><span class="reserved-mark">${icon("lock")}</span></button>`;
}
export function toolButton(id, label, symbol, kind = "functional") {
  return `<button id="${id}" class="tool-button" type="button" data-control-kind="${kind}" title="${label}" aria-label="${label}">${icon(symbol)}</button>`;
}
