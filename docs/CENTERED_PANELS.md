# Centered Shop and Settings

Date: 2026-10-18. Requested after the non-blocking panel update.

Both normal-game panels now sit at the **horizontal and vertical center of the
viewport**, rather than the upper-left side. Their existing dimensions, compact
height override, contents, close controls and scrolling are preserved. This changes
CSS positioning only: `top/left: 50%` with `translate(-50%, -50%)`.

They remain **non-modal**: no backdrop, inert battlefield or focus trap. WASD,
keyboard attacks/skills, held-input preservation and exposed battlefield/HUD pointer
controls continue to work. A centered panel can cover some HUD controls; the game
shortcuts remain active, and closing the panel exposes those controls again. Editor
key protection and the intentional full Shoot/cast movement lock are unchanged.
No simulation, model, kit, economy or item changes.

## Validation

- `npm test`: 170/170 unit checks passed.
- `npm run test:browser:panels`: 16/16 passed, with zero runtime errors, warnings
  or subresource requests. Tests actual offline file:// gameplay and checks
  both panel centers within one pixel at 1440×900, 960×540 and 800×450. Keeps checks
  for non-modal state, bounds, close/attack access, real keyboard/pointer combat,
  preserved held movement/aim, Escape order, editor safety and blur clearing.
- Centered placement intentionally supersedes the former left-side layout assertion.
  The pointer skill check now uses the exposed Ultimate button at desktop size;
  it still requires actual skill damage, rather than clicking through panel content.
- Final browser evidence: `centered-panels-browser-results.json`.
- Build/download/root HTML must be byte-identical. Approved GLB SHA256 stays
  `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.

Files: `src/ui/style.css`, updated `tests/browser-panels.mjs`, generated `index.html`,
`PROJECT_RULES.md`, `README.md`, this report and a superseding note in `LIVE_PANELS.md`.
Downloads/source ZIP are regenerated, not tracked. Older live-panel results retain
historical evidence; native Windows/physical touch remain manual, not certified.
