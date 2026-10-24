# Targeted gameplay and Brawl work — inspection before implementation

Checkpoint: df26ab08a7c6d6bfa13c5a97312dff9aab3a6e20, preserving remote eb6ed33 ancestry. No push requested.

Baseline: npm test 1,010/1,011 pass; existing Saved Plan A binary/hash failure. Browser hero guide 9/9 pass, file:// Chromium/SwiftShader. First browser invocation failed because ignored historical HTML alias was missing; restored an exact copy of existing root index.html, then reran successfully. Logs: artifacts/targeted-brawl/.

Confirmed causes:
- Collision: player movement receives enemies only; NPC movement receives no circles; spacing only steers bots around heroes. There is no shared contact separation. Self must be excluded when supplying all actors.
- Tower commands: existing categories/damage already support structures. However Franco's center-range approach endpoint (1.32) lies inside the forbidden body clearance (player radius + tower radius + .06), making A* return null. Structure attacks need consistent surface-distance checks in command planning and authoritative attack release. Renderer also takes the first intersected mesh without checking living/hostile/protected status, so invalid foreground actors consume clicks.
- Franco basic: attack() schedules damage but never sets heroAction. The approved model's pose driver samples heroAction and otherwise drives idle/run, overriding the requested basic clip. Skill actions already publish this record. Fix the missing basic action, not model/skill assets.
- Respawn: existing rule is already time-dependent: min(45, 5 + 2 * floor(matchSeconds/60)), fixed at death through respawnAt. Available file history contains the same rule. No evidence supports claiming a constant-timer source bug. Preserve other-mode settings; add independently configurable Brawl pacing and test authoritative-time, death snapshot, player/bot, pause/reset behavior. Exact official formula is unverified.
- Brawl currently shares lane geometry, 3 uniform minions every 18s starting immediately, normal altar recovery, level3/gold800, common respawn; special objects are absent. Two towers/core per team already exist.

References inspected 2026-10-24:
- https://event.bittopup.com/news/2-1-88-patch-notes — June 17, 2026 patch mirror: shop five seconds after leaving, combat closes it; barrel carry30s/per-hero recollect60s from pickup; Flying Clouds/reset on respawn; enhanced minions after12min. Prefer these over older barrel15s cooldown.
- https://mlbbdex.com/en/game-modes/brawl and https://mobile-legends.fandom.com/wiki/Brawl — level4/gold2500, no altar recovery, half healing, crabs30s/30s after death, runes30s/35s after pickup and5s collector delay/40% area mana, inner-tower death minion-clearing wave.
- https://mobile-legends.fandom.com/wiki/Death explicitly labels respawn calculation as needed. No reliable exact formula recovered.

Six minions/team (3melee,2ranged,1siege) and30s waves are requested project settings, not established MLBB facts. Exact neutral rewards, HP, damage/radii, cloud duration/cooldown and respawn coefficients remain configurable project tuning. Older barrel world respawn30s is a documented fallback, not verified by the June patch. No reference screenshots or third-party ripped art will ship.
