# Phase 3 — combat-button and three-skill HUD refinement

> Historical refinement report. Defaults remain 1/2/3, but the later [key settings addition](KEY_CONTROL_SETTINGS.md) allows custom bindings (including numpad) and hiding key hints. Counts below describe this earlier delivery.

Date: 2026-10-17. Baseline: `eb658a5`. This is the user's requested HUD correction, not a new gameplay/roster/model milestone.

## Requested changes delivered

- **Attack/minion/tower redesign:** original “Aegis strike” faceted blue metal guard, filled winged-blade emblem, and two smaller target-category satellite buttons. The metallic rim/core, filled minion-helmet and tower crests are authored as inline SVG/CSS. They are not extracted/traced MLBB art or screenshot overlays. Image generation was optional; local vector artwork keeps the result sharp, small and self-contained offline.
- **Exactly three skill buttons:** Skill I, Skill II, Ultimate. The former extra active slot is removed. The three form an arc around the attack cluster, with distinct teal/violet/gold presentation and readable numeric badges.
- **Keyboard convention:** physical top number row **1 → first skill, 2 → second skill, 3 → ultimate**. Binding codes are `Digit1`, `Digit2`, `Digit3`. Numpad keys, F keys and old Q/E/R are not bound to these slots. Ctrl/Alt/Meta combinations are left alone; repeated keydowns and form/dialog input are ignored.
- **Utilities slightly smaller:** desktop Recall/Regen/battle-spell circles reduced from 62px to 50px (~19%); compact landscape from 44px to 38px (~14%); smallest breakpoint from 36px to 32px. Icons/lock marks scale with them. Equipment slots are not changed.
- The attack key hint sits below the metal guard without crossing its real cooldown rail. Cluster controls do not overlap at the tested landscape sizes.

## Honest functionality

| Control | Status |
| --- | --- |
| Basic attack (mouse/HUD/Space), cooldown/range validation | Functional, unchanged |
| Three numeric skill slots | **Reserved/disabled**: shortcut routing exists, but the current hero has no abilities to cast |
| Minion and tower satellites | **Reserved/disabled**: no such targets/systems exist yet |
| Recall, Regen, battle spell | **Reserved/disabled**, smaller visuals only |
| Movement, targeting modes/pins, map, reset, shop/settings UI | Preserved as in the completed Phase 3 milestone |

`requestSkillButton()` routes a future enabled key request through the same native button click path, rather than duplicating combat/skill logic. It refuses disabled or missing buttons. No skill engine, mana, skill cooldowns, new damage, purchases or fake casts were introduced. Numeric labels/ARIA shortcuts are **not proof of implemented abilities**. The actual hero JSON remains unchanged with its empty ability list.

## Changed files

- `src/ui/skill-controls.js`: immutable three-slot/key configuration and guarded shared button routing.
- `src/ui/layout.js`: render exactly those three slots; use the new attack artwork.
- `src/ui/components/attack-art.js`: original inline beveled guard illustration.
- `src/ui/components/icons.js`: original filled strike/minion/tower crests.
- `src/ui/components/buttons.js`: numeric code metadata, accessible shortcut/title badges.
- `src/ui/targeting-controls.js`: category artwork, same disabled availability policy.
- `src/ui/hud.js`: compose skill-key interface controller.
- `src/ui/panels.js`: updated help for top-row 1/2/3 and reserved utilities.
- `src/ui/style.css`, `src/ui/styles/combat-cluster.css`, `src/ui/styles/layout.css`: scoped art/size/position adjustments; remove obsolete four-slot positions.
- `tests/hud.test.js`: three new unit cases for slot count/order, physical-code exclusions, and disabled/native-button routing.
- `tests/browser-hud.mjs`: exact slot/key checks, no fake casts/damage, key-trace routing and modifier guards, internal cluster nonoverlap, utility sizing and key-hint/rail separation across all tested sizes.
- `index.html`: rebuilt committed standalone game.
- `README.md`, `PROJECT_RULES.md`, `deliverables/README.md`, original Phase 3 report historical note, this report and `hud-refinement-*.json`: current instructions and evidence.

**Unchanged:** every simulation, movement/input, targeting, effects, event, world-renderer, hero-definition/registry/model/animation module and data file. New keyboard routing is presentation-only. No dependency or lockfile change.

## Before/after verification

A fresh baseline run before rebuilding captured **89/89 unit tests and 35/35 offline browser checks passing**. After refinement:

| Check | Result |
| --- | --- |
| All unit tests | **92/92 PASS**, all previous 89 retained |
| Offline browser suite | **36/36 PASS**, all previous 35 retained |
| Actual named/root/isolated-source-ZIP file:// HTML | PASS with networking disabled |
| Runtime errors / warnings / subresource requests | **0 / 0 / 0** |
| Original targeting/pins/no-chase/damage/cooldown/reset, WASD/joystick | PASS retained regressions |
| Exactly 3 skills, correct 1/2/3 labels and Digit codes | PASS |
| Numpad/old Q-E-R exclusion; reserved numeric presses cause no casts/hits/HP change | PASS |
| Modifier guard | PASS synthetic keyboard events; no browser-shortcut hijacking added |
| Cluster/control nonoverlap, screen bounds, center battlefield clear | PASS five sizes |
| Reduced utility size and readable attack hint clear of cooldown line | PASS layout assertions |
| Separate development preview and invalid-hero-data banner | PASS supplementary checks |
| Production/hero validation, offline output parity, source ZIP integrity | PASS |
| Rebuild matches browser-tested standalone bytes | PASS |
| Native Windows / physical touch devices | NOT TESTED here |

Tested landscape sizes: **800×600, 854×480, 1024×600, 1440×900, 1920×1080**. Browser checks use Linux Chromium 153/software WebGL2 with normal file-origin security. They test the standalone download, root `index.html`, and archive HTML copied alone to a spaces/Unicode folder. These are not Windows certification or physical-touch testing.

The unchanged deterministic simulation replay still matches all **39 snapshots** with SHA-256:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

The final browser-tested HTML SHA-256 is:

`372ec9d03b34e2e276da6b12ec867a4b2be61d7e6b4cc6b1e720727928105886`

Evidence: `hud-refinement-unit-results.json`, `hud-refinement-before-browser-results.json`, `hud-refinement-browser-results.json`. Synthetic future-enabled button stubs are unit tests only; no unavailable abilities are enabled in the delivered browser game.

## Delivery / pending acceptance

- `deliverables/MOBA-Lab-Phase-3.html` — updated single-file offline game, identical to root `index.html`.
- `deliverables/MOBA-Lab-Phase-3-source.zip` — current sources, lockfile, tests, docs and playable root HTML; no uploaded reference files, dependencies or duplicate builds.

Build with `npm run package:source`; verify with `npm test`, `npm run validate:offline`, `npm run test:browser`. The expected Vite >500kB warning reflects embedding Three.js/GLTFLoader and UI, not a failed build.

On Windows, move only the HTML to an empty folder, disconnect networking and double-click in current Chrome/Edge. Confirm the new cluster/three keys and smaller utilities, then retest existing movement/targeting/attack/cooldown/reset. Unavailable controls must remain disabled. No Windows-specific claim is made without that manual test.

**Stop for approval. No further gameplay, shop, roster, model or animation work is authorized by this tweak.**
