# Regenerable downloads — Layla reconstruction

`npm run build` generates `MOBA-Lab-Phase-3.html`, the single self-contained game,
now with intentionally reconstructed Layla and the unchanged approved embedded GLB.
The Phase-3 filename remains compatible with the existing packaging/tests.
`npm run package:source` generates `MOBA-Lab-Phase-3-source.zip`.

Root `../index.html` is the identical standalone game, deliberately tracked so a
source ZIP can play without building. Edit `../dev.html` / `../src/`, not generated
index. Downloads/dist/dependencies/screenshots remain ignored by Git.

Shop and Settings now stay open without blocking WASD, basic attacks or skills.
Panel transitions preserve held movement and aim; editing controls keep their keys.

Read `../docs/LIVE_PANELS.md`, `../docs/COMBAT_CONTROLS.md` and `../docs/LAYLA_INTEGRATION.md` for recovery result, configuration, mechanics,
GLB validation, tests and limitations. Windows native offline acceptance remains
manual; automated file:// checks run Linux Chromium. No server/sibling assets/CDN
are needed to play the HTML. Stop after this milestone for approval.
