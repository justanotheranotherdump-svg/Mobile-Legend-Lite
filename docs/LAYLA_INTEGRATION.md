> Historical initial-reconstruction report. The user subsequently requested different combat controls and a keyboard-only HUD. See [COMBAT_CONTROLS.md](COMBAT_CONTROLS.md) for the current behavior and validation.

# Layla reconstruction and approved-GLB integration

Date: 2026-10-18. This is **intentional reconstruction**, not recovered gameplay.

## Recovery before editing

Fetched the existing session ref without switching/resetting the working branch.
Inspected its complete 12-commit history through `d921b3f`, all 247 reachable
historical blobs, available branches/tags, PRs/releases and the saved asset-study
ZIPs. No Layla passive/active/mana/combat source was found. Phase 2 has only Test
Hero and `abilities.json: []`. No tags/releases/other kit branch were available;
PR 1 is the same session branch. Asset-study ZIPs contain no gameplay kit.

The user explicitly authorized reconstruction if recovery failed. Before edits,
112 unit checks, build/source packaging and 50 offline browser checks passed.
A full pre-edit source ZIP and hash manifest were preserved outside the repo in
`/home/user/layla-integration-work/`. No destructive reset, branch switch, asset
regeneration, new map/hero, NPC AI, shop/economy or unrelated utility was added.

## Editable initial values — not recovered/canonical balance

Edit `src/heroes/layla/hero.json` and `abilities.json`; strict schema rejects unknown
fields, non-finite values, unsupported effects and missing/duplicate slots. JSON
never executes code. Schema 1 remains intact for the historical fixture; schema 2
requires this four-slot supported effect contract and mana fields.

| Component | Initial values and behavior |
|---|---|
| Arena defaults retained | HP 100; speed 5.5; radius .45; basic damage 25, range 6, CD .65s |
| New mana/basic projectile | Mana 100; regen 4/s alive; basic projectile speed 18; windup .25s |
| Malefic Gun | Linear 100% close → 115% at 6 world units; clamp beyond 6; turret/tower exclusion |
| Malefic Bomb / 1 | Physical base 35; range 9; mana 20; CD 5s; windup .25s; projectile speed 14/radius .16 |
| S1 successful-hit buff | 3s; movement ×1.2; basic range +2; S2 range +2; refresh, no stacking |
| Void Projectile / 2 | Physical base 30; range 7; mana 25; CD 7s; windup .25s; speed 10/radius .22; blast radius 2 |
| S2 mark/trigger | Mark 4s; next offensive hit adds 15 base damage, consumes old mark, stuns nearby enemies within radius 2 for .6s |
| Destruction Rush / 3 | Physical base 70; range 12; full width 1.4; mana 40; CD 14s; windup .25s |

There is no armor/resistance/crit/level system: “physical” damage is direct HP
reduction. Passive is applied **once**, to `(base + consumed-mark bonus)` at damage
time using player/target center distance; no turret scaling. A damaging S2 can
consume an old mark once and place one fresh mark on each survivor. No recursive
mark-damage event is emitted. Marks expire, deaths remove them, reset clears all.
Stun is tracked with an expiry and enforced by the common action predicate and
movement adapter. Current dummies are stationary/non-attacking; this milestone
does **not** add NPC actions to demonstrate interrupting an AI attack.

## Authoritative combat vs presentation

`HeroCombatSimulation` extends the existing movement/target-selection foundation.
Reusable swept segment/circle, obstacle-box and arena-edge collision tests choose
the first eligible living enemy/wall for basics/S1/S2. Small timestep tunneling and
close-range barrel skipping are prevented. The initial player-to-muzzle offset is
also swept; no damage depends on mesh bounds. Basic attacks now use authoritative
travel in Layla mode (the historical training fixture retains its instantaneous
baseline). Basics/S1 stop at first collision; S1 buffs only on an enemy hit. S2
explodes on first enemy, wall/arena edge or the clamped intended destination, then
hits eligible entities in blast radius plus collider radius. The ultimate pierces
obstacles/enemies and hits each eligible collider intersecting its forward line
once per cast; it does not hit behind the caster.

Cast validates alive/stun, supported slot, finite nonzero aim, mana, per-skill CD
and current windup before spending. Cost/CD start once at acceptance. Other actions
are rejected during windup. Death cancels pending casts/projectiles; no mana regen
while dead. Reset restores HP/mana/spawn/enemies and clears timers, buffs, marks,
stuns, pins, pending casts, projectiles, aim and visual feedback. Existing session
bindings/preferences intentionally survive game reset.

S1/ultimate freeze direction at acceptance, never silently auto-retarget. Mouse
position is projected onto ground; over HUD the last chosen point is retained. With
no chosen aim, facing is used; S2 alone may use an existing selected target as its
fallback. S2 freezes its ground destination, even if the player moves during cast.
Movement remains possible while shooting/casting; firing orientation is briefly
locked to make launch direction readable. Target priorities/manual pins remain
independent and never move/chase the player.

`CombatVfx` consumes cast/launch/hit/impact/explosion/mark-trigger/beam events and
projectile/status state. Yellow S1/trails/impact, purple S2 cue/orb/blast/mark/trigger,
wide warm ultimate cue/beam/impacts and pale basic bolts are lightweight Three
geometry. VFX never owns damage. Test coverage verifies enabling/updating/resetting
VFX does not change a simulation snapshot. Timed presentation objects are disposed.
The muzzle offset (+Z ~1.53, side .13, height 1.11) matches the actual Shoot firing
pose; a real-loader sample at .25s measured (x .12981, y 1.11000, z 1.52750).

## Approved model and real animation limits

`src/heroes/layla/assets/layla.glb` is a byte-identical copy of the approved
`/home/user/layla-forward-shoot-experiment/layla.glb`. Original study folders/files
were not edited or re-exported.

- SHA256 `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`
- 64,808 bytes; 8 meshes; 396 triangles; 2 materials; no textures/bones/skins.
- Six rigid body parts plus cannon and muzzle flash. **Not a skeletal rig.**
- Actual `Walk` ~1.20s, `Shoot` ~1.05s; no Idle/Death/dedicated skill clips.
- Move uses Walk. Basic and skills reuse Shoot. Idle stops tracks/restores rest
  pose. Death hides the model without fabricating an animation; reset restores it.
- Ground minY ~0, height ~1.96; scale 1, rotation adjustment 0, offset 0.
- Fresh official Khronos validator: **0 errors, 0 warnings, 0 infos, 0 hints**.
  See `LAYLA_GLB_VALIDATION.json`. Actual Three GLTFLoader and bounds/clips tested.

## HUD, controls and scope retained

Exactly three functional Layla skill buttons use default top-row 1/2/3 and the same
button-click path for keyboard/custom bindings. Mana bar/numbers, per-skill costs,
CD countdowns, no-mana/cast/death state, live basic range and buff indicator are
shown. Names/costs are accessible; Settings no longer calls these skills reserved.
Regen remains V and reserved. Utilities, gold/team counters, equipment and empty
shop remain unchanged/reserved or interface-only. No fake routine notifications.

WASD/joystick normalization, collisions, camera, smart targeting/manual pinning,
input clearing/modal gating, genuine elimination notifications, settings landscape
layout, custom numpad keys/hints and session-only binding preferences are retained.
The old Test Hero is **only an explicitly selectable regression fixture** via
`?hero=training`; default boot is reconstructed Layla. Foundation assertions were
kept, not deleted: fixture discovery is scoped explicitly, full roster separately
tested. Historical browser suite uses that query; a new suite covers default Layla.

## Validation evidence

Final results: **143/143 unit tests** (112 retained +31 new), **50/50 historical
fixture offline browser checks**, and **11/11 new-default offline integration checks**
all PASS on the final HTML. Source preview smoke and invalid-hero-data error handling
also PASS. Full run outcomes are recorded in `layla-test-results.json`,
`layla-browser-results.json` and `layla-foundation-browser-results.json` beside this
report. Both offline suites recorded zero runtime errors, warnings and subresource
requests. Windows/native touch remain untested.

New unit checks cover passive/turrets, first collision/walls/arena edge, S1 success/
miss/buffs/expiry, S2 destination/area/marks/expiry/bonus/nonrecursion/stun, line width/
multiple/unique ultimate hits, mana/CD/invalid aims/death/reset, targeting, real GLB/
clips/rest idle, post-windup travel and read-only VFX/snapshots. Browser checks use
real UI, ground projection and read-only diagnostics (no simulation mutation API).
They cover default GLB, costs/cooldowns, travel/HP, marks/trigger VFX, beam, key/click
routing, movement during skill click, Settings/Shop gates, numpad rebinding, reset,
1440×900/960×540/800×450 controls and isolated source-ZIP HTML at a Unicode/spaces
file path with offline context and zero runtime subresources/errors/warnings.

Build embeds all JS/CSS/Three/JSON/GLB/VFX in ONE HTML. Root `index.html`,
`dist/index.html` and `deliverables/MOBA-Lab-Phase-3.html` are identical. Existing
Phase-3 filenames are retained for compatibility, not a claim this is asset-only.
Source ZIP contains organized source/tests/docs and the playable root HTML, no
node_modules/reference images/runtime sibling dependency. Vite's >500kB chunk
warning is expected for intentional single-file offline bundling, not a runtime
warning. See `LAYLA_CHANGED_FILES.md` for changes relative to the pre-edit snapshot.

## Known limitations / manual approval checklist

- Linux Chromium/software WebGL file:// was automated. **Native Windows Chrome/
  Edge double-click/offline behavior and physical touch are NOT certified.**
- No dedicated idle/death/skill animation, skeletal rig, IK, generated replacement,
  animation retargeting, sound or advanced particle system was invented.
- No real enemy attack/AI/team actors, armor, leveling, competitive balance or
  item/economy systems. Stun mechanics are tested against actor status/movement;
  stationary dummies cannot visibly stop an attack they do not have.
- Health/death guards are deterministic-unit tested; player cannot currently die
  naturally because retained training dummies do not retaliate. No fake death UI
  or additional actor system was added just to simulate it.
- Existing landscape foundation retained; portrait/tiny windows and all possible
  device/browser/GPU combinations are not certified.

On Windows: disconnect network, open copied-alone HTML, check actual character and
1/2/3 with ground aim, mana/CD, hits/buffs/marks/beam; test WASD/joystick, settings
custom keys, menu blocking and reset. Stop after delivery for user approval.
