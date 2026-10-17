> Subsequent approved correction: [landscape Settings and attack/menu input fixes](SETTINGS_INPUT_FIX.md). The empty-slot shop below is preserved.

# Empty landscape shop / routine-banner removal

Date: 2026-10-17 · Approved UI-only correction following the key-settings milestone.

## Delivered

- Removed the routine live message banner entirely: movement instructions, out-of-range prompts, attack cooldown instructions and hit-result chatter no longer appear above the arena.
- Preserved actual training-elimination announcements, the startup/error banner, blur/pause feedback, target HP/range and the existing Attack Ready/cooldown indicator. Combat and attack rejection rules are unchanged.
- Replaced the narrow decorative “armory” cards with an original landscape equipment-shop layout inspired by the supplied references, not copied proprietary art.
- Left category navigation, **16 empty catalog slots**, a reserved build-path area with **4 empty guide slots**, blank item-detail space, and **6 empty equipment slots** along the bottom. The six equipment slots in the battlefield HUD are also empty, rather than decorated with fake item icons.
- All equipment / Simple view switch four-/three-column layouts; Simple view can scroll the catalog. Category buttons change only the selected heading/highlight; there is no catalog data to filter.
- All slots, **Purchase** and **Prioritize** are natively disabled and classified reserved. Gold/price remain **—**, not an invented balance or cost. No item artwork, item names, stats, actual recipes, inventory, purchases or effects were added. Dotted build lines are empty layout guides only.
- Kept the prior session-only hide-key/remap settings, exactly three skills, original attack/minion/tower cluster and smaller utility controls.

## Classification

| Area | Status |
| --- | --- |
| Existing movement, targeting, basic attack, cooldown, reset and real elimination event | Functional, unchanged |
| Shop open/close, categories, view selection | Interface-only |
| Empty shop/HUD equipment, build guides/details, Purchase/Prioritize, gold | Reserved; no gameplay/data |
| Prior key customization/hide hints | Functional session-only preferences; retained |

Native dialog modality still clears input and suppresses gameplay keys, supports Tab/Enter, Escape, close button and backdrop dismissal, and returns focus to the battlefield. Disabled slots are excluded from keyboard activation; category/view buttons expose selected state through `aria-pressed`.

## Verified before / after

Fresh baseline: **101/101 unit tests**, **41/41 offline browser checks**.

| Check | Result |
| --- | --- |
| Unit suite | **104/104 PASS**, all previous 101 retained |
| Offline browser suite | **45/45 PASS**, all previous 41 retained |
| Routine message DOM absent; original out-of-range rejection still enforced | PASS |
| Slot counts, no decorative item icons/images, disabled purchase/build actions | PASS |
| Native/synthetic reserved-button activation leaves player/enemy/attack state unchanged | PASS |
| Categories and view selection affect interface only; scrollable Simple view | PASS |
| Keyboard open, Escape/close/backdrop, focus return, no stuck movement | PASS |
| Shop bounds, close-button hit testing, visible equipment/purchase regions, no shell overflow | PASS at 1920×1080, 1440×900, 1000×700, 800×600, 854×480 |
| Actual desktop/compact shop screenshots | Visually inspected at 1440×900 and 854×480 |
| Existing key settings, movement/joystick/collision, targeting/range/cooldown/reset, genuine elimination and five-size HUD layout | PASS |
| Named HTML, root HTML and isolated source-ZIP HTML, offline file:// | PASS |
| Runtime errors / warnings / subresource requests | **0 / 0 / 0** |
| Supplementary Vite source smoke / invalid-hero-data banner | PASS / PASS |
| Build, hero validation, offline structure/parity, source archive integrity | PASS |
| npm dependency audit | **0 vulnerabilities** |
| Native Windows double-click / physical touch devices | **NOT TESTED** in this Linux workspace |

Evidence: [unit before/after](shop-layout-unit-results.json), [browser before](shop-layout-before-browser-results.json), [browser after](shop-layout-browser-results.json). Browser: Linux Chromium 153, software WebGL2, networking disabled, ordinary file-origin security. Old assertions for six decorative shop cards and the routine range banner were intentionally replaced with the requested empty-slot/banner-absence assertions, while retaining their simulation checks. The arbitrary old icon-count threshold was adjusted for removal of decorative item symbols; original bundled HUD vector coverage remains.

The unchanged deterministic simulation regression still checks **39 exact snapshots**, SHA-256:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

Exact browser-tested standalone SHA-256 (must match final rebuild):

`bc1b9cccb3e3458f030a342a976707789f46a73b2342b64751b552146524baf0`

## Changed files

- `src/ui/shop-panel.js` — isolated original empty-slot markup, slot-count constants, interface-only category/view handlers. No simulation/economy dependency.
- `src/ui/styles/shop.css` — scoped landscape shop framing, empty circular slots, build guides, equipment footer, compact media styles. Does not change the settings layout.
- `src/ui/panels.js` — compose shop module; empty old HUD equipment icons; preserve settings and modal lifecycle.
- `src/ui/layout.js`, `src/ui/hud.js`, `src/ui/style.css`, `src/ui/styles/layout.css` — remove routine banner DOM/dictionary/update and obsolete styles; import new shop styles.
- `src/ui/styles/panels.css` — remove superseded decorative shop-card styles; retain settings/key-editor styles.
- `tests/shop-panel.test.js` — three new unit cases for empty markup, disabled/reserved controls and accessible interface-only navigation.
- `tests/browser-shop.mjs` — four new offline browser acceptance groups covering empty slots/no mutation, category/view controls, modality/input and five-size layout; saves ignored screenshots.
- `tests/browser-hud.mjs`, `tests/browser.mjs` — integrate acceptance checks; intentionally update old UI expectations while retaining gameplay assertions.
- `index.html` — rebuilt tracked self-contained game.
- `README.md`, `PROJECT_RULES.md`, `deliverables/README.md`, `docs/KEY_CONTROL_SETTINGS.md` — updated current instructions/scope and historical forward link.
- This report and `docs/shop-layout-*.json` — durable before/after results.
- Regenerated ignored downloads: `deliverables/MOBA-Lab-Phase-3.html`, `deliverables/MOBA-Lab-Phase-3-source.zip`.

No simulation, input algorithms, hero data/registry, damage/range/cooldown values, world geometry, model/animation assets, dependency manifest or lockfile changed. Reference images remain outside the repository and source ZIP. Transient screenshots/logs are ignored under `artifacts/`.

## Play / reproduce

**Windows:** download `deliverables/MOBA-Lab-Phase-3.html`, place it alone in a folder, disconnect networking and double-click in current Chrome/Edge. No server or sibling files required. Open Shop, inspect the empty slots, switch categories/views, close it, then check attacks, real eliminations and preserved key settings. The source ZIP also includes the same playable root `index.html`.

Development: `npm ci`, `npm run dev -- --port 5173` (0.0.0.0; live preview permitted). Tests/package: `npm test`, `npm run package:source`, `npm run validate:offline`, `npm run test:browser`. Optional source smoke: `DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser` from the sandbox only; browser-facing code uses no localhost backend URL.

Known limitations: shop is a layout only; no item/economy/build system exists. Catalog can scroll in Simple view/compact layouts. Native Windows and physical touch acceptance remain manual. Genuine character GLBs/animations, skills, mana, ally/enemy hero systems, spells, minions/towers, scores and persistence remain unimplemented, not unlocked by this UI change. The intentional Vite >500 kB warning is expected for the single self-contained Three.js HTML (~714 KiB).

**Stop for review.** No item gameplay, roster, asset or other milestone is authorized by this request.
