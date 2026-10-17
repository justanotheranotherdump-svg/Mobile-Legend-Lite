# Phase 1 delivery and acceptance report

Date: 2026-10-17. Status: **implemented and validated in the available Linux environment; Windows/user acceptance pending.** No Phase 2 features implemented.

## Scope and files

New application: `dev.html` (editable template), `index.html` (generated standalone game), `src/main.js`, `src/core/clock.js`, `src/data/{arena,training}.json`, `src/input/controls.js`, `src/simulation/{movement,game}.js`, `src/rendering/world.js`, `src/ui/{hud.js,style.css}`.

Tooling: `package.json`, `package-lock.json`, `vite.config.js`, `.gitignore`, `scripts/{package-html,check-offline,package-source}.mjs`, `tests/simulation.test.js`, `tests/browser.mjs`, `THIRD_PARTY_NOTICES.md`.

Documentation: updated root README and approval/status entries in PROJECT_RULES; this report; browser evidence `docs/phase-1-browser-results.json`; download instructions `deliverables/README.md`. Reference images and analysis were subsequently removed from the branch and source ZIP at the user's request; gameplay is unchanged.

Generated downloads: `deliverables/MOBA-Lab-Phase-1.html` and `deliverables/MOBA-Lab-Phase-1-source.zip`. Duplicate generated downloads are ignored in Git; root `index.html` is now deliberately tracked so GitHub source ZIPs are directly playable.

## Validation performed

Environment: Node 22.22.3, npm 10.9.8, Vite 7.3.7, Three.js 0.186.1. Browser: Linux Chromium 153.0.8010.0, software WebGL2. Browser was provisioned from npm, not a remote browser download endpoint. Missing Linux NSS libraries were supplied from the same package in a temporary directory. No browser-origin/file-access bypass flags were used; sandbox disabling is a container execution requirement, not an offline asset workaround.

| Category | Actual test | Result |
| --- | --- | --- |
| Dependencies | Clean `npm ci` from lockfile | PASS |
| Security audit | `npm audit` | PASS: zero reported vulnerabilities |
| Production | `npm run build` | PASS; expected informational >500 kB bundle warning |
| Unit tests | `npm test` | PASS: 11/11 |
| Camera-relative movement | Cardinal/diagonal vectors and displacement | PASS: automated unit and real keyboard browser checks |
| Frame timing | Same 2s motion at 30/60/144 render schedules | PASS: unit tests |
| Boundaries | Player radius retained on all sides; held keyboard against edge | PASS: unit and browser tests |
| Obstacles | Four approach directions, thin-wall long-step check, circle corners and sliding | PASS: unit tests; live keyboard contact/sliding also passed |
| Dummy collision | Living dummy blocks; dead dummy no longer blocks | PASS: unit test |
| Mouse aiming/camera | Project known ground point then aim there after moving; hero remains centered | PASS: browser test |
| Attack range | Invalid target, beyond range, exact range; click out of range | PASS: unit and browser tests |
| Cooldown | Immediate second click rejected; attack after elapsed cooldown accepted | PASS: unit and browser tests |
| HP/death/reset | Eight hits kill dummy, no negative HP/dead-target damage; reset restores initial state | PASS: unit and browser tests including actual reset button |
| Focus | Input clearing and clock reset; synthetic blur/focus in browser | PASS; actual OS task switching still manual |
| Resize | 1000×700, 800×600, 1440×900; canvas dimensions, centered camera, ground aiming, reset bounds | PASS: browser tests |
| Runtime errors | Captured browser errors, exceptions and warnings during all interactions | PASS: none |
| Single-file structure | Inline JS/CSS/config; dist contains only index.html; deliverable identical | PASS: structural validation |
| Root/ZIP entry regression | Root HTML and source-ZIP index alone, file://, networking disabled; CSS, movement, attack/reset | PASS; 15 offline browser checks total |
| Offline runtime | Open exact download using file://, networking disabled; record subresource requests | PASS: 15 offline browser checks total (after the entry-point correction); ZERO subresource requests |
| Visual inspection | Captured and inspected initial 1440×900 rendered screenshot | PASS: genuine depth, meshes, shadows, HUD visible |
| Development preview | Browser smoke test of Vite on port 5173; preview Host header accepted | PASS: initialized with no errors; HTTP 200 for *.e2b.app host |
| Source delivery | Source ZIP generated and `unzip -t` integrity checked; JS syntax checks | PASS |
| Windows double-click | Actual Windows Chrome/Edge, no networking | NOT TESTED HERE; user action required |
| Windows GPU/performance | Native driver/device-specific behavior | NOT TESTED HERE |

During the entry-point repair, a test-only cleanup issue closing a second context in single-process Chromium was resolved by closing all contexts with the browser at suite exit; the full rerun passed.

The initial attempt to launch browser automation failed because the environment lacked NSS libraries. This was resolved using libraries already supplied by the npm-packaged browser. The first offline structural checker also incorrectly scanned unused library code as CSS; it was corrected to inspect style contents. All reported successful results are from subsequent reruns, not assumptions based on development-server operation.

An initial WebGL shadow-map deprecation warning was fixed by selecting the supported shadow-map mode before the final passing browser run.

## Windows manual acceptance checklist

1. Download **only** `MOBA-Lab-Phase-1.html`, or extract this branch ZIP and use its root `index.html` into an otherwise empty folder. Ensure it has `.html`, not `.html.txt`, as its extension. Disconnect networking.
2. Double-click to open in updated Chrome or Edge. Confirm the location begins with `file:///`, the 3D arena renders, and there is no graphics initialization error. No terminal/server should be running.
3. Press each WASD direction. W moves up-screen, D right-screen. Compare diagonal movement with straight movement; it should not be faster.
4. Hold movement into the arena walls and the four blocks. The hero must not pass through; diagonal input should allow sliding along a block.
5. Move the mouse over the floor. The crosshair should track the cursor's ground intersection even as the camera follows movement.
6. From spawn, click the red/orange dummy. It should say out of range and retain 200 HP. Press D until within the dashed range ring, then click the dummy itself: HP falls by 25.
7. Rapidly click again: no extra damage before cooldown expires. Continue eight valid hits: dummy reaches 0 HP, becomes flattened, and displays DEFEATED. Further clicks must not damage it.
8. Click Reset arena. Both units return to spawn, dummy has 200 HP, player has 100 HP, hit count is 0 and attack is ready.
9. Hold W, Alt-Tab away, release W, then return. No stuck movement or position jump should occur.
10. Resize/maximize the window. Camera and mouse-to-ground alignment should remain correct. For comfortable desktop play, use at least 1000×700; smaller layouts were checked at 800×600 but are not a mobile-control mode.
11. Optionally open DevTools Console and Network. Reload while offline and confirm no application errors or attempted external asset requests. The page document itself is expected, not a subresource.
12. Close the browser, move the HTML elsewhere, and reopen while offline. It must still render without files alongside it. The source ZIP's root index.html must also launch without npm or a server. This milestone deliberately does not persist match state.

Report the browser/version, viewport, and failed step if anything differs. These manual tests remain pending; do not mark Windows acceptance complete until verified.

## Known limitations and deliberate exclusions

- Temporary primitives only. No GLBs, authored low-poly characters, rigs or animation clips generated or claimed.
- Hero health remains full: stationary training dummy has no attack behavior.
- Basic attack is instantaneous, requires clicking the dummy, and checks target life/range/cooldown. No auto-chase, attack-move, hold-to-fire, projectile simulation, or line-of-sight blocking is implemented.
- Flat terrain and simple circle-versus-box/circle collision; no slopes, rigid-body physics, navigation, or AI.
- Orthographic camera follows directly. There is no free-pan or zoom control in approved scope.
- Very narrow windows and low-end hardware need user evaluation; no touch-control scheme or broad device performance claim.
- WebGL2 and graphics acceleration are required. GPU context loss shows a reload instruction; hot context recovery is not implemented.
- Single-file packaging is proven for current code/config/geometry. Later GLBs/textures/audio must be added as embedded bytes with suitable in-memory loaders and their own offline validation.
- No persistence implemented; future file:// save reliability remains unresolved until its approved milestone.
- Download HTML is about 544 KiB, mostly Three.js. Future art will increase it; packaging size and memory must be reassessed then.
- No dedicated 3D-generation capability is currently exposed. Actual generated GLB artwork remains a separate, explicitly unfinished requirement.

## Offline entry-point repair (user-reported Windows screenshot)

**Cause:** the repository/source ZIP root `index.html` was a Vite development template with `/src/main.js`. Its styles were imported by that module. Double-clicking this source template bypassed Vite, preventing the module/CSS from loading and leaving an unstyled HUD. The earlier browser suite tested the separate standalone download only, missing the source-ZIP launch path.

**Correction:** the editable template is now `dev.html`; Vite uses it for both source development and build input. Packaging embeds all code/styles/config into root `index.html`, `dist/index.html` and the named download. Root index is intentionally committed, so GitHub ZIPs contain a playable game. The source archive includes both offline index and editable development source. Source packaging rebuilds first; validation checks the three copies are identical. No new gameplay features are included.

**Regression checks:** verify inline CSS/full-viewport layout, launch root index offline, extract the ZIP's root index into an empty directory with spaces/Unicode and verify offline rendering/movement/attack/reset, and recheck development preview serves the editable source rather than a stale bundle. See updated `phase-1-browser-results.json` for the performed results. Actual Windows retesting remains pending.

## Next milestone recommendation — not implemented

After the user tests and approves Phase 1: plan/approve one complete hero combat kit (Q/E/R, F, recall, mana/cooldowns, shared keyboard/clickable actions, death/respawn). Do not begin it automatically. Preserve standalone offline packaging and all Phase 1 regressions.
