import {
  BUTTON_ACTIONS,
  AVAILABLE_CODES,
  keyLabel,
} from "../input/key-bindings.js";
export class KeySettings {
  constructor(root, bindings, clearInput) {
    root.innerHTML = `<label class="setting-row"><span>Show button key hints<small>Hide key badges without disabling shortcuts or button names.</small></span><input id="show-key-hints" type="checkbox" checked data-control-kind="interface-only"></label><details id="key-controls"><summary>Customize key controls</summary><p class="key-settings-note">Single physical keys only. WASD, Escape, Tab, Enter, function keys and modifier combinations are protected. Mouse controls stay unchanged. Reserved actions stay unavailable even with a key assigned.</p><div id="key-binding-list"></div><button id="restore-key-defaults" type="button" data-control-kind="functional">Restore default keys</button><p id="key-binding-status" role="status" aria-live="polite">Changes apply immediately for this session.</p></details>`;
    this.selects = new Map();
    const list = root.querySelector("#key-binding-list"),
      status = root.querySelector("#key-binding-status");
    for (const action of BUTTON_ACTIONS) {
      const row = document.createElement("label");
      row.className = "binding-row";
      const label = document.createElement("span");
      label.textContent = `${action.label}${action.reserved ? " · reserved" : ""}`;
      const select = document.createElement("select");
      select.dataset.controlKind = action.reserved
        ? "interface-only"
        : "functional";
      select.id = `bind-${action.id}`;
      select.dataset.action = action.id;
      select.setAttribute("aria-label", `${action.label} key`);
      select.add(new Option("Unbound", ""));
      for (const code of AVAILABLE_CODES)
        select.add(new Option(keyLabel(code), code));
      select.addEventListener("change", () => {
        clearInput();
        const result = bindings.assign(action.id, select.value);
        status.textContent = result.ok
          ? `${action.label}: ${bindings.labelFor(action.id)}`
          : result.error;
        status.classList.toggle("binding-error", !result.ok);
        this.render(bindings);
      });
      row.append(label, select);
      list.append(row);
      this.selects.set(action.id, select);
    }
    this.hints = root.querySelector("#show-key-hints");
    this.hints.addEventListener("change", () =>
      bindings.setHints(this.hints.checked),
    );
    root
      .querySelector("#restore-key-defaults")
      .addEventListener("click", () => {
        clearInput();
        bindings.restoreDefaults();
        status.textContent =
          "Default keys restored. Key-hint visibility is unchanged.";
        status.classList.remove("binding-error");
      });
    bindings.subscribe(() => this.render(bindings));
    this.render(bindings);
  }
  render(bindings) {
    this.hints.checked = bindings.showHints;
    for (const [id, select] of this.selects)
      select.value = bindings.codeFor(id);
  }
}
