# Franco Plan B · R5 — separate offline motion comparison

**Not in the playable game. Explicit visual approval is still required.** Plan A is the saved Timing R4 deliverable, with a pinned configuration at `plans/plan-a-r4.json`. Do not overwrite its versioned HTML/source downloads. Choosing a plan does not authorize a Layla rebuild yet.

## The requested comparison

User selected **0.40 s from input to maximum range**, specifically **0.15 s actual cast + 0.25 s outbound travel**. This is a custom prototype, not verified official timing. This is NOT 0.40 s flight after a 0.45 s cast.

| Phase | Plan A / R4 | Plan B / R5 |
|---|---:|---:|
| Actual hook cast clip and movement lock | 0.45 s | **0.15 s** |
| Maximum outbound travel after release | 0.25 s | **0.25 s unchanged** |
| Input-to-maximum-range arrival | 0.70 s | **0.40 s** |
| Near dummy contact | 0.68 s | **0.38 s** |
| Catch settle | 0.02 s | 0.02 s |
| Target haul | 0.18 s | 0.18 s |
| Hook return after haul | 0.08 s | 0.08 s |
| Whole hit sequence including cast | 0.96 s | **0.66 s** |
| Whole miss including cast and empty return | 0.90 s | **0.60 s** |
| Visible hook scale | 1× | **1.5×** |

The three real hook GLB actions are reauthored/exported at **0.15 s** (60 fps), not merely relabeled, cut off while winding up or sped up using the global viewer speed. The throw key is 0.10 s and release is 0.15 s. The full original authored body/weapon mesh buffers and materials remain unchanged. The enlarged hook uses a reusable **1.5× render transform** from `timing-proposal.json`, saved in the Blender source and both GLB node transforms, applied consistently to the held and flying mesh and included in floor-safe pose baking; the stored mesh is not claimed to be resculpted. This changes weapon proportions/readability without changing proposed raw range **6.4 prototype world units**, dummy distance 5.8, or implementing a wider hitbox. Screenshots do not establish official meters/grid conversion or a right-biased collision rule.

Slam remains actual 0.30 s; ultimate remains 1.80 s/immediate restraint/six authored strikes at .15/.45/.75/1.05/1.35/1.65. BasicAttack is 0.60 s at base APS 1.03, contact 0.40 s, cooldown 1/APS. Effective APS scales contact/clip/cooldown. Prehit walk aborts without a hit; posthit walk/next skill retains the single hit and original cooldown. Hook movement/follow-up now unlocks after the new actual 0.15 s cast; ultimate cannot be walked out early.

## Catch → backward Flicker demo

- Click **Play hook → backward Flicker**. This stages a hit, catches at .38 s, then teleports Franco **2.2 prototype world units backward at .39 s**. It does not teleport the target. The eased haul .40–.58 s ends at 1.55 units in front of the displaced caster (world z = −0.65). Hook returns to his new hand by .66 s. The chain remains attached.
- For manual timing, select **Iron Hook · hit**, pause/scrub to .39 s and click **Flicker backward now (F)**. Slow inspection speeds make this small window easier to try. Input must be after catch and before the pull ends. A later accepted teleport during hauling keeps the target continuous from its current position, then redirects the remainder of the haul to the new endpoint.
- Early input, a miss, non-hook actions, repeated Flicker and input during the follow-up slam are rejected. One teleport per staged inspection; restart/reselect/scrub resets the demo. Automatic scenario seeking deterministically reconstructs the .39 s event; manual seeking resets manual input.
- These are explicitly chosen **preview rules**, not a guarantee of official live-patch buffering/cancel windows. No range extension: the outbound endpoint remains fixed. Forward/pre-cast Flicker, aim changes, wall/bounds checks, real spell cooldown/resources, gameplay CC/damage and arbitrary game-state transitions are not implemented.

## Controls / reproducibility

Open `Franco-Animation-Preview.html` offline and check **PLAN B · R5**. Default speed is **1× real elapsed time**. Cast progress is separate from the projectile/effects/input inspection track. The latter is not an actor lock. Play/pause/restart, timeline, phase jumps, loop, orbit/zoom/pan, five camera presets, individual skills/locomotion, guide toggle and base/effective APS remain available. Automatic scenario rewinds deliberately on loop/restart. Same camera/1×/distance should be used when comparing the versioned Plan A HTML.

Build from source with Node/npm:

```sh
npm ci
node scripts/franco/build-preview.mjs
node --test tests/franco-preview.test.js
node tests/browser-franco-preview.mjs
```

The builder writes only named preview outputs, never the playable root HTML. Source contains real original GLBs and editable `assets/source_blender/franco-preview.blend`, original authoring script (Blender 4.2 LTS / compatible bpy required only to reauthor), viewer/sequence/input/Flicker modules, timing and saved Plan A metadata, focused tests and offline browser helper. See `docs/HERO_MODEL_ANIMATION_INTAKE.md` for the saved exact-settings checklist for future heroes and later Layla work. Plan A binary downloads remain outside this smaller source archive; their integrity is pinned by SHA-256.

## Limits / evidence

See delivery report and current `verification.json`, `unit-results.txt`, `browser-results.json`. Full suite now includes 777 preserved game tests and 19 preview tests; the smaller source archive runs only its 19 preview tests. The saved-Plan-A hash test verifies the actual fallback downloads in the full repository; source-only installs check the saved record without those external downloads.

Original unapproved stylized fan-project geometry, not an official or ripped asset or likeness guarantee. 17-bone rig/11 real clips; no finger/facial rig, IK, cloth/fur/hair simulation. Grip, armor overlap, larger-hook placement/weight, floor contact and motion feel still require visual approval. Chain sag, effects, target reaction and hauling are procedural; cyan range/radius aids are not final collision. The dummy is intentionally neutral, not another hero model.

Linux offline Chromium/software WebGL2 and emulated narrow layout only; not physical-phone/Windows/hardware-GPU certification. Some brief overlap input tests use 0.1× inspection; separate elapsed-time verification checks actual 1×. Tests and preservation receipts are not visual approval. Long legacy full-game browser suites are not rerun for isolated preview revisions.

**STOP: choose Plan A or Plan B or request revisions before gameplay integration. Layla remains unchanged.**
