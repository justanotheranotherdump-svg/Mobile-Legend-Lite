# Game polish — Preparation, targeting, HUD and local profile

2026-10-19 · approved Parts 1–10, in sequence · review delivery, no push.
Recoverable local checkpoint: `d94cbb6ae0b3a2a54ae0d37865399584ddb32a6e`.
The restored checkout's checkpoint history was reconciled with the published
branch without force-pushing or replacing the reviewed working files.

## Initial inspection and references

Baseline: **555/555 unit tests** before edits. Existing systems were extended,
not replaced: twelve spells + shared card picker/account unlocks, 45 items +
editable recipe quotes + atomic equipment, existing profile/wallet, pinned
selection, >=10-second local loading, Layla combat, Brawl and separate Practice.
The gaps were inactive lobby navigation, no saved build/history, range-only basic
attack attempts, faint range rings, and absolute-position hold aiming.

The nineteen uploaded images guided sidebar/main-panel proportions, top identity,
selection setup, circular portraits, blue/gold panels, equipment tree, spell list
and inspector, profile navigation, ground sights and thumb aiming wheel. No
reference screenshot is a runtime background or extracted asset. Historical
reference files were removed at the user's request; they were not restored or
bundled. The existing original selection/lobby backgrounds are retained.

Mechanics research (descriptive guidance, not authoritative numerical data):
- https://keymap.io/controls/mobile-legends/ — tap versus drag, release/cancel zone.
- https://www.oneesports.gg/mobile-legends/smart-targeting-how-to-turn-on/ — held,
  dragged targeting controls. Supplied project definitions still govern mechanics.

## Feature completion and implementation map

### 1. Selection and Preparation
- Existing twelve-spell picker is a dedicated, icon-backed selection-room section.
  Selecting a spell persists through the same `BattleAccountStore`, unlock checks
  and match configuration, not a second registry. The draft clock pauses while
  inspecting spells and resumes with the elapsed time restored.
- Lobby **Preparation** opens Battle Setup, Equipment Wiki, Battle Spell Wiki and
  explicitly future-only Emblems. The spell wiki has an icon grid/detail inspector
  and an optional detailed-card view; both read the same existing definitions.
- My Setups creates, edits, reorders, saves, selects and deletes up to three builds
  per owned hero. Each has 1–6 unique completed items and at most one pair of boots.
  Select a build in Preparation or the selection-room build dropdown. No build is
  invented for another hero. Empty custom configuration retains manual priority.
- The equipment wiki includes all 45 real entries, stats, effect descriptions,
  prices, tiers and complete prototype recipe relationships.
- Files: `src/player/builds.js`, `src/menu/preparation-screen.js`,
  `preparation.css`, `battle-screen.js`, `battle-screen.css`, `application.js`.

### 2. Portraits, lobby and profile
- One 256px circular upper-body crop of the project's existing original Layla
  portrait is reused across lobby identity, selection/rosters, map hero markers,
  player HUD, kill notices, owned heroes and profile. No model was replaced.
- Upper-left identity opens Profile and shows actual account level/XP.
- Overview/Statistics derive recent and most-used heroes and win/loss counts from
  actual retained completed lane matches. History shows actual mode, hero, result,
  duration, K/D/A and hero level. Quits/Practice do not fabricate records.
- Heroes opens only the current owned, playable roster (Layla).
- Rank is clearly future-only. Account reset requires a native modal confirmation,
  lists erased data, verifies a recovery backup before deleting current-player
  keys, and offers restore on the creation screen. Other players/preferences stay.
- Separate Developer Tools explicitly add validated coins/diamonds or set account
  XP to level 25. No silent grants or normal-gameplay unlock-all buttons.
- Files: `src/player/history.js`, `account-tools.js`, `src/menu/player-profile.js`,
  `lobby-screen.js`, `progress.js`, `battle-account.js`, `src/ui/portraits.js`,
  `assets/layla-portrait.png`, `minimap.js`, `combat-notifications.js`.

### 3. Ground range clarity
- Solid cyan player range follows current simulation range (including buffs/items).
  Settings: contextual / always / off. Context means a target, attack command or
  active skill aim exists. Nearby allied towers are blue; enemy towers orange,
  becoming pulsing red when the player enters their actual radius.
- Rendering reads live player/tower ranges every frame. The inherited combat
  contract is **center-to-center** distance; visuals do not add collision radii.
  Radii independently constrain path clearance and minimum separation.
- Files: `src/simulation/ranges.js`, `src/rendering/range-visuals.js`, `world.js`,
  `lane-view.js`, `src/ui/targeting-controls.js`.

### 4. Persistent smart basic attacks
- Main Attack/Space/ground command chooses heroes first by default, then eligible
  fallback categories. Minion and tower buttons use strict category filters, never
  replacing a desired minion with a nearby hero. Manual clicks pin eligible foes.
- Commands approach, stop within actual attack validation, and repeat at the
  existing authoritative cooldown/animation interval. They do not teleport,
  increase firing speed, reduce damage or bypass collision validation.
- Bounded A* waypoints are swept against world boxes and actor circles, then
  executed by the unchanged movement controller. Invalid/dead/out-of-search or
  unreachable targets cancel or reacquire according to automatic-switch settings.
- Nearest/current HP/HP percentage, main category priority, smart basic enable,
  automatic switching and manual pin clearing are live simulation settings.
- WASD/joystick, death, explicit clear, skill aiming, accepted casts/utilities and
  input resets cancel approach. Initial search is attack range + 10 world units;
  origin leash is 1.7x that radius, configured in `COMBAT_DEFAULTS`.
- Low-level `attack()` remains the single authoritative attempt for NPC/shared
  combat and numerical regression fixtures; `requestAttack()` owns persistent
  player command intent. Practice may turn Smart Basic off for single attempts.
- Files: `src/simulation/attack-command.js`, `hero-combat.js`,
  `src/match/simulation.js`, `src/runtime.js`, `src/ui/hud.js`,
  `targeting-controls.js`, `settings-panel.js`.

### 5. Directional skills
- Hold a skill or its rebound key to open the aiming wheel and actual-range sight.
  Drag displacement from the press origin determines world direction through the
  current camera's ground-plane basis. Circular orb placement uses stick travel;
  directional shots use maximum range. A tap still uses configured smart targeting.
- Release validates through existing mana, cooldown, target and animation rules.
  Directional manual shots cannot be hijacked into automatic homing. Escape,
  right-click, cancel area, pointer cancellation/reset, and switching panels cancel
  stale aim without spending mana/cooldown. Fresh casts remain usable over the
  existing non-modal panels; editor and native focused-button key safety remain.
- Shape adapter supports projectile, line, circle, cone, self-area and targeted
  sights. Actual Layla skills are projectile, orb/circular placement and line;
  existing spells provide self-area and targeted execution. Cone geometry is an
  adapter/fixture extension, not a newly invented live ability or new hero skill.
- Files: `src/input/directional-aim.js`, `skill-gestures.js`,
  `src/rendering/aim-sight.js`, `src/simulation/hero-combat.js`,
  `src/match/simulation.js`, `src/spells/system.js`, `src/ui/panels.js`.

### 6. HUD
- Battle Spell/Regen show a translucent black icon mask and readable countdown
  from actual ready-at times. Recall has no invented cooldown: its real channel
  receives the same darkened treatment and remaining channel time.
- Removed routine gold/XP/equipment-purchase feed announcements and repeated
  ordinary lock/cooldown attack notices. Kill/death, objectives, results, respawn
  and genuine rejection/system feedback remain.
- Files: `src/ui/utility-cooldowns.js`, `utility-hud.js`, `spell-hud.js`,
  `match-hud.js`, `styles/combat-cluster.css`.

### 7. Shop and build priority
- Lane-mode Quick Buy prominently shows the useful affordable missing component, its icon
  and actual price; the final expensive goal is secondary text. Among affordable
  sub-items the largest useful recipe value wins; if none is affordable the least
  expensive missing component appears disabled with the genuine rejection reason.
- Recommended lists the saved purchase order, skips completed entries, and advances
  after actual equipment acquisition. A manual item overrides until completed;
  Resume saved build restores the sequence. Clear pauses suggestions until resume.
- Simple retains completed browsing; All retains all 45 entries/search/categories.
  Trees show prices, owned credit, remaining cost, next component, and covered
  descendants of owned upgrades without granting double credit.
- Purchases use existing atomic quotes/automatic slots, six-slot capacity, component
  consumption, one-copy/one-boots restrictions, stat/passive refresh and explicit
  sale. Failed purchases never deduct gold; full-slot valid upgrades still combine.
- Files: `src/match/build-priority.js`, `recipes.js`, `simulation.js`,
  `src/ui/match-shop.js`, `styles/match.css`.

### 8. Visual consistency and VFX
- Preparation/Profile use reference-inspired blue/gold side navigation, compact
  hero/build rows and scrollable content, with landscape adaptations.
- Spell grid/detail view retains the previous detailed cards as an explicit option.
- Combat VFX adds additive projectile halos, layered beam core, expanding impact
  rings and short directional sparks. Effects are read-only events/state, bounded
  to 160 transients; they cannot change damage, range, movement or timers.
- Approved GLB, creation image, hero stats, three skills, spells/items, maps,
  animations and camera are preserved.

### 9. Saves and offline workflow
Existing identity, wallet, account-XP, preferences and key formats are unchanged.
New optional per-player extensions:
- `moba-lab.builds.v1:<encoded username>`: validated hero builds/selected ID.
- `moba-lab.history.v1:<encoded username>`: up to 100 actual completed records.
- `moba-lab.reset-backup.v1`: last explicit current-player reset recovery snapshot.

Malformed/outdated extensions fall back safely without overwriting the wallet.
Unavailable storage remains session-only. No browser-origin, Windows-wide, cloud,
server anti-cheat or permanent-save guarantees. Backups may remain in local storage
until replaced; restoring one restores that snapshot. Reset does not erase browser
settings or unrelated users. The HTML and source ZIP workflow is unchanged.

## Validation — complete

- **576/576 unit tests PASS**, zero failures/skips (baseline 555, 21 added).
- **14/14 browser suites PASS**, **205 checks**. This includes 20 new native
  polish checks, preserved numerical/targeting/input tests, source-ZIP isolated
  offline launch, all 12 spell/catalog flows, 45-item shop/recipes, loading/selection,
  owned/profile/save/reset/recovery, and a naturally completed Brawl whose actual
  result is recorded once and shown in Profile. Quitting replay adds no record.
- Production build, both registered-hero asset checks, standalone dependency
  validation and `git diff --check` PASS. Expected build-only large-chunk warning:
  this is intentionally one offline bundle, not a network-loaded code split.
- All four HTML copies match. Actual `file://`, offline networking, normal origin
  security; no unexpected JS errors, browser warnings or external asset requests
  in the offline interaction checks.

Full commands/check names: `game-polish-browser-suites.json`,
`game-polish-browser-output.txt`, `game-polish-unit-output.txt` and
`game-polish-verification.json`. Counts are latest successful checks per suite,
not the sum of repeated phase attempts. Initial failures/corrections are retained
in the verification report; none are silently counted as passed.

Per-phase unit totals: 557, 560, 561, 564, 567, 568, 571, 571, 574; final integration
adds two aiming checks for 576. Per-phase native browser checks grew from 4 to 20.

Regression adaptation policy: no numerical unit test was removed or relaxed.
Historical exact-hit Practice/Batch-1 fixtures explicitly turn Smart Basic off
through real Settings. Batch-1 restores it for persistent minion/tower commands,
asserts honest out-of-search rejection without hero fallback, walks into valid
search range, and requires actual strict-category shots. Existing damage, cooldown,
collision, resources and animation-lock checks remain. Older absolute-mouse
gestures use relative wheel input; panel switching cancels stale aim. Recommended-
unavailable and always-leaf-first assumptions are updated to requested behavior.

Initial overlap caused a real-time timeout on an unchanged simulation-time wait;
final suites run sequentially. A real off-viewport lobby spell shortcut was fixed
and rerun natively. New natural-history text matching was corrected for uppercase
results. Source-ZIP prerequisites/filename and bounded-search fixtures were fixed.
No game clock acceleration, state-injection victory or weakened boundary assertion
was used. Source-ZIP HTML is tested in an empty spaces/Unicode path.

## Known limits and manual Windows/device checks

- Only Layla is currently playable/owned. Build and portrait systems are modular;
  this task adds no additional hero, skin, skill, functioning Emblem or ranked mode.
- Recipes are labeled editable prototypes, not certified official patch recipes.
  Existing jungle/blessing/trap absences and separate dummy Practice spell limits
  remain as documented in `SHOP_AND_BATTLE_SPELLS.md`.
- Navigation is bounded local grid steering, not a strategic global navmesh or
  tower-avoidance AI. Complex or dynamically blocked paths can cancel clearly.
- Hero statistics cover the retained local history (100 matches), not fabricated
  lifetime records from older versions. No AFK/ranked ratings are invented.
- The visual hierarchy follows the references using original assets, not a
  pixel-for-pixel reproduction of proprietary art. Small clustered hero markers
  and bodies may still overlap in dense fights.
- Verify on Windows Chrome/Edge: double-click standalone with Wi-Fi disabled;
  first-run and reload saves for the same file path; build selection/quick buy;
  real mouse/key bindings and hardware WebGL; reset/cancel/restore; audio after a
  real gesture; resize, fullscreen/DPI and alt-tab. Test actual Android/iOS touch
  separately. Linux software WebGL and emulated touch are not physical-device or
  Windows certification. File-origin storage can differ by browser/path/settings.

## Deliverables and integrity

- `deliverables/MOBA-Lab-Game-Polish.html` — copy alone and open offline.
- `deliverables/MOBA-Lab-Game-Polish-source.zip` — editable source, tests, docs,
  lockfile and the byte-identical playable root index; no dependencies/references/
  test screenshots/Git/duplicate builds.
- `deliverables/SHA256SUMS.txt` and `game-polish-integrity.json` — exact final
  artifact hashes and archive audit (outside the ZIP to avoid self-hash recursion).
- `GAME_POLISH_CHANGED_FILES.md` — rationale and exact changed-file list.

Standalone HTML SHA-256: `3de33668607e96d6fae4782d3c30b3077d964aaf92c45921996f2868e9aff0e8`.
GLB: `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
Creation PNG: `bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1`.

Only the approved recoverable local checkpoint was made; no subsequent delivery commit or push. Stop after this complete milestone for review.
