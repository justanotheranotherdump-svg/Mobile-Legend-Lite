# Persistent project rules

Updated: 2026-10-17. These user-approved requirements govern future project work. Read this file before planning or implementing any milestone. This is repository-based project memory, not a claim of platform-level AI memory.

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
