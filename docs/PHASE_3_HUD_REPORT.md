# Phase 3 — MOBA HUD, controls and combat notifications

Date: 2026-10-17. Baseline commit: `0128b3f` (completed Phase 2). Scope: UI/control milestone only; approval required before any subsequent milestone.

## Delivered interface

The supplied screenshots were reviewed for general **layout and hierarchy**: corner minimap, small top-center score/time strip, currency/shop/settings at top-right, movement at lower-left, utilities/equipment below center, circular skills/basic attack at lower-right, brief upper-middle announcements. Their artwork, maps, portraits, icons, logos, character models and screenshots were **not** copied or packaged. All HUD icons are original local SVG paths in `src/ui/components/icons.js`; effects and rings are CSS. No remote fonts/images are used.

The unchanged 3D training battlefield remains visible in the center. Glass/dark-blue panels, teal live-state feedback, warm metallic action rings, muted locked placeholders and adaptive spacing replace the previous developer-style sandbox HUD. Existing enemy labels, HP, aim, selection ring and camera remain connected to real gameplay. On smaller landscape windows the target card is compact and world-label widths reduce to prevent overlap.

- Top-left: live isometric arena SVG, all four actual obstacles, player, actual dummy positions/HP, selected/dead styling, real basic-range overlay; map/range visibility controls.
- Top-center: elapsed simulation timer and reserved team-score spaces. Scores show **—**, not fake team kills. No teams, objectives or competitive match were invented.
- Top-right: reserved gold **—**, shop preview, interface settings and existing reset control.
- Lower-left: current hero/HP from Phase 2 definition/state, optional analog movement joystick and WASD hint.
- Lower-center: six placeholder equipment icons plus reserved quick buy, Recall/Regen/battle-spell slots.
- Lower-right: three active slots and one ultimate slot (all reserved), large functional basic attack with actual cooldown ring/countdown/readiness, disabled minion/tower priorities.

## Complete control classification

Every interactive control has `data-control-kind` and an accessible label/title. **Functional** means a verified current gameplay/state/input binding; **interface-only** means a working presentation interaction without a missing gameplay claim; **reserved** means no action/gameplay implementation.

| Control / display | Class | Actual behavior |
| --- | --- | --- |
| WASD | Functional | Original camera-relative movement, collisions, diagonal normalization |
| Movement joystick; visibility setting | Functional | Analog input into same movement path; optional; no extra speed |
| Minimap player/obstacles/dummies | Functional display | Projects real arena/state, not a screenshot or invented map |
| Toggle minimap; toggle its range overlay | Functional | Presentation of real state; no camera move/attack/world-ring changes |
| Smart targeting dropdown, four modes | Functional | Original nearest/current HP/HP percentage/manual policies |
| Clear lock | Functional | Releases pin, respects current policy/cooldown |
| Ground click / direct enemy click | Functional | Original attack/pin/rejection behavior, never moves/chases |
| Basic attack orb / Space | Functional | One request through the same range/target/cooldown validation |
| Basic cooldown ring/countdown/readiness; player/target HP | Functional displays | Actual existing values only; no fake skill cooldown/mana |
| Reset arena | Functional | Original full reset plus input/visual/notice cleanup |
| Session timer | Functional display | `simulation.time`; pauses on blur and resets with simulation |
| Actual target elimination announcement | Functional display | Lethal damage transition; training label, no hero/team score claim |
| Shop trigger/close/backdrop/Escape | Interface-only | Opens/closes labeled preview; no purchasing or item effects |
| Settings trigger/close/Escape/help | Interface-only | Local presentation/settings panel; modal focus handling |
| Reduced HUD motion | Interface-only | CSS animation preference; respects OS preference, no rule change |
| Skill I/Q, Skill II/E, Skill III/3, Ultimate/R | Reserved, disabled | No ability engine exists in current hero baseline; labels aren't bindings |
| Recall/B, Regen, battle spell/F | Reserved, disabled | No spells, recall, regeneration gameplay added |
| Six equipment slots, quick buy, six shop preview cards | Reserved | Original placeholder icons only; no stats, prices, inventory/purchases |
| Minion/tower target-priority buttons | Reserved, disabled | Categories configured as unavailable; no such units are simulated |
| Team kills / gold | Reserved displays | **—** with reserved labels; no fabricated economy or scoring |
| Future team/objective/equipment information | Reserved space | No simulated objectives, allies or progression |

Only the actual training-dummy category is available. The future-category capability list is isolated in `targeting-controls.js`, not added to combat filtering/calculations.

## Input and interaction

- Joystick axes are bounded to a unit circle, have an 8% deadzone and map screen-up/right to the same camera-relative inputs as WASD. Nonzero keyboard movement takes priority; vectors are **not added**, avoiding extra speed.
- Pointer capture supports dragging outside the control; release, cancellation, capture loss, blur, resize, reset and hiding the joystick clear movement/knob/capture. Multiple movement inputs do not bypass collision or arena boundaries.
- Joystick pointer events never call attack; canvas retains mouse aim, click-to-pin and smart attack. No click-to-move or chasing was introduced.
- Space is a discrete smart-attack shortcut; repeat keydowns are ignored. Focused native attack buttons use Enter/Space without firing twice. Reserved keys have no gameplay handlers.
- Native modal dialogs focus/trap interaction, support Escape/close/backdrop, clear movement on entry/exit and return focus to the battlefield. WASD is suppressed while using dialogs/forms, not permanently lost after closing them.
- Settings are session-only. No storage/persistence, sound system, fullscreen system or nonexistent gameplay setting is claimed.

The expanded browser suite caught a first-input-after-Settings-close focus issue. Closing is now handled synchronously on button/cancel/backdrop paths; the asynchronous native close event no longer clears newly pressed movement keys. Immediate WASD after Escape is explicitly regression-tested.

## Actual combat events, without fabricated notifications

The baseline had `lastAttack` and HP state but no reusable combat-event stream. A small presentation-neutral `CombatEvents` transport was added. The existing validated attack emits **one** death event only when actual successful damage takes a living target from HP > 0 to zero. Rejected/nonlethal/dead-target attacks and selection changes do not emit deaths. Reset emits a reset event that clears queued notices. Event metadata is cloned/frozen; presentation subscriber errors cannot alter the attack result. Damage, targeting, cooldowns, counts and snapshots are unchanged.

`CombatNotifications` subscribes to this stream. A pure classifier and bounded queue support:

| Event classification | Presentation | Runtime status in this arena |
| --- | --- | --- |
| Player defeats training dummy | Small “Target eliminated”, actual dummy name | Connected and browser-tested using actual attacks |
| Player kills enemy hero | Prominent “Enemy slain” | Prepared/unit-tested; no enemy heroes exist |
| Player is killed | Prominent “You have fallen” | Prepared/unit-tested; dummies cannot retaliate |
| Ally kills an enemy | Smaller allied announcement | Prepared/unit-tested; no allies exist |
| Ally is killed | Smaller allied death announcement | Prepared/unit-tested; no allies exist |

No startup/demo/testing controls inject those unavailable events into the delivered game. Training eliminations do **not** increment fictional competitive team scores. Notices animate in, show briefly (2.4 active seconds for minor; 3.2 for prominent), dismiss automatically, and clear on reset. Prominent notices preempt minor ones; backlog is bounded to six. The component does not cause damage, grant gold, respawn anyone or create actors.

Future legitimate publishers can use `{type:'death', time, actor:{id,name,kind,team}, victim:{id,name,kind,team,hp:0}}`. The classifier distinguishes `kind: 'player'`, `kind: 'training-dummy'`, and `team: 'enemy'/'ally'`. This is a prepared presentation contract, **not** a new team/NPC/death system implementation.

## Architecture / changed files

No Phase 2 hero JSON/registry/GLB/visual files, original world renderer, movement/targeting algorithms, arena data, dummy data or damage handler were changed.

| Path | Change |
| --- | --- |
| `dev.html` | Minimal editable shell, canvas/error/labels and modular HUD mount |
| `src/ui/layout.js` | Region templates and responsive HUD hierarchy, not combat logic |
| `src/ui/components/icons.js` | Original inline vector symbols |
| `src/ui/components/buttons.js` | Consistent icon/tool/reserved-button components |
| `src/ui/minimap.js` | Live SVG projection, obstacle and entity markers/range |
| `src/ui/targeting-controls.js` | Existing modes/clear pin and future-category capabilities |
| `src/ui/cooldowns.js` | Actual basic cooldown formatting/ring; reserved skills untouched |
| `src/ui/panels.js` | Shop/equipment previews, modal behavior, UI preferences/help |
| `src/ui/combat-notifications.js` | Event classification, bounded priority queue and notice DOM |
| `src/ui/hud.js` | Compose modules; bind real status/world labels/time |
| `src/ui/style.css` | Theme/reset/world-label/status styles; local CSS imports bundled by Vite |
| `src/ui/styles/layout.css` | Region geometry, minimap, compact landscape breakpoints and notices |
| `src/ui/styles/controls.css` | Original action/joystick/button states and cooldown treatment |
| `src/ui/styles/panels.css` | Readable shop/settings/modal styles |
| `src/input/joystick.js` | Bounded virtual axes, input arbitration and safe capture/reset |
| `src/input/controls.js` | Preserve WASD/pointer; accept virtual axes and discrete Space |
| `src/simulation/combat-events.js` | Shared presentation-neutral event transport |
| `src/simulation/game.js` | Minimal real lethal-transition/reset hooks, no calculation changes |
| `src/main.js` | Supply controls to HUD and shared smart-attack callback |
| `tests/hud.test.js` | 17 pure/domain regression tests |
| `tests/browser-hud.mjs` | Real pointer/keyboard/HUD/modal/minimap/notification/layout acceptance |
| `tests/browser.mjs` | Retain previous checks, integrate HUD checks, Phase 3 paths and explicit dev timeout/foreground |
| `scripts/package-html.mjs`, `scripts/check-offline.mjs`, `scripts/package-source.mjs` | Phase 3 artifact names, same single-file contract |
| `index.html` | Rebuilt committed offline artifact |
| `README.md`, `PROJECT_RULES.md`, `deliverables/README.md` | Current instructions/classifications/approval scope |
| This report and `phase-3-*.json` | Durable before/after verification evidence |

Source CSS/JS is split and formatted for maintenance; the final distribution alone is bundled into one HTML. Runtime icons and all UI templates/styles are compiled inline. Dependency versions and lockfile are unchanged; no runtime dependencies were added.

## Validation

**Final automated acceptance PASSED.** Evidence: [unit results](phase-3-unit-results.json), [before-browser results](phase-3-before-browser-results.json), [after-browser results](phase-3-browser-results.json).

| Check | Before | After |
| --- | --- | --- |
| Unit tests | 72/72 PASS | 89/89 PASS; all original 72 retained |
| Offline browser checks | 24/24 PASS | 35/35 PASS; all original 24 retained |
| Actual file:// WebGL2, styling, movement, targeting, combat, reset | PASS | PASS |
| Named HTML / root HTML / isolated ZIP HTML | PASS | PASS |
| Runtime errors, warnings, subresource requests | 0 / 0 / 0 | 0 / 0 / 0 |
| All four target modes, pins, death fallback, no chasing | PASS | PASS unchanged |
| Minimap/real positions, session timer/pause/reset, map controls | Not present | PASS |
| Real-pointer joystick, normalized diagonals, keyboard priority | Not present | PASS |
| Pointer release outside, blur/reset, synthetic cancel/forced capture loss | Not present | PASS |
| Modal/keyboard focus, optional stick/reduced motion, honest placeholders | Not present | PASS |
| Space and native focused-button attacks, actual cooldown feedback | Not present | PASS |
| Actual lethal-target notice, no fake scoring, dismiss/reset | Not present | PASS |
| Five landscape sizes: region nonoverlap, hit-testing, clear center, usable dialogs | Not present | PASS |
| Vite source/WebGL smoke and invalid-hero banner | Not run this baseline round | PASS supplementary checks |
| Prepared player/ally kill/death classifications and priority queue | Not present | PASS unit tests; unavailable runtime actors not fabricated |
| Clean npm ci, production/hero/offline validation | PASS baseline | PASS final |
| Clean rebuild vs exact browser-tested HTML digest | Not applicable | PASS |
| npm audit | Not rerun baseline | PASS, 0 vulnerabilities |
| Source ZIP integrity/current sources/isolated HTML/no references | PASS | PASS |
| JavaScript syntax and Git whitespace checks | Not rerun baseline | PASS |
| Native Windows / physical touch devices | NOT TESTED | NOT TESTED |

The deterministic **39-snapshot** baseline remains identical:

`14d08bd6e93e44c09c3d7481eb73ef8e9b76ce0e5f77b12388ca1a64a3edc296`

The final HTML under browser verification has SHA-256:

`e106b189ca64eeac68be54ed2557c2415506d47974415476acb4fad8c56e5d2d`

Browser testing uses actual file:// HTML with networking disabled, ordinary file-origin security, Linux Chromium 153/software WebGL2. It tests the named download, repository root index and ZIP's root index copied **alone** to a spaces/Unicode directory without sibling assets. No HTTP preview is substituted for offline acceptance. Supplementary Vite/source and invalid-hero startup-banner tests are separate.

Commands:

```bash
npm ci
npm test
npm run validate:heroes
npm run build
npm run validate:offline
npm run package:source
npm run test:browser
# Optional, with Vite already running:
DEV_TEST_URL=http://127.0.0.1:5173 npm run test:browser
```

Expected Vite warning: bundle exceeds 500 kB because Three.js/GLTFLoader, configuration and HUD are intentionally embedded into one file (~696 KiB HTML). It is not a build failure.

## Pending native acceptance / limitations

- **Windows native double-click: NOT TESTED here.** Download one HTML, move it alone to an empty folder, disconnect networking, double-click with current Chrome/Edge and verify style/WebGL, input, targeting, attacks/cooldown/reset, minimap and modal focus. Linux automation is not Windows certification.
- Physical touchscreen/multitouch devices: NOT TESTED. Pointer-event joystick works in desktop-browser real-pointer automation; synthetic cancel/forced capture-loss tests are identified as such, not hardware certification.
- Landscape sizes tested by automated layout/hit-testing: 800×600, 854×480, 1024×600, 1440×900, 1920×1080. Portrait/very small windows and all browser/OS combinations are not certified; no unsupported viewport is advertised as mobile-ready.
- No new heroes, abilities, mana, gold, shop gameplay, items/equipment effects, spells, healing, respawn, allies, enemy heroes, objectives, competitive match, save system or modes were added.
- No genuine character models/rigs/animations were created. Existing placeholder art is unchanged. All four skill slots are reserved, because the actual baseline has no implemented hero skills.
- Team/player/allied hero death events cannot occur in this training simulation; only the classifier/queue is tested for those future event types. No false runtime screenshots or claims are made.

## Deliverables / stop

- `deliverables/MOBA-Lab-Phase-3.html` — one self-contained offline file; identical to root `index.html`.
- `deliverables/MOBA-Lab-Phase-3-source.zip` — current playable root HTML, modular source, lockfile, tests and docs; no reference screenshots/notes, dependencies or duplicate builds.

**Stop here and wait for user approval. Do not begin roster, ability, full-shop or character-model/animation work.**
