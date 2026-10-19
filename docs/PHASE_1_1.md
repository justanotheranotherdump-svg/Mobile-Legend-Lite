# Phase 1.1 — Smart Targeting acceptance report

Date: 2026-10-17. **Implemented only the approved targeting milestone. Ready for user review; no Phase 2 work.**

## Scope and semantics

- Four HUD-selectable modes: nearest, lowest absolute current HP, lowest HP ratio, manual.
- New pure `src/simulation/targeting.js` owns eligibility/range/scoring/ties, not rendering or movement.
- `TrainingSimulation` has an enemy registry, selected ID and optional manual pin. Selection is refreshed after movement, attack/death, reset, mode changes and pin clearing.
- Auto candidates must be living targetable enemies with finite HP/coordinates, positive max HP, and within 6m center-to-center range. Ties use distance then stable ID. No candidate means no attack and no automatic movement.
- A direct living-enemy click pins and attempts an attack. Pins override all modes until death/invalidation, a mode change or Clear lock. A living out-of-range pin is retained, but damage is rejected; no chase or silent fallback to another enemy.
- Manual mode uses nearest-in-range fallback when no valid pin exists, including after the pinned target dies. This policy is explicit in the HUD/readme.
- Ground clicks and the LMB HUD button use the same attack validator. Each click requests one attack; no held-input firing loop or target-driven movement.
- Three configurable dummies: A 200/200 at (0,0), B 90/120 at (3,1), C 120/400 at (2,-3). At player (-1.5,1.5) all are in range; winners are A/B/C respectively. Reset restores starting HP (not max HP for B/C), default mode and complete target/player/cooldown state.
- All dummies show current/max HP; selected dummy is highlighted with a gold ring and HP-label border. HP/selection UI is driven by simulation state.

## Files changed

- New: `src/simulation/targeting.js`, `tests/targeting.test.js`, this report and Phase 1.1 evidence JSON files.
- Updated: `src/simulation/game.js`, `src/data/training.json`, `src/rendering/world.js`, `src/input/controls.js`, `src/main.js`, `src/ui/hud.js`, `src/ui/style.css`, `dev.html`.
- Updated regression tests: `tests/simulation.test.js` (all 11 foundation tests retained, adapted to enemy IDs/registry), `tests/browser.mjs`.
- Packaging names updated to Phase-1.1 in `scripts/`; root `index.html` regenerated as the full offline game, still intentionally committed.
- Updated README, persistent rules and deliverable instructions. No dependencies added, no reference assets reintroduced.

## Verification matrix

Results are from performed tests, not visible controls alone. Unit tests use Node; browser tests use Linux Chromium 153.0.8010.0 with software WebGL2, ordinary file-origin security and networking disabled.

| Test / acceptance requirement | Automated unit result | Browser result |
| --- | --- | --- |
| Nearest Enemy picks A at common in-range position | PASSED | PASSED via real selector |
| Lowest Current HP picks B (90 absolute HP) | PASSED | PASSED via real selector |
| Lowest HP Percentage picks C (30%) | PASSED | PASSED via real selector |
| Manual Target and direct-click override | PASSED for every auto policy | PASSED: direct clicks, ground clicks, Manual mode |
| Clear lock/mode change return to automatic policy | PASSED; cooldown not reset | PASSED via HUD |
| Only valid living enemies qualify | PASSED: dead, ally, untargetable, malformed/removed units | PASSED for dead units; synthetic malformed/friendly/removal scenarios NOT TESTED in browser |
| Deterministic ties by distance and ID | PASSED for all four modes and reversed input | NOT TESTED in browser (training configuration has no ties) |
| Prefer in-range candidate over distant lower HP | PASSED for all modes | Out-of-range rejection PASSED; artificial distant-low-HP comparison NOT TESTED in browser |
| Death immediately reselects by active policy | PASSED for each automatic mode and manual fallback | PASSED for lowest-current-HP, pinned override, and Manual mode |
| Reject out-of-range attacks | PASSED including exact-range boundary and pinned target with another enemy in range | PASSED for automatic and pinned attacks at spawn |
| Never chase or move automatically | PASSED for mode changes, successful attacks, out-of-range and empty states | PASSED: coordinates unchanged across selectors, pins, attacks, out-of-range feedback |
| Cooldown and damage clamping | PASSED | PASSED: rapid ground click rejected; killing blow clamps B from 15 HP to 0 |
| All HP/max HP labels and selected indicator | State configuration PASSED | PASSED: DOM HP strings, selected-label identity; gold ring visually inspected in screenshot |
| Reset all health, mode, pins, player, cooldown | PASSED including changed player HP/configurable default | PASSED via Reset button after damage/deaths/locks |
| WASD, diagonal normalization, fixed timestep | PASSED (30/60/144 render schedules) | PASSED real keyboard/cardinal vs diagonal speed |
| Arena/obstacle/dummy collision and sliding | PASSED including living/dead unit collider | PASSED boundary/obstacle contact/sliding; dead-unit collider tested in unit suite only |
| Camera follow and ground aiming | NOT TESTED in unit suite (Three.js/browser concern) | PASSED after movement and resize |
| Focus pause, held-key clearing, no catch-up jump | PASSED clock tests | PASSED synthetic blur/focus; real Windows Alt-Tab NOT TESTED |
| Resize 1000×700, 800×600, 1440×900 | NOT TESTED in unit suite | PASSED camera/canvas/picking/reset alignment |
| All enemies dead / invalid click handling | PASSED, no replacement attack | Dead direct click PASSED; exhausting all three dummies NOT TESTED in browser |
| Live development source loads | NOT APPLICABLE to unit suite | PASSED separate online Vite smoke; no page/console errors |
| Windows offline double-click and native GPU behavior | NOT TESTED | NOT TESTED in Linux environment; user checklist below |

### Commands and evidence

- Clean `npm ci` and `npm audit`: **PASSED**, zero reported vulnerabilities; no dependency changes.
- `npm test`: **34 PASSED, 0 FAILED**. Full per-case list: `phase-1.1-unit-results.json`.
- `npm run build`: **PASSED**. Vite warning about a >500 kB chunk is expected for embedded Three.js, not a build error.
- `npm run validate:offline`: **PASSED**. Root index, dist index and named standalone match; inline code/CSS, dist contains only one HTML.
- `DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser`: **23 offline checks PASSED**, separate development smoke PASSED. Per-case browser evidence: `phase-1.1-browser-results.json`.
- Final clean-install rebuild was SHA-256 identical to the browser-tested HTML. ZIP integrity, no-reference exclusion, and JS syntax/diff checks **PASSED**.
- Tested the generated named HTML through **file://**, not just HTTP preview. Also tested committed root index and extracted source-ZIP index isolated in a folder with spaces/Unicode and no siblings.
- Offline browser interactions recorded **zero subresource requests, zero runtime exceptions, zero console errors/warnings**.
- Screenshot of Lowest HP Percentage at common range was inspected: C has a gold ring/label and side-card HP 120/400, while all three current/max HP labels are visible.
- The first combined browser run passed all 23 offline checks but its optional Vite smoke asserted an exact script URL; Vite legitimately appended an HMR timestamp query. Corrected that test to accept the main-entry prefix, then reran the entire suite successfully. This was a test assertion issue, not an offline runtime workaround.

## Exact run instructions

Play: download `MOBA-Lab-Phase-1.1.html`, or extract the source ZIP and open root `index.html` in Chrome/Edge. No npm/server/runtime network required.

Develop/reproduce:

```bash
npm ci
npm run dev -- --port 5173
npm test
npm run build
npm run package:source
npm run test:browser
npm run validate:offline
```

Browser test prerequisites are described in README. Source packaging needs zip; ZIP regression extraction needs unzip. These are development-only tools.

## Windows/manual checklist — NOT TESTED HERE

1. Move only the new HTML to an empty Windows folder, disconnect networking, and double-click it in Chrome/Edge. Verify a styled, rendered 3D arena, not bare text.
2. Press D until all three dummies are inside the 6m ring, near player (-1.5,1.5). In the selector choose Nearest → A, Lowest Current HP → B, Lowest HP Percentage → C. Verify gold indicator follows selection.
3. Click empty ground: only selected dummy loses 25 HP. Repeated fast clicks must respect 0.65s cooldown. The hero must stay still.
4. Under Lowest HP Percentage, directly click A. Verify LOCKED/A, then ground-click after cooldown: A remains prioritized. Clear lock restores C.
5. In Manual Target mode, click B or C and defeat it. It must not be selected after death; the nearest eligible living in-range unit becomes the fallback. Dead clicks must not damage a replacement.
6. Walk away with WASD while a dummy is pinned. Out-of-range attacks must show feedback and must not damage, consume attack cooldown, or chase. With no pin and no enemies in range, no target is selected.
7. Reset: A 200/200, B 90/120, C 120/400, player spawn/100 HP, nearest mode, no pin, no target at spawn, cooldown ready, hits 0.
8. Check WASD/diagonals, walls/blocks/dummies, mouse-ground aim, window resize, actual Alt-Tab while holding/releasing a key. Confirm no stuck movement/jumps.
9. Optionally inspect Console/Network on offline reload: no external requests or runtime errors. Move/rename the HTML and reopen; no sibling files should be needed.

## Known limitations / deliberate exclusions

- Only the requested targeting improvement and supporting training dummies/UI/tests. No skills, spells, recall, items, teams, navigation, menus, Ranked, progression or Phase 2.
- Target scores are recomputed each simulation update, so automatic selection can change as the player moves. Manual pins persist across movement, including out-of-range positions; clear them to resume automatic selection.
- Basic attack remains instantaneous with range/cooldown validation and no line-of-sight/projectile system, as in the approved foundation.
- Manual mode's unpinned/death fallback is explicitly nearest-in-range, not random and not unlimited-range selection.
- No ongoing auto-fire; each click is an attack request. Selection mode is session state, not persisted settings.
- Placeholder geometry only, no final model/animation claims. Player is not attacked in this training arena.
- Desktop WebGL2 required. Native Windows graphics, genuine OS task-switching, and broader device/browser compatibility still need manual verification.

**Stop after Phase 1.1 and wait for user testing/approval.** A hero combat kit remains a future recommendation, not implemented or approved here.
