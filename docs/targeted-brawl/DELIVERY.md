# Targeted gameplay / Brawl delivery

## Fix summary

- **Collision:** all living player/bot/minion bodies, both teams, participate in shared movement checks. Self/dead units do not block. Bounded steps prevent tunneling; radial contact-tangent avoidance can briefly retreat around a packed wave instead of oscillating or becoming a rigid minion wall. Controlled contact separation repairs spawn/forced-movement overlaps against the real world/structure geometry. Hook/dash/projectile execution stays separate; forced motion is not replaced by attack hit tests.
- **Structures:** camera ray selection skips invalid/hidden/allied/dead/protected foreground meshes. Explicit tower commands can approach a valid static structure beyond auto-search range. Planning, shared NPC attack checks, AI firing positions and authoritative basic validation agree on near-surface structure reach. Unit center ranges and hero stat tables are unchanged. All four lane modes and both approved heroes are covered.
- **Franco basic only:** authoritative action record publishes windup/contact/recovery to the existing approved BasicAttack clip. Damage is still scheduled once at contact; stun cancels the pending strike. Attack-speed-scaled recovery and90ms basic-only cancellation/locomotion blending are runtime adaptations, not edited model clips. IronHook/FuryShock/BloodyHunt assets and timing are untouched.
- **Respawn:** inspection found the old rule already increases with elapsed simulation time. It was not falsely reported as constant. Existing lane rules remain unchanged; Brawl has separately configurable time/level coefficients. Delay is snapshotted once at death and countdown uses the simulation clock; pause/reset/player-bot parity are covered.
- **Brawl:** separately configured mirrored bent corridor, wider pockets, bushes with real conceal/reveal, physical cover, level4/gold2500, no altar recovery, shared half-HP-healing, one-shot exit shopping grace, six typed minions/team, enhanced waves after12min, two real Frozen Crabs, two delayed healing runes, two collectible aimed collision barrels, base-only collision-safe Cloud travel, restricted utilities/role effects, and inner-tower minion-clearing wave. New controls mount after the existing HUD constructor and are disposed on exit. Existing hero selection/ownership/equipment/settings/wallet/Coins cheat are preserved.

See **SETTINGS.md** for exact values, sources and uncertainty. No user reference screenshot is shipped.

## Changed files and reasons

| Files | Reason |
|---|---|
| `src/simulation/movement.js`, `game.js`; `src/match/hero-bots.js` | Shared all-team bodies, self exclusion, smooth local avoidance and post-forced-motion separation. |
| `src/simulation/targeting.js`, `attack-command.js`, `ranges.js`; `src/match/actions.js`, `ai-spacing.js`, `ai.js`, `franco-policy.js`; `src/rendering/world.js` | Consistent structure footprint reach, valid entity ray selection, command range and neutral eligibility. Existing firing-position multiplier remains unchanged. |
| `src/simulation/hero-combat.js`; `src/rendering/heroes/pose-driver.js`; `src/heroes/integration-manifest.json` | Publish Franco basic action; basic-only recovery/cancel blend; update the changed JS adapter's own manifest hash, not any model/PNG hash. Shared Brawl HP regeneration scalar. |
| `src/match/respawn.js` | Optional validated victim-level term; existing modes retain zero level term. |
| `src/data/match/brawl.json`, `rules.json`; `src/match/brawl/config.js`, `system.js` | Dedicated Brawl economy, map, tuning, typed waves, object states/timers/rewards, shop latch, concealment and movement actions. |
| `src/match/simulation.js`, `hero-equipment.js` | Integrate mode-owned actors, damage/death/respawn/waves/rewards/shopping and player/bot hooks with common simulation. |
| `src/simulation/status.js`, `utilities.js`; `src/spells/system.js`; `src/match/role-equipment.js` | Mode-only half HP healing, Recall restriction, actual default Flicker/initial cooldown, disabled jungle/roam effects. |
| `src/rendering/brawl-world.js`, `lane-view.js` | Original procedural terrain, typed minion silhouettes, crabs, barrels, gold rune glyphs, world countdowns. No new hero assets. |
| `src/ui/brawl-hud.js`, `utility-hud.js`, `match-shop.js`; `src/runtime.js`; `src/audio/integration.js` | Separate real Cloud/barrel controls, truthful spell limitation, existing shop enforcement, correct HUD mount/dispose, local preference-respecting world cues. |
| `tests/targeted-{collision,towers,basic-respawn,brawl}.test.js` |33 added unit cases, including dense allied wave escape, all-mode towers, single contact damage, actual GLB cancel interpolation, timer parity, object/reward/re-entry/reset rules. |
| `tests/targeted-brawl-render-fixture.js`, `browser-targeted-brawl.mjs`, `browser-targeted-brawl-standalone.mjs`; `scripts/build-targeted-brawl-fixture.mjs` | Actual-renderer and normal standalone UI coverage; mutation harness is test-only, never imported into the game. |
| `tests/match.test.js`, `batch1.test.js`, `player-polish.test.js`, `browser-match.mjs` | Update obsolete Brawl3/800 expectations to requested4/2500; retain lane-fountain/legacy-respawn/Execute assertions in non-Brawl fixtures. Replace the obsolete “overlapping units remain motionless” assertions with safe separation plus successful bounded approach. Strengthen permanent-wall fixture position so the new legitimate structure-edge reach cannot attack from its near side. No tests removed/skipped/disabled. |
| `scripts/package-targeted-brawl.mjs`; `index.html`; `deliverables/README.md`; `PROJECT_RULES.md`; `docs/targeted-brawl/*` | Reproducible standalone/source downloads, current scope, baseline, sources, binary audit and results. |

## Actual verification

| Check | Result |
|---|---|
| Pre-edit full units |1,010/1,011 pass; pre-existing Saved Plan A failure. |
| Pre-edit file:// hero browser |9/9 pass after restoring an ignored historical alias from the unchanged root HTML; first attempt honestly failed with missing-file error. |
| Final full units: `npm test` |**1,043/1,044 pass,0 skipped.** Only the same Saved Plan A missing-binary/hash failure. Includes deterministic unattended Brawl simulation reaching legitimate sequential core destruction and bounding live units. |
| Added targeted units |**33/33 pass**, included above. |
| Actual renderer Brawl/browser |**8/8 pass**: approved model, real tower picking/approach/damage, Franco basic pose, crabs/runes, aimed one-use barrel UI, Cloud movement, compact layout, offline/errors. |
| Normal standalone Brawl UI/browser |**7/7 pass**: fresh profile and owned-only selection;4/2500; actual six objectives;50%-cooldown Flicker; real base purchase; Cloud route out of base; shop closure/button enforcement; compact layouts; pause/quit/disposal/wallet preservation; no external requests/runtime errors. |
| Layla aimed-ultimate framebuffer regression |**8/8 directions pass** using approved beam and exact aimed endpoints. |
| Illustrated UI/commerce HTML-only regression |**10/10 pass**, including paid Franco ownership, actual duplicate items/unique cooldowns, illustrated menus and quit/reselect. Tool initially stopped waiting at120s; process subsequently completed and wrote its successful results file. |
| Build / offline validator |Pass; inline JS/CSS/assets and root/download equality. Vite emits its normal large-bundle advisory, not a failure. |
| Binary preservation audit |**164 tracked PNG/GLB binaries unchanged** against checkpoint;21 integration-manifest PNG/GLBs unchanged. Only the explicitly authorized JS pose adapter hash changed. |
| Source packaging |ZIP integrity, root-HTML equality and excluded-path audit are checked by packaging/final verification. |

Logs under ignored `artifacts/targeted-brawl/`; durable structured results in `RESULTS.json`. Browser environments are Linux Chromium/SwiftShader with file:// and offline contexts, **not Windows/native-GPU/physical-device certification**.

### Remaining failures and limitations — not hidden

1. Historical `tests/franco-preview.test.js` “Saved Plan A HTML and source hashes are preserved exactly for fallback” still fails because historical saved Plan A downloads are absent. Not fabricated, deleted or skipped.
2. The **intermediate pre-Brawl-rework** connected-match browser run passed its first6 checks but timed out after1,000,000ms waiting for an unattended live match result (last log:471.7 simulated seconds, old3-unit/18s waves). It is **not** counted as a full browser pass. The updated long end-to-end browser-match suite has not been rerun to completion. Current final-mode real-engine unattended unit result passes; current standalone/renderer focused flows pass independently. Do not call this native-hardware or a complete all-suite browser certification.
3. Existing spell architecture supports **one real Flicker slot**, not Flicker plus a second spell. This is visible in Brawl UI. No fake second button or fake second cooldown.
4. Exact official respawn formula/cap, crab/rune amounts/radii, barrel damage/travel/untargetability and cloud timings remain unverified project tuning. Six-unit composition is a requested project rule. Older world-barrel respawn30s is a documented fallback; newer carry30s/recollect60s override old15s cooldown.
5. Reference screenshots are visual guidance only; output uses original procedural glyph/map geometry. No new hero, no kit/stat-table retune, no new mode/jungle or publication beyond the current branch workspace.

Work is saved on `arena/55ce0f80-mobile-legend-lite`; history checkpoint preserved. No push requested/performed for this task. Stop here; no next hero/milestone.
