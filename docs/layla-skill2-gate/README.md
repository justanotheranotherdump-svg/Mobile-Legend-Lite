# Layla second-skill activation gate — 2026-10-24

## Request and implementation

Layla's Void Projectile (skill 2) now requires a living, targetable hostile **hero** within its actual cast range. Empty range, minions, jungle creeps, towers and cores alone do not permit activation. Dead, friendly, protected, untargetable or unseen camouflaged heroes do not qualify. Range remains 7 units, or 9 during the existing first-skill range buff; actor collision radius does not extend it. Untyped practice dummies remain hero stand-ins, but untyped match actors do not qualify.

The authoritative `HeroCombatSimulation.castAvailability` gate applies to player and AI casts, including pointer/native click, initial aim, aim release and queued follow-up execution. Rejection returns `no-target` before mana, cooldown, cast animation or projectile commitment. The HUD displays **NO TARGET**. If a hero leaves during aim or before a queued cast executes, execution is rejected without cost.

This is an activation prerequisite, not a homing/hero-only collision redesign. After commitment, existing aimed destination, projectile collision, damage, mark, cost, timing and range remain unchanged. Skill 1 and ultimate still permit aimed empty-space casts. Approved models/effects, Franco hook/recommendations, wallet/ownership/build saves, Brawl and unrelated systems are untouched.

## Inspection and verification

- Checkpoint before edits: `821f749`; original Layla baseline **31/31 PASS**.
- Inspected shared cast/aim/queue execution, targeting eligibility, ability range buff, input gestures and skill HUD before the change.
- Focused: `node --test tests/layla-skill2-gate.test.js tests/layla.test.js` — **51/51 PASS** (20 new cases). Two original test fixtures now include an off-axis valid hero to satisfy the requested prerequisite; all original endpoint/animation and turret damage/passive assertions remain.
- `npm test` — **1081/1082 PASS**. Sole failure is the unchanged historical `tests/franco-preview.test.js:48` requirement for missing saved Plan A download binaries. No tests skipped or removed.
- `node tests/browser-layla-skill2-gate.mjs` — **7/7 PASS**: empty click/no mana/cooldown/animation, native click, minion/tower-only, out-of-range hero, hero leaving while holding aim, valid hero normal cast, offline/no errors. This uses real production engine/HUD/gesture modules in an isolated test-only fixture; no production mutation API or player cheats added.
- `node tests/browser-targeted-brawl-standalone.mjs` — **7/7 PASS** on rebuilt root `index.html`: normal ownership/entry, Brawl shop/purchase/Flicker, Cloud/shop closing, compact HUD, pause/quit/save preservation, zero runtime errors/external requests.
- `npm run build` and `npm run validate:offline` — PASS. Single-file root HTML regenerated with this change.
- Source ZIP integrity, root HTML byte equality, exclusion audit and `git diff --check` — PASS (see delivery manifest).

Browser checks used Linux Chromium/SwiftShader and offline file URLs, not Windows/native-GPU/physical-device certification. Browser fixture and standalone Brawl smoke are separate checks; the fixture is not a claim that a full match AI scenario was manually played.

## Files

Runtime: `src/simulation/hero-combat.js`, `src/ui/hero-skills.js`, regenerated `index.html`.
Tests: `tests/layla-skill2-gate.test.js`, `tests/layla-skill2-ui-fixture.js`, `tests/browser-layla-skill2-gate.mjs`, two fixture adjustments in `tests/layla.test.js`.
Local logs: `artifacts/layla-skill2-gate/` (not shipped).
Downloads: `deliverables/MOBA-Lab-Layla-Skill2-Target-Gate.html`, corresponding `-source.zip`, and `Layla-Skill2-Target-Gate-Manifest.json`.

To play, download the HTML and open it directly in a WebGL-capable browser, without a server or network connection. To edit/test: `npm ci`, `npm test`, `npm run build`; optional development preview: `npm run dev -- --host 0.0.0.0`.
