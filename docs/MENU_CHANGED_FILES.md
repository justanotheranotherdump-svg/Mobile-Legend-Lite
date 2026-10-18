# Changed files — front-end menu milestone

> Historical menu milestone. The current authorized Shop, wallet, PNG environment and audio update supersedes disabled-Shop/Settings and procedural-environment statements below. See [LOBBY_POLISH.md](LOBBY_POLISH.md).
Baseline: `755fb838c46059ef3aa8ab36bd71460eb854951b` on the existing session branch.
No destructive reset, file removal or branch switch. Previous source/assets preserved.

## Added

- `src/gameplay.js`: established game boot moved behind an exported function;
  optional registry/visual injection allows one model instance to be transferred.
- `src/menu/application.js`, `navigation.js`, `profile.js`: screen orchestration,
  pure navigation, validation and safe local/session profile persistence.
- `src/menu/profile-screen.js`, `lobby-screen.js`, `mode-screen.js`: three views.
- `src/menu/lobby-view.js`: original Three.js preview environment and safe handoff.
- `src/menu/art.js`, `menu.css`: offline image manifest and scoped responsive styles.
- `src/menu/assets/icons/*.png`: 20 original local image icons.
- `src/menu/assets/flags/{PH,US,JP}.png`: exactly three original local flag images.
- `src/assets/images/layla-creation.png`, `README.md`: original supplied RGBA art
  copied without changing its bytes, plus provenance/configuration notes.
- `scripts/create-menu-art.py`: optional original icon/flag regeneration source.
- `tests/menu-profile.test.js`: 11 pure validation/storage/navigation/asset checks.
- `tests/browser-menu.mjs`: full normal-launch file:// integration/responsive/touch test.
- `docs/MENU_SYSTEM.md`, this manifest, `menu-*.json` evidence.

## Modified

- `src/main.js`: menu entry; isolated explicit regression bypasses, not combat logic.
- `dev.html`: initially hidden gameplay root and new application title.
- `package.json`: `test:browser:menu` entry, no new npm dependencies.
- `tests/browser-layla.mjs`, `tests/browser-panels.mjs`: explicitly request the
  current-game regression entry now that ordinary startup correctly shows menus.
- `tests/browser.mjs`: larger ZIP HTML stdout buffer for the legitimately larger
  standalone file; unchanged gameplay/layout/archive assertions.
- `PROJECT_RULES.md`, `README.md`, `THIRD_PARTY_NOTICES.md`: current scoped milestone,
  navigation/testing instructions and user-supplied artwork notice.
- `index.html`: regenerated standalone with all runtime assets embedded.
- `deliverables/README.md`: entry/navigation instructions (source tracked).

Unchanged: `src/simulation/*`, `src/heroes/*` including the approved GLB and every
combat configuration, existing gameplay rendering/input/HUD modules/styles, centered
Shop/Settings rules, old test assertions, gameplay numbers and mechanics.

Ignored regenerated artifacts: `dist/index.html`, downloadable HTML/source ZIP,
`artifacts/menu-*.png` and browser scratch results. No dependencies or uploaded
reference screenshots are bundled. Stop for review; no additional gameplay.
