# Changed files — authorized lobby polish

This is layered onto the already-preserved menu milestone on
`arena/55ce0f80-mobile-legend-lite`. No commit, push, destructive reset, clean or
branch switch. Earlier files/reports remain in place; old reports are historical.

## New modules/assets

- `src/audio/preferences.js`, `engine.js`, `score.js`: persisted preferences,
  original local score, master/music/effects buses, gesture/visibility lifecycle.
- `src/audio/settings-controls.js`, `integration.js`, `audio.css`: shared actual
  controls and read-only training presentation adapter.
- `src/menu/progress.js`: separately validated per-profile one-time starter wallet.
- `src/menu/wallet-view.js`, `shop-screen.js`, `settings-screen.js`: balances,
  starter-owned illustration collection, supported Audio/Presentation settings.
- `src/menu/polish.css`: responsive PNG lobby, wallet, collection and Settings.
- `src/menu/assets/lobby-citadel.png`: original generated environment source;
  `lobby-citadel-optimized.png`: indexed runtime derivative, embedded by Vite.
- `src/menu/assets/icons/{coins,diamonds,music}.png`: original local raster icons.
- `tests/polish.test.js`, `tests/browser-polish.mjs`: wallet, preferences, audio,
  real file:// flow and responsive/touch-emulated checks.
- `docs/LOBBY_POLISH.md`, this manifest, `polish-*.json`/text evidence.

## Updated integration/documentation

- `src/menu/application.js`: modular stores/audio/routes/background composition,
  safe UI cleanup, storage notices, gesture unlock and visibility hooks.
- `src/menu/lobby-screen.js`: real Shop/Settings buttons, wallet, quick sound.
- `src/menu/navigation.js`, `art.js`: approved routes and inline background import.
- `src/menu/lobby-view.js`: only the approved 3D hero/lights; environment meshes
  removed, on-demand drawing/resize, safe same-model handoff retained.
- `src/gameplay.js`: optional `onReady({simulation})` composition callback only.
- `tests/browser-menu.mjs`: now 10 unsupported disabled previews, not 13.
- `tests/browser-layla.mjs`: source ZIP extraction buffer accommodates artwork.
- `package.json`: adds `test:browser:polish`; runtime dependencies unchanged.
- `README.md`, `deliverables/README.md`, `PROJECT_RULES.md`,
  `THIRD_PARTY_NOTICES.md`: current authorization, instructions and asset notices.
- `docs/MENU_SYSTEM.md`, `MENU_CHANGED_FILES.md`: marked prior milestone history.
- Generated root/download/dist HTML and source ZIP rebuilt, not hand-edited.

## Unchanged boundaries

Simulation, combat configuration, input implementation, projectiles/homing,
targeting, existing HUD layouts/panel policies and model/animation assets unchanged.
The original supplied alpha PNG is reused, not recompressed or replaced. Existing
legacy regression fixtures retain their historical behavior and bypass the new
front-end presentation composition intentionally. Normal menu-to-training tests
cover the new audio adapter and actual 3D handoff, without those shortcuts.
