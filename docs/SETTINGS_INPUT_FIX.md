# Landscape Settings and attack/menu input correction

Date: 2026-10-17 · UI/input correction only; no new combat/economy/skill systems.

## Why clicking Attack stopped movement

The old `focusin` handler treated **every button** like a text editor and cleared held WASD keys. A pointer click focused Attack before its click handler ran, clearing movement. Space dispatched the button action without moving focus, so it did not hit the same path. The old keydown filter also refused movement over a focused gameplay button.

The revised input policy distinguishes battlefield button focus from editors and menus. Held keyboard/joystick input survives battlefield-button interaction; both mouse Attack and Space retain the same existing target/range/cooldown validation and discrete one-action-per-activation behavior.

A real offline browser reproduction against the previous committed standalone demonstrated the freeze: the player X position stayed **-4.157364419086036 → -4.157364419086036** after clicking Attack while holding S. This targeted assertion fails against the old HTML; it passes after the fix. No mutation/diagnostic movement API was used.

## What changed

### Menu input isolation

- Shop and Settings now explicitly lock gameplay input while open, independent of the event target/focused element. A global open-dialog fallback also covers off-dialog dispatched events.
- Movement axes return zero while blocked; WASD events are ignored rather than cached. Canvas attacks and gameplay shortcuts are gated too.
- Opening/closing clears held keys, virtual axes, pointer state and joystick capture. Active joystick drags cannot keep moving behind a menu.
- Movement key repeats are ignored: closing while a movement key is physically held does not revive old movement. Release/press again to resume; fresh movement works immediately.
- Modal-lock transitions are **idempotent**. Native `close` fires asynchronously; repeating the same closed state must not erase a fresh key press that arrived after the explicit close handler. The first integration run caught this race, which was corrected and given a dedicated unit regression before final acceptance.
- Native Tab/Enter/Space button access, Escape, close/backdrop, battlefield focus return, blur/visibility clearing and camera-relative keyboard/joystick priorities remain. The lock blocks player input; it does not add a new world-pause system, so simulation time/cooldowns may continue behind a menu.

### Regen key

**Regen defaults to V (`KeyV`)** in the binding model and HUD badge, and Restore default keys returns it to V. It can still be rebound/unbound with conflict validation. **Regen gameplay remains reserved/disabled:** V cannot heal, start a cooldown or invent an effect. Recall B, battle spell F, attack Space and the exactly three top-row 1/2/3 skills retain their defaults.

### Original landscape Settings

Reference-guided original translucent panel: centered Settings heading, left category sidebar, blue/cyan selection accents, horizontal section dividers, on/off switches and a session-only footer. No proprietary screenshot/art was embedded.

- **Basic:** reduced HUD motion; honest read-only WebGL2/offline training information. No fake quality, resolution or frame-rate preset switches.
- **Controls:** target priority, optional joystick, preserved scrollable key customization, Restore default keys and help.
- **Interface:** show/hide key badges and battlefield-control help.
- **Sound / Network:** visibly unavailable, with reserved/offline labels. No audio/network feature was invented.

The three supported pages use accessible tabs/labelled panels, selected state, one tab stop and Arrow Up/Down/Home/End navigation. Unavailable categories are disabled. The content scrolls separately so sidebar, header, close and footer remain accessible at compact landscape sizes. Preferences remain session-only; closing/reopening Settings preserves them, arena Reset preserves key settings, and reloading the HTML restores defaults.

**Target priority is now also in Settings → Controls.** Nearest Enemy, Lowest Current HP, Lowest HP Percentage and Manual Target use native radio inputs generated from the existing shared mode definitions. They invoke the existing mode-change path, stay synchronized with the HUD dropdown, clear pins through the existing logic and reflect Reset. The HUD shortcut selector is preserved; no competing targeting algorithm or auto-chase was added. Unsupported hero-lock/filter/cast-slip/skill-size options from the references were not fabricated.

The empty-slot landscape shop and routine-banner removal are preserved. Hero JSON/registry, simulation rules, damage/range/cooldown values, map/colliders, death notifications, original action-cluster geometry and three skills are unchanged.

## Validation

Fresh baseline: **104/104 unit tests and 45/45 offline browser checks**. Final:

| Acceptance | Result |
| --- | --- |
| Unit suite | **112/112 PASS**, all 104 previous cases retained |
| Full offline browser suite | **50/50 PASS**, all 45 previous cases retained |
| Held WASD survives mouse Attack and Space; one attack request per activation | PASS |
| Shop/Settings cancel existing movement and refuse fresh/off-dialog movement/attacks | PASS |
| Closing ignores stale key repeats but accepts fresh movement immediately | PASS |
| Both modals cancel active joystick capture/axes without reviving the drag on close | PASS |
| Settings priority shares HUD/simulation modes and resets without attacking/chasing | PASS |
| Regen V default / reserved no-healing / rebind and restore | PASS |
| Prior key hints, conflicts, unbind/custom/numpad/defaults, mouse/keyboard attack validation | PASS |
| Compact key editor can scroll, rebind, restore and close at 854×480 / 800×600 | PASS |
| Settings tabs, keyboard navigation, close/focus return, shell bounds/overflow | PASS at 1920×1080, 1440×900, 1000×700, 800×600, 854×480 |
| Actual Settings / key-editor screenshots | Visually inspected desktop and 854×480 |
| Existing movement/collision/targeting/range/cooldown/reset/elimination and empty-shop regressions | PASS |
| Named HTML, root HTML and isolated source-ZIP HTML via offline file:// | PASS |
| Runtime errors / warnings / subresource requests | **0 / 0 / 0** |
| Supplementary Vite source smoke / invalid-hero-data error banner | PASS / PASS |
| Hero validation, build, offline parity, source archive integrity, syntax | PASS |
| Dependency audit | **0 vulnerabilities** |
| Native Windows / physical touch-device acceptance | **NOT TESTED** here |

Evidence: [before/after units](settings-input-unit-results.json), [browser before](settings-input-before-browser-results.json), [browser final](settings-input-browser-results.json), [old-artifact freeze reproduction](settings-input-reproduction.json). Linux Chromium 153 / software WebGL2; networking disabled; ordinary file-origin security. The early integration failure and compact-scroll test adaptation are described above; no failed behavior assertion was removed to obtain final acceptance.

The unchanged deterministic gameplay regression still verifies **39 exact snapshots**, SHA-256:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

Exact browser-tested standalone SHA-256, identical after final rebuild:

`c593b78ec0950849122e9630696ec2f7c889a7c36826242f64d8fef2ba0cbbe6`

## Changed files

- `src/input/input-policy.js` — shared editor/global-modal guard, safe for non-element event targets.
- `src/input/controls.js` — preserve movement across HUD focus, gate menu axes/canvas actions, ignore stale repeats, idempotent menu transitions.
- `src/input/joystick.js` — refuse/reset drags under a menu lock.
- `src/input/key-bindings.js`, `src/ui/layout.js` — Regen V default and initial HUD label.
- `src/ui/button-shortcuts.js` — global modal guard for gameplay/button shortcuts.
- `src/ui/settings-panel.js`, `src/ui/styles/settings.css` — original scoped landscape Settings, real tab navigation, accessible implemented preferences.
- `src/ui/panels.js` — compose Settings and synchronize the shared input lock on modal open/close; retain shop/modal lifecycle.
- `src/ui/targeting-controls.js`, `src/ui/hud.js` — Settings priority inputs through existing mode-change path; synchronize settings and HUD every render.
- `src/ui/style.css` — import scoped Settings styles.
- `tests/input-policy.test.js` — six new unit cases for policy, held movement/focus, menu isolation, virtual axes, blur/editors and repeated close notifications.
- `tests/settings-panel.test.js` — two new unit cases for real/disabled tabs, markup and unique/restorable reserved V binding.
- `tests/key-bindings.test.js` — assert the corrected V default in the existing defaults regression.
- `tests/browser-settings-input.mjs`, `tests/browser.mjs` — five new real offline browser groups and integration.
- `tests/browser-hud.mjs`, `tests/browser-key-settings.mjs` — select the actual category for relocated preferences and explicitly scroll the inner content to the compact key editor; retain prior on-screen bounds/behavior assertions and fix empty-string details-open detection.
- `index.html` — rebuilt standalone.
- `README.md`, `PROJECT_RULES.md`, `deliverables/README.md`, historical settings/shop report links — instructions and approved scope.
- This report and `docs/settings-input-*.json` — durable baseline/final evidence.
- Regenerated ignored downloads: `deliverables/MOBA-Lab-Phase-3.html`, `deliverables/MOBA-Lab-Phase-3-source.zip`.

No dependencies/lockfile, hero data, simulation or character assets changed. Reference images, transient logs/screenshots, browser/dependencies and duplicate builds remain excluded from Git/source ZIP.

## Play / reproduce

Download **`deliverables/MOBA-Lab-Phase-3.html`**, put it alone in an empty folder, disconnect networking and double-click in current Chrome/Edge with WebGL2 enabled. No server, Node or sibling files are needed. The source ZIP contains the identical playable root `index.html`.

1. Hold WASD and click Attack: movement should continue without a re-press; Space behaves the same.
2. Open Shop/Settings while moving. The player must stop; new WASD input inside the menu must not move/attack. Close and press a movement key afresh to resume.
3. Open Settings → Controls; select a priority and verify the existing HUD selector reflects it. No target mode should chase enemies.
4. Check Regen V, remap it, then Restore default keys. V should show again, but the reserved button must not heal/cast.
5. In Interface, hide/show hints; in Controls, test key conflicts/unbind/remap; in Basic, test reduced HUD motion. Close/reopen preserves preferences; reloading the HTML restores defaults.

Development: `npm ci`, `npm run dev -- --port 5173` (0.0.0.0, preview hosts permitted). Validation: `npm test`, `npm run package:source`, `npm run validate:offline`, `npm run test:browser`. Optional sandbox-only supplementary source smoke: `DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser`. Browser-facing game code calls no localhost backend.

Windows double-click and real touch-device acceptance remain manual; Linux automation does not certify either. No genuine character GLBs/animations, abilities, Regen effects, audio, networking, graphics preset system, purchases/economy, mana or team gameplay were introduced. The intentional Vite >500 kB warning remains expected because Three.js is bundled into one offline HTML (~723 KiB).

**Stop for review after validated delivery.** No additional gameplay/asset milestone is authorized.
