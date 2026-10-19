# AI Training / Brawl — changed files

Relative to pushed Phase-1 HEAD `65cef6cd6d5c5648838ccb8fbcf3c4a47e740674`. Reviewed expansion; the user subsequently authorized updating the same Arena branch.

## Main groups

- **Flow:** guarded AI scenario selection, configurable local room, only-Layla selection, actual local preparation, results/replay/room/menu.
- **Simulation:** new mode/scenario data, team-aware actor lifecycle, deterministic minions, AI difficulty and pulse resources, tower targeting/projectiles/protection, core outcome, real combat XP/gold and six-slot item transactions.
- **Ownership:** shared runtime, abortable listener construction, RAF/renderer/event/audio teardown, shared GLB retention and restored menu renderer.
- **Presentation:** separate original causeway, dynamic allies/minions/structures/minimap/labels, anchored skill badges, original local PNG controls, saved name/level/HP/mana overhead, match HUD/shop/pause, real touch joystick.
- **Compatibility:** `startTraining`, dummy data, original hero/model/creation assets remain. Only a metadata argument was added at the existing basic-projectile damage hook; sandbox behavior is unchanged. Historical browser entry helpers now traverse the authorized prematch route to that same Practice fixture.
- **Delivery:** updated rules, README/report, tests, regenerated single-file root and ignored named HTML/source ZIP.

## Files

- `PROJECT_RULES.md`
- `README.md`
- `deliverables/README.md`
- `docs/AI_TRAINING_BRAWL.md`
- `docs/AI_TRAINING_BRAWL_CHANGED_FILES.md`
- `docs/GAMEPLAY_PHASE_1.md`
- `docs/MENU_SYSTEM.md`
- `docs/match-baseline-unit-output.txt`
- `docs/match-browser-results.json`
- `docs/match-connected-output.txt`
- `docs/match-recovery-browser-results.json`
- `docs/match-recovery-output.txt`
- `docs/match-regression-browser-results.json`
- `docs/match-regression-output.txt`
- `docs/match-unit-output.txt`
- `docs/match-unit-results.json`
- `docs/match-verification.json`
- `index.html`
- `package.json`
- `scripts/create-combat-art.py`
- `src/audio/integration.js`
- `src/core/events.js`
- `src/data/match/difficulty.json`
- `src/data/match/items.json`
- `src/data/match/lane.json`
- `src/data/match/rules.json`
- `src/gameplay.js`
- `src/input/controls.js`
- `src/input/joystick.js`
- `src/input/skill-gestures.js`
- `src/match/actions.js`
- `src/match/ai.js`
- `src/match/config.js`
- `src/match/equipment.js`
- `src/match/objectives.js`
- `src/match/respawn.js`
- `src/match/results.js`
- `src/match/simulation.js`
- `src/match/start.js`
- `src/match/waves.js`
- `src/menu/application.js`
- `src/menu/lobby-view.js`
- `src/menu/match-flow.css`
- `src/menu/match-flow.js`
- `src/menu/match-screens.js`
- `src/menu/mode-screen.js`
- `src/menu/navigation.js`
- `src/rendering/combat-vfx.js`
- `src/rendering/lane-view.js`
- `src/rendering/world.js`
- `src/runtime.js`
- `src/simulation/hero-combat.js`
- `src/ui/assets/bot.png`
- `src/ui/assets/layla.png`
- `src/ui/assets/recall.png`
- `src/ui/assets/regen.png`
- `src/ui/assets/skill-1.png`
- `src/ui/assets/skill-2.png`
- `src/ui/assets/skill-ultimate.png`
- `src/ui/button-shortcuts.js`
- `src/ui/combat-art.js`
- `src/ui/combat-notifications.js`
- `src/ui/hero-skills.js`
- `src/ui/hud.js`
- `src/ui/match-hud.js`
- `src/ui/match-shop.js`
- `src/ui/minimap.js`
- `src/ui/panels.js`
- `src/ui/progression.js`
- `src/ui/styles/combat-cluster.css`
- `src/ui/styles/layout.css`
- `src/ui/styles/match.css`
- `src/ui/styles/progression.css`
- `src/ui/targeting-controls.js`
- `tests/browser-hero-browser.mjs`
- `tests/browser-match.mjs`
- `tests/browser-menu.mjs`
- `tests/browser-polish.mjs`
- `tests/browser-recovery.mjs`
- `tests/helpers/menu-practice.mjs`
- `tests/lifecycle.test.js`
- `tests/match.test.js`
- `tests/menu-profile.test.js`

## Deliberately unchanged

- `src/heroes/layla/assets/layla.glb` SHA-256 `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`
- `src/assets/images/layla-creation.png` SHA-256 `bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1`
- Historical `src/data/arena.json`, `training.json` and hero fixture definitions; Layla JSON kit/growth/animation mappings; account profile/progress schemas; approved original lobby environment/audio source.

The two immutable-byte checks remain executable unit tests. Source-ZIP validation excludes dependencies, duplicate builds and all user reference screenshots. Development screenshots stay in ignored `artifacts/`, not runtime assets.
