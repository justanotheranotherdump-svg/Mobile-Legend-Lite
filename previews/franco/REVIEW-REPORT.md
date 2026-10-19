# Franco Plan B · R5 — comparison and backward Flicker preview

2026-10-19. **Separate preview only; awaiting visual choice/approval. No gameplay integration.** User explicitly selected Plan B timing as **0.40 s input-to-maximum**, consisting of **0.15 s cast + 0.25 s flight**, and selected **hook catch → backward Flicker** as the preview combo. Plan A remains the unchanged Timing R4 fallback; neither plan choice nor these experiments authorizes a Layla rewrite yet.

## Saved settings / future workflow

The existing R4 HTML and source ZIP remain byte-identical, pinned by SHA-256 in `previews/franco/plans/plan-a-r4.json`. They preserve the complete prior viewer, assets, Blender source, timing and cancellation policy, not only a few remembered numbers. `plans/plan-b-r5.json` records the new candidate settings. `docs/HERO_MODEL_ANIMATION_INTAKE.md` is the reusable future-hero questionnaire: appearance/weapon/rig, exact timing origins, cast/contact/recovery/channel, projectile range/speed/return, pull/CC, hitbox versus visible size, APS/cancel/cooldown, combo timing and destination rules, player/AI parity, offline verification and approval. Ask explicitly for values or approval of proposed values; do not copy Franco timings blindly to another hero. This is repository-based project memory, not guaranteed platform memory across unrelated repositories.

User intends a separate later Layla model/normal-attack/skills rebuild AFTER Franco integration. That is a sensible staged workflow; it has not begun, and existing Layla assets and gameplay remain protected.

## Timing comparison at 1×

| Phase | Plan A / Timing R4 | Plan B / R5 |
|---|---:|---:|
| Actual exported hook actor cast / movement stop | 0.45 s | **0.15 s** |
| Outbound maximum-range flight after release | 0.25 s | **0.25 s unchanged** |
| Input to maximum range | 0.70 s | **0.40 s** |
| Near dummy contact from input | 0.68 s | **0.38 s** |
| Catch settle | 0.02 s | 0.02 s |
| Target pull | 0.18 s | 0.18 s |
| Hook return after hauling | 0.08 s | 0.08 s |
| Whole hit interaction including cast | 0.96 s | **0.66 s** |
| Whole miss including cast / return | 0.90 s | **0.60 s** |
| Visible hook scale | 1× | **1.5×** |

Plan B hit: launch .15 → contact .38 → pull .40–.58 → returned .66. Miss: launch .15 → maximum .40 → returned .60. This explicitly resolves the user's timing interpretation: the experiment makes the total input-to-max shorter, not the already fast .25-second projectile faster. All are custom prototype settings, not independently measured/verified official live-patch values. Supplied screenshot annotations/community timing/range/hitbox-bias claims are not treated as authoritative dimensions or physics.

The three hook GLB actions are genuinely reauthored/exported at **0.15 s**, with throw key .10 and release .15, at 60 fps. No previous .45-second clip runs invisibly behind new labels. Other actual clips remain: BasicAttack .60, FuryShock .30, BloodyHunt 1.80, Death 2, HitReact 16/30, Idle 2, Run .80, Walk 1.20. Six actual ultimate strikes stay .15/.45/.75/1.05/1.35/1.65 within immediate 1.80-second restraint. Transition reel duration is now 2.76 s. Cast progress remains separate from the longer effect/input inspection timeline. Global playback defaults to real-time 1×; no hidden speed multiplier.

Basic attack contact remains .40 at 1.03 APS; animation/contact/cooldown scale with effective APS. Walk before contact aborts without a hit; after contact/next-skill backswing cancellation retains the single hit and original cooldown. Movement and slam follow-up unlock after the new .15-second hook cast while projectile motion continues. Walking cannot bypass the 1.80-second ultimate channel.

## Larger original hook, not an official asset

Existing hook/body geometry and materials are original authored fan-project art, not an official/ripped model or screenshot texture. The hook is **1.5× larger** via GLB node transforms saved in both held/flying weapon assets and genuine Blender source. The actual mesh attribute/index buffers and materials remain preserved; no resculpt is claimed. Floor-safe root pose baking accounts for the enlarged weapon; simply scaling it in the viewer initially exposed a floor intersection and was corrected before final verification.

The proposed raw reach stays **6.4 prototype world units**, with the inspection dummy at 5.8; no screen-pixel-to-grid/meter conversion is asserted. Visible size is not collision width: this revision does not implement an official .37 collider, right-side snap bias or larger collision area. The user's reference images remain guidance only and are not packaged/extracted into assets.

## Backward Flicker scenario / controls

1. Open **Franco-Plan-B-R5.html**, check **PLAN B · R5**, and use **1× normal**.
2. Use individual hook hit/miss to assess the .40-second maximum arrival (near dummy catches sooner at .38).
3. Click **Play hook → backward Flicker**. It catches at .38, teleports Franco **2.2 prototype world units backward at .39**, then smoothly pulls the target during .40–.58 to 1.55 units in front of the new caster position (world z −.65). The linked chain follows the new hand; the hook returns there by .66. Target is not teleported.
4. For manual timing, select Iron Hook hit, seek .39, and click **Flicker backward now (F)**. Inspection slow motion helps hit the brief catch window. Manual Flicker during an already-started haul redirects from the target's current position without a position jump.
5. Restart resets the scenario; seeking resets manual input. The automatic scenario reconstructs its scheduled event deterministically when scrubbing. Play again at an endpoint also resets prior input state. Compare the separate **Plan A / R4 HTML** at matching camera/speed/distance; its files were not overwritten.

Explicit prototype rules: backward Flicker is accepted only after catch and before haul completion, once per inspection, and blocked during follow-up slam. Early input, misses, other actions, and repeat attempts are rejected. Outbound origin/direction/range are not retroactively extended. This implements an interactive displacement/pull-endpoint demonstration, **not final game Flicker mechanics**. No forward/pre-cast Flicker, official buffering/cancel windows, arbitrary collision/target eligibility, spell cooldown/resource system, wall/bounds safety, real damage or suppression is certified. Restart/reselection deliberately reset a staged dummy and spell state.

## Delivered source / integrity

- `Franco-Plan-B-R5.html`: fully embedded, interactive offline 3D viewer; no adjacent assets, network or installation required to view.
- `Franco-Plan-B-R5-Source.zip`: **34 CRC-verified entries**, including that exact standalone HTML (canonical preview path), real local hero/hook GLBs, editable Blender source, author/build/package scripts, sequence/cancel/Flicker modules, timing/plan records, reusable intake, 19 focused tests, offline browser test/helper, preservation evidence and limitations. Dependencies, Git, uploaded references, caches, screenshots and duplicate full-game/Plan-A builds are excluded.
- Saved Plan A downloads remain separately available. Their hashes are in the source record. Source-only tests validate that record; actual Plan A binary hash equality was checked in the full repository separately.
- Reports remain outside the ZIP to avoid circular archive hashes. Canonical preview aliases now point to B, but versioned Plan A remains unchanged.

## Actually executed results

- **796/796 full repository unit tests PASS**, zero fail/skip: 777 existing game tests + 19 focused preview tests. Includes actual exported durations, normalized skin, unchanged geometry/materials, larger GLB transforms, independent clocks, cancellation/APS, saved Plan A integrity, Flicker acceptance/rejection/one-use and continuous redirected hauling.
- **32/32 browser groups PASS**, then the **same 32/32 PASS again** against the actual source ZIP's HTML alone in a fresh otherwise-empty directory. Repeated runs, not 64 unique groups.
- **19/19 focused source tests PASS** directly on the extracted ZIP, zero fail/skip. Another repeat, not additional unique tests.
- Both final browser runs recorded **zero errors, warnings or non-document runtime requests**. Final runs skipped repeated screenshot capture only, not assertions. Browser checks include actual rig/11 clips, floor samples, range/launch/pull positions, genuine six strikes, transport/camera/backward scrub, reel, narrow layout, input/cancellation, actual 1× clock, Flicker displacement/target endpoint/chain/return/reset, new .15-second GLB duration and .40-second maximum arrival.
- Main and isolated browser check lists/revisions match. Versioned/canonical/isolated/ZIP-embedded B HTML are byte-identical. ZIP CRCs pass. Saved A HTML/source hashes match their original frozen record.
- **305 protected game files remain byte-identical**; no new runtime src files, no hero discovery/registry/AI integration. Playable root HTML SHA remains `ae74c0349662142c0272a781e4ee3bc6315943a84128b1715fe2ae8329d7a2c0`. Existing Layla assets untouched.
- Same branch `arena/55ce0f80-mobile-legend-lite`, head `63ccea6`; no commit, push, reset or branch switch.

Linux Chromium/software WebGL2 only. 390×844 layout is emulated; visibility uses an explicitly synthetic hidden-document event. Some brief input-overlap checks select .1× inspection; independent actual 1× wall-clock check passes. No physical-device, Windows, hardware-GPU or speaker certification. Long legacy full-game browser suites were not rerun for this isolated revision.

## Remaining art/gameplay limits and approval gate

17-bone stylized rig, no finger/facial animation, foot IK, cloth/fur/hair physics or retargeting. Approximate grips, larger-hook body clearance/weight, armor overlap and movement foot contact require subjective review. Floor assertions sample selected poses, not exhaustive arbitrary combat blending. Chain sag, target reaction, VFX and haul are procedural; cyan aids are proposed guides, not final hit volumes. No official artwork or character IP rights are transferred. Technical checks do not establish likeness or animation approval.

**STOP for Plan A / Plan B choice or revisions. Explicit visual approval is still required before Franco gameplay integration. Layla rebuild remains a separate later milestone.**

| Artifact | Bytes | SHA-256 |
|---|---:|---|
| `Franco-Plan-B-R5.html` | 3,208,810 | `69c12395439b7d7ad71f7e37c996fef029cfff9ecb173ab8df6f41bb2918ff7b` |
| `Franco-Plan-B-R5-Source.zip` | 4,041,833 | `bc7cc4243f6e42384c249f8c96042ed090ac89f4d9219a013a55ffa5cc1e8cc9` |
| `Franco-Timing-R4.html` | 3,208,936 | `2e5c6fda852857067a4d92f2a96d768d804d2eac00cc9f83657f9506ae4fd6dc` |
| `Franco-Timing-R4-Source.zip` | 4,034,484 | `2182895c235fd64d8f09183d2e4b07db7312a7fe777e803d56ea9197e27d1a56` |
