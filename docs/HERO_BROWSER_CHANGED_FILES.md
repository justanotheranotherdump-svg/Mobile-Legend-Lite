# Changed files — creation and hero browser

Baseline: `37352329dbd2c5a676f6b9edb36bc542ba35b32a` on the fixed session branch.
The prior shipped lobby/audio/profile implementation is preserved; this milestone
contains no new simulation, hero balance, combat-input, model or animation edits.

Added:
- `src/menu/hero-presentation.js`: UI-only ratings, approved catalog IDs, filtering,
  and current-config ability prose/facts.
- `src/menu/hero-icons.js`: reuses existing original vector icon vocabulary.
- `src/menu/hero-details.js`: PNG hero view, real role/current stats, rating bars,
  passive/skill read-only sheets, controls/unsupported-feature notes and focus.
- `src/menu/hero-browser.css`: complete creation-art bottom blend; responsive
  catalog/sidebar/filters and PNG details, compact-height skill visibility.
- `tests/hero-browser.test.js`: seven pure catalog/rating/fact/navigation tests.
- `tests/browser-hero-browser.mjs`: actual offline creation, search/roles/empty
  slots, PNG details, skill sheets, keyboard/touch/back and training handoff.
- `docs/HERO_BROWSER.md`, this manifest, and current `hero-guide-*` evidence.

Updated:
- `src/menu/shop-screen.js`: catalog/search/role filter UI instead of lone card.
- `src/menu/application.js`, `navigation.js`: Shop ↔ Hero and nested Escape policy;
  catalog filter/search/scroll state retained while inspecting hero.
- `src/menu/lobby-screen.js`: removes lobby quick sound UI/subscription only.
- `tests/browser-polish.mjs`: superseded sound button and single-card assumptions
  updated; all 13 audio/wallet checks remain.
- `package.json`: adds `test:browser:heroes`; dependencies/lockfile unchanged.
- `README.md`, `deliverables/README.md`, `PROJECT_RULES.md`: active instructions and
  user-authorized scope; prior `docs/LOBBY_POLISH.md` marked historical.
- Generated root/download/dist HTML, source ZIP and ignored build manifest.

Unchanged assets: original supplied creation/Shop PNG and approved Layla GLB, all
hero definitions, simulation/input implementation, training UI/panel behavior and
original locally synthesized audio. Supplied screenshot references are not copied
into runtime or source ZIP; no hero/skin/skill art extracted from them.

The user has not authorized committing/pushing this new milestone. Stop after
verified deliverables for review.
