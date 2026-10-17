# Changed files — combat-control correction

Compared to the approved initial Layla integration before this request, not the
repository's initial empty commit. Pre-change game/source saved outside the repo
in `/home/user/layla-controls-work/before-source.zip`. No original files removed.
`deliverables/README.md` is also updated.

## Modified

- `PROJECT_RULES.md`
- `README.md`
- `docs/LAYLA_CHANGED_FILES.md`
- `docs/LAYLA_INTEGRATION.md`
- `index.html`
- `src/heroes/layla/README.md`
- `src/heroes/layla/abilities.json`
- `src/heroes/layla/hero.json`
- `src/heroes/registry.js`
- `src/main.js`
- `src/rendering/world.js`
- `src/simulation/hero-combat.js`
- `src/ui/button-shortcuts.js`
- `src/ui/cooldowns.js`
- `src/ui/hero-skills.js`
- `src/ui/hud.js`
- `src/ui/panels.js`
- `src/ui/style.css`
- `src/ui/targeting-controls.js`
- `tests/browser-layla.mjs`
- `tests/layla.test.js`

## Added

- `docs/COMBAT_CONTROLS.md`
- `docs/combat-controls-browser-results.json`
- `docs/combat-controls-foundation-browser-results.json`
- `docs/combat-controls-initial-regression-attempt.json`
- `docs/combat-controls-test-results.json`
- `src/input/skill-gestures.js`
- `src/rendering/aim-sight.js`
- `tests/combat-controls.test.js`
- `tests/skill-gestures.test.js`
- `docs/COMBAT_CONTROLS_CHANGED_FILES.md` (this list)

## Generated / ignored

- Root/dist/download standalone HTML rebuilt; one embedded file, identical bytes.
- `deliverables/MOBA-Lab-Phase-3-source.zip` regenerated with source/model/tests/docs and root HTML.

## Preserved

- Approved GLB, animation mappings, visual JSON and all training hero files are byte-unchanged.
- Arena/scenario, core clock, movement/collision math, target eligibility/priority, notification/VFX damage separation, input policy, default key-binding data, shop content, package dependencies/lock and offline packaging scripts unchanged.
- Hero stats/basic/mana/skill numbers unchanged. Hero JSON adds the full-Shoot action-lock duration; S1/S2 JSON wall-collision flags intentionally switch off.
- Uploaded reference images were not copied into source/downloads. No new models, animations, NPCs, maps, AI or economy.
