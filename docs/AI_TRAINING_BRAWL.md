> Superseded in part by [ROSTER_EQUIPMENT_FOLLOWUP.md](ROSTER_EQUIPMENT_FOLLOWUP.md): editable rosters, real Layla Computers, timed selection/loading, new shop/catalog, utilities, skill queue and lane orientation. Counts below belong to the prior completed expansion.

# Connected AI Training and Brawl — implementation report

2026-10-18 · branch `arena/55ce0f80-mobile-legend-lite` · expands the historical Phase-1-only milestone with the user's explicit authorization. The expansion was delivered for review first; the user subsequently authorized committing and pushing it to this same branch.

## Play

Open **root `index.html`** (or the identical `deliverables/MOBA-Lab-Phase-3.html`) in a WebGL2-capable Chrome/Edge browser, including with networking disconnected. The historical artifact filename is kept for packaging compatibility, not feature numbering.

1. Create/continue the existing local profile. Account starter wallet remains **30,000 coins / 0 diamonds**, granted once, and Layla stays owned.
2. Main Menu → **MODE → AI TRAINING ROOM** → choose **PRACTICE / VS A.I. / CUSTOM / AI TRAINING**. Alternatively MODE → **BRAWL**. Classic and Ranked are disabled, not redirects.
3. The local room shows the saved player and COMPUTER slots. Default is **Normal**, one player + four allied bots vs five bots. Easy/Normal/Hard change actual decisions; Practice truthfully disables difficulty because its targets are stationary. CUSTOM supports 1v1, 3v3 or 5v5. Back returns without starting a simulation.
4. **START GAME** opens hero selection, not combat. Select the only playable **Layla** card, then **OK / CONFIRM**. Upcoming cards are disabled. The original approved GLB is reused, not replaced.
5. VS / loading reports seven completed **local preparation tasks**. There is no internet/ping claim. Failures show a reason and Retry / Back. Lane modes then show **3–2–1–GO** before the match clock and simulation advance.
6. **WASD** moves relative to the camera; coarse-pointer devices also get the drag joystick. **Space / left click** uses the existing no-chase basic attack. Click an enemy to pin it; ground click uses automatic targeting. **1 / 2 / 3** retain existing tap/hold/aim/release/cancel and rebindings in Settings.
7. Spend points with the small **+ at the top-right of each skill**. Rank-zero icons darken; no UNLEARNED overlay or far-left upgrade row. Ultimate ranks still require levels **4 / 8 / 12**. Upgrades do not cast.
8. **SHOP** spends only match gold. Inspect an item, choose a free slot or replacement slot, and Purchase. Click an equipped item in the shop to sell at **60%**. Six slots, one copy per item. Buying/selling recomputes effective stats; opening the shop gives no gold. Equipment icons on the HUD open the relevant shop slot.
9. Move up the single lane behind allied minions. Destroy **enemy outer tower → inner tower → core**. Protected objectives cannot be damaged by player abilities, bots or projectiles. Enemy core destruction wins; your core's destruction loses.
10. **Pause / Quit** freezes the match and offers Resume / Leave to room / Main Menu. The tab also auto-pauses when hidden/unfocused. A dead player gets an actual respawn timer. Results show combat-derived values and Play Again / Room / Main Menu. Replay requires hero confirmation again and initializes a fresh match.

**PRACTICE** is the preserved separate three-dummy sandbox: level 1, no minion waves, towers, competitive result or kill XP/gold. It has the existing stat/level/XP/resource/reset tools and a resumable Exit Practice confirmation. **AI TRAINING** and CUSTOM have labeled testing tools; VS A.I. and BRAWL expose live attributes without level/XP/resource cheats. Reset arena in AI Training restarts the match, including waves, inventory, objectives and countdown.

## Implemented systems and architecture

| Responsibility | Source of truth |
|---|---|
| Existing profile, account wallet, audio, menu navigation | existing `src/menu/`, `src/audio/`; extended `application.js`, `navigation.js` |
| Guarded prematch selection/config/roster/screens | `src/menu/match-flow.js`, `match-screens.js`, `match-flow.css` |
| Mode-aware new entry, preserved sandbox entry | `src/match/start.js`, `src/gameplay.js` |
| Owned RAF / fixed clock / pause / listener abort / renderer disposal | `src/runtime.js`, `src/core/events.js` |
| Validated original map, modes, AI tuning, original items | `src/data/match/*.json`, `src/match/config.js` |
| Team-aware authoritative match updates, damage, XP/rewards/deaths | `src/match/simulation.js`; reuses `HeroCombatSimulation` and existing stats/progression/damage |
| Eligibility / team / protection / range / cooldown guards; seeded RNG | `src/match/actions.js` |
| Decision intents and tower target policy | `src/match/ai.js` |
| Deterministic numbered waves | `src/match/waves.js` |
| Sequential objective protection / respawn / result snapshots | `src/match/objectives.js`, `respawn.js`, `results.js` |
| Atomic six-slot transactions / modifier aggregation | `src/match/equipment.js` |
| Original continuous 3D causeway / procedural placeholder geometry | `src/rendering/lane-view.js`; dynamic world, minimap, labels and combat VFX |
| Match readouts / pause / countdown / real shop | `src/ui/match-hud.js`, `match-shop.js`, `styles/match.css` |
| Skill-wrapper badges / PNG controls / overhead identity and resources | existing `hero-skills.js`, `progression.js`, `hud.js` |
| Original local PNG authoring (development only) | `scripts/create-combat-art.py`, `src/ui/assets/*.png` |

Rendering, meshes and DOM do not schedule waves, choose winners or calculate damage. One simulation owns actors, resources, cooldowns, projectiles, deterministic reward events and objectives. Player basics still use the approved accelerated **same Shoot clip**, locked for their actual interval; skills retain their existing **1.05-second** locks and unchanged GLB clips/materials.

Each gameplay entry owns one AbortController, fixed clock, RAF, renderer, HUD and event bus. Quit/results cancel the RAF, abort window/document/canvas input listeners, unsubscribe match audio/preference controls, detach and retain the approved shared hero, and dispose only scene-owned geometry/materials/renderer. Menu return creates a new presentation renderer with that **same visual instance**, not a second GLB parse. Profile, wallet, global audio engine and shared hero data survive.

## Explicit original prototype balance

These are **not official MLBB parity values**. Layla base/growth and defense formula retain the user-provided version-sensitive reference table. Existing active-skill/XP tuning and all new map, AI, bot-ability and equipment balance are reconstructed/original editable prototype choices. No independent current wiki verification was possible under the environment's host restrictions. User references: Layla / Physical defense / Damage / Attack speed / Turret pages on mobile-legends.fandom.com. No reference screenshot, ripped map, texture or remote runtime URL is shipped.

### Map / objectives / resources

- **Crystal Causeway:** world half-size 36; traversable continuous lane roughly z ±7, collision banks/scenery, blue/red spawn x −33 / +33. Explicit display→world conversions remain in Layla's definition.
- Both teams: outer tower at x ±12 (**3,600 HP**, 55 PD / 40 MD), inner at x ±22 (**4,200 HP**, same defenses), core x ±30 (**6,500 HP**, 65 PD / 40 MD).
- Towers: **220 raw physical damage**, core **260**; range **8**, interval **1.1 s**, actual traveling homing shots. Minions normally take priority; a valid attack on an allied hero under tower range creates **3 s retaliation**. Dead/protected/invalid targets are rejected/retargeted. Protected inner/core still defend their area; protection is not a visual-only flag.
- Respawn delay **8 + 0.6 × current level seconds**; spawn protection **4 s**. Dealing damage ends your protection. Own spawn within radius 3 restores **180 HP/s + 50 mana/s**. It is a local spawn effect, not global healing.
- Player level-one **2,250 HP**, level-fifteen **4,378 HP**; existing mana, growth, regen, attack-rate cap, defense `120 / (120 + effective defense)` and true-damage bypass are reused. Crit/lifesteal do not double-run ability damage. Structures do not get Layla's distance passive.
- Lane minions: first wave at match time 0, then every **18 s**, **3 per team**, 650 HP, 12 PD / MD, 60 physical damage, speed 2.8, range 1.8, attack interval 1.2 s. Each numbered wave emits exactly once; corpses are removed after 1.2 s. Wave spawn points are explicit data; the configured per-team route references the opposite outer/inner/core IDs, resolving their waypoint coordinates from the objective definitions. Bot homes/retreat/respawn also use configured spawn coordinates.
- Modes: Practice **level 1 / 0 match gold**; AI Training, VS A.I., Custom **level 1 / 350 gold**; Brawl **level 3 / 800 gold**. These starts are separate data, not account grants.

### Rewards

- Minion death: **80 XP** to living allied heroes within radius **12**, **30 gold** to the human only on their last hit.
- Hero death: **250 XP** to nearby living allies, **180 gold** for the human last hit. Actual hero kills/deaths update team/player counters; minions and structures do **not** count as hero eliminations.
- Tower destruction: **120 XP + 100 team gold** for the human's team (XP to living team heroes); a core ends the match and gives no additional currency. Every reward is tied to the authoritative once-per-death event, never shop-open or animation events.
- Assists count a recent real player contribution in the last **8 seconds** when an ally eliminates that enemy hero. No separate assist gold is configured. No fabricated damage-share/tank/healing/MVP statistics.
- XP uses the existing deterministic thresholds, cap 15, overflow policy, 15 total points and 6 / 6 / 3 skill caps. Natural leveling keeps ranks and numerical resource deficits. Dead heroes do not silently revive from XP.
- Match gold, inventory and results are never written to the account wallet or ranked progression.

### Training Bots / difficulty

All NPC hero slots are clearly named **Training Bot** placeholders. They use original low-poly geometry and explicitly reuse Layla's published base/growth table as a temporary reference **without becoming selectable heroes**. No fake catalog or extra playable hero kit is registered. They move, defend/advance, detect targets, attack, use a generic original ranged pulse, spend mana, respect cooldowns/HP/defenses/protection/stun/death, retreat, heal at their own spawn, respawn and resume objectives.

| Difficulty | Decision delay | Pulse aim spread | Aggression | Retreat HP | Target policy |
|---|---:|---:|---:|---:|---|
| Easy | .8 s | ±2.3 units | .65 | <40% | nearest |
| Normal | .4 s | ±1 unit | .85 | <28% | distance + HP ratio |
| Hard | .18 s | ±.3 units | 1 | <20% | nearby hero threat |

Same raw attack/ability stats across all difficulties: **no secret damage/HP multiplier**. The pulse has range 7, costs 45 mana, cooldown 7 s, raw physical damage `180 + .6 × PA`; attack intent engages within basic range 5. Retreat has hysteresis until 80% HP, so bots do not oscillate every frame. These are simple deterministic local policies, not an official champion AI, pathfinding network or learned model. Bot equipment shopping and complex team coordination are not implemented.

### Six-slot equipment

| Original item | Cost | Effect |
|---|---:|---|
| Prism Edge | 300 | +30 physical attack |
| Clockwork Spring | 280 | +20% attack speed |
| Fortune Lens | 350 | +20% critical chance on basics |
| Bastion Plate | 300 | +25 physical defense |
| Aether Ward | 300 | +25 magic defense |
| Crystal Heart | 400 | +500 max HP |
| Wayfarer Boots | 250 | +10% movement speed |
| Sanguine Fang | 450 | +15 physical attack, +12% basic-hit lifesteal |

One copy per item, six slots; floor(cost × .6) sale/replacement refund. Recompute modifiers from the complete current inventory after every transaction—no repeated additive bonuses. Max-HP purchases do not heal; sale caps existing HP rather than killing via a numerical max-delta. Crit chance capped at 100%, lifesteal at 50%; critical multiplier comes from existing hero attributes. Lifesteal uses actual HP removed (no overkill healing) and excludes abilities. No inventory is written to persistent storage. Icons are authored local PNGs, shared where appropriate, not an official item-art set.

## Visual corrections

- Each skill owns a `.skill-control` wrapper; its sibling + is `position:absolute; top:-9px; right:-9px`. The skill's inner button remains relative to that wrapper. Existing attack/utility positions were not moved to disguise badge errors.
- Only legal upgrades are shown; one point/rank is spent by the authoritative progression system. Pointer down/up/click and keyboard activation do not leak into casting/attack.
- Local PNG skill/Recall/Regen controls replace glyph-only skill art; rank-zero PNGs are darkened. Recall/Regen/battle spell remain truthfully disabled **art-only utility placeholders**, not fabricated mechanics.
- Saved username, numeric level, actual HP and mana appear over the hero. Friendly/hostile health bars, protected-objective indication, dynamic actors and minimap markers follow simulation data. Small non-selected minions/bots use compact bars to avoid a starting-spawn pile of full text labels.
- Lane environment and bots are original procedural 3D geometry, not final environment/character art. The existing dummy Practice map/config is retained separately.

## Verification

Baseline before edits: **290/290 unit tests passed**. Current unit results, browser results and packaging hashes are recorded in the companion verification summary below after execution, not inferred from old Phase-1 evidence.

- `npm test` includes the original regression suite and new match/lifecycle tests for configuration/guards/countdown/waves, target protection, tower/minion/AI behavior, rewards/death/respawn, item transactions and actual basic crit/lifesteal integration, paused commands, and a complete deterministic unattended core result.
- `npm run test:browser:match`: actual root file://, offline networking, connected prematch, loading tasks, live shop, responsive badge geometry, pause/exit, separate Practice, Brawl, real unattended core result, fresh replay/model reuse, joystick, no runtime requests/errors.
- Historical menu/polish/hero-browser tests now explicitly select **Practice through the new prematch flow**, retaining their original profile/asset/audio/sandbox assertions. Classic/Ranked's disabled guard remains. Only the obsolete terminal-navigation/direct-entry expectations were updated for the authorized lifecycle; combat regressions were not removed or weakened.
- Existing progression/Layla/panels/foundation tests continue using their explicit direct regression URLs. That bypass is not normal menu navigation or another selectable hero.

### Limits / review notes

This is a playable local prototype, not official MLBB, polished production bot AI or online multiplayer. Only Layla is playable. Bot and environment art are temporary; bodies do not implement unit-to-unit collision or team tactics. Bot/minion bodies can visually overlap one another; crowd separation/art polish is not implemented. Screenshot review moved both configured hero spawns two units behind their previous positions, clear of the nearby core, without changing that core or the approved hero art. Full Classic/Ranked, multiple lanes, additional heroes, matchmaking/accounts/networking, skins, monetization, ranked rewards and working utility spells are out of scope. Buy/sell is a small original prototype set, not an official shop/build tree.

Linux Chromium software-WebGL offline checks and touch **emulation** are not native Windows/Edge certification, physical multitouch certification or a real-speaker listening test. File-origin storage depends on browser/location and can fall back to session-only. A single-file Three.js bundle intentionally produces Vite's chunk-size advisory. Graphics creation failure shows Retry / Back. A thrown render/runtime error stops the loop with a visible recovery message and Quit access. Automatic recovery from an actual lost GPU context is not implemented or certified.

Review was completed before the user subsequently authorized updating this same branch.

### Rendering / test-run corrections

The new lane uses instanced identical floor tiles and deliberately avoids a second dynamic shadow pass, keeping its original volumetric geometry/materials/light while reducing software-WebGL cost. This does not alter Practice rendering, model bytes, collision or combat timing. Normal fixed-step time is not accelerated for tests.

An initial connected offline run reached a genuine **Defeat at 6:55** with no errors/requests, but its test expected title-case text while the designed results heading uses CSS uppercase; that assertion was corrected to be case-insensitive. That incomplete run is not counted as a full browser-suite pass. The final run also uses trusted Chromium touch events rather than unsupported synthetic pointer capture. Final suite counts below refer only to completed successful runs.

The historical Layla HUD-position assertion initially exposed an extra available-points row; the production panel was corrected by placing points inline with XP, retaining the original assertion and attack/utility positions. A multi-context touch menu run also timed out while its test tab was not foregrounded; the prematch test helper now explicitly brings the real tab forward and waits for real simulation time (with cold-software-WebGL allowance), without bypassing gameplay pause or loading.

## Final executed verification — 2026-10-18

| Command / suite | Passed |
|---|---:|
| Baseline `npm test`, before expansion | 290 / 290 |
| Final `npm test` | **333 / 333** (43 new match/lifecycle checks) |
| `test:browser:progression` | 10 |
| `test:browser:layla` | 19 |
| `test:browser:panels` | 16 |
| `test:browser:menu` | 11 |
| `test:browser:polish` | 13 |
| `test:browser:heroes` | 9 |
| `test:browser` foundation / HUD / input | 50 |
| Final `test:browser:match` | **10** |
| Final `test:browser:recovery` | **5** |
| **Browser total** | **143** (128 retained + 15 connected/recovery) |

The final match suite ran the **exact SHA-256-identified deliverable**, after the configured spawn correction. No accelerated game clock or simulation mutation was used. Its actual unattended Brawl ended **Defeat, 6:47, level 4, 0 eliminations / 0 deaths / 0 assists, 100 match gold earned, 1 enemy structure destroyed**. Those values are observations of that deterministic run, not fabricated defaults, balance promises or player achievements. Replay reset the match and required hero confirmation; Main Menu reused the same approved GLB. Final connected tests recorded zero JavaScript errors, warnings or runtime asset requests. Recovery deliberately denied the world WebGL context twice: four expected graphics-error log entries, **zero unexpected errors**, working Retry and Back, then trusted touch with non-modal Shop and native keyboard + activation without casting.

`validate:heroes`, `validate:offline`, build and source packaging passed. Root, dist and named HTML are identical; the archive's root index is byte-identical and works without sibling assets. Dependency directories, duplicate builds, test screenshots and user reference screenshots are excluded. The single-file Vite size advisory is expected, not a failed build.

Visual review inspected hero selection and all three requested landscape HUD sizes: **1280×720, 960×540, 844×390**. The approved hero is no longer occluded by its starting core. Wrapper-relative skill badges remain adjacent at the upper-right; HP/mana numbers stay on one line. Dense world labels and temporary NPC bodies can still crowd one another; no crowd-separation/art-polish certification is claimed.

### Evidence and reproducibility

- `docs/match-baseline-unit-output.txt`, `match-unit-output.txt`, `match-unit-results.json`: actual baseline and final unit runs.
- `docs/match-regression-output.txt`, `match-regression-browser-results.json`: actual outputs/checks for all 128 historical browser regressions.
- `docs/match-connected-output.txt`, `match-browser-results.json`: final connected run, observed results and tested HTML hash.
- `docs/match-recovery-output.txt`, `match-recovery-browser-results.json`: final recovery/input run and explicitly expected fault logs.
- `docs/match-verification.json`: machine-readable summary and approved asset hashes.
- `docs/AI_TRAINING_BRAWL_CHANGED_FILES.md`: complete changed-file inventory.
- `deliverables/AI-TRAINING-BRAWL-SHA256.txt`: final HTML and source-archive checksums (generated after packaging; deliberately outside the archive to avoid a circular checksum).

Run `npm ci`, `npm test`, `npm run package:source`, then the nine browser commands above. Browser automation uses the pinned Linux Chromium helper and software WebGL; allow time for honest full match completion. Normal play requires only the HTML, not npm or a server. The expansion was initially left uncommitted for review. The user subsequently authorized updating `arena/55ce0f80-mobile-legend-lite`; this authorization changes delivery status, not gameplay scope.
