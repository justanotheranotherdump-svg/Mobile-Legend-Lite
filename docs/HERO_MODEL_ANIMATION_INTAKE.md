# Reusable hero model, animation and mechanics intake

Saved 2026-10-19. Repository memory: read this and PROJECT_RULES.md before a new hero/model revision. Do not assume platform memory persists outside this repository. Ask the user for exact settings or explicitly approve a proposed value. Unknown is not zero and references are not independently measured facts.

## Workflow

1. Identify the approved milestone and protected existing assets/mechanics.
2. Save the current accepted/comparison baseline as a named Plan A, including configuration and versioned offline HTML/source hashes. Never overwrite that fallback with Plan B.
3. Collect the settings below; distinguish required exact values, reference-based approximations and subjective visual proposals. Clarify timing origins before authoring.
4. Deliver separate interactive offline 3D preview and source with actual exported assets; test it. Compare A/B at the same 1× speed, camera, target distance and scale. Report unchanged versus changed variables.
5. Record explicit visual/mechanics approval and selected configuration. Only then integrate the authorized scope. Integration approval is not approval to replace another hero.

## Questions/settings to settle

### Art, rig and scale
- Hero identity, default appearance/reference restrictions; original-art/license constraints.
- Body proportions, silhouette, face/hair, armor/materials, detail level; height and coordinate/unit convention.
- Weapon dimensions relative to body, weapon head versus handle; hand attachment, chain attachment, link dimensions, chain sag/tautness and readability at game camera.
- Actual rig/bone needs, grip/finger requirements, facial animation, root motion versus in-place, foot IK, allowed deformation/clipping limitations.
- Idle/walk/run/hit/death clips, speeds, loop transitions and facing. Camera framing/zoom must not disguise actual size.

### Every basic attack and ability (fill one record per action)
- Name, action type, aim/targeting mode and eligible first-hit targets.
- Exact time origin: input acceptance, cast start, projectile release, contact or animation end.
- Wind-up/cast lock; release/contact time; actor clip duration; recovery/blend duration; input-unlock times. A blend is not automatically a lock.
- Projectile distance/unit, speed model (constant or eased), release-to-max travel, input-to-max arrival, near-target travel and return times. Explicitly state whether return is included in any quoted duration.
- Visual projectile size separately from collision width/radius; range origin and end; first-hit/blocking/wall/structure rules. Do not derive physics from screenshot pixels.
- Catch settle, target reaction, pull start/duration/easing/destination, close landing and release. Destination sampled at cast, catch, pull start or continuously?
- Impact/VFX windows, radius guide versus actual hitbox, dust/shock/trail/restraint/audio timing.
- Multi-hit timestamps, total channel duration, whether immediate CC precedes first damage; CC/release durations and interruption rules.
- Damage/scaling, resource cost, cooldown start/end and level/equipment dependencies with provenance. Do not present visual markers as applied damage.

### Inputs and attack speed
- Basic base APS, contact/clip times, scaling formula, attack cooldown formula, cooldown preservation after cancellation.
- Movement before contact versus after contact, next-skill cancellation, repeated input/buffering and prevention of free/duplicate hits.
- Movement/turn/aim during casts, channel locks, death/hard-CC interactions, pause and reset semantics.
- Player/AI shared rules and input mappings; no strategy-only AI advantage becoming a hidden stats advantage.

### Combos and repositioning spells
- Exact sequence and input windows: Flicker before cast, during wind-up, during flight, after catch or during pull; direction and distance.
- Which actions allow/reject the spell; resource/cooldown and invalid destination rules; map boundary/wall safety.
- Does aim/projectile origin/direction/range change after teleport? Does pull endpoint follow the caster? Explicitly distinguish moving the catch point from extending projectile range.
- Keep established hits/CC/cooldowns exactly once; reject impossible timing. Staged preview demonstrates only the rules actually implemented, not a certified official exploit/combo.

### Verification and handoff
- Named plan, exact values and source/provenance; unverified or conflicting reference claims remain labeled.
- Test actual clip durations, real-time 1× playback, effects/contact/pull and cancellation; A/B comparison tests should not silently change unrelated variables.
- Validate offline single HTML alone, source archive integrity, no runtime network, desktop/mobile layout, and original-game preservation. Distinguish software rendering/emulation from physical-device tests.
- Deliver actual HTML, source and report; record limitations and explicit approval or requested changes.

## Current Franco baseline and pending decisions

- **Plan A = Timing R4**, frozen settings at `previews/franco/plans/plan-a-r4.json`; existing `deliverables/Franco-Timing-R4*` files are the fallback.
- Cast 0.45 s + max outbound 0.25 s = input-to-max 0.70 s; near dummy contact 0.68; pull 0.70–0.88; hit return ends 0.96. Slam 0.30; ultimate 1.80 with six strikes. Baseline input/cooldown settings are in the saved record.
- User says current hook looks good, but asks to try 0.30–0.40 s. **Resolved by user selection:** total input-to-max arrival. Outbound-only 0.30–0.40 is slower than Plan A's 0.25; total arrival requires a shorter cast than 0.45. Do not quietly reinterpret either.
- **Plan B / R5:** user selected 0.40 s input-to-max, implemented as actual 0.15 s exported cast + 0.25 s outbound. Selected Flicker scenario: catch then backward teleport. User selected this Plan B and parked it on 2026-10-19; no integration now. User also requests larger visible hook head; no authorized inference that screenshot labels are definitive world units or collision sizes. Existing hook is original, not an official asset.
- Updated order (2026-10-19): Franco Plan B selected and parked; completely rework Layla in a separate preview next. Integrate both later after review, not now. See `LAYLA_REWORK_INTAKE.md` for conflicts/questions. Existing game/Layla remain unchanged during preview work.
