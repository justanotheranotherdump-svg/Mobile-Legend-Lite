# Phase 2 — Architecture-only refactor delivery

Date: 2026-10-17. User clarified this architectural task **is Phase 2**. Status: implemented, tested in Linux; Windows/user acceptance pending. No additional heroes, skills or game modes implemented.

## Baseline inspected before editing

Commit `88db256` was the actual starting implementation: the Phase 1.1 training sandbox, Test Hero/basic attack, three dummies, smart/manual targeting, following camera, movement/collisions, cooldowns, HUD/reset, and offline packaging. There was no Layla passive, active-ability system, mana, healing or respawn implementation to move. Those features were neither invented nor claimed as preserved. Ability/animation files are honestly empty for the sole existing Test Hero.

Before production source edits, the existing unit suite (34 tests), build/source archive, and complete 23-check standalone offline browser suite were run successfully. A deterministic 39-snapshot trace was captured from the original simulation for direct after-refactor comparison.

## Changes

- `src/heroes/training/hero.json`: exact baseline identity, role, HP/speed/radius and attack values, ability references and stable visual reference.
- Hero-local `abilities.json` (empty), `animations.json` (empty clips), `visual.json` (placeholder), `placeholder.js` (original mesh relocated), and README.
- `src/heroes/registry.js`: validated immutable definitions, duplicate/unknown-ID errors, discovery contract, fresh runtime state and private model bytes.
- `src/heroes/catalog.js`: eager Vite JSON/inline-GLB discovery, with no central roster list or runtime fetch.
- `src/heroes/model-contract.js`: GLB header/chunk/resource/animation inspection and embedded data decoding.
- `src/simulation/effects.js`: shared code-owned direct-damage handler, replacing only the original damage/clamping line.
- `src/rendering/heroes/hero-visual.js`: independent placeholder/embedded-GLTFLoader adapter, verified AnimationMixer states/one-shots/reset, explicit fallback warning.
- `src/data/training.json`: now stores hero ID/spawn, not duplicate hero stats; all enemy/targeting values unchanged.
- `src/simulation/game.js`, `src/main.js`, `src/rendering/world.js`, `src/ui/hud.js`: inject registry/presentation, retain gameplay, bind existing HUD values to definition/state, show detailed invalid-data errors.
- `scripts/validate-heroes.mjs`, `scripts/lib/hero-files.mjs`, package scripts, Vite asset handling: same schema checks before build; GLB bytes forced inline.
- Existing regression tests adapted only for injected registry; new schema/registry/GLB/adapter/bundling/replay tests and fixtures/helpers. In-memory/temp synthetic GLB fixtures are test data, not production character assets.
- Root `index.html` regenerated; downloads named `MOBA-Lab-Phase-2.html` and `MOBA-Lab-Phase-2-source.zip`. Docs/rules updated; dependency versions and lockfile preserved, no dependencies added.

Full design and extension instructions: [HERO_ARCHITECTURE.md](HERO_ARCHITECTURE.md).

## Behavior preservation

Every pre-refactor unit regression remains. Runtime player state has exactly the previous fields and values. A replay of movement, obstacles/boundaries, four target modes, manual overrides, rejected attacks/cooldowns, damage/deaths and reset produces **39 complete snapshots with the identical SHA-256**:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

No movement, target policy, damage, range, cooldown, dummy stats, spawn, or camera rules were redesigned. HUD controls and placeholder appearance remain the same; values now come from the selected hero definition. The on-screen Phase 1.1 label denotes the unchanged gameplay baseline; Phase 2 here is architectural, not a new game mode.

## Registry and future heroes

- Four required hero-local JSON files are discovered automatically. Folder ID, fields, ranges, effects, ability references, asset existence and actual clip names are validated.
- Scenario selects one registered hero via `player.heroId`. Immutable definitions are separate from fresh match state; core code never branches on Layla/other roster IDs.
- Future approved heroes use their own directory, stats/abilities/model/mapping files. To use existing mechanics, no unrelated hero or core combat edits are needed; select the new ID in the scenario. Auto-discovery requires no central roster edit.
- New mechanics still require approved, tested shared handlers/activation/resource support. JSON does not magically implement skills and is never evaluated as JavaScript. No hero-specific engine copy was added.
- Future GLB replacement changes visual/model/animation files, **not hero gameplay definitions or shared combat**. Models must have embedded resources and real verified clips. Collider dimensions do not depend on the mesh.

## Validation results

| Test | Before | After |
| --- | --- | --- |
| Original unit regressions | PASSED 34/34 | PASSED 34/34 retained |
| All unit tests | PASSED 34/34 | PASSED 72/72; 0 failures |
| Exact simulation trace | Original captured | PASSED 39 snapshots, identical digest |
| Standalone offline browser suite | PASSED 23/23 | PASSED 24/24, includes registry/HUD check |
| Browser errors/warnings/subresource requests | Zero | Zero |
| Named HTML, root HTML, isolated source-ZIP HTML | PASSED | PASSED, file:// with networking disabled |
| All targeting modes/pins/death fallback/no chase | PASSED | PASSED browser and unit regressions |
| Movement/normalization/collision/aim/camera/cooldown/reset/resize | PASSED | PASSED retained regressions |
| Missing/malformed/duplicate hero data, unsafe/unknown effect IDs | Not present | PASSED schema/registry tests |
| Immutable definitions and independent state/reset | Not present | PASSED |
| Build-time hero/asset validation | Not present | PASSED |
| Invalid data visible startup banner | Not present | PASSED separate dev-browser negative test (bad HP injected via page route, no source edits) |
| GLTFLoader and AnimationMixer | No models | PASSED using synthetic animation-node bytes, not a character asset |
| Asset parse/clip failure placeholder fallback | Not present | PASSED injected loader/error tests |
| External GLB resources/decoders rejected | Not present | PASSED synthetic contract tests |
| Eager JSON/GLB bundling | JSON scenario only | PASSED disposable Vite fixture with assetsInlineLimit=0; one output chunk, exact bytes, no runtime fetch API |
| Live Vite source preview | Not run in this baseline run | PASSED separately, plus invalid-data error banner |
| Native Windows double-click/graphics | NOT TESTED here | NOT TESTED here; manual checklist below |
| Genuine textured/rigged character asset | Unavailable | NOT TESTED / no such asset supplied or generated |

Per-test evidence: `phase-2-unit-results.json`, `phase-2-before-browser-results.json`, `phase-2-browser-results.json`. Source ZIP integrity, syntax, offline output parity, clean dependency install/audit, and final build reproducibility are verified during delivery. The final rebuilt HTML is checked against the browser-tested SHA-256.

Final standalone HTML SHA-256 (identical after clean reinstall/rebuild):

`c4f1acd7cbf121b9341b1cb3fa756f92b03f307511247156d326c955ad76ca15`

The first bundling-test assertion assumed Vite's API always returned a single result object; library builds return an array. The test was corrected to normalize the API result and all unit tests reran successfully. No application workaround or gameplay change was needed.

### Commands

```bash
npm ci
npm test
npm run validate:heroes
npm run build
npm run validate:offline
npm run package:source
npm run test:browser
```

Optional development smoke (with dev server already running):

```bash
npm run dev -- --port 5173
DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser
```

Node/npm/Vite/Three.js versions remain as in README. Browser tests run Linux Chromium 153 with software WebGL2 and normal file-origin security, networking disabled. They do not certify Windows behavior. The intentional >500 kB bundle warning reflects embedding Three.js plus its model loader, not a failed build (~668 KiB HTML).

## Manual Windows acceptance (pending)

1. Download only `MOBA-Lab-Phase-2.html`, or extract the source ZIP and use root `index.html`. Move the HTML alone to an empty folder, disconnect networking, open in current Chrome/Edge by double-clicking.
2. Verify the same styled arena, capsule hero, three dummies, camera, WASD, collisions, mouse-ground aiming and HP labels.
3. Approach with D. At the common test location nearest chooses A, lowest current HP B, lowest percentage C. Test direct pin, clear lock, ground/HUD attacks, cooldown and no chasing. Defeat a target and verify fallback.
4. Reset: Test Hero 100 HP at (-5,5), damage 25, range 6, cooldown .65, starting dummy HP 200/200, 90/120, 120/400, no manual pin/target at spawn, nearest mode.
5. Resize and use actual Alt-Tab while moving. Verify no stuck keys/jump. Console/Network should show no runtime errors or external asset requests. Renaming/moving the HTML must not break it.

## Remaining limitations / stop point

- Only the existing Test Hero is registered. No Layla kit, additional heroes, skills, mana/resource economy, healing, respawn, menus, progression or modes were added. These require later approved gameplay work.
- Ability schema/reference support exists; ability activation and additional effect implementations are not claimed. Unsupported effects fail clearly rather than silently doing nothing.
- No genuine GLB, character textures, rig, animation clips or Blender source was generated. Current animations.json is empty. Synthetic test fixtures prove parser/bundler/mixer mechanics only, not final character quality/integration.
- Asset contract currently supports self-contained uncompressed GLB 2. External resources and decoder-dependent compression are deliberately unsupported. Actual future models/textures must be tested in the real standalone browser.
- Model loading happens at boot; live hero swapping, asset hot-replacement and a selection menu are outside scope.
- Persistent local progression and Windows file:// storage remain future work; no save system added.

**Wait for user approval before adding heroes or any further gameplay.**
