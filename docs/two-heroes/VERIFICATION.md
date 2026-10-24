# Latest executed feedback verification

See [USER-FEEDBACK-FIXES.md](USER-FEEDBACK-FIXES.md) and
[CURRENT-FEEDBACK-RESULTS.json](CURRENT-FEEDBACK-RESULTS.json): 178/178 focused
units; 1010/1011 full units with the same pre-existing missing Plan A files
failure; **45 browser checks** (18 two-hero, 8 actual aimed-beam pixel tests,
9 hero-guide, 10 extracted-source UI/commerce/purchase/return checks).
Fresh source build is byte-identical. No skips or new push.

---

> **Current update:** [USER-FEEDBACK-FIXES.md](USER-FEEDBACK-FIXES.md) supersedes
> earlier artwork, locked-selection-preview and one-copy/one-active-item wording
> below. Earlier results remain historical, not claims of new reruns.

# Current correction: illustrated UI restored

See [ART-RESTORATION.md](ART-RESTORATION.md) for the current presentation,
executed results and deliveries. Current browser results: **18 two-hero + 8 UI +
9 guide checks**; focused units **70/70**; full units **902/903**, with only the
pre-existing missing Plan A downloads failure. The historical integration report
below does **not** describe the current UI: 3D details/model-render portraits have
been replaced by the requested 2D illustrations. It is retained as history, not
as a new legacy-rerun claim.

---

# Approved Layla + Franco integration — executed verification

Date: 2026-10-19. Work stays on `arena/55ce0f80-mobile-legend-lite`; no reset,
clean, branch switch, commit, push, next hero or new mode. This extends the existing
game. Historical preview source and approved authoring files remain unchanged.

## Delivered behavior

* Actual approved Energy Gunner Layla GLB (10 clips) and Plan B Franco GLB
  (11 clips), plus detached enlarged hook. No substitute characters/placeholders.
  The same models appear in roster portraits, interactive 3D details, selection,
  practice, the player and mixed-role NPCs. Pointer/arrow rotation and wheel zoom.
* Fourteen separate local PNGs: each hero has a square portrait, useful transparent
  character portrait, separate environment background and four distinct ability
  icons. PNG alpha is decoded/tested, not merely inferred from a header.
* Selection entry and clear really set the hero to null; empty portrait, showcase,
  descriptions and skills; disabled confirmation. Locked Franco can be inspected,
  never confirmed or started as an unowned hero. Switching and async races tested.
* Franco costs configurable **32000 Coins OR 749 Diamonds**. Explicit quote and
  confirmation, cancel, insufficient-funds disabling, once-only debit/ownership,
  same-file reload and migration; one wallet+ownership write. The initial wallet
  remains **30000 Coins / 0 Diamonds**, Layla owned. No real save was funded and
  no new currency grant, recharge or player-facing cheat was introduced.
* Shared engine resources, stats, equipment, cooldowns, damage, statuses and
  collisions for both humans/NPCs. Franco passive timer/speed/regen/stacks and
  consumption; directional first-contact Hook; Fury radius/slow; six-hit Hunt
  with 1.80-second suppression, action lock and interruption/death/reset cleanup.
  Tank/Roam peel/catch/objective policy is independent of moving Layla goals;
  existing ranged Layla farming/spacing/sustain/tower behavior stays in place.
* Hook's approved .15 cast + .25 maximum flight, .02 contact pause, .18 haul,
  .08 hit return / .20 miss return are explicit data. Pull uses shared collision
  and body-separation constraints and no contact teleport. Dead/immune targets
  and invalid ownership clean up; chain endpoint follows the actual live socket.
* Layla's existing tables and distance passive (excluding towers), S1 benefits
  and separate S2 application/mark/later-trigger are preserved. Approved R2
  release times/shot identities are used. Ultimate is a continuous muzzle-connected
  **48 custom local-unit** beam, not a bullet or a near-target-truncated flash.
  Local timing/geometry candidates are not certified official MLBB measurements.
* Match history, profile, build/preparation identity and equipment use the actual
  selected hero; old v1 saves and Layla ownership remain compatible.

## Executed checks

| Check | Executed result |
|---|---|
| Initial checkout unit baseline, before dependency installation | 619 pass / 8 fail / 627; seven missing-dependency failures and the missing historical Plan A download test |
| Final full units in clean extracted source | **887 pass / 1 fail / 888**, 0 skipped; sole pre-existing Plan A failure below |
| Focused integration + player/NPC/item fairness in clean source | **87 / 87 pass** |
| Production build + offline inlining checks | PASS; 317 modules; single inline HTML, JS/CSS/assets embedded |
| Clean source installation | `npm ci`: 35 packages, 0 reported vulnerabilities |
| Clean source production rebuild | PASS, **byte-identical** to current root/download HTML |
| Full workspace asset/preservation audit | PASS: **30 runtime entries**, **71 unchanged approved originals** |
| Extracted-source audit | PASS: 30 runtime entries, 68 original source/authoring entries; three large historical compiled previews intentionally omitted, small editable preview HTML entries retained |
| Final approved-timing standalone browser acceptance | **18 / 18 pass, exit 0**, errors `[]`, warnings `[]`, external/subresource requests `[]` |
| Legacy final gameplay polish | PASS, 5 checks: actual null selection, stat parity, unattended tower/wave behavior, 9999 match-only gold, native-input mutual real combat |
| Legacy recovery | PASS, 5 checks: actual failed WebGL preparation, healthy Retry, Back cleanup, emulated touch with non-modal shop, keyboard upgrade isolation |
| Legacy hero browser | PASS, 9 checks: responsive layout, filters, actual 3D detail, descriptions, touch/back, safe model transfer and offline |
| Legacy main menu | PASS, 11 checks: real storage, blocked/corrupt storage, responsive/touch, profile/modes and original training entry |
| Legacy roster | PASS, 9 checks: real mixed architecture, orientation, 99-item shop/PNG/boots/currency isolation, utilities, basic→skill follow-up, no browser errors |
| Earlier integration-build regressions | Polish 13/13, draft 6/6, Preparation expansion 13/13 passed |
| Legacy Layla native input / isolated source ZIP | PASS, 19 checks; all assertions retained |
| Original foundation / HUD / keys / settings harness | PASS, 50 checks, including root and isolated ZIP HTML with spaces/Unicode paths |

The 18-check acceptance opens a copy of **only** the actual HTML in a fresh
folder using `file://`, with networking disabled. Purchases use new isolated normal
browser profiles and test-only saved funds, seeded once **after** initial document
load, never by a reload init script. Both raw saved JSON and post-reload state are
asserted: Coins → 8000 Coins /1000 Diamonds; Diamonds → 40000 Coins /251 Diamonds
from harness funds40000/1000. Cancel and double confirm cannot add another debit.
No such balance appears in runtime code or a real user's browser/profile.

The test-only render fixture uses the actual registry, engine, production
WorldView, GLBs and pose/VFX adapters. It is **not shipped in the game** and creates
no mutation API or cheat. It separately checks authoritative damage/status and
actual rendered geometry: spindle S1; S2 orb→impact→mark→later trigger/stun;
near/mid/far beam hits once with an off-line miss, live muzzle connection and at
least8/9 bright framebuffer samples; real hook/chain miss return and hidden in-hand
duplicate; actual Hunt clip, six damage strikes and suppression release at1.80s.
Rendered animation is not treated as proof that damage/status happened.

## Fixed during verification (tests retained)

* Near-target lock no longer truncates the long ultimate.
* Minion/tower projectile events carry their own identity instead of inheriting
  human Layla and incorrectly entering her approved VFX records.
* Retry recreates a released showcase and retains the explicitly selected hero,
  rather than silently forcing Layla or reusing a disposed renderer.
* Franco match history is accepted alongside Layla, not silently filtered out.
* VFX diagnostics retain accepted event counters even when rendering is delegated
  to approved effects; marks/restraints/alternate templates release owned resources.
* Web Locks rejection returns a truthful failed purchase without an unhandled
  rejection. Clear/load races cannot attach a stale model.
* Legacy assertions were updated for two registered heroes, actual approved clip
  names, real interactive details, implemented shared-kit notes and the larger
  **current** source archive. Native movement uses the open flank around actual
  bodies, not teleporting. Existing mechanics assertions were not removed/skipped. The full-size Layla software-GPU runner initially reached its global 480s watchdog after17successful checks; its final rerun uses a 900s test-wide budget, with every per-mechanic assertion/timing and full-size viewport retained.

## Known failure and certification limits

**The full unit suite is not completely green.**
`tests/franco-preview.test.js` → “Saved Plan A HTML and source hashes are preserved
exactly for fallback” fails because the historical ignored Plan A HTML/source ZIP
are absent in the supplied checkout. This failed before integration. Original
Plan A timing/hash records and every locally supplied approved original are kept.
No old binary, matching hash or passing test is fabricated; the assertion remains.
GitHub release lookup found no saved releases to restore these binaries from.

These are Linux Chromium/SwiftShader tests and emulated viewport/touch checks,
**not Windows, native-GPU, physical phone, battery/performance or speaker certification**.
File-URL storage is browser-policy-dependent: normal clean profiles were verified;
blocked storage remains honestly session-only, and purchases require successful
writable persistence. No guarantee is made for browsers which discard local-file
storage or tabs without Web Locks; the fallback queue serializes same-page stores.
Moving/renaming an HTML can also change a browser's file-URL save origin. Keep the
same file path for existing saves; existing local backup/reset tools remain.

The single-file build intentionally triggers Vite's large-chunk size advisory.
It is not a runtime missing-file/remote-resource warning. No claim is made that
unmeasured range, collider width, stack interval or sampled release frames are
current official live balance; see the specification and source provenance.

## Deliveries and principal files

* `deliverables/MOBA-Lab-Layla-Franco.html` — current standalone game.
* `deliverables/MOBA-Lab-Layla-Franco-source.zip` — root HTML + organized source,
  both approved GLBs, detached hook, all fourteen PNGs, local effects/configs,
  tests, authoring/Blender inputs and small editable preview entry files.
* `deliverables/Layla-Franco-Delivery-Manifest.json` — final sizes/SHA-256; the ZIP
  cannot embed its own final hash. Dependencies/Git/caches/uploads/test captures/
  duplicate compiled previews are excluded. Archive integrity and every runtime
  asset hash are checked by `scripts/two-heroes/check-package.mjs`.

Principal runtime paths:

* `src/heroes/{layla,franco}/` and `integration-manifest.json`: assets/clip mappings,
  hero data/abilities/commerce, local PNGs and approved Layla energy adapter.
* `src/menu/{application,match-flow,match-screens,lobby-view,hero-guide,hero-purchase,progress}.js`,
  hero CSS/portraits: null selection, interactive models, atomic one-currency UI/save.
* `src/simulation/{hero-combat,franco-kit,ability-contract,status}.js`,
  `src/match/{simulation,hero-bots,ai,franco-policy}.js`: shared kits/resources/AI.
* `src/rendering/{approved-combat-vfx,combat-vfx,lane-view}.js` and
  `heroes/{hero-visual,clone-visual,pose-driver}.js`: actual clones/attachments/VFX.
* `src/player/history.js`, `src/menu/player-profile.js`, preparation/build/HUD
  modules: real hero identity and compatible records.
* `tests/two-heroes.test.js`, `tests/hero-fairness.test.js`,
  `tests/browser-two-heroes.mjs`, render fixture and preserved browser suites.
* `scripts/two-heroes/`: artwork, manifests, audit, isolated fixture, packaging;
  existing `npm run package:source` delegates to current integration packaging.

Full local run logs/screenshots are in ignored `artifacts/two-heroes/` rather than
bloated into source. The final offline result JSON is retained beside this report.
No next hero, Assassin/Mage/Support implementation, Classic or new5v5 work follows.
