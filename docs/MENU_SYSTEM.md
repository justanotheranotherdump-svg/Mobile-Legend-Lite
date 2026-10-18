# MOBA Lab — profile, lobby and mode selection

> Historical menu milestone. The current authorized Shop, wallet, PNG environment and audio update supersedes disabled-Shop/Settings and procedural-environment statements below. See [LOBBY_POLISH.md](LOBBY_POLISH.md).
Date: 2026-10-18. This is a front-end navigation milestone, not a new game mode,
combat rewrite, economy, online service or AI-opponent system.

## Implemented flow

**First launch:** Create Username → Continue → Main Menu → MODE → Mode Selection →
AI TRAINING ROOM → existing playable Layla training.

**Returning launch with valid local data:** Main Menu → MODE → Mode Selection →
AI TRAINING ROOM. Mode Selection Back (or Escape) returns to Main Menu without a
reload or profile loss. There is no new in-match return-to-lobby feature in scope.

The form trims surrounding whitespace and validates 4–20 ASCII letters, digits or
underscores. Invalid/empty names cannot continue. Country is exactly PH, US or JP
(PH initially selected); gender must explicitly be Male or Female. Selections have
visible checked states. A profile consists of username, country and gender; it is
not an online account and has no invented currency, level, rank or achievements.

## Correct asset assignment

| Screen | Character | Verification |
|---|---|---|
| Create Username | Supplied anime Layla PNG | Original bytes, actual alpha decoded and tested, `object-fit: contain` |
| Main Menu | Existing approved `layla.glb` | Real Three.js render, original materials and rest pose |
| Mode Selection | Same lobby GLB instance/scene | No model reload or PNG substitution |
| AI Training | Same GLB instance transferred into established training | Shared presentation injected; existing simulation/arena/HUD/controls retained |

Creation illustration: `src/assets/images/layla-creation.png`, copied byte-unchanged
from supplied `image-1.png`; 1536×1024 RGBA, actual alpha range 0–254.
SHA256 `bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1`.
Configure the single image import in `src/menu/art.js`. No rectangular image
background was added, no image was regenerated, and none of the reference UI
screenshots were included. Original artwork rights remain with their holders.

The GLB stays byte-unchanged, SHA256
`963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
It remains the approved **rigid-part, low-poly** model, not the higher-detail model
in the references. Its only real clips are Walk and Shoot; the lobby uses its rest
pose, not a fictitious idle animation or a new rig.

Twenty new local PNG icon assets and exactly three country PNG flags live in
`src/menu/assets/`. There were no suitable existing raster menu icons. Original
badges were raster-drawn locally in a consistent gold/navy/cyan palette (not fetched,
not cropped reference art or emoji). `scripts/create-menu-art.py` preserves editable
source for regeneration; optional developer prerequisite: Python + Pillow. Normal
build/play does not require Python. Flags use their own PH/US/JP layouts/proportions,
with `object-fit: contain`. The citadel, platform, towers, lighting and atmosphere
are original procedural Three.js/CSS, not an uploaded screenshot or remote image.
No image/icon assets remain missing.

## Functional versus visual-only controls

**Functional:** profile text input, three-country selector, two-gender selector,
Continue, MODE, Mode Selection Back/Escape and AI TRAINING ROOM. The latter alone
enters gameplay. Repeated/rapid activation is guarded against repeated initialization.

**Disabled visual previews:** Profile, Mail, Friends, Resources, lobby Settings,
Shop, Events, Starlight, Daily, Preparation, Heroes, Achievements, Inventory, Classic,
Ranked and Brawl. Native disabled buttons have no click handlers or side effects.
They do not open fake feature screens, start matches, mutate data or grant rewards.
In-match Shop and Settings retain their existing centered, non-blocking behavior;
they are separate from the lobby's deliberately disabled preview icons.

The AI Training Room label launches the current stationary-target training demo.
No retaliating NPCs, allies, AI behavior, matchmaking or competitive modes were added.

## Architecture / resource and input ownership

- `src/main.js`: application entry; ordinary launch starts the menu, not training.
- `src/gameplay.js`: original initialization moved behind exported `startTraining`;
  it accepts an already-loaded registry/visual. No combat/simulation/hero-config code
  was changed. Arena, skills, target rules, animation locks and gameplay HUD remain.
- `src/menu/profile.js`: pure validation plus safe, versioned local storage wrapper.
- `src/menu/navigation.js`: explicit allowed screen transitions, separate from combat.
- `src/menu/profile-screen.js`, `lobby-screen.js`, `mode-screen.js`: separate views.
- `src/menu/application.js`: one navigation owner, repeated-entry guard, lazy preview
  and single training handoff.
- `src/menu/lobby-view.js`: one GLB parse, original procedural environment, one resize
  listener/render loop reused for lobby/modes. On entry it stops that loop, removes
  listeners, detaches the model, disposes only lobby environment geometry/materials
  and its renderer, then transfers the model without destroying shared resources.
- `src/menu/art.js`, `menu.css`: embedded image manifest and scoped responsive styles.

No gameplay Controls, Hud, combat simulation or gameplay render loop exists while
in the menu. Menu key presses cannot attack, cast, move or pin targets. On training
entry the existing input stack is initialized once and the canvas receives focus.
The menu DOM is removed/hidden and its global Back listener is detached.

Developer-only regression entry `?screen=training#diagnostics` directly loads current
Layla to preserve the dedicated combat/panel suites. `?hero=training` retains the
historical fixture. Neither shortcut is exposed by normal menus. The new menu
suite tests the actual full navigation path, not one of those bypasses.

## Persistence and offline behavior

Storage key: `moba-lab.profile.v1`. A write is followed by a validated read-back;
the UI only claims local storage when that succeeds. Corrupt/invalid data returns
to creation. If storage access throws or does not retain the value, a valid in-memory
profile still works, with an honest **Session-only profile** label. No server, cookies,
account login or runtime fetch is required.

Linux Chromium 153 at offline `file://`: same-file reload restored the saved profile
and skipped creation; denied-storage fallback and invalid-saved-data recovery were
also tested. This does **not** certify native Windows browser behavior, permanent
retention, different paths/renames, browsers, devices, cleared/private storage or
browser policies. Session-only state is lost on reload if persistent storage is
unavailable. No export/import account system was added.

## Validation and deliverables

Final fresh checks: **181/181 unit tests passed** (170 preserved + 11 new),
**11/11 menu integration checks, 19/19 Layla combat checks, 16/16 live-panel checks
and 50/50 historical foundation checks passed**. The foundation development-preview
and invalid-hero-data banner smoke checks also passed. All successful offline
browser suites recorded zero runtime errors, warnings and subresource requests.
Results are in adjacent `menu-*.json` evidence files. The final menu suite ran the
exact final standalone, including compact touch-emulated AI entry; script/CSS
payloads were byte-identical to the complete combat/foundation regression build
(the final artwork notice is an HTML comment only).
The integration suite covers first/returning launch, name validation, every flag and
both genders, saved/displayed profile, denied/corrupt storage, real PNG alpha,
correct GLB assignment/reuse, placeholders, MODE/Back, single existing-game entry,
menu input isolation, real movement/skill damage, all images loading offline and
layout/touch emulation at **1280×720, 960×540 and 844×390**, including actual
touch-emulated AI Training entry at the compact size. Screenshots were inspected;
finite reveal animations are fast-forwarded only for screenshot capture.

The first browser attempt caught horizontal scroll extent caused by a decorative
background outside its clip. The background is now internally clipped; the original
failed result is retained in `menu-initial-browser-failure.json`. No error was hidden
by deleting a functional check. The historical ZIP reader buffer was raised from
4 MiB to 12 MiB because embedding the supplied original 2.55 MB PNG legitimately
makes the standalone HTML exceed that old tooling cap; archive equality remains
asserted. Combat suites retain their assertions and explicitly request their
regression entry; they are not mislabeled as full navigation tests.

Commands: `npm ci`, `npm test`, `npm run package:source`, `npm run validate:offline`,
`npm run test:browser:menu`, `npm run test:browser:layla`,
`npm run test:browser:panels`, `npm run test:browser`. Run software-WebGL browsers
serially. Linux minimal-image foundation tests use supported `BROWSER_PATH` and
`LD_LIBRARY_PATH` overrides; browser tools never enter source or playable artifacts.

Packaging is unchanged: root `index.html`, `dist/index.html` and
`deliverables/MOBA-Lab-Phase-3.html` are the same single-file game, with embedded JS,
CSS, PNGs, flags and GLB. `deliverables/MOBA-Lab-Phase-3-source.zip` contains editable
source, local assets, tests, reports and playable root HTML, not dependencies,
reference screenshots or duplicate builds. No runtime CDN/API/remote resource.

**Limits:** browser automation includes touch emulation, not a physical-device
certification. Native Windows file:// remains manual. Portrait/all-device layouts,
high-detail character remodels and any further gameplay features are out of scope.
Stop for review after this milestone; no additional gameplay or push is implied.
