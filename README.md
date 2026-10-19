# MOBA Lab — offline AI Training and Brawl

**Current: approved Layla + Franco integration (2026-10-19).**
The approved Energy Gunner / Plan B models now run in the existing offline game.
Selection starts empty. Layla stays owned; locked Franco is previewable and costs
32000 Coins OR 749 Diamonds, confirmed separately. No starter balance increase,
next hero or new mode. Open [the current HTML](deliverables/MOBA-Lab-Layla-Franco.html)
or read [the executed verification](docs/two-heroes/VERIFICATION.md) and
[integration specification](docs/two-heroes/INTEGRATION-SPEC.md).

The following earlier milestone description is retained as history, not a new
integration prohibition. The current two-hero stage is detailed at the end.

**Previous milestone (historical): Final Gameplay Polish (2026-10-19).**
Real empty hero selection; persistent tower/wave plans; an in-match-only final
Settings → Cheats tab with Add +9999 Gold; shared player/NPC equipment and combat
contexts. No new hero or new push is authorized by this milestone.
Read [the implementation/tests/limits report](docs/FINAL_GAMEPLAY_POLISH.md)
and [PROJECT_RULES.md](PROJECT_RULES.md). The earlier
[Preparation expansion report](docs/PREPARATION_EXPANSION.md) remains historical;
its equipment-source/version caveats still apply.

A modular local 3D MOBA prototype: rooms → explicit Layla pick → real local loading
(minimum ten seconds) → single-lane AI gameplay → actual results/replay. Practice
is the separate preserved three-dummy sandbox. Only Layla is playable; Training
Bots and the original causeway use honest temporary geometry. No online play,
ranked matchmaking, functional Emblems, skins or monetization are implemented.

## Play offline on Windows

Download **`deliverables/MOBA-Lab-Final-Gameplay-Polish.html`** alone, or extract the source
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
  certified current official patch recipes. All 45 existing items remain; the
  expanded catalog has 99 paid entries plus nine typed special/reference entries.
- **Preparation**: select one of six icon slots and click an equipment card to
  replace it; remove or reorder with the labeled controls. Save/use a custom
  build or copy one of three community templates. Battle Spells opens directly.
  Emblem positions are intentionally empty and grant nothing.
- **Special equipment**: choose a jungle/roam intention in Preparation. It is
  not free inventory: compatible spell/boots and genuine match progress are
  required. Read the report's explicitly versioned classic-rules limitations.
  Winter Crown has an inventory USE action; Magic/Rock Potions are consumed,
  not placed in a slot.
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
npm run dev                    # optional authoring server; not needed to play
npm test                       # all source unit suites
npm run package:source         # rebuild + current HTML/source ZIP and aliases
npm run validate:offline       # one self-contained HTML, byte-identical aliases
npm run validate:preparation-assets # preserved 63 PNGs and approved GLB
npm run test:browser:final-polish
npm run test:browser:final-regression # 15 preserved suites, serial by default
npm run validate:final-delivery
npm run test:browser:final-isolated  # HTML alone + ZIP index alone, offline
```

All fourteen legacy browser suites plus the Preparation suite and the final
focused gameplay suite are
listed in `package.json`; run them
sequentially on software WebGL. `@sparticuz/chromium` + Playwright are test-only.
Source ZIP includes editable source/tests/scripts/docs, lockfile and playable root
HTML; excludes dependencies, Git, screenshots/references, test captures and duplicate
builds. Optional image-authoring scripts are not runtime dependencies.

Current results, corrections, source discrepancies, artifact hashes and limits are in
[FINAL_GAMEPLAY_POLISH.md](docs/FINAL_GAMEPLAY_POLISH.md) and its final verification
JSON. Earlier equipment source/version caveats remain in
[PREPARATION_EXPANSION.md](docs/PREPARATION_EXPANSION.md). Linux software
WebGL/emulated touch is **not** native Windows/physical-phone/speaker certification.
Follow the earlier report's manual Windows checklist. Historical implementation details:
[Layla](docs/LAYLA_INTEGRATION.md), [lane modes](docs/AI_TRAINING_BRAWL.md),
[rosters](docs/ROSTER_EQUIPMENT_FOLLOWUP.md),
[items/spells and absent subsystems](docs/SHOP_AND_BATTLE_SPELLS.md).


## Approved Layla + Franco integration

This stage extends the existing offline game with the approved Energy Gunner
Layla and Plan B Franco models/animations. Both have local portraits/backgrounds
and distinct four-skill PNG sets, an interactive 3D showcase and shared player/AI
combat kits. Selection starts genuinely empty. Layla remains owned; Franco is
previewable while locked, costs **32000 Coins OR 749 Diamonds**, and requires a
confirmed, affordable, one-currency purchase. The existing fresh wallet remains
30000 Coins / 0 Diamonds — no free currency was added.

Open the root `index.html` directly, or use `npm ci && npm run dev`. Current
delivery: `deliverables/MOBA-Lab-Layla-Franco.html` and the matching source ZIP.
See [integration decisions/provenance](docs/two-heroes/INTEGRATION-SPEC.md) and
[executed validation/limitations](docs/two-heroes/VERIFICATION.md). Earlier preview
files remain historical, unchanged inputs; this stage is integration, not another
preview or new hero/mode.
