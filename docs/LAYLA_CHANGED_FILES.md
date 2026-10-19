> Historical initial-reconstruction report. The user subsequently requested different combat controls and a keyboard-only HUD. See [COMBAT_CONTROLS.md](COMBAT_CONTROLS.md) for the current behavior and validation.

# Changed files — Layla reconstruction

Relative to the pre-edit hash manifest, not the repository's initial commit.
The session already contained the approved foundation implementation; it was not
reset or replaced. `deliverables/README.md` is also updated.

## Modified

- `PROJECT_RULES.md`
- `README.md`
- `docs/HERO_ARCHITECTURE.md`
- `index.html`
- `package.json`
- `src/heroes/registry.js`
- `src/main.js`
- `src/rendering/heroes/hero-visual.js`
- `src/rendering/world.js`
- `src/simulation/game.js`
- `src/simulation/movement.js`
- `src/ui/button-shortcuts.js`
- `src/ui/cooldowns.js`
- `src/ui/hud.js`
- `src/ui/key-settings.js`
- `src/ui/style.css`
- `tests/browser.mjs`
- `tests/helpers/heroes.js`
- `tests/heroes.test.js`

## Added

- `docs/LAYLA_GLB_VALIDATION.json`
- `docs/LAYLA_INTEGRATION.md`
- `docs/layla-before-browser-results.json`
- `docs/layla-browser-results.json`
- `docs/layla-foundation-browser-results.json`
- `docs/layla-development-smoke.json`
- `docs/layla-test-results.json`
- `src/heroes/layla/README.md`
- `src/heroes/layla/abilities.json`
- `src/heroes/layla/animations.json`
- `src/heroes/layla/assets/layla.glb`
- `src/heroes/layla/hero.json`
- `src/heroes/layla/visual.json`
- `src/rendering/combat-vfx.js`
- `src/simulation/ability-contract.js`
- `src/simulation/hero-combat.js`
- `src/simulation/skill-geometry.js`
- `src/ui/hero-skills.js`
- `tests/browser-layla.mjs`
- `tests/layla.test.js`

- `docs/LAYLA_CHANGED_FILES.md` (this list)

## Generated downloads (ignored by Git)

- `deliverables/MOBA-Lab-Phase-3.html` — same bytes as root/dist index
- `deliverables/MOBA-Lab-Phase-3-source.zip` — editable source, model, tests, reports and root standalone

## Preserved

- All original snapshot files remain; none removed.
- Arena/scenario JSON, all training hero files, targeting, keyboard/pointer/joystick input, key-binding defaults, layout, Settings/Shop panels, baseline replay/fixture and package lock are byte-unchanged.
- Approved original study GLB and copied game GLB match SHA256 `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
- No new runtime dependencies; no model generation/substitution or study-file edits.
