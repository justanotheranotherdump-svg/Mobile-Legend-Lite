# Persistent project rules

Updated: 2026-10-19. Latest dated authorization below supersedes historical milestone restrictions. These user-approved requirements govern future project work. Read this file before planning or implementing any milestone. This is repository-based project memory, not a claim of platform-level AI memory.

## Workflow and approval

- Build one precisely scoped milestone at a time; obtain the user's approval before starting each milestone.
- Phase 1/1.1 foundation and targeting are the preserved baseline. Phase 2 modular hero architecture is complete. Phase 3 HUD, controls, targeting interface and combat announcements are explicitly approved on 2026-10-17. Preserve mechanics and architecture; no additional heroes, skills, shop gameplay or model/animation work is approved. Stop after this UI milestone for review.
- Start with a playable 3D foundation, not menus, mockups, or a screenshot pretending to be gameplay.
- Keep gameplay modular, preserve working features, and avoid premature polish or future-milestone implementation.
- After implementation, run available build and validation commands, fix introduced errors, provide exact run instructions, report acceptance tests honestly, list unfinished features/known issues, and recommend but do not implement the next milestone.
- A visible button, placeholder, or model is not proof that its gameplay feature works. Distinguish verified, untested, and incomplete work.

## Game vision

A genuinely 3D browser-based MOBA inspired by the general gameplay of Mobile Legends: Bang Bang. Eventually:
- Single-player 5v5: one human hero, four AI allies, five AI opponents.
- Five playable hero archetypes: Layla, Alucard, Tigreal, Estes, Lancelot.
- Elevated/isometric battlefield, three lanes, jungle camps, minion waves, turrets, bases, neutral objectives.
- Basic attacks, abilities, HP, mana, cooldowns, experience, gold, equipment, death, respawning.
- Casual and local Ranked modes, main menu, hero selection, shop, Wiki, Settings, results, persistent local progression.
- Local Ranked means offline progression against NPCs, not online matchmaking.

## Mandatory final standalone offline delivery

The final Windows deliverable must launch by double-clicking ONE HTML file, using file:// in a compatible browser:
- No hosting, local server, development tools, or internet required to play.
- No runtime CDN dependencies, remote APIs, or external model/texture/audio/data files.
- Embed ALL required code, configuration, and assets inside the standalone HTML.
- Development may use Vite and a local server, but server-based development does not satisfy delivery acceptance.
- This supersedes the earlier planning statement that production output requires HTTP hosting. A normal Vite dist folder alone is not sufficient.
- Plan and validate offline packaging from the foundation milestone onward, not only at final delivery.
- Bundle dependencies and configuration; load embedded model bytes from memory rather than fetching file paths. Include glTF dependencies and any decoder code in the package or avoid formats requiring external decoders.
- Test the actual single-file artifact through file:// on Windows, with networking disabled, before claiming this requirement passed. HTTP preview testing is not equivalent.
- Browser/WebGL support remains necessary. File-URL local storage behavior and portability must be tested; if unreliable, propose user-approved embedded-game export/import saves rather than silently promising persistence.

## Technology and modularity

Preferred stack: Three.js, Vite, JavaScript ES modules, JSON hero/ability/item data. Inspect compatibility before implementation; explain blockers rather than switching to 2D.

Keep movement, collision, combat, targeting, NPC AI, map/navigation, hero stats, skills, equipment, match state, UI, persistence, and rendering separated. Meshes and animation must not own gameplay rules. NPCs and players should use shared action validation. Keyboard and clickable skills must invoke the same gameplay actions.

Controls: WASD movement plus an optional virtual joystick authorized in Phase 3; mouse ground aiming/target selection; left mouse basic attack or target confirmation; top-row 1 first skill, 2 second skill, 3 ultimate (Digit1/2/3, not numpad or F keys; current slots remain reserved); F battle spell; B recall. Respect world collisions and correctly map mouse coordinates onto the 3D ground. Use an elevated/isometric camera. Final combat UI includes functional clickable skills.

## Genuine 3D assets required

- Primitives are TEMPORARY gameplay/debug placeholders only, not final character artwork.
- Final characters require actual stylized low-poly 3D assets exported as valid .glb files; appropriate enemies/environment assets follow as development progresses.
- Use available genuine 3D-generation capabilities to create geometry, materials, textures, and, where supported, rigging/animation. Never label a 2D generated image as a 3D model.
- Verify each actual file exists and loads correctly before claiming model completion. Validate animations separately; a static GLB is not proof of rigging or animation.
- Do not rebrand a primitive-only JavaScript export as satisfying final low-poly character artwork.
- If generation/rigging capability is unavailable, explicitly report the limitation and the remaining asset requirement. Retain functional temporary placeholders rather than fabricating completion; approved asset sourcing is needed to finish final artwork.
- Preserve independent gameplay colliders and replaceable model/animation adapters.
- Embed required validated assets into the final standalone HTML.
- Do not use ripped proprietary models, artwork, sounds, logos, or animations. References guide original work, not asset extraction or screenshot overlays.

Asset paths:
- Hero definitions and runtime models: src/heroes/<id>/ with assets/*.glb (Phase 2 overrides the earlier generic hero asset convention).
- Other world runtime models: public/assets/models/ (.glb/.gltf, subject to standalone embedding requirements)
- Textures: public/assets/textures/
- Editable Blender sources: assets/source_blender/ (.blend, only when genuine files exist)
- Hero/ability/animation configuration: src/heroes/<id>/
- Shared scenario and future equipment configuration: src/data/

## Reference images

The user requested removal of the uploaded reference images and reference-analysis files from this branch and source downloads. Do not re-add docs/references/ or package those files. Images in the conversation remain visual guidance only, not licensed runtime assets. They do not establish exact dimensions, hidden mechanics, or a final authoritative layout.

## Known capability and validation limitations

Environment inspected on 2026-10-17: Node 22.22.3, npm 10.9.8, Git/GitHub CLI, ZIP; registry access works; Three.js/Vite not installed. Repository initially contained README.md only. No Blender executable or browser executable was detected.

No dedicated text/image-to-3D generation tool is currently exposed. Available image generation produces 2D images, not validated GLB models or rigged characters. Do not promise automatic AI-generated, animated GLBs without obtaining and validating a suitable capability/workflow.

Single-file bundling is technically feasible but has not been implemented or tested. Anticipate inline JS/CSS, embedded JSON and binary assets, file:// loading restrictions, decoder/worker dependencies, package size/memory costs, and browser-specific persistent storage. Windows file:// behavior cannot be certified solely from this Linux workspace/live preview.

## Preservation

Keep source, lockfiles, tests, documentation, and appropriate assets in this repository on the Arena session branch. Do not rely on generated build directories for preservation. Ignore dependencies, caches, and transient outputs. Provide source and standalone HTML downloads at approved delivery milestones; use an explicit external-storage convention for assets that become too large.

## Phase 1 implementation status (2026-10-17)

Phase 1 foundation is implemented with temporary geometry only. `npm ci`, production/offline packaging, 11 simulation tests and 12 offline Linux Chromium file:// browser checks passed. See docs/PHASE_1.md and docs/phase-1-browser-results.json. Windows double-click acceptance is still pending; no final character GLBs or animations exist. Earlier capability findings above describe the initial inspection; a development-only npm-packaged Chromium workflow now enables Linux browser testing. Do not start Phase 2 without the user's testing and explicit approval.


## Phase 1 offline entry correction

The user reported opening the repository root index.html via Windows file:// and seeing unstyled text. That root was the Vite development template, while only the separately generated deliverable was offline-ready. Fix this delivery ambiguity without expanding scope: use dev.html for Vite development/build input and intentionally commit the generated standalone game as root index.html. GitHub branch ZIPs and the source ZIP must include that playable root file. Future runtime edits must rebuild it; validate byte equality with dist/index.html and the standalone download. Duplicate build output remains ignored. Test styling, root file launch, and the source-ZIP index in isolation with no sibling assets. Windows retesting is still required.


## Phase 1.1 — approved smart targeting scope

Four modes: nearest, lowest current HP, lowest HP percentage, manual. Auto candidates must be valid living enemies within basic attack range; ties use distance then stable ID. Direct living-enemy clicks pin a manual override; ground clicks/HUD Basic Attack use the current selection. Death/invalidation, mode changes, or Clear lock release a pin. Manual mode without a pin falls back to nearest in-range. Valid out-of-range pins remain selected but cannot be attacked. Targeting never issues movement/chasing: WASD remains the only movement input. Three dummies have distinct starting HP/max HP and distances; reset restores the configured starting values (including injured dummies), all target/player state, and cooldowns. Show selected indicator, every dummy's current/max HP, and a functional HUD selector. No abilities or Phase 2 work.

Phase 1.1 unit and offline Linux Chromium regressions passed; see docs/PHASE_1_1.md and associated evidence. Root index.html remains the committed offline game, built from dev.html. Current download names are MOBA-Lab-Phase-1.1.html and MOBA-Lab-Phase-1.1-source.zip. Reference assets stay excluded. Wait for user approval after delivering this milestone.


## Phase 2 — modular architecture only (current approval)

Refactor the actual Phase 1.1 baseline without inventing missing skills/stats. Only the existing Test Hero is registered as training; Layla and the other future archetypes are not implemented. Hero-local hero.json/abilities.json/animations.json/visual.json and placeholder.js live under src/heroes/training/. Ability and clip lists are honestly empty because none existed. Hero stats/attack values migrate exactly; scenario data retains only hero ID/spawn plus targeting/dummies. Use validated auto-discovery, immutable definitions/fresh state, code-owned allowlisted effects, and independent visual adapters. Future GLBs belong to each hero's assets/ folder, are bundled eagerly inline, parsed from memory, and may only reference embedded resources/verified clips. Retain functional placeholders on runtime asset parse failure; fail malformed data clearly. No fake assets or phantom playable roster entries.

Before/after unit and offline regressions plus a 39-snapshot exact simulation replay protect compatibility. See docs/HERO_ARCHITECTURE.md and docs/PHASE_2_ARCHITECTURE_REPORT.md. Downloads now use MOBA-Lab-Phase-2.html and MOBA-Lab-Phase-2-source.zip. Windows-specific file:// testing remains manual. Wait for approval before any new gameplay or roster expansion.


## Phase 3 — MOBA HUD/control milestone (current approval)

Approved: original landscape MOBA-style HUD inspired by conversation screenshots, live arena/player/target minimap, team-score/gold reserved space, simulation timer, basic placeholder shop/settings panels, optional movement joystick alongside unchanged WASD, current targeting modes and basic attack, three active-skill slots plus an ultimate slot, utilities/equipment/quick buy placeholders and disabled minion/tower categories. Classify every control as functional, interface-only or reserved; never fabricate purchases, skills, resources, teams or units. Joystick/keyboard share the existing camera-relative simulation movement and collisions; targeting still never moves/chases. This supersedes only the older WASD-exclusive input restriction, not any targeting/damage rules. Space is a discrete smart-attack shortcut using the same validation, not auto-fire.

Publish genuine lethal-transition/reset combat events without changing formulas or state snapshots. Training dummy eliminations are labeled as such, not fabricated hero kills/team scores. Prepare player/ally kill/death announcement rendering without injecting events when those actors/systems do not exist. Use brief queued notices, truthful cooldown/HP feedback and separate maintainable UI modules. No proprietary icons or reference uploads in Git/ZIP; local original SVG geometry only. Do not generate character models or animations. Preserve the Phase 2 hero files/registry.

Phase 3 download names: MOBA-Lab-Phase-3.html and MOBA-Lab-Phase-3-source.zip; rebuild committed root index.html. Test the actual offline file and isolated source-ZIP index, input/focus/capture, reset, smart targeting and multiple landscape sizes. Report Windows/native touch and absent-feature limitations honestly. See docs/PHASE_3_HUD_REPORT.md. Stop for user approval before subsequent gameplay/model milestones.


## Phase 3 HUD refinement — current approved correction

The user approved a narrow HUD tweak: original MOBA-style attack/minion/tower button art/arrangement; **exactly three skill buttons total** (first, second, ultimate); top-row **1/2/3**, near the F-key row, not Numpad1/2/3 or F1/F2/F3. This supersedes prior Q/E/R bindings and the initial four-slot HUD specification. Reduce Recall/Regen/battle-spell size slightly. Keep all gameplay, movement, smart targeting, attack validation, cooldowns/reset and hero configuration unchanged. Skill shortcut routing must share clickable button activation when genuinely available, but current skills/categories/utilities remain explicitly reserved and cannot cast or create nonexistent systems. Use original bundled vector artwork; do not copy the supplied reference assets. Stop after testing/rebuilding the current Phase 3 HTML/source ZIP for review.


## Settings key hints and button customization — current approved UI addition

User requested a settings toggle to hide key badges and customizable button shortcuts. Default skill keys remain top-row 1/2/3; users may choose alternative single letter/digit/numpad/arrow keys for buttons. Protect WASD, mouse aiming/attacks, Escape/Tab/Enter, function keys and modifier shortcuts. Keep bindings unique, allow Unbound and Restore default keys, update badges/help/accessibility metadata immediately, and dispatch through the same native button paths. Reserved skills/utilities/categories remain disabled regardless of binding. Hiding visual hints must not disable actions or remove accessible names. Bindings/visibility are session-local, survive arena reset but do not claim persistence across HTML reloads/file locations. Test remapping, conflicts, menus, native focused-button activation, reset/default restoration, compact settings and actual offline HTML. No new gameplay systems are approved.


## Routine-banner removal and empty landscape shop — current approved UI correction

The user requested removal of routine gameplay messages (including attack cooldown instructions) and a landscape item-shop layout inspired by their screenshots, **with no items yet, just slots**. Remove the routine message DOM/update/styles, retaining truthful training-elimination announcements, error reporting and existing HP/range/cooldown feedback. Build an original empty-slot shop with category navigation, catalog, reserved build-path/detail space and six empty equipment slots. Categories and view selection are interface-only; all slots, Purchase and Prioritize stay reserved/disabled. Do not invent item icons/names/stats/prices, gold, recipes, purchases or effects. Empty the old decorative HUD equipment icons too. Preserve three skills, action-cluster geometry, customizable key settings, modal input clearing/focus and all simulation/hero mechanics. Rebuild/test the one-file offline HTML and source ZIP, report compact layout/Windows limitations, then stop for review. References remain excluded from source/downloads. See docs/EMPTY_SHOP_LAYOUT.md.


## Attack focus/menu input fix and landscape settings — current approved correction

The user reported movement freezing when clicking Attack (but not Space), and gameplay movement continuing with Shop/Settings open. Preserve held WASD/joystick while using battlefield buttons; do not treat every button focus as an editor. Explicitly gate keyboard, joystick and canvas attacks while either modal is open, independent of focused event target. Clear inputs/capture on open/close; ignore held-key repeats so closing does not revive stale movement. Keep ordinary keyboard accessibility and shared combat validation. **Regen default is V (`KeyV`)**, still reserved without healing gameplay; preserve B/F and three default top-row 1/2/3 skills and rebind/default restoration.

Adopt an original translucent landscape Settings design inspired by the supplied references: category sidebar, Basic/Controls/Interface pages, centered header, section dividers, on/off controls and close/footer. Add working target-priority choices under Controls, sharing the existing simulation and HUD selector (no duplicate targeting rules). Preserve session-only key customization/hiding and optional joystick/reduced HUD motion. Sound/Network remain visibly unavailable; do not invent graphics-quality/frame-rate/resolution/audio/network/skill-cast options or mechanics. References remain excluded. Rebuild and verify the exact one-file offline artifact, before/after regressions, compact layouts, focus/input capture and downloads; document honest Windows/touch limitations, then stop for review. See docs/SETTINGS_INPUT_FIX.md.

## Authorized Layla reconstruction milestone — 2026-10-18
Recovery search completed before editing: remote session's full 12-commit history,
all 247 reachable historical blobs, refs/tags/PRs/releases and saved asset ZIPs
contain no working Layla kit. The user explicitly authorized intentional reconstruction
if unrecoverable. New mana/skill/buff values are editable initial reconstruction
values, not recovered/canonical balance. Preserve existing arena HP/movement/basic
attack defaults and the training regression fixture. Integrate ONLY Layla; no new
heroes, maps, AI, economy or unrelated utilities. Three skill buttons become
functional only for the capable Layla simulation; training/other utilities remain
honestly reserved. Preserve settings, targeting, modal input gating and offline build.
Copy approved GLB byte-unchanged; SHA256
963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51.
Actual clips are rigid-part Walk and Shoot, not skeletal animation. Rest pose for
idle; Shoot reused for casts; no death/dedicated skill clips. Combat owns damage,
projectiles/statuses/mana/cooldowns; renderer only consumes authoritative state/events.
Deliver test/build/GLB/offline reports, changed files, HTML/source ZIP and limitations;
stop for approval. Linux automation cannot certify native Windows/touch behavior.

## Approved combat-control / keyboard-only correction — 2026-10-18
The user tested the reconstruction and approved these superseding control rules:
stop actual player movement throughout Shoot/cast animation, then resume held WASD;
basics absolutely lock onto the chosen eligible in-range enemy, home and pass
through obstacles. Tap skills auto-target by Settings priority, with no mouse aim
required; hold pointer or the bound skill key to preview an aim sight, release to
cast, allow cancel without spending mana/CD. Targeted skill shots home; free-aim
shots stay directed. All offensive aim/projectiles pass through objects; player
movement still collides. Face movement normally, aiming/firing only when active,
not idle mouse hover. Remove default HUD target-priority card and joystick, move
hero status to the old bottom-left joystick location; priority remains in Settings.
Keep the historical training fixture explicit for older regressions, never conceal
these intentional new semantics. Preserve approved GLB bytes, actual Walk/Shoot,
three skills/default/rebind keys, stats/mana/CDs/effects, offline bundling and scope.
No new actors/maps/AI/economy. Cancel gestures on menus/reset/blur/capture loss;
Escape/right-click and a visible cancel area support cancellation. Ship new checks,
HTML/source ZIP and honest limitations; stop for review.

## Approved non-blocking Shop/Settings panels — 2026-10-18
The user clarified the superseding requirement: WASD, basic attacks and skills all
remain usable with Shop or Settings open. Use non-modal tab-like panels in the
normal game: no inert battlefield/backdrop/focus trap; preserve held keys and
ongoing actions on open/close. Visible battlefield/HUD stays clickable. Protect
text entry and key-binding/select editing from combat shortcuts. Keep Escape/X
close, skill cancel, normal combat validation, full Shoot movement lock, collision,
blur/visibility/reset clearing, no fake shop/economy and unchanged approved model.
The older explicit training fixture keeps its historical modal policy. Add default
panel-combat checks and rebuild standalone HTML/source ZIP; stop for approval.

Follow-up authorization: commit and push this verified non-blocking-panel fix to
`arena/55ce0f80-mobile-legend-lite` so the GitHub branch serves the updated game.

## Centered live panels — 2026-10-18
The user requests Shop and Settings centered in the viewport, horizontally and
vertically. Supersede the former left-side placement only; preserve non-modal
WASD/combat, held-input lifecycle, panel contents, sizing and approved model.

## Authorized front-end menu milestone — 2026-10-18
The user authorizes Create Username → Main Menu → MODE → Mode Selection → AI
Training Room → established gameplay. Restore a valid locally saved profile to the
lobby; gracefully support session-only storage fallback. ASCII usernames 4–20
letters/numbers/underscores; exactly PH/US/JP image flags and Male/Female choices.
Use the supplied alpha-bearing anime PNG (original bytes) ONLY for creation; it is
explicitly authorized runtime artwork, unlike the other uploaded reference screens.
Reuse the byte-unchanged approved GLB for lobby/modes and transfer its presentation
safely to existing training initialization. No combat or hero-config edits, new AI,
modes, economy, purchases, online accounts, multiplayer or fake stats. All other
lobby controls and Classic/Ranked/Brawl remain disabled visual previews. Bundle
original local image icons/flags, isolate menu input from game initialization,
validate file:// persistence/asset assignment/responsive/touch-emulated flows and
existing regressions; ship updated standalone/source/reports, then stop for review.

## Authorized lobby polish / audio / collection — 2026-10-18
Supersedes the prior menu-only restrictions only for these approved features:
original embedded PNG lobby environment, unchanged approved 3D Layla in lobby/modes
and gameplay; supplied original transparent illustration also allowed in the Hero
Shop; Layla already owned/free; actual coin/diamond display with a one-time local
profile starter grant of 30,000 coins / 0 diamonds, including old-profile migration.
No earning, spending, prices, new heroes, real purchases, accounts or online services.
Original locally synthesized fantasy instrumental (calm lobby / energetic training),
gesture-aware mute and volume, persisted supported Settings. Use read-only combat
events for sound, never rewrite combat or model assets. Functional lobby Shop and
Settings replace only those disabled placeholders. Retain all earlier gameplay,
non-modal panel, asset-integrity, modularity and offline delivery requirements.
Rebuild/test standalone HTML and editable source ZIP, document evidence and limits,
then stop for review. No new commit or push authorized.

## Authorized hero browser / creation refinement — 2026-10-18
Keep the whole supplied creation illustration visible, enlarge its available
presentation where layout permits, and blend its bottom edge into the background
(no new image/model). Sound controls belong in Settings, not a lobby quick button.
Replace the lobby Hero Shop with a reference-inspired original catalog layout:
role filters, one owned Layla card, empty future slots; selectable real hero cards
open a PNG detail view with role, abilities and four presentation ratings. User
explicitly chose editable, clearly labeled prototype Durability/Offense/Control
Effect/Difficulty ratings. These never affect combat or claim official values.
Use existing registry skill descriptions/numbers, not screenshot balance. Do not
invent other heroes, skins, prices, purchases, skill levels, videos or stats.
Keep approved 3D lobby/gameplay and combat unchanged, test offline/responsive and
existing regressions, rebuild standalone/source/report, then stop for review.
No fresh commit/push authorization for this new milestone.


## Authorized gameplay roadmap Phase 1 — 2026-10-18 (historical; superseded below)
This is a NEW gameplay roadmap, not the old foundation/HUD phase numbering.
Supersedes previous gameplay freezes only for: immutable per-hero base/growth and
explicit world conversions; validated levels/XP to 15; real HP/mana/regen and
numerical max-delta level-up policy; 15 total skill points (one at level 1),
S1/S2 caps 6, ultimate cap 3 at levels 4/8/12; configurable reconstructed skill
rank scaling; shared physical/magic/true damage and documented defense/penetration;
truthful live stat/rank UI and modular, labeled session-only Practice controls.
Use the user-supplied Layla reference table; label XP/rank tuning as prototype,
not official parity. Level 1 starts with unlearned actives and one point.
User explicitly approved scaling playback of the SAME Shoot clip for BASIC
attacks so actual cooldown/rate and full movement lock agree. Skill animations
and 1.05s locks remain unchanged; never change approved GLB/PNG bytes.
Preserve targeting/aim/homing/collision/WASD/key bindings/non-modal panels,
lobby/audio/profile/wallet and the exact historical training regression fixture.
No Phase 2–5 systems: Brawl map/minions/towers/base, AI/death/respawn gameplay,
items/gold/rewards, dedicated TrainingRoom/selection or new heroes. No kill XP.
Rebuild root offline HTML and editable ZIP with the existing workflow, run real
checks, document values/XP/ranks/files/limits and propose Phase 2 ONLY. Stop for
review. No fresh commit or push authorized. See docs/GAMEPLAY_PHASE_1.md.

Follow-up authorization: the user approved committing and pushing the verified
Phase 1 gameplay milestone to `arena/55ce0f80-mobile-legend-lite`. This updates
the branch only; it does not authorize starting roadmap Phase 2 or later phases.

## Authorized connected AI Training / Brawl expansion — 2026-10-18
Supersedes the prior Phase-1-only restriction for this explicit milestone ONLY:
MODE → AI mode selection → offline room → real Layla selection → honest local
setup/VS → countdown → distinct dummy Practice or new single-lane 5v5 match →
real core victory/defeat/results → replay/room/menu. Brawl shares that pipeline;
Classic/Ranked remain disabled. Implement deterministic difficulty-driven bots,
waves, two sequential towers + core per team, targeting/retaliation, death/respawn,
event XP/gold, six-slot original prototype items and real effective modifiers.
Preserve profile/wallet/audio/Shop/settings, approved GLB/creation PNG bytes,
existing Layla controls and exact historical fixture. Bot visuals are explicitly
Training Bot placeholders, not new playable heroes/final character artwork.
Correct HUD: each legal + is anchored to its own skill wrapper; upgrades never
cast; unlearned icons darken without UNLEARNED text; original local PNG icons;
actual username/HP/mana/level over player. Touch joystick + keyboard retained.
Use modular simulation/config/render/UI/lifecycle systems; no gameplay in mesh
callbacks, no copied reference art, runtime network services or packaging change.
Baseline 290 unit tests passed before edits. Add new system/flow/responsive/
offline tests; run actual available checks, rebuild root HTML/source ZIP, document
functional systems, reconstruction/balance and device/art limitations. Stop for
review; no Classic/Ranked, other playable heroes, skins/monetization or fresh push.

Expansion review handoff: connected gameplay implemented; actual final verification
is documented in `docs/AI_TRAINING_BRAWL.md` and `docs/match-verification.json`
(333 units, 143 browser checks). Approved asset bytes remain unchanged. Native
Windows/physical touch/speakers and polished bot art/team tactics are not certified.
Review only: no expansion commit/push; the authorized branch remains unchanged.

## Subsequent branch-update authorization — 2026-10-18
The user explicitly requested updating `arena/55ce0f80-mobile-legend-lite` after
the completed expansion review handoff. Commit and push the reviewed expansion
to that same branch. This supersedes the preceding review-only / no-push status,
without authorizing additional gameplay scope or another branch.

## Authorized roster / presentation / equipment follow-up — 2026-10-18
User requests an original PNG-backed reference-inspired Brawl room with editable
Computer slots on either team, no Start without enemy AI, real available-hero NPC
picks (duplicates allowed until at least five heroes exist), timed selection with
teammate picks and complete actual rosters at local loading. Preserve only-Layla
catalog and approved GLB bytes; cloned Layla NPC visuals/abilities are authorized.
Restore wide landscape shop layout, add supplied Attack catalog and Movement boots
with original PNG item art, search/sort, true six-slot inspect/select/explicit Sell.
Javelin is +8% crit for 320. Typed attack values override reference discrepancies;
boot stats are supplied by latest reference. Implement real item effects rather
than labeling unimplemented effects as working. Add a one-skill follow-up buffer
only during basic attack locks, revalidate on execution; preserve locks and clips.
Recall/Regeneration become functional. Improve original volumetric single lane and
orient allied base bottom-left / enemy top-right, with matched minimap/input.
No screenshot textures/ripped assets, extra heroes/skins/online features. Previous
push authorization was fulfilled; deliver this new work for review, no fresh push.

Follow-up review handoff: 407 unit tests and 157 browser checks executed; details
and artifact/asset hashes in `docs/ROSTER_EQUIPMENT_FOLLOWUP.md` and
`docs/roster-verification.json`. No fresh commit/push for this follow-up.

## Authorized Batch 1 — selection, controls, AI, respawns — 2026-10-18
User explicitly authorizes a recoverable LOCAL checkpoint before editing. Actual
current workspace (not historical hashes in old reports) captured in checkpoint
`d359178e9d6cf51a58d7d2a64fe53ad43266474a` on the session branch; no push.
Baseline after restoring locked npm dependencies: 407/407 units and 9 connected
browser checks passed. Initial missing-dependency attempts are not passing tests.
Implement ONLY: independent original selection background, remove description/
debug clutter, hide preview until explicit pick/reset on re-entry; proper loading
state >=10 seconds AND actual ready with no gameplay HUD leaking into lineup;
hero/minion/structure attack commands with settings-aware priority/fallback,
manual override, stale-target reacquisition and visible rejection feedback;
incremental threat-aware hysteresis/committed retreat/recovery AI; shared match-
time respawn 5 + 2 per completed minute capped45; readable hero nameplates and
selected-enemy actual HP/mana/level panel. Preserve current Brawl, camera/movement,
Layla byte assets/ability tuning/full animation locks, queued skill, utilities,
working shop and offline packaging. No shop redesign/recipes/recommendations/
prioritization, no new spells/heroes/skins, no copied reference pixels. Deliver
HTML/source ZIP/changed-file list/tests/manual limits, then STOP for approval.

Batch 1 review handoff: 448 units and 173 browser checks executed. Exact timing,
artifact/asset hashes, baseline checkpoint, scoped changes and manual limits in
`docs/BATCH_1.md` / `docs/batch1-verification.json`. Stop for approval before shop
redesign/battle spells. No further commit or push for the Batch 1 implementation.

## Explicit combined Batch 2 → Batch 3 authorization — 2026-10-18
User supplied both boundaries; clarification tool explicitly selected BOTH IN ORDER
without an intermediate approval stop. Implement shop/recipes/quick buy first,
then twelve actual battle spells/card selector/account unlocks. Baseline checkpoint
`b60f96cf240485186e5e6d7f7bd5dcfcf10cf8b0` captures completed Batch1; no push.
448 baseline units + 16 standalone Batch1 browser checks passed before edits.
Use current prices/stats/effects. Missing recipes must be editable and labeled
prototype reconstructions, not official. All catalog entries, including eight
supported legacy prototypes, must be visible. Preserve six slots/max-copy and
one-pair rules; automatic component consumption, no arbitrary slot replacement.
No full recommended builds. Spell numerical values/unlocks/cooldowns authoritative
from user's reference; original bundled art, actual shared gameplay, no visual-only
claims. No fabricated jungle/blessing/traps; explicit inactive extension points.
Keep account unlock XP separate from hero XP and wallet; configure any prototype
account earning rule, validate saved selection, no normal unlock-all UI. Preserve
Batch1 preview/10s loading, Layla bytes/kit, AI/respawns and offline packaging.
Checkpoint before milestones, deliver tests/limits/source/HTML then stop; no push.

Combined Batch2→3 review handoff: 555 unit tests and 184 browser checks executed.
Prototype recipes, exact spell rules/account XP, supported lane modes and inactive
jungle/blessing/trap/Practice cases are documented in `docs/SHOP_AND_BATTLE_SPELLS.md`
and `docs/b23-verification.json`. No additional milestone/commit/push; stop for review.

## Subsequent combined-milestone branch-update authorization — 2026-10-18
After the completed Batch2/3 review delivery, the user explicitly requested updating
`arena/55ce0f80-mobile-legend-lite`. Commit and push the reviewed current tree to
that same branch; no additional feature batch. This supersedes the preceding
review-only/no-push handoff. The sandbox checkpoint lineage and published earlier
milestone lineage diverge; reconcile ancestry without force-pushing or replacing
the reviewed working version. All published tracked files exist in this workspace.

## Authorized complete game-polish milestone — 2026-10-19
User authorizes Parts 1–10 sequentially with relevant tests between parts and no
intermediate approval stops. Local recoverable checkpoint d94cbb6 (including
published history) preserves the reviewed workspace; baseline 555/555 unit tests.
Connect existing spell selection, Preparation/builds/wiki, consistent portraits,
real local profile/history/reset and explicit developer cheats; truthful future
Emblems/Rank placeholders. Add real range indicators, persistent obstacle-safe
attack approach with category/settings/manual control, directional skill joystick,
cooldown overlays, clean announcements and saved-build component quick buy.
This explicitly supersedes earlier no-build/no-cheat/no-chase restrictions for
this milestone. Preserve approved assets/hero/spell/item definitions/camera/map,
wallet migration, offline workflow and native focused-button input safety. Use
uploaded images as visual guidance only; historical reference docs were removed
by user request and must not be restored or bundled. No new heroes/skills/ranked/
Emblem mechanics/services. Finish all parts, tests and final delivery, then stop
for review; no new push authorized by this implementation request.

## Subsequent Game Polish branch-update authorization — 2026-10-19
After the complete Game Polish review handoff, the user explicitly requested
updating `arena/55ce0f80-mobile-legend-lite`. Commit and push the reviewed current
tree to that same branch. This supersedes the milestone's review-only/no-push
handoff; it authorizes publication only, not another feature milestone. Preserve
published ancestry; no force push, reset or branch switch.

## Authorized visual Preparation and special-equipment expansion — 2026-10-19
The user authorizes the full ordered task: visual six-slot build creation, editable
research-labeled Layla presets, direct spell wiki, empty structured Emblems,
Magic/Defense/Jungle/Roaming catalog, genuine restricted blessing mechanics,
individual original PNGs, save/match wiring, AI improvements and final regression.
Preserve current equipment, model, camera, maps, combat authority and offline
packaging; no screenshot extraction, fake passives or free-item exploits. Research
conflicts must be documented. Checkpoint 0e55576 preserves restored working files
and published ancestry. Baseline 576 units passes after npm ci; an earlier attempt
without dependencies failed and is not counted as passing. Continue in order,
test each section, final delivery for review; no implementation push requested.

## Preparation Expansion branch-update authorization — 2026-10-19
After the reviewed Preparation/equipment expansion handoff, the user explicitly
requested updating `arena/55ce0f80-mobile-legend-lite`. Commit and push the reviewed
implementation to this same branch. This authorizes publication, not additional
features. Preserve published ancestry; no reset, force push or branch switch.
The existing verification certificate records the earlier pre-publication review.

## Authorized final gameplay polish before next hero — 2026-10-19
Complete in order: real null selected-hero state and empty selected portraits;
stable tower/wave AI decisions; final in-match Settings Cheats tab with only
+9999 match Gold; authoritative player/NPC combat-stat and damage parity audit;
regressions and actual offline-browser/delivery verification. No new hero, no
other cheats, no account-currency change, no unsolicited publication. Preserve
approved assets, kit, map, equipment, saves and offline architecture.

## Franco animation-preview approval gate — 2026-10-19
The user authorizes ONLY a separate offline interactive Franco model/animation
preview first. Use original authored geometry inspired by supplied appearance
references, not ripped models or screenshot textures. Include hook mechanism,
Iron Hook hit/miss, Fury Shock, six-strike Bloody Hunt, transitions and inspection
controls with honest source/clip/provisional timing documentation. Keep all new
assets outside src/heroes discovery until explicit approval. Do not integrate
Franco, abilities, role AI, presets or Classic yet. Preserve the current playable
HTML, Layla assets and all existing source/gameplay. Deliver preview HTML and
reusable assets/source; STOP for visual feedback. No new push authorized.

### Franco timing R3 feedback — preview first
The user explicitly chose "Revise the preview first" when asked whether to lift
this gate. Demonstrate exact .45 s hook cast (projectile independent), .30 s slam,
1.80 s ultimate, attack-speed scaling and movement/recovery cancellation only in
the isolated preview. Do not alter the playable game or Layla's existing locks.

### Saved Plan A and requested Plan B / Flicker preview — 2026-10-19
Preserve Timing R4 as Plan A (`previews/franco/plans/plan-a-r4.json` and
versioned R4 deliverables). User likes the current hook but requests comparison
with 0.3–0.4 s timing, a larger visible hook and Flicker combo demonstration.
Clarify whether timing means button-press-to-max-range or release-to-max-range
before changing it; Plan B is not yet defined. Keep experiments in the separate
preview; no explicit game-integration approval yet. Reference screenshots are
visual guidance, not official dimensions, physics or reusable runtime artwork.
Use `docs/HERO_MODEL_ANIMATION_INTAKE.md` to ask for exact settings on future
hero/model revisions. User intends a later Layla model/basic/skills rebuild AFTER
Franco integration; do not start that milestone or silently replace Layla now.

User clarification: Plan B means **0.40 s input-to-maximum**, proposed and selected
0.15 s actual cast + 0.25 s flight. Flicker scenario selected: **hook catch →
backward Flicker**. Authorize this separate preview experiment and larger visible
hook only; do not infer official units/hitbox bias from supplied images/text.
Plan A remains saved R4, Plan B R5 is awaiting review; no integration approval.

## Layla complete rework intake; Franco selected and parked — 2026-10-19
User explicitly prefers Franco **Plan B / R5** and asks to set Franco aside.
Preserve its versioned HTML/source/assets/settings; selection and artifact hashes
are at `previews/franco/plans/selection.json`. No further Franco retuning or
gameplay integration now. The previous Franco-before-Layla order is superseded:
prepare a complete Layla model/basic/skills rework for separate review FIRST,
then integrate both approved hero proposals together in a later milestone.
Current playable game/Layla assets/mechanics remain untouched during intake and
preview work. User invites questions about animations/range/base stats/skills.
Clarify mixed classic/current default appearance references and conflicting
passive/mark versions and all exact timing origins before authoring. Supplied
web summaries are provisional, not independently verified official frame data.
No skins, copied screenshot assets, hidden stat advantages or new push authorized.

Layla intake answers: modern Energy Gunner default; written115%-passive/stun-mark
mechanics direction; initial custom S1/S2/ultimate release points .25/.40/.65s,
basic release .25 at1.06APS, separate travel/cancellable post-release recovery,
committed ultimate wind-up. User requests researched numeric baseline presented
for approval before implementation. See `docs/LAYLA_REWORK_RESEARCH.md` and
`previews/layla/rework-intake.json`; research has unresolved version/range/travel
values and is not certified latest-live frame/stat data. Do not silently apply
researched differences or replace current assets during intake.

## Authorized complete Layla separate preview — 2026-10-19
The user's detailed eleven-phase task authorizes building the original modern
Energy Gunner model/rig/individual clips and offline interactive workshop NOW,
using Liquipedia ability tables as preliminary data without another candidate-
approval question. Research conflicts and unconfirmed timing/range/mark/beam rules
must be exposed as editable prototype alternatives. Preserve playable game and
existing Layla; leave parked Franco files untouched. Do not integrate either hero.
Deliver real offline HTML, reusable assets/source, research/test/limitations report,
test actual packaged HTML alone, then STOP for feedback. No other heroes/Classic,
shop/build changes, publication or full roster integration.

## Layla R2 ability-effects revision — 2026-10-19
Preserve the accepted original Energy Gunner model, rig, source actions, basic
attack animation and other working character parts. Revise only local Malefic
Energy effects and supporting inspection/comparison controls: small basic bolt,
elongated S1 bomb, swirling spherical S2 orb with separate impact/mark/trigger,
and immediate full-length super-long-range continuous ultimate. Range, width,
beam duration and glow are independent provisional controls. Add side-by-side
normal/slow playback. Supplied screenshots guide energy structure, not skin
changes, measured mechanics or reusable runtime textures. Keep R1 for fallback,
Franco parked and game/current Layla unchanged. Deliver R2 offline/source/test
evidence and STOP for visual review; no integration or next hero authorized.

## Authorized two-hero integration — 2026-10-19
User explicitly approves final Layla R2 and Franco B/R5 models/animations/effects
and authorizes integrating both into selection/details/showcase, practice and
existing offline lane/Brawl gameplay now. This supersedes preview-only/parked
restrictions for this milestone, not preserved preview history. Use actual GLBs
and distinct local PNGs/effects, shared combat/status/stats/AI, no hidden bot
bonuses. Franco Tank / Roam costs configurable32000Coins OR749Diamonds; preserve
Layla ownership, one-time wallet grant, saves, genuinely null initial selection,
owned-only confirmation, locked preview, recipes/equipment and all unrelated
features. No free currency/new cheats, further hero, Classic or new5v5 mode.
Run before/after tests; preserve originals/approved source assets; deliver offline
game and organized source/evidence, then STOP.

## User correction: restore illustrated UI — 2026-10-19
The user rejects replacing menu art/profile/room/loading portraits with GLB
renders. Restore the exact original Layla anime PNG and profile icon. Shop cards
and clicked hero details use the same hero-specific 2D illustration. All small
portraits, owned/profile/history/room/selection-list/loading cards stay 2D anime.
Lobby uses illustrated Layla positioned left of the invitation. Actual GLBs are
restricted to the central explicit hero-selection preview and gameplay. Preserve
the original 2D selection-stage PNG across picks and clear. This supersedes the
earlier interactive-3D-details requirement only, not gameplay model approval.
Do not alter models/kits/wallet/saves. Locked Franco still requires a real
confirmed purchase; allied computer picks do not convey ownership. No free grant.

## Latest feedback corrections — 2026-10-19
- Layla ultimate visual must use the exact released cast's world endpoint/effect
  identity; test all cardinal/diagonal directions, not just the +Z preview. Do not
  reauthor approved GLBs/animations or silently change damage/range/timing.
- Human hero selection lists only owned implemented heroes. Unowned heroes remain
  purchasable/inspectable in Shop, not selectable/previewable in the match list.
  AI roster availability is separate. Never grant ownership/currency.
- Duplicate non-boot equipment purchases are allowed, paid each time, within the
  existing six slots. Basic stats stack; identical named passives/cooldowns stay
  unique. Exactly one pair of boots INCLUDING legacy Wayfarer Boots; real component
  upgrades may replace that pair. Duplicate builds advance per purchased copy.
  This replaces old unique-item/one-active-item restrictions, not special-item
  eligibility, consumable rules, wallet isolation or gold/slot accounting.
- User provided new Franco/Layla art references and explicitly requests newly
  made matching background, transparent character, icon and Shop banner versions.
  Use newly illustrated 2D reference-inspired assets, preserve old original
  Layla artwork on disk, do not ship the uploaded references or change models.

## Targeted collision / tower / Franco basic / Brawl authorization (2026-10-24)

Current user authorizes scoped shared living-unit collision/separation, actual structure click/approach/damage, Franco basic animation only, authoritative configurable time/level respawn, and separately configured Brawl improvements. Solid structures use their near surface for basic-attack reach, consistently across planning/action validation; hero/minion combat retains existing center ranges and all hero stat/range tables remain unchanged. Forced hero skill motion/projectile hit tests remain separate from contact resolution. Preserve approved GLBs, skill assets/timings and unrelated screens/systems. Six-unit Brawl waves are a requested project rule, not asserted official fact. Prefer June2.1.88 shop/barrel updates; list numerical uncertainties and unsupported second-spell architecture rather than pretending completion. See docs/targeted-brawl/INSPECTION.md and SETTINGS.md. Existing historical Saved Plan A hash failure must remain reported. No new hero or push requested.

### Requested Franco hook extension and hero catch hold — 2026-10-24
User now explicitly authorizes longer runtime Iron Hook range and a0.5s hold on caught heroes before hauling toward Franco's current location. Runtime range chosen8 units (was6.4, +25%); retain.15s cast/.25s maximum outbound flight, damage/mana/cooldown, .18s haul/.08s hit return and other skills/basic/model assets. Non-hero catches retain.02s contact pause. Shared player/AI hook execution, collision/control-immunity/cancel safeguards and historical Plan A/B preview artifacts remain intact. This supersedes the earlier no-hook-retuning restriction only for these requested changes.

### Franco equipment recommendations — 2026-10-24
User requests Franco recommended equipment builds, including tank/hybrid variants, guided by supplied screenshots. Add reference-inspired Tank/Roam, Hybrid/Pickoff and Damage/Burst templates using supported local items in existing Preparation/build-selection/shop workflow. Use saves/selects an editable paid-item order, not free inventory or stats; preserve ownership, wallet, account/hero isolation, custom work, three-build limit, spell unlocks and one-boots rule. Emblems/spell/roam suggestions must not pretend bonuses or unlocks. Preserve Layla builds, Franco's requested hook8/hero hold0.5s, models and all unrelated combat. Uploaded reference screenshots remain excluded. No push requested.

## 2026-10-24 — Authorized Layla skill 2 activation prerequisite

- User explicitly requires Layla skill 2 not to activate unless an enemy hero is inside its current skill range. Check living/targetable/hostile hero eligibility before aim/cast commitment and recheck at release/queued execution for player and AI. No mana, cooldown or animation on rejection; HUD may show NO TARGET.
- Preserve existing range/buff, cost/cooldown, aimed projectile destination/collision/damage/mark and other skills. This is not a homing redesign. Practice hero stand-ins remain supported, while match minions/creeps/structures alone do not qualify.
- Completed verification and known historical Plan A failure: `docs/layla-skill2-gate/README.md`. No push requested for this follow-up.
