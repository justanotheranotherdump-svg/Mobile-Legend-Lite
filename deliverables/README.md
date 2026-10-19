# Visual Preparation & Equipment Expansion — offline downloads

Current milestone: six-icon build creation, editable Layla community presets,
direct spells, intentionally empty Emblems, typed Magic/Defense/Jungle/Roam
catalog and mechanics, 63 individual original PNGs, bot formation/kiting.
Reviewed expansion; same-branch publication subsequently authorized on 2026-10-19. Classic blessing rules are explicitly documented,
not presented as the current live patch. Read `docs/PREPARATION_EXPANSION.md`.

- `npm run build` → **MOBA-Lab-Preparation-Expansion.html**, complete offline game.
- `npm run package:source` → **MOBA-Lab-Preparation-Expansion-source.zip**, editable source +
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

See `../README.md` and `../docs/PREPARATION_EXPANSION.md` for controls, feature completion,
actual test results, hashes and manual Windows limitations. Approved GLB and
creation PNG are unchanged. Match gold is not persistent account currency.
