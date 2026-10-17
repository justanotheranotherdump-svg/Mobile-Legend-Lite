# MOBA Lab — Phase 1

A genuinely 3D, single-player training sandbox using Three.js and Vite. **Phase 1 only; ready for user acceptance testing.** Read [PROJECT_RULES.md](PROJECT_RULES.md) before future work. No Phase 2 approval has been given.

## Play without development tools

Download `deliverables/MOBA-Lab-Phase-1.html`. On Windows:

1. Save the HTML file to a local folder. If downloaded in an archive, extract it first.
2. Disconnect from the internet (or disable network adapters).
3. Double-click the HTML. If Windows opens an editor, use **Open with → Google Chrome or Microsoft Edge**.
4. It should open as `file:///…/MOBA-Lab-Phase-1.html`. No server, installation, sibling assets, or internet is needed by the game.
5. Click inside the arena if necessary to focus keyboard input.

Requires a modern browser with **WebGL2** and graphics acceleration. The exact standalone artifact passed automated offline file:// tests in **Linux Chromium 153**, not Windows. Windows Chrome/Edge acceptance remains manual; see [docs/PHASE_1.md](docs/PHASE_1.md).

## Controls and scope

- **WASD**: camera-relative movement. Diagonal speed is normalized.
- **Mouse**: ground aiming with a crosshair; the faint dashed circle is the 6m attack range.
- **Left-click the dummy**: one basic attack per click, if within range and off cooldown. There is no auto-move or held-button auto-attack.
- **Reset arena**: restore both units, positions, HP, hit count, feedback, and cooldown.
- Switching focus pauses simulation and clears held input.

Start by pressing **D** to approach the dummy on the right. Attacks deal **25 damage**, have **0.65s cooldown**, and defeat the **200 HP** dummy in eight hits. The dummy does not fight back; the player's 100 HP stays full in this milestone. Dead dummy geometry is visibly flattened until reset.

Included: elevated orthographic following camera, real 3D temporary geometry, arena/obstacle/dummy collision, ground aiming, targeting, range/cooldown validation, HP feedback, reset and minimal HUD.

Not included: skills, battle spells, recall, AI teams, minions, full map, jungle, shop, equipment, progression, menus, final artwork, GLBs, rigging or animation assets. Q/E/R/F/B are intentionally not implemented.

## Develop and validate

Node.js **22.22.3** and npm **10.9.8** were used. Vite 7.3.7 supports Node 20.19+ / 22.12+; modern Node 22 is recommended. Version-pinned dependencies and lockfile are preserved.

```bash
npm ci
npm run dev -- --port 5173
```

Open the development URL shown by Vite (or Arena's live preview). Server binds to `0.0.0.0` and accepts `*.e2b.app` preview hosts. No browser-facing backend or localhost API is used.

```bash
npm test                 # 11 pure simulation/clock tests
npm run build            # Vite build, inline packaging, offline structure checks
npm run validate:offline # Recheck generated deliverable
npm run test:browser     # Exact HTML, file://, offline Chromium interactions
npm run preview -- --port 4173
npm run package:source   # Source ZIP, requires the zip CLI (available in Arena)
```

The browser test uses development-only `playwright-core` and npm-packaged Linux Chromium with software WebGL. On the minimal Arena Linux environment it extracts bundled NSS libraries into a temporary folder. On another platform set **BROWSER_PATH** to an installed compatible Chromium/Chrome executable instead; e.g. Windows PowerShell:

```powershell
$env:BROWSER_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run test:browser
```

If automated browser prerequisites are unavailable, report that explicitly and perform manual acceptance tests; do not treat them as passed. The browser test's focus test dispatches synthetic blur/focus events; real OS task switching remains a manual check.

## Standalone packaging

Vite bundles Three.js, JSON configuration and application modules into one JS entry. `scripts/package-html.mjs` embeds that entry and its CSS into HTML, includes the Three.js MIT notice, removes generated external assets, and writes:

- `dist/index.html` — production output (only file in dist).
- `deliverables/MOBA-Lab-Phase-1.html` — identical downloadable file (~544 KiB).

No single-file plugin, external fonts, CDN, fetched JSON, runtime model files, decoder, service worker, or network API is required. A Vite >500 kB chunk warning is expected because intentionally bundling Three.js is required; it is not a failed build. Future GLB bytes/textures/audio must be embedded and decoded in memory. A future asset pipeline must fail validation if it introduces external dependencies; this milestone does not claim to implement future GLB loading.

Source ZIP excludes node_modules, .git, caches, generated HTML and test screenshots; download HTML separately. It includes the original reference images for planning only. Neither screenshot art nor reference logos are embedded in the game.

## Source map

| Path | Responsibility |
| --- | --- |
| `src/simulation/` | Mesh-independent movement, circle/box collision, combat, dummy lifecycle, reset |
| `src/core/clock.js` | Fixed timestep and capped catch-up |
| `src/input/controls.js` | Keyboard, pointer, focus handling |
| `src/rendering/world.js` | Three.js scene, camera, raycasting, temporary visual adapters |
| `src/ui/` | State-driven HUD, reset input, responsive layout |
| `src/data/` | JSON arena and training-unit configuration |
| `tests/` | Unit and offline browser checks |
| `scripts/` | Standalone packaging, structural validation, source archive |
| `docs/` | Phase 1 acceptance report and unchanged visual references |

Future runtime models: `public/assets/models/`; textures: `public/assets/textures/`; editable Blender source: `assets/source_blender/`. Empty directories may not appear in Git; create them when genuine assets arrive. No models or Blender sources are claimed in Phase 1.

Add `#diagnostics` to the HTML URL only when debugging to expose a read-only state snapshot and world-to-screen projection helper. It cannot change gameplay state. Normal play does not require it.

## Preservation

Source, lockfile, tests and docs live on the Arena session branch. Generated `dist`, downloads, node_modules and test artifacts are ignored by Git and can be regenerated. Obtain the HTML and source ZIP from the delivered downloads; source is the authoritative preserved project. No commit/push is required for Arena to preserve source edits.

Phase 1 results, known limitations, and the Windows acceptance checklist: [docs/PHASE_1.md](docs/PHASE_1.md).
