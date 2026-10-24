# Layla workshop R1 — preliminary specification, not game balance

Researched/fetched2026-10-19. User authorizes this preview without a further candidate-table approval question. It does not authorize playable integration. Franco remains parked. Original modern Energy Gunner-inspired25-bone/ten-action model; no screenshot textures or imported official assets.

## Classification

- **Verified here:** existence/structure of locally authored model/actions, implemented workshop timing/input behavior, actual offline test results and original-file preservation. See delivery report; these are implementation checks, not verified official frame data or visual approval.
- **Source-derived candidate:** tables explicitly attributed below; they are secondary sources, not a live-game measurement or proof of one exact current patch.
- **Prototype/unconfirmed:** ranges, unit mapping, speeds, interpolation, mark scope/chain behavior, recovery tuning and beam/commitment alternatives. Editable in `previews/layla/settings.json` and the offline panel.

## Sources inspected

1. [Liquipedia](https://liquipedia.net/mobilelegends/Layla): preliminary ability-table baseline, fetched2026-10-19; exact table patch revision not established.115% passive; S1 mana35→60; S2 header70 without a rank cost table; ultimate37/32/27 and130/150/170.
2. [MLBB.io](https://mlbb.io/en/hero/layla): page says updatedOct18,2026 but individual hero data version is not established.130% passive; baseHP2250/physicalDEF15/MS240, versus LP2320/17/250. Do not treat the page timestamp as validation of all numeric records.
3. [MLBB Guides](https://www.mlbbguides.com/heroes/layla/): body says updatedSep29,2026 local dataset.115% passive; S1 mana40→65, S2 mana65→90. Damage endpoints and ultimate tables agree with LP. Combo prose mentions unsupported Starlight stacks/ultimate lock-on; these contradictory claims are not adopted.
4. [ONE Esports](https://www.oneesports.gg/mobile-legends/layla-guide-best-build-emblem/): bylineApr10,2025; embedded Dec6 build-update note refers to patch1.9.32 (year not given). Qualitative sequences corroborate S1 minion/creep range activation and S1/ultimate triggering marks; no exact cast-frame values. Builds/emblems are not implemented or changed.

No official in-game client or instrumented video frame data was available/used to certify current timings/ranges. The earlier patch research is a conflict lead, not permission to mix all growth/stat versions; no final growth/level15 table is fabricated in this preview.

## Editable candidate skill records

All damage is raw before defense, passive, crit, equipment etc. The preview does not apply these numbers to combat entities.

| Property | Source-derived preliminary candidate |
|---|---|
| Passive |100→115% at6 reference units; turret excluded (LP/Guides).130% alternate (IO). Exact curve/sampling unresolved.|
| S1 damage ranks1–6 |200/240/280/320/360/400 +80% totalPA; crit-eligible in LP text.|
| S1 cooldown |6/5.6/5.2/4.8/4.4/4 seconds (LP).|
| S1 mana |35/40/45/50/55/60 (LP);40/45/50/55/60/65 retained separately (Guides).|
| S1 windows |Extra basic/S2 range3s;60% MS decays over1.2s, duration doubled on hero hit (LP). Exact extra range/stacking/decay curve remain unconfirmed.|
| S2 initial damage |170/200/230/260/290/320 +65% totalPA (LP).|
| S2 cooldown |7.5/7.3/7.1/6.9/6.7/6.5 seconds (LP).|
| S2 mana |LP header70; no complete rank table in fetched LP page. Guides65/70/75/80/85/90 is retained as an alternate, not falsely called LP data.|
| S2 mark |3s;100/120/140/160/180/200 +35% totalPA on trigger;0.25s stun (LP).|
| Ultimate damage |500/650/800 +150% totalPA (LP).|
| Ultimate cooldown/mana |37/32/27 seconds;130/150/170 mana (LP, agrees with Guides).|
| Ultimate passive |+.6/1.2/1.8 units basic/S2 range by rank (LP); sight increase amount unknown.|

LP observed base-stat snapshot (not applied): HP2320, mana500, HPregen5.4, manaregen4, PA133, physicalDEF17, magicDEF15, baseAPS1.06, AS-ratio1.0, MS250. No hidden player/NPC differences or stat changes are introduced.

## Declared initial prototype settings

| Action | Input→release | Nonblocking recovery | Projectile speed | Base reach |
|---|---:|---:|---:|---:|
| Basic |.25s at1.06APS|.20s at1.06APS|18u/s|4.3u|
| S1 |.25s|.20s|14u/s|8u|
| S2 |.40s|.25s|10u/s|4.3u|
| Ultimate |.65s|.30s|45u/s front OR instant|12u|

**None of these timing/speed/geometric values is claimed as official measured frame/range data.** Releases came from user candidates. Basic4.3 is an older reference candidate; S2 shared base4.3, S1=8 and ultimate12 are editable staging choices. Speeds are initial prototype choices (basic/S1/S2 seeded from local implementation). Range is actor-center eligibility; travel starts at actual animated muzzle. Scene-unit/reference-unit1:1 is only a workshop convention, not existing-game scaling or official meters.

Candidate basic/S2 range = base +.6×ultimateRank + activeS1Bonus. Default bonus1.6 is an unconfirmed additive proposal. Passive near/mid/far presets use fixed ultimate rank3 so2/4/6u can all be valid basic hits. AoE radius1.4 and beam width1.0 are editable prototype values. Same ultimate width/range in both alternatives; no different damage strength is implied.

The passive comparison uses explicit unverified illustration `1+(maximum−1)*clamp(centerDistance/threshold,0,1)`; threshold6 and maximum1.15 or1.30 are editable. Turret multiplier is always1.0. Readout uses normalized100 damage before defense, not an applied health reduction.

S1 hit windows are event-based; miss grants none. Movement bonus uses linear decay (prototype); hero hit doubles duration but not initial magnitude. Range ring and cyan foot chevrons separate range and movement feedback.

S2 chooses fixed-direction orb staging (not verified targeting/tracking). First collision creates visible AoE, marks all eligible area targets or only primary depending on selector. A direct eligible basic/S1/ultimate follow-up consumes that target's mark once and produces separate purple impact/yellow stun indicators for.25s. Secondary explosions do not chain-trigger other marks in this prototype. No follow-up demonstrates expiry; dead primary is invalidated; escaped primary is rejected for the follow-up attempt. No phantom projectile is emitted on invalid follow-up. These are declared comparison policies, not official death/mark-spread certification.

Ultimate travelling alternative has a finite front; near-instant hits the lane at release. Both hit all eligible targets along the same lane/range/width. Wind-up direction is fixed. Voluntary movement commitment is switchable; no official hard-CC/spell interruption or buffering behavior is certified.

Basic wind-up/recovery scale by1.06/effectiveAPS; repeat interval remains1/effectiveAPS. Pre-release movement aborts without a projectile; post-release cancellation retains the independent shot and original cooldown. Each manual inspection permits one repeat/follow-up; staged resets intentionally rewind. Future integration must use the actual game's shared authoritative player/NPC action/combat paths and preserve unrelated systems.

## Assets, tests and limits

See `previews/layla/README.md`, `asset-manifest.json` and delivery report for actual ten exported actions and source-versus-tuned timing. Two extra reusable source actions (HitReact/Death) are not separate buttons in R1. Eight requested actor studies are directly inspected/played through the offline workshop.

Stylized original13,884-vertex/12,202-polygon authored model; no commercial likeness guarantee.25-bone skin, baked arm IK, four keyed twin-tail bones, modeled but unrigged fingers. No facial rig, cloth/hair physics, arbitrary-aim runtime IK, locomotion foot planting, final audio, live damage, navigation/vision/AI or item/build integration. Face/material/proportion/weapon weight and foot sliding still need visual review. No technical test can certify that the model 'matches closely' on the user's behalf.

STOP after delivering the offline preview/source/research/test evidence. Existing game/Layla and parked Franco are not replaced.
