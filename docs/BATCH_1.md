# Batch 1 — hero selection, combat controls, NPC AI and respawns

2026-10-18 · session branch `arena/55ce0f80-mobile-legend-lite`.
Only this batch is implemented. Equipment recipes, recommendation/priority/quick-
buy redesign and the twelve battle spells are **not** implemented or approved here.

## Baseline and recoverable checkpoint

The actual current workspace included the newer Brawl/37-item/queued-skill work,
but Git in this checkout still had only the initial tracked README. I did not
reset/revert that workspace to any historical milestone. At the user's explicit
request I captured the complete current working source in local checkpoint:

**`d359178e9d6cf51a58d7d2a64fe53ad43266474a`**

Commit message: `Checkpoint current Brawl and equipment baseline before Batch 1`.
It remains on the same session branch and was **not pushed**. This is the recovery
point for this batch, not the historical commit identifiers in older reports.
`git show d359178:index.html` can retrieve the prior offline HTML without changing
branches or overwriting the current work.

Read/inspected PROJECT_RULES, current README/menu/hero reports, flow/lobby/runtime,
hero combat/targeting, lane simulation/AI/respawn, HUD/nameplates/settings and the
actual offline rendered game. Locked npm dependencies were restored with `npm ci`;
missing-dependency attempts are not counted as successful test runs.

Before gameplay edits: **407/407 unit tests**, **9/9 connected browser checks**.
Raw baseline output: `batch1-baseline-unit-output.txt` and
`batch1-baseline-browser-output.txt`. New implementation remains uncommitted for
review; only the baseline checkpoint was committed. No push performed.

## Changes

### Selection and loading

- `src/menu/assets/hero-selection-stage.png` is a dedicated original celestial
  armory/dais background, separate from both main-menu and room PNGs. UI is live
  HTML/CSS, not baked into the image. No reference screenshot pixels extracted.
- Removed the left Layla biography/movement/debug paragraph and prototype note.
  Hero-identifying names, actual team picks, timer, selection and confirmation
  controls remain. Selected hero's three genuine skill icons remain contextual.
- The character area starts empty with **Select a hero**. The shared approved GLB
  preview becomes visible only on an explicit hero pick, and resets on leaving/
  re-entering. Opening selection creates no gameplay simulation. The cached lobby
  model may already exist in memory; that is not a spawned gameplay actor.
- Only Layla is currently available, so distinct multi-hero switching cannot be
  certified without future authorized heroes. No extra characters/skins are faked.
  The existing timed default Layla pick remains; expiry enters loading rather
  than briefly displaying an unrequested preview on the selection screen.
- New `LocalLoadingState` owns actual-resource readiness independently of a
  configurable **10,000ms minimum** in `src/data/match/presentation.json`.
  Completed tasks never permit entry before the minimum; loading that takes
  longer still waits for actual completion. Preparation progress and elapsed
  lineup-viewing progress are separate, honestly labeled indicators.
- Practice, AI Training and Brawl use the same gate. Failures show Retry/Back
  immediately rather than pretending to be a normally completed load.
- Runtime prepares the game with the app/HUD hidden. A single reveal/resize/focus
  happens only after loading is committed to gameplay. The old HUD-over-lineup
  leak in the user's screenshot is fixed. Simulation does not tick behind the
  loading screen; the separate existing match countdown starts afterward.

### Attack resolver and controls

`src/match/targeting.js` is a pure, source-team-aware category resolver; the
existing authoritative attack method still checks range, life/status, accepted
animation lock and attack interval and creates the real projectile.

- **Large attack / Space / ground click:** prefer eligible enemy heroes.
- **Minion button:** performs an attack preferring an eligible enemy minion.
- **Tower button:** performs an attack preferring an eligible tower/core.
- Within a preferred category, use Settings' Nearest, Lowest Current HP or Lowest
  HP Percentage. Manual mode retains the existing nearest fallback when no pin
  exists. Valid explicit mouse pins override category/mode preference.
- If the preferred category has no in-range eligible target, use the existing
  settings-based all-category fallback. Dead/removed/protected/friendly/invalid
  targets never qualify; out-of-range pins are discarded and targets reacquired.
  Clicking an explicitly out-of-range actor reports range rejection, not chasing.
- Large attack resets the old filter-only minion/tower preference; auxiliary
  buttons now submit attacks rather than merely toggling a stale filter. Actual
  settings and button preference indicators remain synchronized.
- Visible short status feedback explains no target/range, cooldown, status,
  action lock or countdown rejection. Rejected attempts do not move the player,
  spend resources, create shots or extend the accepted attack lock. Repeated
  button/key presses cannot exceed real attack speed. Category commands respect
  active skill-aim gesture isolation, just like the large button.
- Practice still has real target dummies, **not minions/towers**; category buttons
  remain explicitly unavailable there. Legacy fixture targeting is unchanged.

### Incremental AI refinement

No replacement AI framework, stat cheats, artificial damage buffs or new kits.
The same decision function/real Layla kit adapter is retained, with simulation-
owned `engage`, `retreat` and `recover` state and configurable conditions.

- Weigh current HP, nearby enemy heroes/minions/tower danger, nearby allied
  support and a safe nearly-defeated target before retreating. Merely not being
  full HP is not a retreat condition. Low HP versus a minion alone is different
  from being outnumbered by heroes or exposed to an enemy tower.
- Enter thresholds: Easy 30%, Normal 24%, Hard 18%. Critical threshold 8%.
  Retreat commits for at least 2.5s, recovers toward 55%, can return early when
  safely recovered above 42%, and uses a 3s re-engagement grace interval unless
  critical/overwhelming danger requires a new retreat. All values are data-driven.
- Retreat uses configured home/offset and a bounded lateral route adjustment
  around a nearby blocking enemy. Existing movement/collision remains authoritative.
- Real spawn/base regeneration enables recovery/re-engagement. Actual ability
  availability comes from the bot's learned ranks/mana/cooldowns/status/locks;
  commands still go through the shared hero kit with no bypass.
- Blue and red Computers use identical rules with existing reaction/accuracy/
  targeting difficulty differences. Advanced coordinated tactics/pathfinding/
  crowd separation are not claimed; quality still merits human playtesting.

### Match-clock respawns

Single shared configurable calculation in `src/match/respawn.js` / lane data:

`min(45, 5 + floor(actualMatchSeconds / 60) * 2)`

| Clock at death | Respawn duration |
|---|---:|
| 0:30 | 5s |
| 1:00 | 7s |
| 10:30 | 25s |
| 20:00 or later | 45s |

The death handler assigns one absolute `respawnAt` and records the duration once.
Existing duplicate-death guard, HUD countdown, restore/protection and core victory
remain. Player and Computer hero deaths use the same actual match clock; pausing
stops that clock. New matches reset it. Recovery clears dead actor AI commitment,
marks and stale respawn metadata. No mode-specific lane exception existed;
Practice remains the separate no-hero-death sandbox, not a fabricated respawn mode.

### Enemy identity and live HUD

- Enemy hero names (Computer / numbered variants), actual level, red HP and blue
  mana are visible over the real model. Allied hero bars are cyan, with distinct
  team coloring for lane entities; player HUD stays intact. Labels follow actors,
  hide on death/offscreen and are removed when the entity leaves the scene.
- The compact selected-enemy panel reads the **actual target**, including name,
  level, current/max HP and current/max mana only when the actor uses mana.
  It updates on target/data changes and hides when no valid enemy hero is targeted.
- Panel is below the minimap on desktop and beside it in compact landscape to
  avoid covering the existing map, testing toggle or player HUD. Nameplates stay
  deliberately small; overlapping bodies in dense fights can still crowd labels.

## Preserved / deliberately deferred

Brawl room/rosters/selection/results/replay; manual WASD/touch movement and flipped
camera; approved Layla GLB/materials/clips and exact ability data; full basic/skill
locks and one-skill follow-up buffer; working Recall/Regen; targeting settings;
combat announcements; profile/account wallet/audio/settings; **all current shop
purchases/selling/items/passives** and standalone packaging. No item recipes,
auto-component upgrades, completed-item filters, prioritized build/quick-buy,
new recommendations, battle spells, extra heroes/skins or multiplayer were added.
The existing Equip-in selector is intentionally untouched until approved Batch 2.

## Manual verification steps / limits

1. Disconnect internet; open delivered HTML alone. Enter Brawl, add Computers and
   Start. Confirm selection starts empty. Pick Layla, Back and re-enter: empty
   again. Inspect the dedicated background and absence of biography/debug clutter.
2. Confirm with a stopwatch in Brawl and an AI mode/Practice. Both team lineups
   remain visible for at least 10s with progress feedback and **no gameplay HUD**.
   Actual graphics failures should show honest Retry/Back, not a fake successful load.
3. In lane combat, use Settings → Controls to test each target mode. Click the
   large attack button / Space with battlefield focus: heroes are preferred.
   Minion/tower buttons prioritize their real categories and safely fall back.
   Click an enemy to pin it, move out of range and verify reacquisition/feedback;
   attacks themselves never chase. Verify rapid presses respect cooldown.
4. Fight on each difficulty. Compare a low-health NPC with allied support/weak
   opponent to one outnumbered near a tower. Observe committed retreat, recovery
   and re-entry rather than HP-threshold jitter. This qualitative feel and
   long-session edge cases still require human judgement, not merely unit counts.
5. Die early and later in a lane match; compare HUD countdown to the formula at
   the instant of death. Check no premature/double respawn and a fresh new match.
6. Target a Computer; watch red HP/name/level/mana update while it moves, casts,
   takes damage and dies. Test 1280×720, 960×540 and 844×390 landscape; touch/wide
   screen hardware and dense 5v5 label crowding should be checked manually.
7. Verify the existing shop buys/sells exactly as before, utilities, queued skill
   follow-up and replay/menu return still work. No new shop/spell UI is promised.

Automated tests use Linux Chromium software WebGL and trusted touch emulation.
They are not native Windows double-click, physical-phone performance, speaker or
subjective AI-quality certification. Exact approved hero/creation-art bytes are
checked separately. Final executed evidence/counts and changed files are appended
at handoff; historical reports describe their own earlier snapshots.


## Final executed verification

| Test | Passed |
|---|---:|
| Pre-edit units | 407 / 407 |
| Pre-edit connected browser baseline | 9 |
| Final units | **448 / 448** |
| Batch 1 native standalone flow | 16 |
| Retained roster | 9 |
| Actual draft timeout / full 5v5 / touch | 5 |
| Layla combat controls | 19 |
| Progression | 10 |
| Non-modal panels | 16 |
| Graphics failure/retry and input recovery | 5 |
| Menu | 11 |
| Wallet/audio/lobby polish | 13 |
| Hero guide | 9 |
| Legacy foundation/HUD/input/offline isolation | 50 |
| Connected match/core/results/replay/touch | 10 |
| **Final browser total** | **173** |

**41 additional unit checks** cover the category×mode matrix; distinct lowest-HP
and percentage selection; manual pin precedence; stale/range/protected targets;
no-chase/cooldown/no-target feedback; match-clock respawn boundaries, both teams,
once-only/no-early restore and new-match reset; threat/finisher/hysteresis/recovery/
route AI decisions; dual-condition loading; preview-flow reset; and live enemy
HUD changes/death/no-mana/team values using a small isolated DOM adapter.
No private gameplay mutation API was added for the browser tests.

Final native loading measurements from confirmation through gameplay transition:
- **brawl: 10.0210s**
- **ai-training: 10.0261s**
- **practice: 10.0133s**

The full final standalone and connected-result suites identify the exact delivered
HTML hash in `batch1-verification.json`. There were **zero unexpected runtime
errors, warnings or external runtime asset requests**. Recovery intentionally
injects two denied graphics contexts, generating four expected graphics-error log
entries; those are distinguished from unexpected failures.

The real idle 1v1 Brawl ended through sequential core destruction: **Defeat 4:32,
level 6, 0 eliminations/deaths/assists, 0 earned gold, 0 enemy structures destroyed**.
These are observations of that idle run, not invented achievements. The suite
also verifies a full 5v5 initialization, actual purchases/selling, safe pause/quit,
fresh replay/hero confirmation and GLB reuse. Separate deterministic normal 1v1
and full 5v5 simulations reached real core outcomes (`batch1-natural-simulations.json`).
Their completed retreat/recovery cycles did not break the 2.5s commitment rule;
shortest observed full withdrawal/re-entry was about 12.50s / 5.83s respectively.
Those probes do not substitute for subjective tactical playtesting.

Screenshots inspected at 1280×720, 960×540 and 844×390: empty and picked preview,
loading without HUD bleed, enemy nameplates/selected panel and existing controls.
The selected panel has explicit no-overlap/in-bounds browser assertions against
the minimap, player card and testing toggle at all three sizes. The same approved
rigid-part model/materials/clips are retained; art/model replacement is not claimed.

### Regression adjustments / honest failures

- Three old AI cases now advance past the new minimum retreat commitment before
  asserting re-engagement. A minion-only low-HP case now expects continued fighting,
  exactly the newly requested behavior; genuine-threat retreat assertions remain.
- The initial Batch 1 browser attempt asked for an internal category absent from
  the existing diagnostic snapshot; the read-only snapshot now includes the real
  category, and the actual attack/UI assertions passed on the rerun.
- An old panel test assumed Space attacks while a focused shop button owns native
  Space. This behavior already existed in the checkpoint: an isolated checkpoint
  diagnostic observed no attack command from that key. That diagnostic later timed
  out due its own absolute-time wait and is **not counted as a passing suite**.
  The retained panel test now explicitly focuses the battlefield before Space,
  still verifies real damage with the non-modal panel open, and keeps all sixteen
  assertions. Native button activation is not weakened/reverted to make it pass.
- Incomplete attempts are excluded from the final 173 passing browser checks.

### Evidence and reproducibility

- `batch1-baseline-unit-output.txt`, `batch1-baseline-browser-output.txt`:
  actual pre-edit baseline; checkpoint diagnostic is separately marked above.
- `batch1-unit-output.txt`, `batch1-browser-output.txt`,
  `batch1-browser-suites.json`: actual final outputs and command/check inventory.
- `batch1-browser-results.json`, current `match-browser-results.json`, and
  `batch1-verification.json`: timing, core result, errors, exact tested hash.
- `batch1-natural-simulations.json`: bounded complete-match policy probes.
- `BATCH_1_CHANGED_FILES.md`: exhaustive changed files relative to checkpoint.
- `deliverables/BATCH-1-SHA256.txt`: final download/immutable-asset checksums,
  written after source ZIP creation to avoid a circular checksum.

Run `npm ci`, `npm test`, `npm run package:source`, then the twelve browser commands
listed in `batch1-browser-suites.json` (real timers/full matches take real time).
Normal play requires only the standalone HTML, not npm/Python/server access.
Build, hero validation, offline validation, ZIP CRC/inclusion and identical HTML
checks pass. The archive excludes dependencies, screenshots/reference images,
credentials, Git internals and duplicate generated builds.

**Deliver and STOP. Await approval for Batch 2 / Batch 3. No push performed.**
