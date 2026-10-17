# MOBA Lab — Phase 3: MOBA HUD & Controls

A genuinely 3D training sandbox using Three.js and Vite. **Phase 3 is the approved HUD/control milestone:** a live minimap, optional movement joystick, compact MOBA action HUD, interface-only shop/settings panels and real combat notifications. Phase 2 hero architecture and existing damage/targeting/movement rules are preserved. No new heroes, skills, items, spells, gold economy or modes were implemented. Read [PROJECT_RULES.md](PROJECT_RULES.md) before future work.

## Play offline on Windows

Extract this branch's source ZIP and double-click the root **`index.html`**. That file is the complete game, not a development template. Alternatively download **`deliverables/MOBA-Lab-Phase-3.html`**, which has identical contents. Either HTML can be copied alone to an empty folder.

1. Disconnect networking.
2. Double-click the HTML. If needed, choose **Open with → Chrome or Edge**.
3. Confirm it opens as `file:///…/index.html` (or the named standalone file).
4. Click the arena if necessary to focus movement controls.

No server, Node.js, npm, sibling assets, or internet is needed to play. Requires a modern browser with **WebGL2**/graphics acceleration. Linux Chromium 153 offline file:// tests passed; Windows-specific verification remains manual. See [the latest empty-shop report](docs/EMPTY_SHOP_LAYOUT.md).

## Controls

- **WASD / optional on-screen joystick**: same camera-relative movement/collisions; diagonal speed is normalized. Nonzero keyboard input takes priority rather than adding joystick speed. Targeting never moves or chases.
- **Mouse**: ground aiming/crosshair.
- **Left-click ground** or the **large Basic Attack HUD button** or the **configured attack key (default Space)**: attack the selected target, subject to range and cooldown.
- **Left-click a living dummy**: pin that enemy as a manual override and attempt one attack. Further ground/HUD attacks keep that pin.
- **Targeting mode** dropdown: change selection policy and release any pin.
- **Clear lock**: release the pin without changing modes or resetting cooldown.
- **Minimap buttons**: toggle the live map and its attack-range overlay (not the world range ring).
- **Shop**: open the landscape empty-slot equipment panel. Category selection and All equipment / Simple view change only the interface; purchases do not exist.
- **Settings**: optional joystick, reduced HUD motion, **Show button key hints**, and **Customize key controls**. Choose single-key shortcuts for attack, skills, utilities, target priorities, reset/clear lock, panels and map controls. Unbind keys or restore defaults; duplicate assignments are rejected. WASD/mouse stay fixed. Escape closes panels and restores battlefield focus. **Preferences are session-only; reopening/reloading restores defaults.**
- **Reset arena**: restore player, all dummy starting HP/max HP, positions, mode, selection, pin, cooldown and hit count.

One click/Space requests one attack; this is **smart target selection, not continuous auto-firing**. Switching focus pauses simulation and clears held input. **Exactly three skill slots:** top-row **1 = Skill I, 2 = Skill II, 3 = Ultimate** (physical `Digit1/2/3`, not numpad or F keys). These are the defaults; Settings can rebind them, including to Q/E/R or numpad keys. The existing hero has no abilities, so the slots remain reserved/disabled and never cast. F battle spell, B recall, Regen, equipment and quick-buy also remain reserved.

Routine attack/movement hint banners are removed. Target HP, range/cooldown indicators and genuine training-elimination announcements remain. The shop contains **only empty slots**: no item art, names, prices, stats or purchasing logic.

## Targeting rules

| Mode | Policy for eligible in-range enemies |
| --- | --- |
| Nearest Enemy | Lowest ground-plane center distance |
| Lowest Current HP | Smallest absolute current HP, then distance |
| Lowest HP Percentage | Smallest current HP / max HP, then distance |
| Manual Target | Click an enemy to pin it; without a valid pin, nearest in-range fallback |

All ties finally use stable ID ordering. Only living, targetable enemies with valid coordinates/HP qualify. Automatic selection considers only units within the inclusive **6m center-to-center range**. With none available, it shows no target and rejects attacks without consuming cooldown or moving the player.

A valid manual pin overrides every mode, even if it is out of range. Such attacks are rejected; it never chases or silently switches away from the pin. Death, removal or invalidation releases the pin and immediately applies the current mode's fallback. Changing modes or clearing the lock also releases it. Clicking a dead dummy never attacks some other enemy accidentally.

The selected enemy has a **gold ground ring and gold HP-label outline**. Every dummy shows its current and maximum HP. The side card indicates automatic versus manually locked selection.

### Training setup

Press **D** from spawn to approach the cluster (stop before colliding with A). At approximately **player (-1.5, 1.5)** all three are in range and each automatic mode picks a different enemy:

| Dummy | Position X/Z | Starting HP / max HP | Ratio | Mode winner at test position |
| --- | --- | --- | --- | --- |
| A · Sentinel | 0 / 0 | 200 / 200 | 100% | Nearest |
| B · Wounded | 3 / 1 | 90 / 120 | 75% | Lowest Current HP |
| C · Bulwark | 2 / -3 | 120 / 400 | 30% | Lowest HP Percentage |

Reset restores these **starting** HP values, not full health for B and C, so modes remain distinguishable. Attacks deal **25 damage** with **0.65s cooldown**. Dummies remain stationary and do not attack; player health stays at 100. All character geometry is temporary. No GLBs, rigs, or animation assets are claimed.

The latest refinement uses an original faceted attack-guard illustration with smaller minion/tower satellites, a three-skill arc, and reduced-size Recall/Regen/battle-spell buttons. All artwork is inline vector/CSS, not copied reference assets.

## Honest interface status

- **Functional:** live map/HP/target feedback, simulation/session timer, WASD/joystick, target-mode selector, clear pin, click/Space/basic attack, actual cooldown feedback, reset, and real training-target elimination announcements.
- **Interface-only:** shop categories/view layout, settings/help shell, modal open/close, reduced HUD motion. Joystick visibility controls the real input adapter.
- **Reserved:** team kill counters and gold show **—**, not fabricated numbers; three skill slots (1, 2, 3/Ultimate), Recall/Regen/battle spell, six equipment slots/quick buy, minion/tower priorities and empty catalog/build slots and disabled Purchase/Prioritize buttons have no gameplay functionality.

Dummy deaths announce **Target eliminated**, not competitive hero kills; no fake team score changes. Player/ally kill/death announcement classifications are prepared and unit-tested, but cannot occur with the existing non-retaliating dummies and absent allies. No demo notifications fire at startup. The timer is elapsed training simulation time, not a newly invented competitive match system.

Validated landscape sizes: 800×600, 854×480, 1024×600, 1440×900, 1920×1080. Portrait/very small windows, physical touch devices and native Windows verification are not certified here.

## Develop and validate

Used Node **22.22.3**, npm **10.9.8**, Vite **7.3.7**, Three.js **0.186.1**. Modern Node 22 (22.12+) is recommended.

```bash
npm ci
npm run dev -- --port 5173
npm test                   # 104 unit tests, retaining all 101 previous tests
npm run validate:heroes    # Schema/reference/embedded-model validation
npm run build              # Build and validate the standalone game
npm run validate:offline
npm run package:source     # Rebuild then archive (zip CLI required)
npm run test:browser        # 45 offline browser checks; requires source ZIP above
npm run preview -- --port 4173
```

The development server binds to `0.0.0.0`, accepts Arena `*.e2b.app` hosts, and serves editable **`dev.html`** at `/` and `/index.html`. Edit `dev.html`/`src/`, not the generated root index. There are no browser-facing localhost API calls.

Browser tests use development-only `playwright-core`, npm-packaged Linux Chromium, software WebGL, and the `unzip` CLI. On the minimal Linux environment, bundled NSS libraries are extracted into temporary storage. These tools are **not needed to play**. On other platforms, set `BROWSER_PATH` to an installed Chromium/Chrome executable and provide unzip as a developer prerequisite. Optional `DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser` also checks that Vite serves live source. Test prerequisites unavailable means **not tested**, not passed.

## Files and packaging

- `src/heroes/training/`: exact existing hero stats, empty abilities/clip mappings and unchanged placeholder.
- `src/heroes/registry.js` / `catalog.js`: validated immutable registry and eager Vite auto-discovery.
- `src/rendering/heroes/hero-visual.js`: presentation-only adapter, embedded-GLB parsing, verified clip playback/fallback.
- `src/simulation/effects.js`: allowlisted shared damage implementation; no executable JSON.
- `src/simulation/targeting.js`: pure eligibility, mode scoring, in-range filtering, deterministic tie-breaking.
- `src/simulation/game.js`: mesh-independent state, movement integration, manual pin lifecycle, validated attacks/reset.
- `src/data/training.json`: scenario hero ID/spawn, default mode, dummy IDs/positions/HP. Hero stats are no longer duplicated here.
- `src/input/`: keyboard/pointer/Space, optional bounded joystick, capture and safe UI-focus handling.
- `src/rendering/world.js`: replaceable temporary visuals, camera, ray picking, selected ring and hit feedback.
- `src/simulation/combat-events.js`: presentation-neutral death/reset transport; no score or damage rules.
- `src/ui/`: separate layout/styles, original vector/button components, live minimap, targeting, cooldown display, shop/settings/equipment placeholders and queued combat announcements.
- `tests/`: simulation, targeting and actual offline browser regressions.
- `scripts/`: inline HTML packaging, structural validation, source archive.

Vite builds `dev.html`; packaging embeds its JS, CSS, Three.js and JSON, including the Three.js MIT notice and original inline-vector HUD icons. The output is identical in:

- **`index.html`** — deliberately committed so GitHub source ZIPs play directly.
- `dist/index.html` — the only file in dist.
- `deliverables/MOBA-Lab-Phase-3.html` — named download (~714 KiB).

No CDN, external font, external model/texture/data file, fetched JSON, service worker, decoder, or remote API is required. The >500 kB Vite chunk warning is expected because Three.js must be embedded. Hero GLBs are prepared for eager inline bundling and in-memory parsing; external GLB resources/decoders are rejected. No genuine character GLBs exist yet. Future audio/other asset types require their own approved embedding workflow.

Root `index.html` is the intentional generated-artifact exception: rebuild and commit it with runtime changes. Duplicate downloads/dist, dependencies, caches and screenshots stay ignored. The source ZIP contains root index, editable source, lockfile, tests, and docs—but **no reference screenshots/notes**. Per this architecture milestone, hero runtime models belong to `src/heroes/<id>/assets/*.glb`, alongside hero-owned JSON and animation mappings. Legacy public model/texture paths remain reserved for other world assets; editable Blender sources remain `assets/source_blender/`. Empty directories may be absent until genuine assets exist.

Add `#diagnostics` to a game URL only for the read-only state snapshot/projection API used by tests; it cannot mutate gameplay. No persistent match/progression save system is included.

Latest changes, per-test evidence and limitations: [docs/EMPTY_SHOP_LAYOUT.md](docs/EMPTY_SHOP_LAYOUT.md). The [key-settings report](docs/KEY_CONTROL_SETTINGS.md) documents the preserved session-only key editor. The [initial Phase 3 report](docs/PHASE_3_HUD_REPORT.md) retains its original Windows checklist/history. The [hero architecture guide](docs/HERO_ARCHITECTURE.md) explains schema, discovery, model replacement and adding a future approved hero. Earlier reports remain historical evidence. Stop here for approval before additional gameplay.
