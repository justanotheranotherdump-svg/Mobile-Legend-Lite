> **Game Polish publication authorized (2026-10-19):** after the review handoff, the user requested updating `arena/55ce0f80-mobile-legend-lite`. This authorizes committing and pushing the reviewed Game Polish work to that branch, superseding the historical review-only/no-push statements below. No additional feature milestone is authorized.

# Game Polish — regenerable offline downloads

Current milestone: Preparation, smart combat targeting, directional skills, HUD,
real local Profile/History and saved-build shop priority. Review only; no new push.

- `npm run build` → **MOBA-Lab-Game-Polish.html**, complete offline game.
- `npm run package:source` → **MOBA-Lab-Game-Polish-source.zip**, editable source +
  tests + docs + playable root `index.html`.
- Root index, dist/index, current named HTML and historical Phase-3 HTML alias are
  byte-identical. Only one playable HTML is included in the source ZIP.

Open the HTML alone in Chrome/Edge with WebGL2, including with networking disabled.
No server, Node, sibling assets, CDN or runtime installation is needed. The source
ZIP excludes dependencies, Git, reference screenshots/test captures and build copies.

Lobby Preparation edits saved builds and spells; upper-left identity opens Profile.
MODE → AI Training/Brawl → START GAME → explicitly choose Layla → CONFIRM → actual
loading/countdown. Main attack now approaches and repeats safely; dedicated category
commands stay filtered. Hold/drag relative to the skill wheel, release to cast;
cancel without spending. Equipment/spells/utilities remain authoritative and local.
Classic/Ranked and functional Emblems remain unimplemented; only Layla is playable.

See `../README.md` and `../docs/GAME_POLISH.md` for controls, feature completion,
actual test results, hashes and manual Windows limitations. Approved GLB and
creation PNG are unchanged. Match gold is not persistent account currency.
