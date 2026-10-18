# Regenerable downloads — gameplay roadmap Phase 1

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

The game now opens Create Username (or the lobby for a valid saved local profile).
Continue → MODE → AI TRAINING ROOM enters the existing Layla demo. The creation
screen uses the original alpha PNG; lobby/modes use the approved GLB. Lobby Shop and Settings are now functional; other lobby navigation and
Classic/Ranked/Brawl remain disabled previews. The background is an original
embedded PNG, the approved 3D hero is unchanged, and the Shop uses the original
illustration. Audio is synthesized locally. A one-time per-profile wallet starts
at 30,000 coins / 0 diamonds; no earning, spending or real purchases.
See `../docs/LOBBY_POLISH.md` and `../docs/MENU_SYSTEM.md` for persistence, asset assignment and validation.

Latest: `../docs/HERO_BROWSER.md` — complete creation PNG with blended bottom,
15-slot hero catalog, PNG guide and actual skill facts; sound stays in Settings.


Current content: **gameplay roadmap Phase 1 stats/progression**, documented in
`../docs/GAMEPLAY_PHASE_1.md`. The historical Phase-3 artifact filenames are
retained solely for packaging/test compatibility; they do NOT mean roadmap
Phases 2–5 have been implemented. Level 1 starts with one point/unlearned skills;
use the S1/S2/ULT upgrade row and Attributes / Practice · Testing controls.
