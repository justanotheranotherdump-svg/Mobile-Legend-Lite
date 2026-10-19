# Final Gameplay Polish Before Adding the Next Hero

Date: 2026-10-19. Review-only work on `arena/55ce0f80-mobile-legend-lite`.
No new hero, branch switch, reset, force push or new publication.

**Complete: all implementation, unit, native gameplay, 15-suite browser regression,
and both isolated offline delivery checks passed.**
The final machine-readable records are `final-gameplay-polish-*-results.json`
and `final-gameplay-polish-delivery-audit.json`. Historical Preparation/Game Polish
certificates describe their earlier builds, not this build.

## 1. Genuine empty hero selection

`MatchFlow.heroId` starts/reset/re-enters as `null`; the diagnostic selectedHeroId
reads that same state. The draft config heroId is a getter for this same nullable
state, so the match factory's default cannot remain as a second hidden selection.
No default Layla, last-used hero or timer fallback is chosen.
The human teammate slot has no selected portrait, details/skills and 3D preview are
hidden, and Confirm is disabled and guarded. Hover/browsing does not select.
An explicit pick populates all selected displays; Clear removes them again.
Individual roster/pick-card portraits remain present. At real 45-second expiry,
empty selection stays empty. An explicitly picked hero can proceed; real loading
still requires at least ten seconds and readiness.

## 2. Stable, real tower tactics

The old movement fallback selected a destination across its own danger boundary,
then reversed the decision when the NPC crossed it. Target selection and fallback
now share one persistent `lanePlan`: objective ID, hold/push mode, timestamps,
cover state, reason and stable safe destination. A no-wave destination sits
2.2 simulation units outside the actual tower range, rather than around the
old decision boundary. Collision-aware movement and attack controllers remain.

Minions must actually enter the tower's interior range for at least 0.6 seconds
before establishing cover. Losing cover, retaliation, low HP or objective death
causes reassessment. Covered pushes prioritize their objective, but defend against
a recently damaging in-range hero rather than blindly ignoring the attacker.
The existing committed low-health retreat/recovery remains intact.

A healthy no-wave siege is not a blanket permission to dive. It requires at least
three nearby healthy heroes and a conservative estimate using actual physical
damage/defense, attack rates, tower HP/damage/cooldown, approach time and a 40% HP
reserve; estimated completion must fit within 80% of that tank budget. This also
avoids a wave-only unattended-match stalemate. It is a tactical estimate, not a
guarantee against future enemy movement. Towers still acquire targets, retaliate,
attack and deal real damage. They have not been disabled or weakened.

Unit scenarios cover no-wave hold, wave arrival/loss/rearrival, high/low health,
retaliation, objective death, normal farming/fighting, calculated siege and
self-defense during a push. The browser samples actual, untouched offline Brawl
movement, requires settled positions outside real tower range, then observes
advance with arriving minions and real structure damage. The trace is
`final-gameplay-polish-ai-browser-trace.json`.

## 3. In-match Gold cheat only

AI Training/Brawl Settings has a final **Cheats** tab with one action:
**Add +9999 Gold**. Gold is the game's existing shop currency. Each click adds
exactly 9999 to current funds, is repeatable, and updates the HUD/shop. Purchases
use the unchanged ordinary shop and deduct their normal price.

The action is scoped to a running local match, including a paused active match;
countdown/ended matches are rejected. Lobby, hero selection and separate Practice
Settings do not receive this new tab. No NPC funds, account wallet, earned-income
or blessing-progress credit is granted. `developmentGoldGranted` is tracked
separately. No other cheat was added. Existing unrelated account developer tools
were not removed or expanded. Closing Settings restores normal controls.

## 4. Actual hero-stat and combat fairness

### What was already correct

There was **no hidden base-stat difficulty multiplier** in the implemented hero.
Player and NPC already instantiated the same Layla definition, progression,
attribute calculator, ranked skills and hero combat engine. It would be inaccurate
to claim that this work removed a base HP/damage bonus.

Actual fresh Brawl level-3 values match on Easy, Normal and Hard:

| Effective value | Human | NPC |
| --- | ---: | ---: |
| Max HP / mana | 2554 / 700 | 2554 / 700 |
| Physical attack / magic power | 150 / 0 | 150 / 0 |
| Physical / magic defense | 23 / 20 | 23 / 20 |
| Attack rate / cooldown | 1.1 / 0.909091 s | 1.1 / 0.909091 s |
| Runtime movement / attack range | 5.5 / 6 | 5.5 / 6 |
| HP / mana regeneration | 5.8 / 4.4 | 5.8 / 4.4 |
| Crit chance / crit multiplier | 0 / 2 | 0 / 2 |
| Item CDR / lifesteal / spell vamp / tenacity | 0 / 0 / 0 / 0 | 0 / 0 / 0 / 0 |

Source movement/range units are intentionally converted by the same runtimeScale
for both actors. `final-gameplay-polish-stat-audit.json` records actual values and
both skill-point states, not a duplicate display-only stat table.

### Real asymmetry repaired

NPC engines did not have the human's inventory/equipment effect contexts, some
attack metadata/scaling was dropped, and match damage applied preparation,
penetration, outgoing/incoming item hooks, shields/procs/lifesteal and resurrection
only to the human. That meant copying displayed attributes alone was insufficient.

`hero-equipment.js` attaches independent six-slot inventories and the **same**
ItemEffects/ExpandedItemEffects classes to NPC hero engines. Each owns its timers,
modifiers, resources and procs, while using the real match world, RNG and damage
resolver. Player and NPC attacker/defender contexts now flow through the same
match damage pipeline. NPC damage forwards metadata and passive-adjusted scaling.
Equipment ticks maintain temporary modifiers instead of overwriting them every
NPC frame. Item kill/assist credit uses the actual owner ID, not a hardcoded
`player` key. Item/proc clocks are synchronized to the authoritative hit time, including when
a projectile lands before the defender's NPC engine advances. Dead NPCs can complete the same Immortality effect; pending
resurrection does not become an ordinary premature respawn. A dormant bot-growth
fallback no longer replaces shared range with a generic lane constant.

The HUD continues to read simulation attributes/resources, not a synthetic parity
panel. Minion/tower identities, damage formulas and the existing core passive
exception are preserved; different entities are not equalized.

### What the fairness tests establish

`hero-fairness.test.js` adds 27 cases:

- 72 identical-build stat fixtures: levels 1, 3, 8 and 15 × three difficulties ×
  six builds (empty, physical/crit, magic/procs, defense, on-hit and recovery).
- Exact full attribute/rank/ability definitions and actual runtime HP/mana, regen,
  attack rate, movement, range, crit, CDR, lifesteal, spell vamp and tenacity;
  equivalent actual skill-1 buff state also retains parity.
- Twelve paired real basic/projectile and all-three-skill runs (four builds ×
  three difficulties), controlled RNG, equivalent targets/defenses and ranks;
  actual damage, HP, resource spending and cooldowns must agree after updates.
- Actual incoming physical/magic/true damage, item shields/recovery and timed
  Immortality on both owners; owner-correct NPC item kill credit; identical proc
  expiries even when an NPC engine has not advanced yet this frame.

These are simulation actions and damage outcomes, not screenshot equality.
Native browser verification separately checks a fresh actual match and real UI
movement/combat. In `final-gameplay-polish-root-combat-browser-snapshot.json`, the initially idle human is
level 3 with a purchased Dagger and the farming NPC has earned level 5 with an
empty inventory; that capture is deliberately not presented as an equal-loadout
damage comparison. The numerical parity proof uses controlled equivalent
conditions in the paired tests. This is not an exhaustive numerical browser
replay of every item.

### Intentional differences / limits

Difficulty changes reaction interval (0.8/0.4/0.18 s), aim spread (2.3/1/0.3),
aggression, retreat thresholds and target policy—not HP, damage or stat growth.
NPCs automatically spend earned skill points; humans choose theirs. A fresh Brawl
human has three unspent points while the NPC has rank-3 Malefic Bomb. Tests control
ranks before comparing abilities. Different earned levels, equipment, buffs,
positions, target defenses and RNG can legitimately produce different outcomes.

NPCs still default to empty inventories; this task did **not** add an auto-shop,
automatic item-active or battle-spell decision AI. Equipment parity is exercised
using controlled equivalent loadouts through the actual NPC equipment contexts,
not by pretending the bots bought the human's items. Only Layla is implemented;
future heroes, their magic/skill formulas and unimplemented stats cannot yet be
certified. This is not a commercial-game live-patch balance certification.

## 5. Verification record

| Ordered checkpoint | Actual result |
| --- | --- |
| Baseline | 741/741 units passed |
| Empty selection | 742/742 units; native empty/select/clear/re-entry passed |
| Tower plan | 747/747 units; actual offline wave-push browser passed |
| Gold cheat | 749/749 units; actual repeated grants/shop purchase/resume passed |
| Controlled fairness | 775/775 units passed |
| Final self-defense / authoritative-hit-clock refinements | **777/777 units passed**, no failures/skips |
| Final native offline gameplay | 5/5 check groups passed; zero runtime errors/warnings/external requests |
| Full browser regression | 15/15 suites, 219 check groups passed; no failed suites |
| Isolated standalone / ZIP HTML | 2/2 runs, 5 groups each (10 repeated checks); zero runtime errors/warnings/external requests |

Full unit output: `final-gameplay-polish-unit-results.txt`. The regression runner
retains each suite's complete stdout/stderr. Assertions were not deleted, bypassed
or weakened. The old draft browser expectation was legitimately updated from
five selected portraits/automatic expiry pick to four NPC portraits, null human
selection at actual 45-second expiry, then an explicit pick and real ≥10-second
loading. Touch movement, complete 5v5 roster and disposal coverage remain.

### Failures found while iterating

- A wave-only safe policy stalled an existing unattended 5v5 result regression.
  Covered-objective priority plus the actual-DPS conservative siege rule restored
  that regression; the result test was not shortened or removed.
- New fixture iterations initially omitted real tower defenses, allocated too few
  ranks for all three skills, or used an invalid neutral team in hero damage
  checks. Those fixtures were corrected to valid game conditions, not worked
  around with production fake defaults.
- The new native combat harness initially referenced a nonexistent hero-priority
  button, then attempted combat from outside the real bounded search range/inside
  its own tower protection. It was corrected to use the actual main attack and
  trusted movement to a real duel position; no range/targeting bypass was added.
- The first legacy browser regression attempt reached 21 checks then discovered
  its required named source ZIP was absent from the restored workspace. Current
  archives were generated with the real build; the unchanged suite is rerun.
- Concurrent software-WebGL regressions also encountered a navigation timeout.
  The interrupted attempt is retained; final verification is scheduled serially
  without weakening browser timeouts or assertions.
- A new targeted clock test reproduced a genuine 0.02-second NPC shield/proc
  expiry discrepancy (42.98 versus 43) when damage arrived before the NPC frame.
  Hit/death contexts now use the actual match time; all 777 units pass. Earlier
  browser work was interrupted for this fix and is not counted for the final HTML.

Final native error/warning/request arrays, full regression results, isolated
file-origin checks, package hashes and remaining failures are authoritative in
the new JSON records. Do not infer success from an earlier historical report.
Linux Chromium/software WebGL/emulated touch/audio checks are not native Windows,
physical touch hardware or real speaker certification. The bundler's existing
large-chunk size advisory is not a browser runtime warning.

## 6. Significant files

- Selection: `src/menu/match-flow.js`, `match-screens.js`, `application.js`.
- Tower behavior: `src/match/tower-plan.js`, `ai.js`.
- Combat authority: `src/match/hero-equipment.js`, `hero-bots.js`, `simulation.js`,
  `item-effects.js`, `expanded-item-effects.js`.
- Settings wiring: `src/ui/settings-panel.js`, `panels.js`, `hud.js`.
- Coverage: `tests/final-gameplay-polish.test.js`, `hero-fairness.test.js`,
  `browser-final-gameplay-polish.mjs`, `browser-draft.mjs`, `batch1.test.js`.
- Packaging/audit: existing package/offline scripts; final regression, delivery
  audit and isolated-browser scripts; package commands, README and PROJECT_RULES.

No new art/model/hero data was substituted. The approved Layla GLB, creation PNG,
portrait and 63 original equipment PNGs retain their exact recorded SHA256 values.

## 7. Delivery and next step

`deliverables/MOBA-Lab-Final-Gameplay-Polish.html` is the current standalone game;
`deliverables/MOBA-Lab-Final-Gameplay-Polish-source.zip` is organized editable source
plus tests/reports and one playable root index. Established HTML/source aliases
are updated. The ZIP excludes Git/dependencies/caches/reference images/test
captures/duplicate builds. Exact CRC, byte comparisons and SHA256 are recorded
outside the archive to avoid self-referential hashes.

**Readiness: ready for a separately authorized next-hero milestone within the
implemented Layla/offline scope. No known failing acceptance path remains in the
completed checks.** This is not certification of unimplemented heroes, exhaustive
item combinations, live commercial balance, native Windows or physical devices.
NPC automatic shopping/item-active/battle-spell decision AI remains outside this
milestone as documented above.

The final archive is repackaged after reports finish, then CRC-tested and every
included source/document byte compared to the workspace. Its root HTML is
byte-identical to the runtime already exercised by both isolated runs. Final
hashes are in `final-gameplay-polish-delivery-audit.json` and the consolidated
`final-gameplay-polish-verification.json`, outside the ZIP to avoid self-reference.
Stop here for user review; do not start the next hero or push without authorization.
