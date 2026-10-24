# Layla · Energy Gunner workshop R1

**Separate unapproved model/animation preview only.** Open `Layla-Animation-Preview.html` directly in a WebGL2-compatible Chrome/Edge browser. The HTML embeds code, configuration, real animated GLB and materials. It needs no adjacent files, server, Node, Blender or internet to VIEW. Technical offline tests are Linux Chromium, not native Windows certification.

Existing playable Layla and all game files remain untouched. Parked Franco source/model/preview files present at the start of this task are preserved byte-for-byte. No hero registration, combat integration, build/shop change or other roster/mode is included. Stop for user review after delivery; integration requires a separate explicit authorization.

## First inspection

1. Start in **Idle / model inspection**, using Studio, Front, Side, Rear and Face camera presets. Drag to orbit, wheel/pinch to zoom, right-drag to pan. Inspect the original stylized face, blonde high twin tails, goggles, white/purple/gold outfit and forked cyan-core cannon.
2. Play **Walk**, **Run**, then **Run → aim → fire** at1×. Walk/run are in-place inspection cycles; no foot-IK or game navigation is claimed.
3. Choose **Basic**, **S1**, **S2**, **Ultimate** separately. Use Release / Contact / Recovery phase jumps and the two independent progress bars. Slow down to0.1× to inspect the gun release and short-lived muzzle flash.
4. Change Scenario: stationary hit, off-line miss, explicitly staged moving dummy crossing a fixed shot lane, three targets in a line, empty path. Primary target can be hero-like, smaller minion-like or a labeled turret test dummy (not a finished turret model).
5. **Passive** includes near/mid/far2/4/6-unit presets; each explicitly sets ultimate rank3 for the same valid6.1-unit basic reach. Toggle115/130% candidates, edit the multiplier/threshold, or select turret (bonus fixed to0%).
6. **S1** hit displays three-second extra range and cyan movement chevrons/decaying speed readout. Hero-like hit doubles the movement window1.2→2.4s; minion-like does not. Miss grants neither. These are simulated timing windows, not actual game stat buffs.
7. **S2** mark scope is adjustable: all impact-AoE targets versus primary only. Initial cyan AoE is separate from purple mark-trigger feedback/yellow stun indicators. Choose basic/S1/ultimate follow-up, no follow-up/expiry, target death or out-of-range rejection. No actual HP/damage is applied.
8. **Ultimate**: switch travelling-front and near-instant alternatives at equal range/width. Use line/empty/near/far targets. The travelling front penetrates all eligible lane targets; it does not stop at the first.
9. **Attack → follow-up** compares move/S1/S2/ultimate. Manual Move now before release aborts with no projectile; after release it cancels recovery while preserving the shot. Next skill now follows release; Attack again must wait the original1/APS interval. One manual repeat/follow-up per reset. Effective APS changes real basic pose/release sampling and repeat cadence, not global speed.
10. **Ultimate commitment** compares voluntarily locked wind-up versus allowed movement abort. This is a prototype input policy, not a claim of official hard-CC/spell buffering behavior.

Every tuning/scenario change restarts the staged sequence. Scrub/restart resets staged manual inputs; looping rewinds deliberately. **Reset all** restores candidates and camera/transport. **Download my settings JSON** exports the current workshop settings; it neither writes the game nor promises browser save persistence. JSON can guide a later revision; there is no import-settings UI in R1.

## Editable source / tuning

- `settings.json`: current defaults and provenance, including independent releases/speeds/ranges, width/radius, passive comparison, rank, S1 bonus, mark scope and nonblocking recoveries.
- `research.json`: source-separated candidate rank tables, competing values, dated source notes and unresolved rules. No final damage/cooldown/mana is hardcoded into the pose/controller code.
- `rework-intake.json`: historical initial answers, not the current editable runtime specification.
- `simulation.js`: pure deterministic staged shots, circle contact, AoE/marks/buffs, input/APS and animation scheduling. No game imports/entities/damage/registry.
- `viewer.js`: embedded GLB loader, actual source clip sampler, independent VFX, controls, research panel and read-only test diagnostics.
- `assets/layla-rework.glb`: genuine original geometry,25-bone skin, ten authored/baked clips and local material surfaces. No textures or icons are required.
- `assets/source_blender/layla-rework-preview.blend` relative to repository/source root: genuine editable Blender4.2 source, with arm IK and two bones per twin tail.
- `scripts/layla/author-model.py`: original custom contour/mesh author, rig/IK/action construction and floor-safe baking. Uses bpy4.2.22; exports to this preview only.

### Genuine exported clips versus presentation timing

| GLB clip | Source duration | Source release |
|---|---:|---:|
| Idle |2.00s|—|
| Walk |1.20s|—|
| Run |0.80s|—|
| Aim |1.00s|—|
| BasicAttack |0.60s|0.25s|
| MaleficBomb |0.60s|0.25s|
| VoidProjectile |0.75s|0.40s|
| DestructionRush |1.10s|0.65s|
| HitReact |0.40s|—|
| Death |1.50s|—|

The eight requested model/firing clips are directly inspectable through the workshop. HitReact/Death are extra reusable source actions, not separate viewer buttons or certified death-combat handling. Each firing clip's wind-up and recovery are sampled independently to support tuning. Default effective nonblocking recoveries are .20/.20/.25/.30s respectively; source key data is not claimed to have those compressed recovery lengths baked in. User-supplied release defaults .25/.25/.40/.65s are NOT official measured frame data. Basic timing scales by1.06/effectiveAPS; repeat interval is1/effectiveAPS, never just.25s.

### Declared prototype math / geometry

Workshop units are independent: one scene unit is treated as one reference unit ONLY for this comparison; no official meters or existing-game conversion is certified. Candidate reaches are actor-center distances along horizontal+Z; projectile travel starts at the actual captured animated muzzle, so travel distance is less than center-to-center distance. Basic/S1/S2 speeds18/14/10u/s are editable starting choices; beam45u/s is an original visual alternative. These are not measured official projectile speeds. A fixed-direction swept circle contact test against dummies is only a staging device, not final collision/targeting.

Passive illustration: `1 + (maxMultiplier − 1) * clamp(centerDistance / threshold, 0, 1)`, with turret multiplier1.0. Exact official interpolation and sampling are unresolved. Basic/S2 candidate range = base +0.6×ultimateRank + optional S1 bonus. Default S1 bonus1.6 is a provisional additive amount, not a verified stacking formula. Ultimate sight increase is listed as unconfirmed; no vision/fog system is invented.

S2 initial explosion radius and mark-trigger radius share a tunable value. A direct eligible follow-up consumes that target's mark once; neighboring marks do not chain-detonate from secondary explosion. Dead primary loses interaction; an escaped primary's follow-up is rejected rather than silently spawning a homing projectile. Those rules/mark scope remain proposals. Nearly-instant beam hits at release; travelling mode uses the same width/range with distance/speed arrival. Voluntary ultimate commitment is a selectable proposal, not officially certified uncancellability.

## Rebuild / verify

```sh
npm ci
node scripts/layla/build-preview.mjs
node --test tests/layla-preview.test.js
node tests/browser-layla-preview.mjs
```

Source-package `npm test` runs only21 focused preview tests; the full repository suite includes many unrelated preserved tests. Authoring optionally uses `blender --background --python scripts/layla/author-model.py` or compatible bpy4.2.22. Blender is not needed to view/build with the included GLB. No authoring caches/native libraries are distributed.

See `unit-results.txt`, `browser-results.json`, `verification.json` and delivery report for actual results. Original full-repository baseline already has one failure: the historical Franco PlanA artifact-hash test expects old ignored download files absent from this restored workspace. It was not weakened, bypassed or repaired by modifying Franco. Full baseline795/796; with21 new preview tests816/817, the SAME failure. All existing gameplay tests and all new focused tests pass. Final counts are evidence, not a claim of a completely green repository.

`preservation.json` hashes337 original game/Layla/Franco/source files present at task start; `audit-preview.mjs` requires the full repository to recheck that ledger. It is not expected to run against the smaller standalone source archive. Packaged HTML is separately tested alone with no sibling assets.

## Honest limits

Original stylized fan-project interpretation, not official/proprietary asset or a promise to match commercial likeness/detail. Face/hair/outfit/gun proportions and grip/weight still need subjective approval. Meshed fingers are not individually rigged; no facial rig/cloth/hair physics; two-bone tails are keyed. Arm IK is baked, not arbitrary-aim runtime IK. Walk/run are in-place, with simple input-demo displacement and possible foot sliding during transitions. Floor/hand tests sample poses, not all arbitrary future combat blends. Low frame rates can skip short effects but do not slow the simulation clock.

Dummies, projectiles, impacts, marks, stun stars, range circles and movement chevrons are deliberately procedural staging assets. They are not final hitboxes, damage events, hero targeting, physics, navigation, audio, AI, stats/equipment integration or spell mechanics. Decorative beam glow does not define its candidate lane width. No new builds, skins, modes or heroes are implemented. No official IP rights are transferred.

Tests use Linux Chromium/software WebGL2, emulated390px layout and a synthetic visibility event. They are NOT native Windows/physical-device/GPU certification. Global1× and eight requested actor studies are actually played to completion in browser checks, alongside deterministic scrubbing tests; some brief manual-input checks use0.1× inspection for reliability.

**STOP for user visual/animation feedback. Existing game and parked Franco stay unchanged.**
