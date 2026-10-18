# Gameplay roadmap — Phase 1: stats and progression

2026-10-18. Builds on the previously pushed `e6c8f392be86dce43bb6e9bf4d9f10b0e8590164`.
**Phase 1 ONLY.** No new heroes, Brawl, minions, towers/base, AI, respawn,
items/purchases/gold, match rewards, dedicated TrainingRoom map or hero selection.
The existing menu's “AI Training Room” label remains its earlier sandbox entry;
it does not imply AI has been added. No fresh commit or push performed.

## References, reconstruction and scope

Stats below use the version-sensitive reference table supplied by the user.
User reference URLs: [Layla](https://mobile-legends.fandom.com/wiki/Layla),
[Physical defense](https://mobile-legends.fandom.com/wiki/Physical_defense),
[Damage](https://mobile-legends.fandom.com/wiki/Damage),
[Attack speed](https://mobile-legends.fandom.com/wiki/Attack_speed).
No independent current wiki verification was possible with this environment's
outbound host restrictions. This is a coherent offline prototype, **not a claim
of current official MLBB parity**. XP, rank tuning, practice target scale and
2.5 attack-rate cap below are explicitly authored prototype choices.
Screenshots are visual references only; none is shipped or used as game art.

Previous reports record earlier milestones; their 100 HP / 25 damage / 0.65s
basic cooldown, 100 mana and “no levels” statements are historical, superseded
for current Layla only. The exact historical Test Hero fixture remains unchanged.

## Immutable base/growth and effective values

Schema 3 stores validated `baseStats`, `growthStats`, `runtimeScale`,
`progression` and damage/rank definitions in the existing hero-owned JSON.
Frozen registry definitions are never mutated. Each simulation gets independent
attributes, resource state, XP and ranks. Formula: `base + growth × (level − 1)`.

| Attribute | Level 1 | Growth / level | Level 5 | Level 15 |
|---|---:|---:|---:|---:|
| HP | 2250 | 152 | 2858 | 4378 |
| HP regen / second | 5.4 | 0.2 | 6.2 | 8.2 |
| Mana | 500 | 100 | 900 | 1900 |
| Mana regen / second | 4 | 0.2 | 4.8 | 6.8 |
| Physical attack | 133 | 8.5 | 167 | 252 |
| Physical defense | 15 | 4 | 31 | 71 |
| Magic defense | 15 | 2.5 | 25 | 50 |
| Magic power | 0 | 0 | 0 | 0 |
| Attack speed | 1.06 | 0.02 | 1.14 | 1.34 |
| Attack-speed ratio | 1 | 0 | 1 | 1 |
| Crit damage multiplier | 2 | 0 | 2 | 2 |
| Movement, display | 240 | 0 | 240 | 240 |
| Basic range, display | 4.3 | 0 | 4.3 | 4.3 |

Crit chance/critical hits are NOT implemented; 2× is a truthful inactive attribute,
not random doubled attacks. Collision radius stays 0.45.

Explicit conversions: `world speed = display movement × (5.5 / 240)`;
`world range = display range × (6 / 4.3)`. Thus normal world speed stays 5.5,
range 6 at every level. S1's existing hit buff gives speed 6.6 and world range 8;
S2 range becomes 9 instead of 7. Inspector displays the actual buffed values,
including converted display units (movement 288; range ~5.73). No change to arena
geometry, collisions, projectile pass-through, selection or no-chase rules.

`calculateAttributes` supports validated empty-by-default `items` and `temporary`
flat/percentage layers: `(base + growth + sum(flat)) × (1 + sum(percent))`.
For attack speed, the percentage term is multiplied by the effective attack-speed
ratio. This is an extension seam, **not an equipment system**. Runtime `speed` /
`range` fold in the existing S1 skill buff separately; `player.attributes` holds
the level/modifier build. Positive resources/rate/range and nonnegative ordinary
attributes are enforced; negative-defense amplification is not supported.

Resource policy on normal XP level gains: `current += newMax − oldMax`, capped
at the new maximum. Example 700/2250 HP and 125/500 mana → level 5 gives
1308/2858 HP and 525/900 mana, not a refill. Zero HP stays zero: XP/regen never
revives an actor. Actual regen runs only while alive and caps at maxima.
Practice Restore is an explicitly labeled manual debug refill, not a respawn or
new healing ability. Existing V Regen remains reserved.

## Attack rate and approved animation decision

`attackRate = min(effectiveAttackSpeed, 2.5)`; interval `= 1 / attackRate`.
Baseline ratio is 1. Level 1 interval **0.9433962264s**; level 15
**0.7462686567s**. Cooldown, animation-lock deadline, raw damage/range feedback
and inspector all derive from actual runtime stats. Acceptance is discrete at
the existing 1/60s simulation ticks (unit cadence tests also use 1/120s).
This is still one action per click/key press, **not auto-fire**.

User chose **scale_playback**: play the same 1.05s Shoot clip over the accepted
basic interval. Movement is locked for that entire adjusted duration. Windup
preserves its approved clip proportion: `(0.25 / 1.05) × interval`.
`lastAttack.duration` is a read-only renderer instruction; animation callbacks
never unlock movement, grant XP, consume mana or deal damage. Skill casts retain
the original Shoot playback rate and 1.05s lock, including at level 15.
Changing stats mid-flight does not retroactively alter an accepted basic's lock
or projectile damage; a subsequent accepted action uses the new stats.

## XP curve and skill points — authored prototype

Cumulative thresholds are editable in `hero.json.progression.xpThresholds`.
They must start at zero, have exactly one finite safe integer per level and
strictly increase. Current curve costs `100 × (currentLevel + 1)` to reach the
next level. It is NOT asserted to be the official MLBB XP curve.

| Level | Cumulative XP | XP to next | Total awarded points |
|---:|---:|---:|---:|
| 1 | 0 | 200 | 1 |
| 2 | 200 | 300 | 2 |
| 3 | 500 | 400 | 3 |
| 4 | 900 | 500 | 4 |
| 5 | 1400 | 600 | 5 |
| 6 | 2000 | 700 | 6 |
| 7 | 2700 | 800 | 7 |
| 8 | 3500 | 900 | 8 |
| 9 | 4400 | 1000 | 9 |
| 10 | 5400 | 1100 | 10 |
| 11 | 6500 | 1200 | 11 |
| 12 | 7700 | 1300 | 12 |
| 13 | 9000 | 1400 | 13 |
| 14 | 10400 | 1500 | 14 |
| 15 | 11900 | MAX | 15 |

XP grants are nonnegative safe integers; NaN, infinity, fractional/string/negative
inputs throw before changing state. Multiple levels can be gained at once with
correct remainder. Level 15 saturates total XP at 11900 and discards overflow;
local XP/next displays 0/0 internally and “MAX LEVEL” + full bar in the UI.
Granting XP never lowers level/XP. Only explicit Practice set/reset can do so.
No minion, kill, dummy elimination or tower XP reward code is added.

All active ranks start at zero. Passive remains automatic. One point at level 1
and one per gained level gives exactly 15 total, not 16. S1/S2 max 6 each;
ultimate max 3, requiring hero levels 4/8/12 respectively. Standard skills have
no additional hero-level gate; they are limited by available points and cap.
`unspent = level − sum(active ranks)`. No overspending, over-ranking or early
ultimate upgrades. Upgrade buttons show rank/cap and are visibly disabled with
reason/title/accessibility metadata. Exactly three active cast buttons remain;
1/2/3 defaults and session rebinding still invoke the same cast/gesture paths.
Unlearned skills cannot spend mana, cast or begin aiming.

## Reconstructed rank tuning

All current Layla attacks/skills deal **physical** damage. Shared helpers support
magic and true damage too; this does not add a new ability. Base values below
are before PA scaling, passive distance multiplier, mark bonus and defense.
Magic coefficient is 0 throughout the current kit. Basics: **0 + 1.0 × PA**.

| Skill | Rank base damage | PA coefficient | Mana | Cooldown seconds |
|---|---|---:|---|---|
| S1 Malefic Bomb | 180 / 220 / 260 / 300 / 340 / 380 | 0.8 | 35 / 40 / 45 / 50 / 55 / 60 | 6 / 5.6 / 5.2 / 4.8 / 4.4 / 4 |
| S2 Void Projectile | 150 / 180 / 210 / 240 / 270 / 300 | 0.65 | 60 / 65 / 70 / 75 / 80 / 85 | 7.5 / 7.3 / 7.1 / 6.9 / 6.7 / 6.5 |
| Ultimate Destruction Rush | 450 / 600 / 750 | 1.5 | 100 / 120 / 140 | 30 / 27 / 24 |

S2 flat mark-trigger bonus: **80 / 100 / 120 / 140 / 160 / 180**, with no PA
coefficient. Existing geometry and effects stay: S1 range 9/speed 14 and 3s
+20% speed/+2 world basic/+2 S2 range; S2 range 7/speed 10/blast radius 2,
4s mark and 0.6s stun within radius 2; ultimate range 12/width 1.4;
all skill windups 0.25s. Passive ramps to 1.15× at distance 6 and excludes
both turret/tower kinds. No new passive range upgrade mechanic.
Mark bonus and base damage share one passive/defense application, consume once,
and cannot recursively trigger themselves. Surviving orb-hit targets get a mark.
Cooldown/mana/damage are resolved from actual learned rank, not cached HUD data.
Damage coefficients are snapshotted at acceptance; defense/passive distance and
mark status resolve at contact. Leveling during flight cannot rescale its base.

Current practice dummies retain positions and HP ratios but HP is **×10** via
`src/data/layla-practice.json`: A 2000/2000; B 900/1200; C 1200/4000.
Each explicitly has 15 physical and 15 magic defense. These are prototype test
recipients for the larger stat scale, not new enemy/AI types. Historical
`src/data/training.json` and `src/heroes/training/` are byte-unchanged.

## Shared damage and validation

`damagePower = base + PA × physicalScaling + magicPower × magicScaling`.
After the existing passive/mark calculation, physical and magic mitigation:

```
effectiveDefense = max(0,
  (defense - flatReduction)
  * (1 - percentReduction)
  * (1 - percentPenetration)
  - flatPenetration)
finalDamage = rawDamage * 120 / (120 + effectiveDefense)
```

Reduction precedes percentage penetration, then flat penetration. Percentages
are fractions 0–1; flat modifiers are finite/nonnegative. At 0 / 120 defense,
100 raw physical damage becomes 100 / 50. Magic selects magic defense instead.
True bypasses ordinary defense. Negative input defense/penetration below zero
is clamped to effective 0: **no official negative-defense amplification formula,
no singularity at −120, no exact official stacking-parity claim**. Shields,
critical hits, lifesteal, spell vamp, damage-type-specific item effects and tower
special rules are not implemented.

The pure damage helper accepts generic source attributes/recipient defenses,
not a mesh or hero identity; future NPC/player combat can reuse it and existing
`canActorAct`/target validation. No NPC behavior is implemented now. Schema 1's
historical direct-damage fixture deliberately keeps its old, exact handler.
JSON remains allowlisted data, never executable scripts. Strict file.field
errors cover missing/unknown fields, nonfinite or invalid resources/regen/
defenses/rates/ranges/levels/XP, rank lengths/caps/unlocks/coefficient values,
ability IDs and missing/duplicate slots. Definition basic range/cooldown are
validated level-1 checkpoints, never runtime authorities or silent defaults.
The whole level curve and bounded runtime conversions are validated at loading.

## UI and Practice policy

Player card: level, XP meter, current/max HP and mana. Visible three-button
upgrade row: S1/S2/ULT rank/cap, available points, disabled unavailable upgrades.
**Attributes / Practice · Testing** opens a non-modal scrollable inspector with
HP/mana, PA/PD/MD, magic power, actual attacks/second, movement/range (display →
world), regen, attack-speed ratio and inactive critical multiplier.

Commands call simulation methods only:
- **Set level 1–15:** set exact cumulative threshold, reset all ranks, award
  exactly `level` unspent points, cancel aim/pending/projectiles/buff/attack and
  skill cooldowns. Preserve positions, timer, pins, dummy health and numerical
  player resource deficit (clamp on down-level). Reapplying same level also resets
  ranks; its label says so. It never creates elimination/reward events.
- **Grant XP:** configurable amount; normal leveling keeps learned ranks,
  in-flight actions, existing cooldown deadlines and resource deficit.
- **Reset to level 1:** same debug cancellation, zero XP/ranks, one point, then
  explicitly restore full baseline resources. Does not reset target health/map.
- **Restore HP / mana:** explicit manual refill only; no cooldown bypass.
- Existing **Reset arena** still restores the entire original scenario and now
  resets progression to fresh level 1/one point/unlearned actives too.

Practice state is session-only. No account levels, wallet edits, fabricated gold,
equipment, kills or XP rewards. Lobby starter wallet remains separate. Opening
the inspector doesn't pause gameplay or clear held controls; actual number
editors protect typing, movement and combat exactly like existing editor policy.
Existing centered non-modal Shop/Settings, sound, menu/model handoff and rebinds
remain. Preview panes may cover part of the map while open, not the whole arena.

## Validation and delivery

See the accompanying changed-file manifest and machine-readable Phase 1 results.
Unit tests include exact growth/reference points, resource/regen policies, every
XP boundary, invalid grant/set inputs, points/caps/ultimate gates, real ranked
costs/damage/cooldowns, defense/penetration and type cases, actual basic cadence /
movement locks at 1 and 15, unchanged skill lock, same-clip playback reset,
immutability, reset/no reward behavior, and file.field validation.
Existing geometry/input regression fixtures explicitly learn rank-1 skills at
level 4; they do not silently make initial skills available. Browser helpers do
that through real Practice controls. A fresh-state browser suite separately
verifies actual initial progression, real learning, XP, cap allocation, inspector,
input safety and 1280×720 / 960×540 / 844×390 reachability.

The menu's software-WebGL compact scene handoff once exceeded its old 30s test
action limit; only the test budget was raised to 90s. No native-device performance
claim follows. Initial browser failures exposed a compact inspector bound and
unlearned-skill assumptions; those were corrected and rerun, not counted as passes.

```bash
npm ci
npm test
npm run build
npm run package:source
npm run test:browser:progression
npm run test:browser:layla
npm run test:browser:panels
npm run test:browser:menu
npm run test:browser:polish
npm run test:browser:heroes
npm run test:browser
npm run validate:offline
npm run dev -- --port 5173
```

To play: double-click `index.html`, create/restore profile, MODE → AI TRAINING
ROOM, learn S1/S2 with the visible upgrade row, inspect/grant XP using Practice.
No server, npm, internet or sibling assets required to play. Editable source is
`deliverables/MOBA-Lab-Phase-3-source.zip`; standalone is
`deliverables/MOBA-Lab-Phase-3.html`. The **legacy Phase-3 filenames are retained
for existing packaging compatibility**, not the new roadmap's scope. Root index,
dist/index and named standalone are rebuilt identically; ZIP includes root index,
source/config/tests/docs, not dependencies, reference uploads or duplicate builds.

Limitations: Linux Chromium offline file:// and touch emulation are not native
Windows double-click, physical-touch/GPU or audible-speaker certification.
Windows/manual acceptance remains pending. file:// storage may be session-only
or vary by file path/browser. Software WebGL is slow. Three.js's >500 kB embedded
chunk warning is expected; splitting into fetched chunks would violate standalone
delivery. Current dummies do not attack, so HP loss/resource deficit and incoming
mitigation are unit-tested with explicit test state, not claimed as enemy AI.

## Proposed next milestone — STOP here for review

After approval only: roadmap **Phase 2** could add a deliberately scoped offline
Brawl lane/map, minion-wave and tower/base objectives using these validated actor
stats/damage/action seams. Define actor stats/defenses, collision/projectile and
tower rules, XP attribution and acceptance tests before implementation. Do not
start Phase 3 AI/respawn, Phase 4 equipment/economy or Phase 5 dedicated training
selection/map as part of that work without separate authorization.

### Executed acceptance results

| Command | Actual result |
|---|---|
| `npm ci` | Success; 35 packages, audit reported 0 vulnerabilities |
| `npm test` | **290 passed, 0 failed** (200 preserved/migrated + 90 new) |
| `npm run validate:heroes` | Passed: Layla schema 3 + historical schema 1 |
| `npm run build` | Passed; single embedded HTML generated |
| `npm run validate:offline` | Passed; root/dist/named HTML byte equality + dependency checks |
| `npm run test:browser:progression` | **10 passed**, fresh state and real Practice UI |
| `npm run test:browser:layla` | **19 passed**, learned-kit controls/geometry/isolated ZIP |
| `npm run test:browser:panels` | **16 passed**, non-modal movement/aim/combat/editor regression |
| `npm run test:browser:menu` | **11 passed**, profile/GLB handoff/compact touch emulation |
| `npm run test:browser:polish` | **13 passed**, wallet/audio/persistence/fallback |
| `npm run test:browser:heroes` | **9 passed**, creation/catalog/guide/ratings |
| `npm run test:browser` | **50 checks passed**, exact historical fixture |

**128 offline browser checks**, with zero runtime errors, warnings or subresource
requests in their saved reports. Machine-readable summary:
`gameplay-phase-1-validation.json`; detailed unit/browser reports are adjacent.
The long foundation run exceeded the tool's initial 600s wait, continued once
(no duplicate run), then completed its full successful 50-check report. The
completed report and process exit/liveness were inspected; the later separate
structural offline validation also passed. No Windows certification is implied.

Approved GLB SHA-256 (unchanged):
`963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
Approved creation PNG SHA-256 (unchanged):
`bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1`.
