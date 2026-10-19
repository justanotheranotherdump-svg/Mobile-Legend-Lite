# Creation artwork and hero catalog/detail guide

Date: 2026-10-18. This approved UI milestone builds on commit `3735232`.
No new hero, skin, gameplay mechanic, price or purchase has been added.

## User decisions and appearance

The user selected **show the complete creation illustration and blend the bottom
edge**, not crop it offscreen. The same original 1536×1024 PNG stays byte-identical.
Its layout allocation increases from 1.16:1 to 1.25:1 relative to the form on wide
screens, and a CSS alpha mask blends its lower edge into the existing background.
It uses `object-fit: contain`, no viewport crop, no generated body extension.
The form and compact viewport behavior are preserved.

The separate lobby sound button is removed. Actual master/music/effects switches,
volume sliders and audio reset remain in lobby/training Settings. Music, gesture
unlock, visibility lifecycle and persisted preferences are otherwise unchanged.

## Shop

Original reference-inspired structure: header/back/search/wallet, left category
rail, seven role filters, vertically scrollable five-column catalog (four columns
on narrower screens, three on very narrow screens). **Layla + 14 empty slots** in
All/Marksman. Other role/search results honestly show no matching heroes and 15
empty slots. Empty space has no hero identity, price, click handler or purchase.
Featured/Skins are explicitly unavailable. No extracted commercial screenshots,
hero cards or skill artwork are bundled.

Role filters and case-insensitive name/role search actually work. Clicking the
owned Layla card (or native keyboard activation) opens her guide. Back returns to
the same search, role and catalog scroll state, without reload or wallet changes.
The historical Test Hero fixture is deliberately excluded from the catalog.

## Hero guide

Large original PNG with a smaller appearance thumbnail; name/Marksman role on the
left; four prototype rating bars; expandable real training stats; passive and
three skill inspect buttons. At compact height the current training-stat section
stays collapsed initially, so the skill buttons remain visible. Other information
can scroll; close controls remain reachable. No 3D model is loaded for the guide.
Approved 3D Layla is retained in lobby/modes/training, with the same single-model
handoff. Hero detail is presentation only, not match initialization or selection
of a different combat hero.

User-approved **subjective prototype presentation ratings (out of 10)**:

| Durability | Offense | Control Effect | Difficulty |
|---|---|---|---|
| 3 | 8 | 4 | 3 |

Explicit UI-only disclaimer appears by the bars. Scores live in the editable
presentation module, never hero gameplay config, and are neither official ratings
nor calculated balance. They never alter damage, HP, targeting or difficulty.

Inspect Passive / Skill I / Skill II / Ultimate to open a read-only details sheet.
Names, cooldown, mana, base damage, range, windup and relevant parameters come
from the already validated runtime registry. Descriptions explain this prototype's
actual effects, not numbers from the supplied commercial screenshots. The facts
have one current configuration, **not fabricated six-level upgrade tables**.
Notes expose actual tap/hold/cancel controls and clarify unsupported critical
hits, lifesteal, spell vamp, equipment scaling, levels and videos. Escape closes
the ability sheet first, then returns from hero to Shop, then from Shop to lobby.
Focus returns to the selected ability when a sheet closes.

No extra skins, ratings gameplay, video playback, wishlist counts, chapter levels,
stories, builds, accounts, rewards, purchases or fabricated online features.

## Modules and future extension

- `src/menu/hero-presentation.js`: authored UI metadata/ratings, approved catalog
  IDs, role/search filtering, read-only ability prose and facts.
- `src/menu/hero-icons.js`: existing original local vector icons for abilities.
- `src/menu/shop-screen.js`: genuine filter/search/catalog UI.
- `src/menu/hero-details.js`: PNG guide, rating bars, facts, notes and skill sheet.
- `src/menu/hero-browser.css`: scoped creation/catalog/detail responsive styling.
- `application.js`, `navigation.js`: Shop → Hero → Shop routing and Escape policy.
- `lobby-screen.js`: remove only the quick sound button and its subscription.
- `tests/hero-browser.test.js`, `browser-hero-browser.mjs`: seven new unit cases and
  normal-flow offline creation/catalog/guide/touch/keyboard/training assertions.
- `tests/browser-polish.mjs`: adapt only superseded sound-button/catalog selectors;
  all existing audio/wallet checks remain. Other gameplay suites unchanged.

Future approved heroes need their own registered gameplay definition, PNG asset
and presentation metadata; the present catalog intentionally has only Layla.
Do not turn empty slots into fabricated heroes or reuse Layla's art for new ones.
Combat/hero JSON, model/animation files, input code and simulation are unchanged.

## Verification and delivery

**200 / 200 unit tests passed. 118 browser checks passed:**
9 hero-guide + 13 audio/wallet + 11 menu + 19 Layla combat + 16 live panels +
50 historical foundation. Each successful browser report has zero runtime errors,
warnings and subresource requests. Hero-guide and audio/wallet suites were repeated
after the final compact-layout refinement. The final guide tests additionally
assert all four skill buttons fit without scrolling at the three target sizes.
Existing combat/input implementations were not changed.

Evidence: `hero-guide-unit-results.json`, `hero-guide-browser-results.json`,
`hero-guide-polish-browser-results.json`, `hero-guide-menu-browser-results.json`,
`hero-guide-layla-browser-results.json`, `hero-guide-panels-browser-results.json`,
`hero-guide-foundation-browser-results.json`.

Production build, hero schema validation and structural offline checks passed.
The expected >500 kB Vite bundle warning remains (standalone embedded assets), not
a browser runtime warning. Actual standalone file:// tests run with networking
disabled; touch is emulated. Visual inspection confirmed the creation blend at
1440×780, catalog at 1280×720, guide at 960×540 and final compact guide at 844×390.
Screenshots can be regenerated under ignored `artifacts/hero-browser-*.png`.

Final HTML: **5,119,510 bytes**, SHA-256
`b0778cfdbfeaee7b9f6f313cd70979d556c12c7e0b3ad376804aa93261638dbd`.
The original GLB/illustration hashes match the previous approved milestone:
`963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51` (GLB),
`bc2b258b61ddceb7aa9abe9a82c9ebe25d30b7ba91c6d3a58a57b4f15005fca1` (PNG).
The final source ZIP is byte-checked against every included workspace file; its
external checksum is in ignored `deliverables/BUILD_MANIFEST.json` to avoid a
self-referential archive hash.
Generated root `index.html`, `dist/index.html`, and named standalone download must
match. Editable source ZIP excludes dependencies, screenshots and proprietary
references. Linux Chromium software WebGL/touch emulation is not native Windows,
physical touch or physical speaker certification. No commit/push for this new
milestone: stop for review.
