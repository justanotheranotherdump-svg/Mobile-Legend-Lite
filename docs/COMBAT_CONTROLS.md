# Keyboard-only HUD and locked/tap/hold combat controls

Date: 2026-10-18. User-requested correction after testing the reconstructed Layla.
This intentionally supersedes the initial movement-during-shooting, mouse-hover
facing, directional-tap and wall-stopped-shot behavior. It does not recover/rebalance
an original kit, change the approved model, or add any actors/maps/AI/items.

## Play / controls

- **WASD** moves normally with the same camera-relative normalization and collisions.
  The joystick and its setting are absent from the default game. The hero HP/mana
  panel now sits bottom-left where the joystick used to be.
- Target priority is **Settings → Controls only**; the card beneath the minimap is
  removed. Settings also contains **Clear manual target lock**. Existing manual
  enemy-click pins, priority modes and deterministic tie-breaking remain.
- **Space / Attack button / LMB** requests one basic attack. It validates an eligible
  enemy within current basic range before starting. The projectile absolutely locks
  to that enemy, follows its changing position, passes obstacles and other enemies,
  and hits once on authoritative contact. It never silently switches targets.
- **Tap 1/2/3 or a skill button**: auto-target according to Settings priority, using
  that skill's own current range (including the S1 range buff for S2). No mouse aim
  is needed. A valid in-range manual pin wins; an out-of-range pin does not silently
  switch. Without a pin, Manual mode retains its nearest fallback. No eligible tap
  target means no cast, no animation lock, no mana/cooldown spend.
- **Hold the skill button or its currently bound key for 180ms**: show the original
  procedural ground sight and range guide. Move the pointer to choose direction/
  destination. S2 additionally shows its blast radius; ultimate shows its wide line.
  Nothing is spent during the preview. Release to validate and cast once.
- Releasing over an eligible in-range enemy (within its collider +.6-unit acquisition
  margin) locks that aimed enemy, overriding auto priority without modifying a pin.
  Otherwise it is a freely aimed ground shot, not an invisible auto-retarget.
- **Escape, right-click, click CANCEL, or drag into CANCEL and release** cancels
  aiming without mana/cooldown. Menus, blur, visibility changes, reset, pointer
  cancellation/capture loss, or changing bindings clear the gesture. Stale releases
  do not cast. Pointer capture permits dragging off the original skill button.
- Rebound keys (including numpad), session hint controls, native Enter/Space button
  activation and direct assistive button clicks remain supported. Default keys stay
  top-row 1/2/3. Repeat keydown is ignored. Utilities remain reserved; Regen stays V.

## Shooting animation / facing

All accepted basic attacks and active skills freeze **actual simulation movement**
for the complete existing Shoot animation: `hero.json.actionLockDuration = 1.05s`.
Windup remains .25s, so firing still matches the real muzzle pose. Held WASD is NOT
cleared, so movement resumes on the next simulation tick after the animation lock.
Rejected requests add no lock. A new action cannot restart the unfinished animation.
Configured basic CD remains .65s, but the effective minimum accepted-action interval
is 1.05s because of the full-animation lock. HUD shows **Firing** during the remaining
lock rather than misleadingly claiming Ready when only the shorter CD has expired.

Ordinary mouse hover does not rotate the model or leave an ambient aim marker.
Facing follows actual movement, keeps its last direction when stationary, points
along an active preview, and tracks the locked enemy while shooting/casting.
The minimap arrow follows the same facing. No new animation clip or rig was created:
actual Walk/Shoot only, rest-pose idle, no dedicated death/skill clips.

## Projectile / combat details

Auto/aim-locked S1 and S2 home to their locked living enemy. Ultimate tracks its
locked enemy until the firing instant, then executes its existing instantaneous
wide line once per valid target. All basic and skill trajectories pass obstacles;
**player movement still collides** with the same walls/dummies/bounds. Free ground
shots remain directed and can collide with the first eligible enemy on their path.
A missed S1 still gives no buff. S2 damage/mark/bonus/stun and passive scaling remain
in the simulation, not the renderer. Aiming sights/VFX cannot damage anything.

Range is checked when a target lock is accepted. A valid already-fired homing shot
continues tracking even if that enemy subsequently leaves acquisition range. If it
dies, becomes untargetable/friendly/invalid, the pending or traveling shot is cancelled
without damaging a different enemy. Thus “absolute” lock is not fabricated guaranteed
damage to dead or invalid entities. Current arena enemies are stationary; moving-
enemy homing is deterministic-unit tested, not misrepresented as a new NPC system.

No skill numbers, mana/regen, passive scaling, S1 buffs, S2 marks/stuns or ultimate
line/damage formulas were rebalanced. Only new control/target-lock semantics, the
full-animation gate, projectile wall behavior and UI organization changed.
Approved GLB SHA256 remains
`963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.

## Architecture and regression scope

- `simulation/hero-combat.js`: authoritative action lock, acquisition, aim lifecycle,
  validated target-bound casts and homing collision/damage.
- `input/skill-gestures.js`: shared pointer/rebound-key tap/hold/release/cancel state,
  capture/blur/menu lifecycle; no damage/resource ownership.
- `rendering/aim-sight.js`: read-only original procedural geometry, not copied art.
- HUD/Settings: no joystick or duplicate priority card in the normal game; Clear lock
  moved into Settings. No hidden gameplay target card is retained.
- The explicitly selected `?hero=training` historical fixture intentionally retains
  its older empty skills/joystick/card for the existing 50-check regression suite.
  It is not the default game. This preserves evidence without pretending old
  movement/aim expectations still describe the corrected Layla.
- Four earlier Layla assertions were explicitly revised for the authorized wall-
  passing/auto-tap semantics; their original source remains in the pre-change ZIP.
  They were not silently skipped. Core geometry, replay, stats, marks and model tests
  remain. Two new test files add 20 deterministic checks.

## Validation and packaging

Final results: **163/163 unit tests PASS**, **19/19 updated default-mode offline
browser checks PASS**, and **50/50 historical-fixture offline browser checks PASS**.
Both browser suites recorded zero runtime errors, warnings and subresource requests.
Vite source-preview smoke and invalid-hero-data error handling also PASS. Full final
outcomes are stored in the adjacent
`combat-controls-test-results.json`, `combat-controls-browser-results.json`, and
`combat-controls-foundation-browser-results.json`. The changed-file manifest is
`COMBAT_CONTROLS_CHANGED_FILES.md`.

The browser suite covers UI removal/layout, model movement-vs-hover facing, full-
Shoot movement lock/resumption, tap priority/range, retained marks/bonus/VFX, held
key/mouse preview and release, pin override, Escape/right-click/drag cancel, menu/
blur/reset cancellation, numpad remapping, native Enter activation, compact layouts
and an isolated source-ZIP HTML in a Unicode/spaces file path with network disabled.
One earlier concurrently running software-WebGL attempt timed out waiting for the
8-second simulation movement check (no app errors/warnings). Both suites were rerun
serially without relaxing assertions and passed; the initial attempt is retained in
`combat-controls-initial-regression-attempt.json`.

Unit checks additionally move targets behind walls/decoys/beyond initial range,
validate no retargeting on invalidation, all-skill animation locks and gesture races.

Existing build filenames are retained: root `index.html`, `dist/index.html` and
`deliverables/MOBA-Lab-Phase-3.html` are byte-identical single embedded HTMLs; the source
ZIP contains organized source/model/tests/docs and the playable root HTML. No CDN,
server or sibling asset is required for play. Uploaded reference screenshots remain
outside source/ZIP; aim geometry is original. Vite's large-chunk warning is expected
for intentional one-file offline output, not a browser runtime warning.

**Limitations:** Linux Chromium/software WebGL file:// is automated. Native Windows
Chrome/Edge double-click and physical touch devices remain manual. Pointer capture/
cancel code is shared for touch, but this is deliberately a keyboard-movement game,
not a newly added mobile movement scheme. No portrait/all-device certification,
new animations, skeletal rig, AI, economy, competitive balance or guaranteed hits
on invalid/dead targets. Stop after delivery for review.
