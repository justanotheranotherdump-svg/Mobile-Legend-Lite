# Persistent project rules

Updated: 2026-10-17. These user-approved requirements govern future project work. Read this file before planning or implementing any milestone. This is repository-based project memory, not a claim of platform-level AI memory.

## Workflow and approval

- Build one precisely scoped milestone at a time; obtain the user's approval before starting each milestone.
- Phase 1 (playable 3D foundation) was explicitly approved on 2026-10-17. No Phase 2 or later milestone has been approved. Stop after Phase 1 for user testing and approval.
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

Controls: WASD movement; mouse ground aiming/target selection; left mouse basic attack or target confirmation; Q/E active skills; R ultimate; F battle spell; B recall. Respect world collisions and correctly map mouse coordinates onto the 3D ground. Use an elevated/isometric camera. Final combat UI includes functional clickable skills.

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
- Runtime models: public/assets/models/ (.glb/.gltf)
- Textures: public/assets/textures/
- Editable Blender sources: assets/source_blender/ (.blend, only when genuine files exist)
- Hero, ability, and equipment configuration: src/data/

## Reference images

The ten user-provided images are preserved in docs/references/ as image-1.png through image-10.png. See docs/references/README.md for analysis, constraints, and integrity hashes. They are visual/planning references only, not licensed runtime assets. Different images depict different map variants; they do not establish exact dimensions, hidden mechanics, or a final authoritative layout.

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
