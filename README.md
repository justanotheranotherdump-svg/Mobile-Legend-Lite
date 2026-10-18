> **Game Polish publication authorized (2026-10-19):** after the review handoff, the user requested updating `arena/55ce0f80-mobile-legend-lite`. This authorizes committing and pushing the reviewed Game Polish work to that branch, superseding the historical review-only/no-push statements below. No additional feature milestone is authorized.

# MOBA Lab — offline AI Training and Brawl

**Current review: Game Polish — Preparation, combat targeting, HUD and local
profile (2026-10-19).** This milestone is review-only: local checkpoint only; no delivery commit or push.
The earlier reviewed expansion was published separately. Read
[the feature-by-feature report](docs/GAME_POLISH.md),
[changed files](docs/GAME_POLISH_CHANGED_FILES.md), and [PROJECT_RULES.md](PROJECT_RULES.md).
Earlier phase/batch reports in `docs/` are historical; the current report supersedes
old statements about empty shops, no approach, absolute mouse aiming or placeholder
profile/preparation screens.

A modular local 3D MOBA prototype: rooms → explicit Layla pick → real local loading
(minimum ten seconds) → single-lane AI gameplay → actual results/replay. Practice
is the separate preserved three-dummy sandbox. Only Layla is playable; Training
Bots and the original causeway use honest temporary geometry. No online play,
ranked matchmaking, functional Emblems, skins or monetization are implemented.

## Play offline on Windows

Download **`deliverables/MOBA-Lab-Game-Polish.html`** alone, or extract the source
ZIP and double-click its root **`index.html`**. The historical
`MOBA-Lab-Phase-3.html` alias has identical bytes for test/package compatibility.

1. Disconnect networking and open the HTML in current Chrome/Edge with WebGL2.
2. Create a local username (4–20 ASCII letters/numbers/underscores), PH/US/JP and
   Male/Female, then Continue. The same file/browser can retain the profile when
   local storage is available; blocked storage is session-only.
3. Lobby **Preparation** edits per-owned-hero builds/spells and browses the actual
   equipment/spell wiki. **Emblems** is clearly a future visual placeholder.
4. Click upper-left identity to view actual local Profile/History/Owned Heroes,
   account settings, recoverable reset, or explicitly separate Developer Tools.
5. **MODE → AI TRAINING ROOM → scenario**, or **MODE → BRAWL**; configure the
   actual local roster/difficulty, START GAME → explicitly pick Layla → CONFIRM.
   No gameplay/HUD starts merely by visiting a room/selection. Check the selected
   spell and optional saved build before confirming.
6. Fight actual waves/bots, spend match gold on six-slot equipment, and destroy
   outer tower → inner tower → core. Completed lane results enter local history;
   Practice and quitting do not. Replay returns through selection. Match gold is
   separate from the persistent account wallet.

No server, Node.js, npm, sibling assets, CDN, API or internet is needed to **play**.
Approved GLB/creation PNG remain byte-identical. New portrait/control/VFX art is
local and original. File-origin saves can differ after moving/renaming the file,
changing browsers or privacy settings. No cloud account or online reward exists.

## Current controls

- **WASD** or touch stick: camera-relative movement with collision/diagonal
  normalization. Explicit movement cancels a pending basic-attack approach.
- **Space / ground click / main Attack button**: persistent smart attack command,
  hero-first by default. It searches locally, approaches safely, stops within the
  actual range and fires at the unchanged animation/cooldown interval.
- **Enemy click**: manual pin; **minion/tower buttons**: strict category commands,
  not hero-stealing fallback. Settings → Controls changes nearest/HP/HP%, main
  category priority, auto switch and smart basic. Turning Smart Basic off keeps
  single authoritative attempts. Clear lock also cancels pending approach.
- **1/2/3**: exactly three existing Layla skill slots. Tap auto-targets; hold
  (180ms) opens a directional wheel. Drag **relative to the press origin**, release
  to cast. Deliberate direction is not overridden by auto aiming. Escape,
  right-click, cancel area or switching a panel cancels without mana/cooldown.
  Spend legal skill points using the local top-right **+** buttons. Ultimate gates
  and the existing animation locks/mana/passive/queued-skill rules are unchanged.
- **F**: selected actual battle spell; **B**: Recall; **V**: Regen. Unlocks use
  account level, not the hero's current match level. Dark masks/countdowns read
  actual spell/Regen cooldown and Recall channel times.
- **Shop (lane modes)**: Simple/All/Recommended, actual categories/search, purchase/sell, six
  automatic slots, complete recipe tree, useful affordable-component Quick Buy,
  and Resume saved build. Prototype recipes are editable reconstructions, not
  certified current official patch recipes. All 45 existing items remain.
- **Settings**: targeting/ranges, rebindings/button hints, audio and reduced motion.
  Native focused buttons own Space; editors isolate combat keys. Normal panels
  remain non-modal. Opening a panel cancels stale aim but does not lose held WASD;
  fresh exposed-battlefield casts still work. Match Pause actually stops time.
- **Minimap**: live actors/towers/objectives, shared hero portraits/range toggle.
  Player ground rings use actual center-to-center attack range; tower rings use
  actual tower range, with distinct allies/enemies and a stronger threat state.
- Leaving the browser pauses time and resets held input. Practice/testing resets
  remain separate from explicit profile deletion. No automatic wallet grants beyond
  the existing one-time 30,000 coins / 0 diamonds starting wallet are added.

## Edit, build and test

Author modular `src/` and `dev.html`, **not generated `index.html`**.

```sh
npm ci
npm run dev                 # optional authoring server, not needed to play
npm test                    # all source unit suites
npm run build               # root index + dist/index + two identical downloads
npm run validate:offline    # one self-contained HTML; no external JS/CSS/assets
npm run test:browser:game-polish
npm run package:source      # MOBA-Lab-Game-Polish-source.zip
```

All fourteen browser suite commands are listed in `package.json`; run them
sequentially on software WebGL. `@sparticuz/chromium` + Playwright are test-only.
Source ZIP includes editable source/tests/scripts/docs, lockfile and playable root
HTML; excludes dependencies, Git, screenshots/references, test captures and duplicate
builds. Optional image-authoring scripts are not runtime dependencies.

Current exact results, failures/corrections, artifact hashes and limits are in
[GAME_POLISH.md](docs/GAME_POLISH.md) and its verification JSON. Linux software
WebGL/emulated touch is **not** native Windows/physical-phone/speaker certification.
Follow the report's manual Windows checklist. Historical implementation details:
[Layla](docs/LAYLA_INTEGRATION.md), [lane modes](docs/AI_TRAINING_BRAWL.md),
[rosters](docs/ROSTER_EQUIPMENT_FOLLOWUP.md),
[items/spells and absent subsystems](docs/SHOP_AND_BATTLE_SPELLS.md).
