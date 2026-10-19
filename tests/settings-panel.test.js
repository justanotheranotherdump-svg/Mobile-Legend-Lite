import test from "node:test";
import assert from "node:assert/strict";
import { settingsMarkup, SETTINGS_TABS } from "../src/ui/settings-panel.js";
import { KeyBindings } from "../src/input/key-bindings.js";
test("landscape settings has three accessible real pages and disabled sound/network placeholders", () => {
  const html = settingsMarkup();
  assert.ok(Object.isFrozen(SETTINGS_TABS));
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 3);
  for (const tab of SETTINGS_TABS.map((n) => n.toLowerCase())) {
    assert.ok(html.includes(`id="settings-tab-${tab}"`));
    assert.ok(html.includes(`id="settings-page-${tab}"`));
  }
  assert.equal(
    (html.match(/disabled data-control-kind="reserved"/g) || []).length,
    2,
  );
  assert.match(
    html,
    /Graphics quality, resolution and frame-rate presets are not implemented/,
  );
  assert.match(html, /data-priority-options/);
});
test("Regen defaults to V, is uniquely reserved, can be rebound and restored without enabling an ability", () => {
  const b = new KeyBindings();
  assert.equal(b.codeFor("regen"), "KeyV");
  assert.equal(b.actionFor("KeyV").reserved, true);
  assert.equal(b.assign("attack", "KeyV").ok, false);
  assert.ok(b.assign("regen", "KeyG").ok);
  assert.equal(b.actionFor("KeyV"), null);
  b.restoreDefaults();
  assert.equal(b.codeFor("regen"), "KeyV");
  assert.equal(b.actionFor("KeyV").reserved, true);
});
