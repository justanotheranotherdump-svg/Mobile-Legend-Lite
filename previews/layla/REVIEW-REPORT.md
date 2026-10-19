# Layla Energy Gunner — standalone workshop R1

**Delivered 2026-10-19. Preview only. Stop for visual/animation feedback; no game integration is authorized.**

## Deliverables

- `deliverables/Layla-Animation-Preview-R1.html`: single-file offline browser workshop. Open directly in Chrome/Edge with WebGL2. No installation, server, internet or adjacent assets are required to view it.
- `deliverables/Layla-Animation-Preview-R1-Source.zip`: organized editable source, one standalone HTML, local GLB, Blender project, author/build scripts, configuration/provenance, tests, specification, evidence and Three.js license. Does not contain dependencies, Git, reference screenshots, development captures, full-game/Franco assets or duplicate HTML builds.
- `docs/LAYLA_PREVIEW_SPEC.md`: human-readable research, candidate tables, conflicts, prototype policies and limits.
- `previews/layla/README.md`: controls, build instructions, action list and mechanics explanation.

The preview-folder HTML and the R1 download are identical. The HTML rebuilt in a clean extracted source directory is also byte-identical:

`SHA-256 751f64b390efbced86de07d43572b55dd5f6cae0ae882770ddac7f0a763e5098`

## What is implemented

A real, locally authored skinned GLB and editable Blender project—not a static render, video or imported proprietary character. Blonde twin tails, youthful stylized face, goggles/accessories, white/purple/blue/gold outfit, gloves/boots, cyan details and an original large forked-muzzle cannon. The proposed appearance still needs the user's subjective approval; it is not represented as an exact or commercially certified likeness.

Model manifest: **13,884 authored vertices; 12,202 polygons; 25 bones**, authored/exported with Blender4.2.22 LTS. Actual exported clips:

| Action | Source duration | R1 access |
|---|---:|---|
| Idle | 2.00s | Direct study |
| Walk | 1.20s | Direct study |
| Run | 0.80s | Direct study |
| Aim | 1.00s | Direct study |
| BasicAttack | 0.60s | Direct study and mechanics |
| MaleficBomb | 0.60s | Direct study and mechanics |
| VoidProjectile | 0.75s | Direct study and mechanics |
| DestructionRush | 1.10s | Direct study and mechanics |
| HitReact | 0.40s | Reusable source clip; no separate R1 button |
| Death | 1.50s | Reusable source clip; no separate R1 button |

Source-action durations are **not claims of official game animation lengths**. Runtime presentation sampling maps configurable release/recovery windows separately from projectile movement. Initial input-to-release values are basic0.25s, S1 0.25s, S2 0.40s and ultimate0.65s, all explicitly provisional. Basic repetition uses APS, not a0.25s attack interval.

Workshop features include orbit/zoom/front/side/rear and ability framing; animation selection; play/pause/restart/speed/slow-motion/loop; seekable phase timeline; independent actor and projectile clocks; actual animated muzzle origins; provisional recovery/pre-release transitions; dummy/range scenarios; editable candidate settings and export; buff, projectile, mark, stun, AoE and range visualization; and the visible four-source research panel.

Mechanics demonstrations include near/far115% versus130% passive comparisons with editable threshold/max and turret exclusion; S1 first eligible hit/miss/moving/minion/hero plus range/MS windows; S2 AoE-mark versus first-target-only, initial/trigger effects, basic/skill triggers, expiration and death/leaving-range behavior; and ultimate travelling-blast versus nearly instant beam using the same lane/direction/width, including multiple or empty targets. Ultimate commitment is a **reviewable prototype toggle**, not a claim of official complete uncancellability. Basic recovery transitions preserve the fired projectile and original attack lock; pre-release aborts do not produce a free duplicate hit.

## Research status

Liquipedia ability tables are preliminary. Liquipedia, MLBB.io, MLBBGuides and ONE Esports are compared visibly with URLs, fetch date, page metadata and claim-specific status. The panel does not silently combine115%/130% passive or conflicting mana tables into verified values. Geometric reaches, world-unit convention, cast timings, movement/projectile speeds, interpolation and collision policies remain editable prototype assumptions. No official frame, travel-speed or world-unit measurements were obtained. Shop/build changes and unreliable guide-template claims were excluded.

## Actual verification

| Check | Result |
|---|---|
| Focused asset/mechanics/provenance units | **21/21 pass**, zero skipped |
| Canonical offline browser suite | **34/34 check groups pass**; zero runtime errors, warnings or external requests |
| Final packaged HTML, alone in a fresh directory | **34/34 check groups pass** through `file://`; zero runtime errors, warnings or external requests |
| Freshly extracted source | `npm ci`, **21/21 focused units**, successful production rebuild; rebuilt HTML byte-identical to delivered HTML |
| ZIP integrity | CRC test, unique safe entries and embedded-HTML equality pass |
| Preservation ledger | **337 original files byte-identical**; no new runtime files in `src`; no game integration |
| Full repository | **816/817 pass**; same single pre-existing failure described below |

Browser tests use Linux Chromium/software WebGL2, actual animated bone/bounds observations, real-time1× playback of all eight requested studies through completion, release/travel/recovery assertions, visible effects/mark controls, all-four-release-field edits, camera framing, cancellation/transition behavior, paused/visibility clock handling and390px emulated layout checks. Direct screenshot inspection covered the studio/model, S2 marks and both ultimate modes. This is real playback evidence, not import-only validation, but remains automated/emulated testing rather than physical-device certification.

### Existing full-suite failure, not concealed

The initial full-repository baseline was795/796. After adding21 Layla tests it is816/817. The sole unchanged failure is **“Saved Plan A HTML and source hashes are preserved exactly for fallback”** in `tests/franco-preview.test.js`; historical ignored Franco Plan A download files were already absent at the start of this task. No parked Franco assets were edited, recreated to hide the issue, or integrated; no existing tests were weakened, removed, skipped or bypassed. `baseline-test-status.json` and `full-unit-results.txt` retain the evidence.

## Limitations and review targets

- This is an original stylized interpretation. Please review silhouette, face/hair, forked cannon proportions, grip alignment, footwork, recoil, charge and recovery before any approval or integration.
- Hair has baked secondary bones; arms use baked authoring IK. Fingers are modeled but not individually rigged. There is no facial rig, cloth/hair physics, arbitrary-aim runtime IK or physical foot planting.
- These are controlled dummy demonstrations, not final combat collision, HP/damage/mana spending, random crits, homing, server synchronization or match balance.
- Marks, distance interpolation, leaving-range cleanup, non-chain-consuming secondary AoE and commitment/cancel rules are visible proposed policies, not verified official behavior.
- Linux software rendering and emulated narrow/touch interactions are not Windows, native GPU, Safari/iOS or physical Android/touch-device certification. Direct offline viewing requires a modern WebGL2-capable browser.
- Extra HitReact/Death source actions have no separate workshop buttons. This preview adds no roster entries, skins, shop/build data, account changes, other roles, Classic work or gameplay registration.

**Existing playable Layla/game and parked Franco remain untouched. Delivery is complete; stop here and await the user's review and explicit next-phase authorization.**
