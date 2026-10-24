# Requested Franco hook update — 2026-10-24

Supersedes only the runtime hook range/hero catch timing from the earlier Brawl delivery; earlier reports remain historical.

- Range **6.4 →8 local units (+25%)**, shared by player/AI, aiming/range display and actual projectile reach. Range8 is chosen project tuning in response to “longer,” not an official MLBB value.
- Caught **heroes hold in place for0.5s**, then haul for the existing0.18s toward Franco's **current** location. Practice hero stand-ins use the same hold. Minions/neutral creeps retain0.02s contact pause.
- Existing0.15s cast +0.25s maximum outbound flight remain; configured speed32 matches the longer reach. Damage, mana cost, cooldown, post-pull stun, hit return, physical collision, control-immunity/death/interrupt behavior, other skills/basic and approved model/PNG assets are unchanged. Historical Plan A/B preview source/settings are untouched.

Files: `src/heroes/franco/abilities.json` (range/speed/hero hold); `src/simulation/ability-contract.js` (validate new bounded hero-hold parameter); `src/simulation/franco-kit.js` (hero-specific shared timing); `src/heroes/integration-manifest.json` (authorized abilities JSON hash only); existing hook timing assertions updated to the new request, plus `tests/franco-hook-update.test.js` and `tests/browser-franco-hook-update.mjs`. Root standalone HTML regenerated; source ZIP refreshed.

Verification:
- Before edits: existing two-hero focused suite48/48 pass. Checkpoint dbc75fc preserves the workspace and published branch ancestry; no push performed.
- Updated focused suite57/57 pass, including nine new cases: actual extended hit/miss reach, exact hero/player/bot0.5s hold, current-caster destination, non-hero timing, shared AI execution and caster-death cancellation.
- Actual engine/approved-renderer browser fixture5/5 pass: hook/chain catches at7.5 units; hero stays fixed during hold; pull and normal hook return; quick minion catch; zero page errors/external requests.
- Full suite1,052/1,053 pass,0 skips. Sole existing failure: historical Saved Plan A binary/hash check, downloads absent. Not weakened, skipped or fabricated.
- Build and standalone offline validator pass. Linux Chromium/SwiftShader browser checks are not native-GPU/Windows/physical-device certification.

Reproduce: `node --test tests/franco-hook-update.test.js tests/two-heroes.test.js`; `node scripts/two-heroes/build-fixture.mjs && node tests/browser-franco-hook-update.mjs`; `npm test`; `npm run build`.
