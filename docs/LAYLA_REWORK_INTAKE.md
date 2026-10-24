# Layla complete rework — intake, not an implemented specification

2026-10-19. User selects Franco Plan B / R5 and parks it. New order: Layla separate model/basic/skill preview first, then later integrate both reviewed proposals together. No current playable-game or existing Layla changes. Franco selection and frozen output hashes are in `previews/franco/plans/selection.json`. Do not infer gameplay integration approval from this request.

## User reference intent

Complete rework of Layla model, normal attacks and skills. Supplied images show classic bronze/brown cannon and modern white/purple/gold forked energy-gun appearances, plus alternate-skin VFX. Need one coherent appearance choice, not an accidental mixture. Images are visual guidance only; do not copy screenshots into runtime assets or source archives. Aim for original genuine 3D geometry/rig/materials and individual action clips with honest quality limits, not a promise to equal official commercial assets.

## Pasted mechanics — provisional, not independently verified

- Passive: distance scaling 100–115% at six units, excluded for turrets. Images instead describe 100–140% and an older 130→140 revamp.
- S1 first-hit straight projectile, Physical damage, can crit; cooldown 6→4, mana35→60. Range buff to basic/S2 for3s. Claimed60% movement buff decays over1.2s, hero hit doubles duration. Images mention range and hero-hit duration doubling but do not establish an exact compatible live version.
- S2 targeted orb/AoE, Magic Mark3s, triggered by basic/skills/ult for extra AoE and brief stun. Pasted cooldown7.5/mana70. Images describe mark explosion with30% slow1.2s instead. Stun duration and exact damage/scaling arrays are missing from user's latest text.
- Ultimate line blast, all enemies in path, passive basic/S2/vision range increases with rank. Pasted cooldown30/26/22, mana100/120/140 explicitly called estimates. Image mentions +0.6yards per rank (not proof of this project's units). No exact new damage/scaling/range table supplied. Do not infer immunity from turrets without matching range/collision rules.
- Timing estimates from user: S1 cast .25–.30s, S2 .40s, ult .60–.70s; ult direction committed during startup and cannot voluntarily cancel. These are not published/verified frame data. Must separate input-to-release from projectile travel and visual recovery, not repeat Franco's ambiguous combined clock.
- Basic APS claimed1.06; attack wind-up/recovery scale with AS. Distinguish initial attacks/second from attack-speed ratio coefficient. Do not silently change ratio coefficient based on wording alone.
- User text suggests S2→S1→ultimate/basic; image suggests S1→basic→S2→basic→ultimate. Both can be proposed demonstration scenarios, not a forced mandatory combo rule.

## Existing implementation observed (preserve until authorized integration)

Sources: `src/heroes/layla/{hero.json,abilities.json,animations.json,visual.json}`. These are the current local baseline, not certified official values.

- Level1 HP2250 (+152/level), mana500 (+100), PA133 (+8.5), physicalDEF15 (+4), magicDEF15 (+2.5), HPregen5.4 (+.2), manaRegen4 (+.2), baseAPS1.06 (+.02), AS-ratio coefficient1, MS240.
- Base range stat4.3; current game range conversion6/4.3; basic runtime reach6. Range conversion must be stated explicitly rather than treating all quoted numbers as identical units. Basic projectileSpeed18, cast .25, cooldown1/1.06; max attack rate2.5.
- Passive currently1.15 max at referenceDistance6, tower/turret excluded.
- S1 current runtime range9, speed14/radius.16; damage180/220/260/300/340/380 +.8totalPA, mana35/40/45/50/55/60, CD6/5.6/5.2/4.8/4.4/4; cast.25; range bonus2; speedMultiplier1.2 (not pasted60%).
- S2 current range7, speed10/radius.22, blastRadius2, mark4s (not pasted3), markBonus80/100/120/140/160/180, stun.6/radius2, baseDamage150/180/210/240/270/300 +.65totalPA; mana60/65/70/75/80/85, CD7.5/7.3/7.1/6.9/6.7/6.5; cast.25 (not .4).
- Ultimate current range12/width1.4, baseDamage450/600/750 +1.5totalPA; mana100/120/140, CD30/27/24 (not estimated30/26/22); cast.25 (not .65). These file values are only the starting audit; effective locks/paths also depend on shared runtime code and must be audited before integration.
- Current animations map movement to Walk and basic/all casts to Shoot. Complete rework should give distinct authored actions rather than claim one reused clip proves every ability animation.

## Decisions still needed

1. Appearance: modern Energy Gunner, classic Malefic Gunner or explicitly described original hybrid; no alternate skins without approval.
2. Which mechanic version is intended? Do not combine screenshot140%/slow and pasted115%/stun invisibly.
3. Initial cast/release/lock values and recovery cancellation. Proposed starting candidate .25/.40/.65 for S1/S2/ult, basic release .25 at1.06APS, with separate travel clocks; user has not accepted these yet.
4. Numeric stat/range/damage provenance: retain local baseline provisionally, user supplies a table, or research a dated dataset and reconcile conflicts. Estimated ultimate CD cannot silently replace the registry.
5. Next exact pass after those choices: projectile max-range travel or speeds/basic/S1/S2, beam sweep/travel model and linger, physical ranges/radii and conversion, S1 buffs, mark trigger/explosion/stun duration, each rank damage/cooldown/mana table, passive curve and attack-speed/cancellation rules. Clarify what must change versus remain for compatibility.

Use `HERO_MODEL_ANIMATION_INTAKE.md` for full checklist. Record approved proposal values and tests before authoring. Do not start a full gameplay rewrite, preserve same player/NPC formulas and existing saves/equipment/HUD. No model/animation implementation or tests run in this intake-only turn.

## User answers received (supersede pending initial choices)

- Appearance: **modern Energy Gunner default**, not classic bronze cannon.
- Mechanics direction: **written115% passive / triggered stun mark**.
- Initial preview timing: **S1 .25 / S2 .40 / ultimate .65 s input-to-release**; basic
  release .25 at1.06APS with AS scaling; separate travel, cancellable post-release
  recovery, committed ultimate wind-up. These are accepted custom starting values.
- Numeric baseline: **research a dated dataset and present for approval first**.
- Research checkpoint: `LAYLA_REWORK_RESEARCH.md`; recorded selections at
  `../previews/layla/rework-intake.json`. Range/travel/recovery and researched numeric
  corrections still need review. No new model/gameplay implementation yet.
