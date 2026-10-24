# Gameplay roadmap Phase 1 — changed files

Base: `e6c8f392be86dce43bb6e9bf4d9f10b0e8590164`; branch
`arena/55ce0f80-mobile-legend-lite`. No commit/push performed for this milestone.

## Responsibilities

- **Hero data/validation:** Layla schema 3 base/growth/conversions/XP, rank tuning,
  strict allowlisted field validation; historical schema 1/2 supported.
- **Simulation:** independent pure stat, XP/rank, damage/defense and validation
  modules; combat integrates resource growth/regen, learned skills, snapshot
  damage, actual attack rate/full adjusted lock. No rule in UI or animations.
- **Practice config/UI:** existing Layla dummy HP scale/defenses; visible skill
  point allocation, live level/XP/attributes and labeled session-only commands.
- **Presentation:** same Shoot clip can follow an accepted basic duration;
  skill playback resets normal rate. HUD refreshes actual rank-dependent values.
  PNG hero guide removes stale no-level claims and shows current rank tables.
- **Tests:** 90 new unit tests and new offline progression suite; existing
  learned-kit tests explicitly prepare level 4/rank 1 through simulation/UI.
  Menu/audio tests learn S1 before casting; compact software-WebGL handoff budget
  increased without altering production menus. Historical fixture tests unchanged.
- **Docs/generated root:** current requirements/report/README, full evidence and
  this manifest; root index rebuilt through the unchanged packaging workflow.

## Modified tracked files

- `PROJECT_RULES.md`
- `README.md`
- `deliverables/README.md`
- `index.html`
- `package.json`
- `src/gameplay.js`
- `src/heroes/layla/abilities.json`
- `src/heroes/layla/hero.json`
- `src/heroes/registry.js`
- `src/menu/hero-details.js`
- `src/menu/hero-presentation.js`
- `src/rendering/heroes/hero-visual.js`
- `src/rendering/world.js`
- `src/simulation/ability-contract.js`
- `src/simulation/hero-combat.js`
- `src/ui/cooldowns.js`
- `src/ui/hero-skills.js`
- `src/ui/hud.js`
- `tests/browser-hero-browser.mjs`
- `tests/browser-layla.mjs`
- `tests/browser-menu.mjs`
- `tests/browser-panels.mjs`
- `tests/browser-polish.mjs`
- `tests/combat-controls.test.js`
- `tests/hero-browser.test.js`
- `tests/layla.test.js`

## New files

- `docs/GAMEPLAY_PHASE_1.md`
- `docs/GAMEPLAY_PHASE_1_CHANGED_FILES.md`
- `docs/gameplay-phase-1-foundation-browser-results.json`
- `docs/gameplay-phase-1-heroes-browser-results.json`
- `docs/gameplay-phase-1-layla-browser-results.json`
- `docs/gameplay-phase-1-menu-browser-results.json`
- `docs/gameplay-phase-1-panels-browser-results.json`
- `docs/gameplay-phase-1-polish-browser-results.json`
- `docs/gameplay-phase-1-unit-results.json`
- `docs/gameplay-phase-1-validation.json`
- `docs/progression-browser-results.json`
- `src/data/layla-practice.json`
- `src/simulation/stats/attributes.js`
- `src/simulation/stats/damage.js`
- `src/simulation/stats/progression.js`
- `src/simulation/stats/validation.js`
- `src/ui/progression.js`
- `src/ui/styles/progression.css`
- `tests/browser-progression.mjs`
- `tests/helpers/offline-browser.mjs`
- `tests/helpers/practice.mjs`
- `tests/progression.test.js`

## Generated ignored downloads (workspace, not Git)

- `deliverables/MOBA-Lab-Phase-3.html` — current Phase 1 content; historical name.
- `deliverables/MOBA-Lab-Phase-3-source.zip` — editable source + offline root.
- `dist/index.html` — identical to root/named standalone, build output only.
- `deliverables/GAMEPLAY-PHASE-1-SHA256.txt` — artifact hashes for this delivery.

No changes to approved GLB/PNG, historical `src/heroes/training/`,
`src/data/training.json`, arena geometry or input/targeting policies. No new
references, dependencies, ripped art, AI, economy, additional hero or roadmap
Phase 2–5 implementation. Details and limits: `GAMEPLAY_PHASE_1.md`.
