> **Current review follow-up:** editable Computer rosters, timed hero selection/actual team loading, 37 Attack/Movement items in the restored wide shop, queued skills, Recall/Regen and flipped improved lane. See [docs/ROSTER_EQUIPMENT_FOLLOWUP.md](docs/ROSTER_EQUIPMENT_FOLLOWUP.md). This follow-up is uncommitted pending review.

# MOBA Lab — offline AI Training and Brawl

A modular local 3D MOBA prototype with **connected rooms → Layla selection → honest local loading → single-lane AI gameplay → results/replay** and a separate preserved dummy Practice sandbox. Only Layla is playable; Training Bots and the original causeway are explicitly temporary geometry. Classic/Ranked, online play and monetization are not implemented.

Read the current [AI Training / Brawl report](docs/AI_TRAINING_BRAWL.md), [changed files](docs/AI_TRAINING_BRAWL_CHANGED_FILES.md), and [PROJECT_RULES.md](PROJECT_RULES.md). The approved GLB and creation PNG remain byte-identical. Historical Phase-1/menu reports describe earlier milestones, not the current feature boundary.

## Play offline on Windows

Extract this branch's source ZIP and double-click the root **`index.html`**. That file is the complete game, not a development template. Alternatively download **`deliverables/MOBA-Lab-Phase-3.html`**, which has identical contents. Either HTML can be copied alone to an empty folder.

1. Disconnect networking.
2. Double-click the HTML. If needed, choose **Open with → Chrome or Edge**.
3. Confirm it opens as `file:///…/index.html` (or the named standalone file).
4. Create a local username (4–20 letters/numbers/underscores), select PH/US/JP and Male/Female, then Continue. A valid saved profile skips creation on later same-file launches when browser storage is available.
5. Choose **MODE → AI TRAINING ROOM → PRACTICE / VS A.I. / CUSTOM / AI TRAINING**, or **MODE → BRAWL**. Classic and Ranked are disabled. Set real AI difficulty in the local room (Normal default); Custom also configures team size.
6. **START GAME → select Layla → OK / CONFIRM**. Seven actual local setup tasks finish before countdown/gameplay. No combat starts merely by opening a room or selection.
7. Use **WASD / touch joystick**, **Space / left-click basic attack**, **1/2/3** skills; existing aiming, cancellation, targeting and rebindings remain. Spend legal skill points with the **+ beside the top-right of each skill**, not a separate upgrade row. Ultimate gates remain levels 4/8/12.
8. In lane modes, follow real waves, fight bots, buy/sell original items with **separate match gold** in six equipment slots, and destroy **outer tower → inner tower → core**. Core destruction gives Victory/Defeat and actual results. Dead heroes respawn. Pause / Quit provides safe room/menu return; replay starts fresh through selection.
9. Practice keeps the existing reward-free three-dummy map and testing/reset/exit controls. AI Training/Custom also have testing tools. VS A.I./Brawl have no level/XP/resource cheats; Brawl starts at level 3 / 800 match gold, AI scenarios at level 1 / 350. Account coins/diamonds never fund or receive match purchases/rewards.

The creation screen uses the supplied transparent anime PNG. Lobby and mode selection use the existing approved 3D GLB; the same model instance transfers to gameplay. Local persistence was checked at offline file:// on Linux Chromium; moving/renaming the HTML or using another browser can change its storage scope. If blocked, a session profile still works. No online account is created.

No server, Node.js, npm, sibling assets, or internet is needed to play. Requires a modern browser with **WebGL2**/graphics acceleration. Linux Chromium offline file:// verification is documented in the current report; Windows-specific verification remains manual. See [the current controls report](docs/COMBAT_CONTROLS.md).

## Controls

- **WASD**: camera-relative movement/collisions with normalized diagonal speed. No on-screen joystick. An accepted basic pauses movement for one calculated attack interval (0.9434s at level 1; 0.7463s at level 15), using faster playback of the same Shoot clip. Skills retain their full 1.05s lock; held WASD resumes automatically afterwards. Targeting never chases.
- **Mouse**: ordinary hover does not rotate the hero. While holding a skill, move the pointer to aim the sight. Otherwise facing follows movement or the active shot.
- **Left-click ground** or the **large Basic Attack HUD button** or the **configured attack key (default Space)**: attack the selected target, subject to range, cooldown and alive/animation state; the ranged shot locks to that enemy, homes through obstacles and other enemies, and damages only on authoritative contact.
- **Left-click a living dummy**: pin that enemy as a manual override and attempt one attack. Further ground/HUD attacks keep that pin.
- **Target priority** (Settings → Controls only): change selection policy and release any pin.
- **Clear lock** (Settings → Controls): release the pin without changing modes or resetting cooldown.
- **Minimap buttons**: toggle the live map and its attack-range overlay (not the world range ring).
- **Shop**: open the centered landscape empty-slot equipment panel. Category selection and All equipment / Simple view change only the interface; purchases do not exist.
- **Settings**: centered original landscape panel with Basic / Controls / Interface tabs. Basic offers reduced HUD motion and shared audio controls (also reached via the Audio shortcut); Controls contains target priority, Clear lock and **Customize key controls**; Interface offers **Show button key hints**. Choose single-key shortcuts for attack, skills, utilities, target priorities, reset/clear lock, panels and map controls. Unbind keys or restore defaults; duplicate assignments are rejected. WASD/mouse stay fixed. Both panels are non-modal: WASD, attacks and skills stay active on the exposed battlefield/HUD. Opening/closing preserves held movement and skill aim. Escape cancels aiming first, then closes the panel; X or the trigger also closes it. **Audio and reduced motion save locally when storage is available; combat targeting, key bindings and button hints remain session-only.**
- **Reset arena**: restore player, all dummy starting HP/max HP, positions, mode, selection, pin, cooldown, mana, projectiles, marks, stuns, buffs and hit count.

One click/Space requests one attack; this is **smart target selection, not continuous auto-firing**. Leaving the browser window pauses simulation and clears held input. **Exactly three skill slots:** top-row **1 = Skill I, 2 = Skill II, 3 = Ultimate** (physical `Digit1/2/3`, not numpad or F keys). These are the defaults; Settings can rebind them, including to Q/E/R or numpad keys. **Once learned, these three buttons are functional for Layla:** 1 Malefic Bomb, 2 Void Projectile, 3 Destruction Rush. **Tap a button/key to auto-target by Settings priority and that skill’s range. Hold for 180ms to preview a sight, move the pointer, then release to cast. Escape, right-click or release over the visible CANCEL area cancels without cost/CD.** An enemy under the released sight is locked; otherwise the skill is freely aimed. Auto/locked S1 and S2 home; the ultimate follows its locked enemy until firing. No eligible tap target means no cast/spend. F battle spell, B recall, **V Regen**, equipment and quick-buy also remain reserved.

Accepted attacks/casts intentionally freeze actual movement for the complete adjusted/original Shoot animation respectively, not because of button focus. Held WASD remains recorded and resumes afterwards; rejected requests do not add a lock. **Shop and Settings do not block WASD, basic attacks or skills.** Focused key-binding/select editors keep their combat keys; text entry suspends movement too. Panel transitions do not clear held keys or cancel aim. The settings priority choices control the shared simulation rules; they do not add auto-chasing.

Routine attack/movement hint banners are removed. World target HP, range/cooldown indicators and genuine training-elimination announcements remain. The shop contains **only empty slots**: no item art, names, prices, stats or purchasing logic.

## Targeting rules

| Mode | Policy for eligible in-range enemies |
| --- | --- |
| Nearest Enemy | Lowest ground-plane center distance |
| Lowest Current HP | Smallest absolute current HP, then distance |
| Lowest HP Percentage | Smallest current HP / max HP, then distance |
| Manual Target | Click an enemy to pin it; without a valid pin, nearest in-range fallback |

All ties finally use stable ID ordering. Only living, targetable enemies with valid coordinates/HP qualify. Automatic selection considers only units within the inclusive **6m center-to-center basic range** (temporarily 8m after S1 hits). With none available, it rejects attacks without consuming cooldown or moving the player.

A valid manual pin overrides every mode, even if it is out of range. Such attacks are rejected; it never chases or silently switches away from the pin. Death, removal or invalidation releases the pin and immediately applies the current mode's fallback. Changing modes or clearing the lock also releases it. Clicking a dead dummy never attacks some other enemy accidentally.

The selected enemy has a **gold ground ring and gold HP-label outline**. Every dummy shows its current and maximum HP. The duplicate side card is removed; priority and Clear lock live in Settings.

### Training setup

Press **D** from spawn to approach the cluster (stop before colliding with A). At approximately **player (-1.5, 1.5)** all three are in range and each automatic mode picks a different enemy:

| Dummy | Position X/Z | Starting HP / max HP | Ratio | Mode winner at test position |
| --- | --- | --- | --- | --- |
| A · Sentinel | 0 / 0 | 2000 / 2000 | 100% | Nearest |
| B · Wounded | 3 / 1 | 900 / 1200 | 75% | Lowest Current HP |
| C · Bulwark | 2 / -3 | 1200 / 4000 | 30% | Lowest HP Percentage |

Reset restores these **starting** HP values, not full health for B/C. The Layla-only practice configuration multiplies the historical targets' HP by 10 and explicitly gives each 15 physical / 15 magic defense; positions, ratios, collisions and targeting stay unchanged. It is **not** the future dedicated TrainingRoom/map phase. The historical `?hero=training` fixture retains exactly 200/200, 90/120 and 120/400 with its old combat rules.

Layla starts with 2250 HP / 500 mana / 133 physical attack. Level 15 gives 4378 HP / 1900 mana / 252 PA / 71 PD / 50 MD / 1.34 attacks per second. Levels use `base + growth × (level − 1)`. Display movement 240 and range 4.3 convert explicitly to world speed 5.5 and range 6. Basics use 100% PA; rank-based skills use the documented reconstructed base + PA coefficients. Physical/magic damage use `120 / (120 + effective defense)`; true damage bypasses defense. Crit damage 2× is retained as an inactive attribute, **not implemented critical hits**.

Current/max HP and mana, level, XP and skill points are live. HP/mana regenerate at the configured per-second rate; normal level-up adds only the numerical maximum increases, not a refill. Dummies are still stationary/non-retaliating. The approved GLB still has only rigid-part Walk and Shoot, not a skeletal rig.

The latest refinement uses an original faceted attack-guard illustration with smaller minion/tower satellites, a three-skill arc, and reduced-size Recall/Regen/battle-spell buttons. All artwork is inline vector/CSS, not copied reference assets.

## Honest interface status

- **Functional:** connected local rooms/selection/loading, real one-lane waves/bots/towers/cores, actual hero team score/time/HP/mana/XP/ranks/gold, six-slot purchases/sales/modifiers, death/respawn/pause/quit/results/replay, dynamic minimap, preserved controls/settings/audio and separate dummy Practice.
- **Temporary presentation:** original procedural causeway/tower/core/bot geometry; authored local PNG controls; only the existing approved Layla GLB is a playable character.
- **Reserved/unimplemented:** Classic/Ranked/online services, additional heroes, utility Recall/Regen/spell mechanics, production bot tactics/pathfinding and an official item catalog. Disabled slots never cast fake abilities. Practice's empty shop/score placeholders remain truthful for that reward-free sandbox.

Supported landscape checks target **1280×720, 960×540 and 844×390**. Coarse-pointer input adds the real virtual joystick. Physical devices, portrait/very small windows and native Windows verification are not certified. See [the current report](docs/AI_TRAINING_BRAWL.md) for exact evidence and prototype balance.

## Develop and validate

Used Node **22.22.3**, npm **10.9.8**, Vite **7.3.7**, Three.js **0.186.1**. Modern Node 22 (22.12+) is recommended.

```bash
npm ci
npm run dev -- --port 5173
npm test                   # historical fixture + progression + match + lifecycle coverage
npm run validate:heroes    # Schema/reference/embedded-model validation
npm run build              # Build and validate the standalone game
npm run validate:offline
npm run package:source     # Rebuild then archive (zip CLI required)
npm run test:browser        # 50 historical-fixture offline checks; requires source ZIP
npm run test:browser:menu   # first/returning profile, lobby, modes and actual gameplay flow
npm run test:browser:match  # complete connected offline lane flow, real result/replay, responsive and touch
npm run test:browser:progression # real XP/ranks/stats/Practice UI and compact layouts
npm run test:browser:layla  # current tap/hold/homing/keyboard-only offline checks
npm run test:browser:panels # live movement/combat with Shop and Settings open
npm run test:browser:polish # wallet, owned hero Shop, audio, Settings and responsive offline flow
npm run preview -- --port 4173
```

The development server binds to `0.0.0.0`, accepts Arena `*.e2b.app` hosts, and serves editable **`dev.html`** at `/` and `/index.html`. Edit `dev.html`/`src/`, not the generated root index. There are no browser-facing localhost API calls.

Browser tests use development-only `playwright-core`, npm-packaged Linux Chromium, software WebGL, and the `unzip` CLI. On the minimal Linux environment, bundled NSS libraries are extracted into temporary storage. These tools are **not needed to play**. On other platforms, set `BROWSER_PATH` to an installed Chromium/Chrome executable and provide unzip as a developer prerequisite. Optional `DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser` also checks that Vite serves live source. Test prerequisites unavailable means **not tested**, not passed.

Developer regression entry: `?screen=training#diagnostics` bypasses the front end for the dedicated current-combat/panel suites; `?hero=training` retains the historical fixture. Neither shortcut is exposed by the normal UI. The new menu suite tests the real, unshortened flow separately.

## Files and packaging

- `src/heroes/layla/`: reconstructed kit JSON, verified animation mappings and byte-unchanged approved GLB.
- `src/simulation/hero-combat.js` / `skill-geometry.js`: authoritative shared cast/projectile/status/damage pipeline.
- `src/rendering/combat-vfx.js` / `src/ui/hero-skills.js`: separate read-only combat effects and capability-based skill HUD.
- `src/heroes/training/`: exact existing hero stats, empty abilities/clip mappings and unchanged placeholder.
- `src/heroes/registry.js` / `catalog.js`: validated immutable registry and eager Vite auto-discovery.
- `src/rendering/heroes/hero-visual.js`: presentation-only adapter, embedded-GLB parsing, verified clip playback/fallback.
- `src/simulation/effects.js`: allowlisted shared damage implementation; no executable JSON.
- `src/simulation/targeting.js`: pure eligibility, mode scoring, in-range filtering, deterministic tie-breaking.
- `src/simulation/game.js`: mesh-independent state, movement integration, manual pin lifecycle, validated attacks/reset.
- `src/data/training.json`: scenario hero ID/spawn, default mode, dummy IDs/positions/HP. Hero stats are no longer duplicated here.
- `src/input/`: keyboard/pointer/Space, shared skill gestures/cancellation and safe UI-focus handling; shared joystick for coarse-pointer gameplay and the training fixture.
- `src/rendering/world.js`: approved injected hero visual, temporary arena/dummies, camera, ray picking, selection and event-driven VFX.
- `src/simulation/combat-events.js`: presentation-neutral death/reset transport; no score or damage rules.
- `src/ui/`: separate layout/styles, original vector/button components, live minimap, targeting, cooldown display, match shop/settings/equipment, preserved Practice placeholders and real combat announcements.
- `tests/`: simulation, targeting and actual offline browser regressions.
- `scripts/`: inline HTML packaging, structural validation, source archive.

Vite builds `dev.html`; packaging embeds its JS, CSS, Three.js and JSON, including the Three.js MIT notice and original inline-vector HUD icons. The output is identical in:

- **`index.html`** — deliberately committed so GitHub source ZIPs play directly.
- `dist/index.html` — the only file in dist.
- `deliverables/MOBA-Lab-Phase-3.html` — named download (includes embedded GLB, PNG artwork and audio synthesis source).

No CDN, external font, external model/texture/data file, fetched JSON, service worker, decoder, or remote API is required. The >500 kB Vite chunk warning is expected because Three.js must be embedded. Hero GLBs are prepared for eager inline bundling and in-memory parsing; external GLB resources/decoders are rejected. The approved Layla GLB is bundled unchanged. Music/effects are synthesized locally; the original lobby PNG and illustration are embedded.

Root `index.html` is the intentional generated-artifact exception: rebuild and commit it with runtime changes. Duplicate downloads/dist, dependencies, caches and screenshots stay ignored. The source ZIP contains root index, editable source, lockfile, tests, and docs—but **no reference screenshots/notes**. Per this architecture milestone, hero runtime models belong to `src/heroes/<id>/assets/*.glb`, alongside hero-owned JSON and animation mappings. Legacy public model/texture paths remain reserved for other world assets; editable Blender sources remain `assets/source_blender/`. Empty directories may be absent until genuine assets exist.

Add `#diagnostics` to a game URL only for the read-only state snapshot/projection API used by tests; it cannot mutate gameplay. Hero XP/levels and equipment are match/session-only; real lane combat events grant XP and match gold. Practice is reward-free. A separate local wallet stores only the one-time starter balances and Layla ownership; match earning/spending never touches it.

Latest lobby/audio/wallet changes: [docs/LOBBY_POLISH.md](docs/LOBBY_POLISH.md). Prior menu milestone: [docs/MENU_SYSTEM.md](docs/MENU_SYSTEM.md). Previous panel details: [docs/LIVE_PANELS.md](docs/LIVE_PANELS.md). Combat-control details: [docs/COMBAT_CONTROLS.md](docs/COMBAT_CONTROLS.md). The [Settings/input report](docs/SETTINGS_INPUT_FIX.md) records the preserved earlier milestone. The [empty-shop report](docs/EMPTY_SHOP_LAYOUT.md) records the retained empty-slot shop. The [key-settings report](docs/KEY_CONTROL_SETTINGS.md) documents the preserved session-only key editor. The [initial Phase 3 report](docs/PHASE_3_HUD_REPORT.md) retains its original Windows checklist/history. The [hero architecture guide](docs/HERO_ARCHITECTURE.md) explains schema, discovery, model replacement and adding a future approved hero. Earlier reports remain historical evidence. See the current AI Training / Brawl report for values and scope. The user subsequently authorized updating `arena/55ce0f80-mobile-legend-lite` with the reviewed expansion.


## Layla module and historical fixture

`src/heroes/layla/` owns JSON definitions/animation mappings and the approved GLB. Shared `src/simulation/hero-combat.js` owns casts/projectiles/statuses/damage; `src/rendering/combat-vfx.js` consumes events and never applies damage. No additional playable hero was added; lane AI uses explicitly temporary Training Bot geometry and reference attributes. `?hero=training` deliberately selects the old Test Hero fixture for unchanged historical regression checks; the default is Layla. `npm test` runs both foundation and reconstructed-kit coverage; `npm run test:browser:layla` exercises the current tap/hold/locked-attack default, while `npm run test:browser` exercises the explicitly selected historical fixture.
