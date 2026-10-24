# Spawn acceleration and permeable units — 2026-10-24

## Latest instruction supersedes earlier contact behavior

User reports heroes speeding up on spawn and explicitly requests removing hero/minion collisions. The earlier targeted-collision authorization is historical, not the current desired behavior. Heroes, minions and other living units now pass through one another. Do not restore hard unit blocking or push-apart separation in future fixes.

## Exact causes and scoped changes

1. `BrawlSystem.botIntent` automatically called `useCloud` whenever a bot was at its base with Cloud ready. Initial spawn and respawn reset that cooldown, causing immediate high-speed travel. Removed this automatic call. Ordinary player and AI movement use existing actual movement stats; the explicit Flying Cloud button still works.
2. `moveEntity` blocked against every supplied living actor circle. The tangent fallback then made units detour around heroes/minions. Walking now considers only living towers/cores as solid circles, in addition to world geometry/bounds. The fallback applies only to solid structures.
3. `separateLivingUnits` also pushed overlapping units apart after each match update, producing extra displacement beyond normal walking. It now repairs only structure overlaps; living-unit overlap never pushes either body. Structure safety is retained.
4. Smart-attack `approachPath` independently treated all living actors as obstacles. Updated it to the same structure-only collision rule so clicking attack does not get stuck waiting for permeable units.

Normal hero/boots stats, Franco's approved out-of-combat passive movement bonus, Layla's skill buff, skills, forced movement, range, health, mana, cooldowns and AI combat policy are not retuned. AI may still choose different firing arcs or normal-speed soft steering; that is not solid body collision. All attack/projectile/hook hit geometry remains independent and unchanged. Layla's recent skill-2 target gate and Franco's hook/build recommendations are preserved.

## Verification

- Before edits: targeted collision/Brawl/AI baseline **23/23 PASS**.
- Focused: `node --test tests/targeted-collision.test.js tests/spawn-no-unit-collision.test.js tests/targeted-brawl.test.js tests/ai-spacing.test.js tests/player-polish.test.js tests/layla-skill2-gate.test.js tests/two-heroes.test.js` — **121/121 PASS**.
- Six new tests: real shared player/NPC movement in Brawl and lane mode; AI initial spawn and real respawn do not auto-launch Cloud; actual opening simulation movement is bounded by actual movement speed; manual Cloud still works; overlapping targets still receive real skill damage.
- Existing `targeted-collision` assertions requiring unit separation were intentionally replaced by exact straight-line displacement/no-push assertions, including both teams, a compact six-unit wave, low frame rates, and retained walls/structure blocking. The two `player-polish` overlap fixtures now require the minion not to move, retain tower category/real firing checks, and wait explicitly for a **fired** result rather than stopping at a merely **ready** target. No tests removed or skipped.
- `npm test` — **1087/1088 PASS**. Only unchanged historical failure: missing saved Plan A downloads, `tests/franco-preview.test.js:48`.
- `node scripts/build-targeted-brawl-fixture.mjs && node tests/browser-spawn-no-unit-collision.mjs` — **3/3 PASS**. Actual MatchSimulation, LaneView and approved Layla GLB traverse an overlapping real enemy hero/minion at exact normal speed without detour or push; offline/no runtime errors.
- `node tests/browser-targeted-brawl-standalone.mjs` — **8/8 PASS** on rebuilt root `index.html`. Includes new spawned-bot no-Cloud/no-cooldown assertion, real explicit Cloud button, existing normal-account entry/shop/wallet/compact/pause/disposal checks, zero runtime errors/external requests.
- `npm run build`, `npm run validate:offline`, source ZIP integrity/root-byte equality/exclusion audit and `git diff --check` — PASS.

Linux Chromium/SwiftShader offline file:// testing is not Windows/native-GPU/physical-device certification. Test-only fixtures are not imported into production or exposed as gameplay cheats. Logs/screenshots remain local under `artifacts/spawn-no-unit-collision/` and are excluded from source delivery.

## Downloads / reproduction

- Current playable offline HTML: `deliverables/MOBA-Lab-No-Unit-Collision.html` (same bytes as root `index.html`). Open directly in a compatible WebGL browser; no server/network required.
- Editable source + playable root: `deliverables/MOBA-Lab-No-Unit-Collision-source.zip`.
- Sizes/hashes: `deliverables/No-Unit-Collision-Manifest.json`.
- Development: `npm ci`, `npm test`, `npm run build`; optional preview `npm run dev -- --host 0.0.0.0`.
