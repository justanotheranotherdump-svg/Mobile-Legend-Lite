# Lobby polish, local wallet, owned Hero Shop and audio

> Historical polish milestone: [HERO_BROWSER.md](HERO_BROWSER.md) supersedes the quick sound button and single-card Shop layout. Earlier tests/hashes below belong to that milestone.

Date: 2026-10-18. This supersedes the prior menu milestone only for the explicitly
authorized presentation, starter balances, Hero Shop and useful Settings.

## Included

- Original embedded fantasy-citadel PNG environment, `object-fit: cover` (cropped,
  never stretched). Original full-size source PNG is retained; the derived indexed
  runtime PNG reduces download size. No proprietary reference-screen extraction.
- Approved byte-unchanged 3D Layla in lobby and MODE; same instance transferred
  once to training. Removed procedural background meshes and continuous lobby
  render loop. Hero rest pose is genuine, not a fabricated idle animation. Gentle
  original CSS motes/transitions can be reduced; no model/clip changes.
- Top bar coins/diamonds. **30,000 coins / 0 diamonds** granted once per local
  username profile, including migration of an existing identity record. Reloads
  retain the saved balance; navigation does not grant again. Layla is owned/free.
- Lobby **Hero Shop**: original supplied transparent PNG portrait, Owned / Starting
  Hero badge and honest future-hero message. No other heroes, prices, purchase,
  top-up, spending, earning, rewards or economy API. The training equipment Shop
  remains the separate established empty-slot panel.
- Original eight-bar locally synthesized instrumental: calm citadel arrangement
  at 82 BPM; training arrangement at 106 BPM with bass/percussion. Synthetic UI,
  accepted cast, projectile-launch and real-hit cues consume existing read-only
  events. Audio never affects damage, targeting, cooldown or simulation state.
- Real master/music/effects switches and three volume sliders; quick lobby sound
  toggle, audio reset, persisted reduced interface motion. Lobby Settings offers
  Audio and Presentation, with keyboard-accessible tabs. Training Basic includes
  the same shared controls, reached directly with its Audio shortcut. Unsupported
  quality/network/chat features are not exposed as working settings.

## Persistence and browser behavior

Identity remains `moba-lab.profile.v1`. Wallet is separate:
`moba-lab.progress.v1:<encoded username>` with a starter-grant marker, safe integer
balances and owned Layla. Corrupt existing wallets recover at zero instead of
repeatedly granting coins. The lobby discloses recovery/session fallback. Local
saves are not tamper-proof accounts: clearing browser data loses the local record;
a new browser/file scope may be treated as a new profile. There is no server.

Audio/motion use `moba-lab.preferences.v1`, normalized booleans and clamped volumes.
Blocked/failed storage keeps a usable session copy; no permanent-save guarantee.
Targeting/key bindings/button hints retain their established session-only behavior.
Same-file file:// persistence is tested; native Windows and physical touch are not
certified by Linux browser emulation.

No AudioContext is created until a real click/tap or activation key. Mute settings
survive reload without autoplay. Blur/hidden state suspends sound and clears the
music timer/voices; focus/visibility resumes one scheduler when unlocked. Missing
Web Audio is clearly reported and does not prevent play. Music is synthesized
from bundled code: no audio downloads, commercial samples, CDN or external tracks.

## Modules and gameplay boundary

- `src/menu/progress.js`: wallet validation, one-time migration and storage fallback.
- `src/menu/{wallet-view,shop-screen,settings-screen}.js`: actual wallet/collection/UI.
- `src/menu/{application,navigation,lobby-view,art}.js`, `polish.css`: composition,
  routes, embedded environment, on-demand hero presentation and responsive styling.
- `src/audio/{score,engine,preferences,settings-controls,integration}.js`, `audio.css`:
  composition, Web Audio buses, preferences and shared controls/event adapter.
- `src/gameplay.js`: optional `onReady` presentation-composition hook only. No
  simulation, Controls, damage, skill, model or animation implementation changes.
- `tests/polish.test.js`, `browser-polish.mjs`: new wallet/preference/audio/offline
  checks. Existing menu placeholder expectation updates from 13 to 10; source ZIP
  extraction buffer increased for embedded PNG payload. All other regressions stay.

Preserved: no default joystick, exactly three Layla skills, full Shoot movement
lock, authoritative homing/projectiles, held-input/editor safety, centered non-modal
training panels, exposed battlefield/HUD combat, and honest offline status.

## Verification

Final fresh checks: **193 / 193 unit tests** and **109 browser checks**
(13 polish + 11 menu + 19 Layla + 16 live panels + 50 historical foundation).
Every successful browser report has `errors: []`, `warnings: []`, `requests: []`.
The final polish suite was repeated after the final footer wording adjustment.
Hero schema validation, production build and structural offline checks also pass.
The expected Vite >500 kB bundle warning remains: all dependencies/artwork must be
embedded for standalone operation; it is not a runtime warning.

Evidence: `polish-unit-results.json`, `polish-unit-output.txt`,
`polish-browser-results.json`, `polish-menu-browser-results.json`,
`polish-layla-browser-results.json`, `polish-panels-browser-results.json`,
`polish-foundation-browser-results.json`. These reports are current; previous
`menu-*` and other milestone reports remain historical.

The first regression attempt completed the 11 menu checks and 17 Layla gameplay
checks, then failed at ZIP extraction because the source ZIP was absent. Preserved
in `polish-initial-packaging-failure.txt`; generating the archive fixed that
packaging prerequisite. The complete repeated Layla suite subsequently passed all
19 checks, including standalone root extracted from ZIP in a Unicode/spaces path.

Actual OfflineAudioContext rendered 132,300 samples at 44,100 Hz,
stereo, RMS 0.00728110, peak 0.04040154 (nonzero, unclipped three-second
citadel excerpt). Live browser checks confirm trusted-gesture unlock, scheduling,
scene change, effects, muting, persistence, blur/focus and missing-audio fallback.
This is not subjective listening or physical-speaker certification; the headless
browser mutes its hardware output.

Visual inspection covered actual lobby at 1280×720 and 844×390, PNG Shop at
1280×720, Settings and training Audio at 844×390; automated touch-emulated bounds
and navigation also cover 960×540. Settings content scrolls at compact height.
Screenshots are regenerable under ignored `artifacts/polish-*.png`.
Linux Chromium 153.0.8010.0 / software WebGL / touch emulation is not native Windows
or physical touch certification. Native Windows double-click/audio/touch acceptance
remains manual.

Final standalone: **5,093,599 bytes**, SHA-256
`d4dea3a38fe564034a43aeaa020991c0a4954e04fef579c0ad949920f9a7baec`.
Approved GLB SHA-256:
`963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.
Supplied original illustration SHA-256:
`bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1`.
The external download `deliverables/BUILD_MANIFEST.json` records the final ZIP hash
without introducing a self-referential hash inside the archive.

## Delivery and scope

Root `index.html`, `dist/index.html` and `deliverables/MOBA-Lab-Phase-3.html` must be
byte-identical. Source ZIP includes the playable root, source PNGs, editable code,
lockfile, tests/docs/notices; excludes dependencies/build copies/screenshots and
proprietary references. No commit or push: stop for user review.
