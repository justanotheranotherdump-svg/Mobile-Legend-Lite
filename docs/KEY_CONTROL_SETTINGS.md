# Settings: button key visibility and custom shortcuts

2026-10-17. Baseline commit `1c78d9b`. This is a scoped UI/control addition, not a new gameplay milestone.

## Use it

1. Open **Settings** (gear).
2. Uncheck **Show button key hints** to hide key badges on HUD buttons. Names, locked/reserved status, tooltips and accessible shortcut metadata remain. Shortcuts continue working while badges are hidden.
3. Expand **Customize key controls**. Choose another single physical key in a control's dropdown. Changes apply immediately.
4. Choose **Unbound** to remove a shortcut. Mouse clicks/native focused-button activation remain available. To move an occupied key to a different action, unbind/change its original action first; conflicts produce a visible explanation without changing either binding.
5. **Restore default keys** restores Space / top-row 1,2,3 / B / F and clears added shortcuts. It does not change hint visibility.
6. Escape closes the panel and restores battlefield focus.

**Settings last for this session only.** Arena reset preserves them; reloading/reopening the HTML restores defaults. No localStorage, file writes, external service or cross-file persistence is claimed.

## Configurable buttons

- Basic attack: default Space; mouse attack remains unchanged.
- Skill I, Skill II, Ultimate: defaults physical `Digit1/2/3`, shown as 1/2/3.
- Recall/B, Regen/unbound, Battle spell/F.
- Minion and tower priority: initially unbound.
- Clear target lock, reset arena, shop/settings panels, minimap/range visibility: initially unbound.

Allowed alternatives: letter keys other than WASD, top-row digits, numpad digits and arrow keys. Numpad labels read “Num 0” etc. Binding to Q/E/R or numpad is now possible explicitly; those are not defaults. WASD, Escape, Tab, Enter, function keys and modifier combinations are protected. Mouse aiming, clicks and joystick behavior are unchanged.

The three skill slots, utilities and minion/tower actions remain **reserved/disabled** because their gameplay systems do not exist. Assigning a shortcut does not unlock/cast a skill, regenerate health, recall, grant items or simulate targets. The slot count remains exactly three. Ordinary Enter/Space accessibility activation of a focused enabled button remains native browser behavior, not a second global gameplay shortcut.

## Implementation / changed files

- `src/input/key-bindings.js`: frozen action/default/allowed-code definitions; session model, duplicate/protected-key validation, visibility preference and subscriptions.
- `src/input/controls.js`, `src/main.js`: retain WASD/mouse/joystick input, remove the old hardcoded Space handler so it cannot fire alongside a rebound action.
- `src/ui/button-shortcuts.js`: one guarded button-key dispatcher. Refuses repeats/modifiers/forms/dialog contexts; resolves current settings and shares native button click/action validation. Disabled buttons cannot execute. Updates badges (including newly bound buttons), tooltip/help and ARIA metadata without changing simulation.
- `src/ui/key-settings.js`: visibility toggle, accessible dropdown editor, conflict status, Unbound and restore defaults.
- `src/ui/skill-controls.js`: retains immutable default three-slot artwork and testable native-button guard; removes the obsolete fixed numeric event listener to prevent duplicate/stale bindings.
- `src/ui/hud.js`: composes model/controller; attack prompt reflects the current shortcut.
- `src/ui/panels.js`, `src/ui/styles/panels.css`: integrate scrollable key settings and hide only key badges, not names/controls.
- `tests/key-bindings.test.js`: nine new unit cases covering defaults, remap, conflicts, protected keys, unbind, reset semantics, isolation, subscriptions and prototype/unknown names.
- `tests/browser-key-settings.mjs`, `tests/browser.mjs`: retain all previous browser cases and add real UI/key-input checks.
- Root `index.html`, README/rules/download notes, historical refinement note, this report and `key-settings-*.json`: updated offline output/instructions/evidence.

No hero definitions, simulation, movement/collision/targeting calculations, damage, cooldowns, death events, map geometry or character assets were changed. Dependencies/lockfile are unchanged. No persistence or gameplay system was introduced.

## Verified results

A fresh before run passed **92/92 unit tests and 36/36 offline browser checks**. After:

| Check | Result |
| --- | --- |
| All unit tests | **101/101 PASS**, all previous 92 retained |
| Offline browser suite | **41/41 PASS**, all previous 36 retained |
| Hide/show hints while shortcuts remain active | PASS |
| Remap attack to J: old Space removed, one real attack, original cooldown enforced | PASS |
| Rebind reserved slots/categories: labels update, no fake cast/hit/state change | PASS |
| Duplicate key rejection and protected WASD/navigation keys | PASS |
| Menu focus suppresses gameplay shortcuts | PASS |
| Unbind preserves HUD/mouse access; custom numpad key works | PASS |
| Arena reset preserves settings; restore defaults restores Space/1/2/3 | PASS |
| Compact editor usable at 854×480 and 800×600; Escape/focus return | PASS |
| All prior five-size layout, movement/joystick/targeting/camera/reset/death/HUD checks | PASS |
| Named file, root HTML, isolated source-ZIP HTML via file:// offline | PASS |
| Runtime errors / warnings / subresource requests | **0 / 0 / 0** |
| Vite source preview and invalid-hero-data banner | PASS supplementary checks |
| Hero/build/offline validation, source archive integrity, syntax | PASS |
| Final rebuild equals exact browser-tested HTML | PASS |
| Native Windows / physical touch devices | NOT TESTED here |

The old deterministic simulation trace still matches all **39 snapshots**, SHA-256:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

Final browser-tested standalone SHA-256 (identical after rebuild):

`270dd7370038188a6bcda9b7576ec950e7a2e77d0065a1e8e89b67fc088e9703`

Evidence: `key-settings-unit-results.json`, `key-settings-before-browser-results.json`, `key-settings-browser-results.json`. Browser tests use Linux Chromium 153/software WebGL2 with networking disabled and ordinary file-origin security; native Windows is not certified. No unavailable gameplay action was enabled to make these tests pass. Future-enabled button stubs exist only in unit tests.

## Deliverables / stop

Updated **`deliverables/MOBA-Lab-Phase-3.html`** and **`deliverables/MOBA-Lab-Phase-3-source.zip`**, plus identical committed root `index.html`. The one HTML embeds required JS/CSS/Three.js/configuration/vector assets, needs no server or sibling files and performs no runtime network requests in the verified flow. The intentional Vite >500kB warning is expected (~708 KiB HTML).

Commands: `npm test`, `npm run package:source`, `npm run validate:offline`, `npm run test:browser` (optional `DEV_TEST_URL=http://127.0.0.1:5173` for supplementary source tests).

Windows manual acceptance remains: move only the HTML to an empty folder, disconnect networking and double-click in current Chrome/Edge. Test the new settings, remap/unbind/defaults, unchanged mouse/WASD movement/attacks/targeting/reset, then reopen and confirm session-local settings return to defaults.

**Stop for review; no further roster, skills, gameplay, shop or asset milestone is authorized.**
