# Phase 2 — Modular hero architecture

This milestone refactors the working Phase 1.1 sandbox. It does **not** implement Layla's kit, mana, healing, respawn, more heroes, or a hero-selection screen. Those mechanics did not exist in the baseline; they were not fabricated during migration.

## Current layout

```text
src/heroes/
  catalog.js                 # Vite eager discovery; no runtime fetch
  registry.js                # Shared schema/reference validation and registry
  model-contract.js          # Embedded GLB/resource/clip contract
  training/
    hero.json                # Existing Test Hero identity/stats/basic attack
    abilities.json           # [] — no abilities in current baseline
    animations.json          # { "clips": {} } — no available clips
    visual.json              # Honest placeholder or future embedded GLB reference
    placeholder.js           # Exact existing temporary capsule mesh, relocated

src/rendering/heroes/
  hero-visual.js              # Shared placeholder/GLTFLoader/AnimationMixer adapter
src/simulation/
  effects.js                 # Code-owned allowlisted effect implementations
  game.js                    # Shared movement/target/attack/cooldown/reset rules
  targeting.js               # Unchanged automatic/manual target policy
  movement.js                # Unchanged movement and collisions
scripts/
  validate-heroes.mjs         # Runs before every production build
  lib/hero-files.mjs          # Node filesystem adapter for same pure validation
```

Only `training` is registered/playable. This is the same **Test hero**, not a newly implemented Layla. Later approved heroes may follow `src/heroes/layla/`, `alucard/`, `tigreal/`, `estes/`, `lancelot/` with the same file contract. No fake empty roster entries are registered for them.

## Definition ownership

`hero.json` has schema version, ID, display name, role, base stats, basic attack, ability IDs and a stable `visual.json` reference. Values migrated exactly:

| Value | Before | After |
| --- | --- | --- |
| Max HP | 100 | 100 |
| Movement speed | 5.5 | 5.5 |
| Collision radius | 0.45 | 0.45 |
| Basic damage | 25 | 25 |
| Basic range | 6 | 6 |
| Attack cooldown | 0.65 | 0.65 |
| Spawn | (-5, 5) | (-5, 5), still owned by training scenario |

`src/data/training.json` now selects `player.heroId: "training"` and stores spawn/target-mode/dummies. It no longer duplicates hero stats. `createHeroState()` maps immutable definition fields to the exact original runtime fields; each simulation/reset creates fresh mutable state. No mesh, Three.js object, or animation lives in simulation state.

The basic attack has `effectId: "direct-damage"`. Existing attack eligibility, range, pin selection, cooldown, hit count and reset remain in shared simulation. Only the existing `Math.max(0, hp - damage)` operation was extracted into a shared handler. No damage formula changed.

## Registry/loading

1. `catalog.js` eagerly discovers `./*/{hero,abilities,animations,visual}.json` and `./*/assets/*.glb` via Vite.
2. `discoverHeroPacks()` groups required sibling files. Folder name must match hero ID; missing/orphan data gets a path-specific error.
3. `createHeroRegistry()` validates, rejects duplicate IDs, clones/freezes all definition data, and privately owns model bytes. `get(id)` rejects unknown IDs; `modelBytes(id)` returns a copy.
4. Main boot resolves the scenario's hero ID, constructs simulation and visual adapter, then starts the unchanged clock/input/HUD/world loop.
5. Build validation uses Node file reads and the **same** pure discovery/schema functions. It runs before Vite changes output. Development startup also validates and shows errors in the visible error banner, including file and field.

No central roster array needs editing for a new hero directory. No JSON is fetched over HTTP or file://; JSON imports and model data URLs are bundled.

## Validation contract

Required fields, unknown/typo fields, schema version, kebab-case ID, nonempty name/role, finite numbers, positive HP/speed/radius/cooldown, bounded ranges/damage, and complete references are checked. Current limits are defined in `registry.js` (e.g. HP 1–10,000,000; speed .01–100; radius .05–10; range 0–1000; damage 0–1,000,000; basic cooldown .01–3600). These are safety bounds, not rebalanced gameplay values.

Ability records, when introduced under a future approval, must define:

- `id`, `slot`, `name`, `effectId`
- `targeting` with `team` and `type`
- `range`, `damage`, `manaCost`, `cooldown`

Supported schema slots are passive/Q/E/R/F/B, with unique IDs/slots and exact hero ability references. The **only implemented effect** today is direct damage to an enemy unit. Unsupported effects and inherited-object names such as `constructor` are rejected. JSON is never evaluated as JavaScript.

**Important:** accepting a definition is not implementing a skill. The baseline has no ability activation/resource system; `abilities.json` remains empty, and no Q/E/R/F/B controls or buttons were added. Future skills must bring approved shared activation/resource rules and tested effect handlers, not engine copies in hero JSON. More complex mechanics can extend reusable code handlers; do not put executable strings in data or bypass shared range/cooldown/target rules.

## Presentation and future GLBs

`visual.json` is separate from gameplay data. Current kind is `placeholder`, model is `null`, adapter is `training-capsule`, transform is identity. `placeholder.js` is the unchanged existing test mesh, **not final character art**. `WorldView` receives a visual root/adapter rather than constructing the hero mesh itself.

When a suitable, original/licensed GLB actually exists:

1. Place it at `src/heroes/<id>/assets/<name>.glb` (flat filenames).
2. Change only `visual.json`: `kind: "glb"`, `model: "assets/<name>.glb"`, and necessary scale/rotation/offset. Do not change hero stats, gameplay definitions, collision radius or combat code to accommodate art.
3. Keep buffers/images embedded in the GLB, or use embedded base64 data resources. Relative/remote textures and buffers are rejected. Draco, Meshopt and KTX2/Basis decoder-dependent assets are rejected until an explicitly embedded decoder workflow is approved.
4. Inspect actual named animation clips; map semantic states in `animations.json` to those exact names. No guessed Run/Idle/Attack clip names. Validation checks GLB JSON, and runtime checks actual GLTFLoader clips again.
5. Rebuild and test the actual character, textures, transforms and animation in the standalone browser before claiming it works.

Vite imports GLBs with `?inline`. The registry decodes bundled data URLs, validates GLB 2 header/chunks/resources/clip references, and passes byte copies to `GLTFLoader.parseAsync()`—never `load(filePath)` or fetch. The LoadingManager also blocks non-data/non-blob model resource URLs. The adapter uses a separate transform anchor, so model orientation/scale does not change simulation position or collider.

`idle`/`move` locomotion and `basicAttack` one-shot events are shared presentation states. AnimationMixer only plays configured, verified clips. Placeholder mappings remain empty. Reset stops animation actions. Other semantic states require their approved gameplay events before claiming integration.

Runtime parsing/clip failures warn explicitly and retain the functional placeholder at its original scale. Invalid definitions/references fail validation rather than quietly shipping broken data. Missing final artwork is not treated as completion.

No genuine character GLB, texture or animation asset was created in this milestone. Tests use synthetic animation-node GLB bytes (plus a disposable temp-file bundling fixture), **not character artwork or a new playable hero**.

## Adding an approved hero later

1. Create its own directory and four JSON files; use approved identity/stats/basic parameters and actual ability definitions only.
2. Use the existing placeholder adapter until a validated model is available. Keep clip mappings empty without actual clips.
3. Existing shared mechanics need no duplicated engine code. Novel effect types require explicit validated shared-handler support and tests; they are not achieved by adding arbitrary JSON fields.
4. Run `npm run validate:heroes`, unit/build/browser tests. Auto-discovery registers the directory automatically.
5. To use it in this training scenario, set `src/data/training.json`'s `player.heroId`. No unrelated hero files or core combat edits are required for an existing-mechanic hero. There is no selection menu in this milestone.
6. Rebuild/commit root `index.html`. Test the named standalone file and ZIP's isolated root HTML offline.

Do not add any of those future heroes until user approval.

## Packaging and test evidence

See `PHASE_2_ARCHITECTURE_REPORT.md`. Root `index.html` remains the committed single-file game. Named downloads are `MOBA-Lab-Phase-2.html` and `MOBA-Lab-Phase-2-source.zip`. Production CSS/JS/Three.js/config/runtime assets are inline; duplicate output stays ignored in Git.
