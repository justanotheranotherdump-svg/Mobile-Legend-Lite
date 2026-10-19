# Changed files — Game Polish

Work is on `arena/55ce0f80-mobile-legend-lite`, layered on recoverable checkpoint
`d94cbb6ae0b3a2a54ae0d37865399584ddb32a6e`. No new commit/push, destructive reset,
branch switch or reference extraction. The exact final path list follows below.

## New authored modules/assets

| Files | Purpose |
| --- | --- |
| `src/player/builds.js` | Versioned per-player/per-owned-hero ordered builds and validation |
| `src/player/history.js` | Actual completed-match records, deduplication, bounded history and derived usage |
| `src/player/account-tools.js` | Verified backup, explicit current-account deletion and restoration |
| `src/menu/preparation-screen.js`, `preparation.css` | Functional build editor, actual equipment/spell wiki, future-only Emblems and shared responsive layout |
| `src/menu/player-profile.js` | Real Overview/History/Hero Statistics, owned-only roster, future Rank, Account and labeled Developer Tools |
| `src/ui/portraits.js`, `assets/layla-portrait.png` | Single shared circular derivative of existing original Layla art |
| `scripts/create-hero-portraits.py` | Optional authoring-only reproducible portrait crop; no runtime dependency |
| `src/simulation/ranges.js`, `src/rendering/range-visuals.js` | Actual range sources, configurable player ring and distinct nearby allied/enemy tower threat rings |
| `src/simulation/attack-command.js` | Persistent filtered targeting, bounded A* approach and cancel/reacquire rules |
| `src/input/directional-aim.js` | Camera-ground-basis relative virtual stick and six-shape data adapter |
| `src/ui/utility-cooldowns.js` | Read-only authoritative spell/Regen cooldown and Recall channel display |
| `src/match/build-priority.js` | Saved purchase sequence, completion, manual override, pause and resume |
| `tests/player-polish.test.js` | 21 additional unit checks; existing 555 remain |
| `tests/browser-game-polish.mjs` | 20 new native offline browser checks through real controls |

## Extended existing systems

- `src/menu/application.js`, `lobby-screen.js`, `navigation.js`: connected
  routes, identity card, owned/profile/preparation navigation, build configuration,
  completion recording, reset/recovery and preserved draft/loading lifecycle.
- `src/menu/battle-screen.js`, `battle-screen.css`: same twelve actual spell cards
  gain icon-grid/detail inspector; retain detailed-card option and actual equip.
- `src/menu/progress.js`, `battle-account.js`: explicitly validated developer
  wallet additions/max level, not new automatic rewards or a second save registry.
- `src/simulation/hero-combat.js`, `src/match/simulation.js`, `src/runtime.js`: shared player command dispatch, live settings, valid
  cancellations, relative aim/spell adapter and accepted authoritative casts.
- `src/ui/button-shortcuts.js`: help now describes the equipped active lane battle spell.
- `src/input/skill-gestures.js`, `src/rendering/aim-sight.js`, `src/spells/system.js`:
  pointer capture/keyboard hold, relative wheel/release/cancel, generic actual-range
  shapes and manual targeted spell direction. No new hero skill/effect definition.
- `src/rendering/world.js`, `lane-view.js`, `combat-vfx.js`: range presentation,
  original bounded halos/shards/beam/rings, cleanup; no damage or model changes.
- `src/ui/hud.js`, `targeting-controls.js`, `settings-panel.js`, `panels.js`: live smart settings/ranges and panel stale-aim safety.
- `src/ui/utility-hud.js`, `spell-hud.js`, `styles/combat-cluster.css`: real dark
  cooldown/channel masks/countdowns and visible hold wheel.
- `src/ui/combat-art.js`, `minimap.js`, `combat-notifications.js`, `match-hud.js`:
  consistent portraits (including live KDA strip), team marker outlines and quieter
  routine feed while preserving important combat/objective/result feedback.
- `src/match/recipes.js`, `src/ui/match-shop.js`, `styles/match.css`: useful
  affordable-component Quick Buy, complete owned tree/next step, saved Recommended
  list and manual/resume UI, without replacing atomic equipment transactions.

## Regression and release workflow

Historical browser tests now explicitly select single-attempt mode for exact
single-hit fixtures, use relative wheel gestures, expect cancellation of stale aim
on panel changes, exercise saved Recommended and useful-component Quick Buy, and
check actual completed history. Batch-1 restores default Smart Basic for strict
minion/tower approach tests and respects the bounded search area. Foundation's
wall-clock allowance is longer on software WebGL; simulation-time/damage/boundary
assertions are unchanged. No test is deleted or marked skipped.

`scripts/package-html.mjs` adds the current named HTML while retaining the original
compatibility alias. `check-offline.mjs` verifies all four HTML copies match.
`package-source.mjs` names the current source ZIP and retains the existing
single-playable-index/exclusion workflow. README and deliverables README describe
the actual current controls rather than historical empty-shop/no-chase behavior.
`docs/GAME_POLISH.md` and JSON/log evidence describe completion, corrections,
actual test results and Windows/device limitations. `index.html` is regenerated.

## Preserved, not changed

The approved Layla GLB and creation PNG, hero definitions/base stats/animations,
the twelve spell registry values/unlocks/cooldowns, 45-item base catalog/stat/price
values, maps/camera, real loading/selection/result/replay and account-versus-match
currency distinction. No screenshot/reference, dependency cache, Git directory or
second generated build is included in the source ZIP.

## Exact path list

```text
.gitignore
PROJECT_RULES.md
README.md
deliverables/README.md
docs/GAME_POLISH.md
docs/GAME_POLISH_CHANGED_FILES.md
docs/b23-browser-results.json
docs/batch1-browser-results.json
docs/game-polish-browser-output.txt
docs/game-polish-browser-results.json
docs/game-polish-browser-suites.json
docs/game-polish-unit-output.txt
docs/game-polish-verification.json
docs/match-browser-results.json
docs/match-recovery-browser-results.json
docs/roster-browser-results.json
index.html
package.json
scripts/check-offline.mjs
scripts/create-hero-portraits.py
scripts/package-html.mjs
scripts/package-source.mjs
src/input/directional-aim.js
src/input/skill-gestures.js
src/match/build-priority.js
src/match/recipes.js
src/match/simulation.js
src/menu/application.js
src/menu/battle-account.js
src/menu/battle-screen.css
src/menu/battle-screen.js
src/menu/lobby-screen.js
src/menu/navigation.js
src/menu/player-profile.js
src/menu/preparation-screen.js
src/menu/preparation.css
src/menu/progress.js
src/player/account-tools.js
src/player/builds.js
src/player/history.js
src/rendering/aim-sight.js
src/rendering/combat-vfx.js
src/rendering/lane-view.js
src/rendering/range-visuals.js
src/rendering/world.js
src/runtime.js
src/simulation/attack-command.js
src/simulation/hero-combat.js
src/simulation/ranges.js
src/spells/system.js
src/ui/assets/layla-portrait.png
src/ui/button-shortcuts.js
src/ui/combat-art.js
src/ui/combat-notifications.js
src/ui/hud.js
src/ui/match-hud.js
src/ui/match-shop.js
src/ui/minimap.js
src/ui/panels.js
src/ui/portraits.js
src/ui/settings-panel.js
src/ui/spell-hud.js
src/ui/styles/combat-cluster.css
src/ui/styles/match.css
src/ui/targeting-controls.js
src/ui/utility-cooldowns.js
src/ui/utility-hud.js
tests/browser-batch1.mjs
tests/browser-game-polish.mjs
tests/browser-layla.mjs
tests/browser-match.mjs
tests/browser-menu.mjs
tests/browser-panels.mjs
tests/browser-shop-spells.mjs
tests/browser.mjs
tests/helpers/practice.mjs
tests/player-polish.test.js
```
