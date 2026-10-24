# Brawl reference decisions and configurable project settings

Rules live separately in `src/data/match/brawl.json`; other modes retain `lane.json` and their original starts/economy/respawn. The map is one bent, mirrored corridor, two towers and core/team, two bushes, two reachable object pockets/side, physical cover rocks. No jungle, Turtle, Lord, altar target or extra lane.

## Reference-supported behavior

- Level4 / gold2500. No altar HP/mana restoration. HP healing halved, including regeneration, spells, items and rune healing; shields are not halved by the HP-healing scalar.
- Five-second purchase grace begins on the first exit this spawn. Combat closes it immediately; returning to base never resets it. Death/respawn opens a new window. Buying/selling/quotes/quick-buy share serverless simulation enforcement, not only button styling.
- Two Frozen Crabs: first30s, respawn30s after death, actual neutral bodies/HP/damage, killer healing/shield/reward, nearby contributing allied assist gold. Stationary until forced displacement, retaliate only in melee against a recent attacker. No invisible jungle camp.
- Two runes: first30s, respawn35s **from pickup**. Continuous collector healing during5s, then allied HP/mana burst in real radius; mana restores40% maximum, bounded by missing mana. Collector death cancels immediately, even before a later respawn. Gold spiral/concentric ground glyph is original procedural art inspired by the supplied visual, not a shipped screenshot. Global world timers and locally synthesized pickup/completion/cancellation audio respect existing audio preferences/unlock.
- June2.1.88 patch: barrel carry30s, per-hero recollect60s from initial pickup. Newer patch supersedes old15s cooldown. First spawn20s is secondary-reference supported. World respawn30s after pickup is the older reference fallback; June patch did not confirm it. Cooldown survives death; carry does not. Root/stun/suppression/casting prevents activation; aimed one-use travel uses world/structure sweep and first enemy collision, brief untargetability and true impact damage. Death, expiry, use and match reset clear carry/travel.
- Flying Cloud is a separate base-only movement action, with collision-safe actual travel and cooldown reset on respawn. Does not replace or secretly trigger a hero skill/battle spell.
- Enhanced minions after12min; referenced enhanced melee MDEF40 and siege MDEF50, siege MDEF growth6. Inner-tower destruction clears lane minions without fake player rewards.
- Recall/Arrival/Retribution and jungle/roam effects unavailable. Brawl's functional spell is Flicker with initial50% cooldown; its account-level exemption is scoped only to Brawl.

## Requested project settings, NOT verified exact MLBB rules

Six units **per team**:3melee/2ranged/1siege, first30s/every30s. Typed HP, damage, reach, cooldown, gold/XP, shapes and projectiles are real; rewards are guarded once per death. Formation and wave cadence are the user's project preference, not a claimed official composition.

## Provisional, explicitly local balance tuning

- Respawn: `min(45,4 + 1.5*completedMinutes + .3*(level-1))`. Death snapshots authoritative elapsed simulation time and victim level; no wall-clock dependency. **45 is a project cap, not a verified official cap.** Other modes preserve existing `min(45,5+2*completedMinutes)` with zero level coefficient. No historical alternate formula was recovered.
- Typed minions: melee850HP/65damage/1.35reach/1.2s/40gold/90XP; ranged520HP/75/4.5/1.4s/45/95; siege1350HP/110/5/1.8s/75/130. Enhanced HP×1.8, damage×1.4, ranged MDEF24; siege MDEF growth applied per completed minute after12min. These base stats, multipliers and growth cadence are project tuning.
- Crab1500HP, defenses18, damage65, reach1.5, attack interval1.3, gold40/assist20/XP100, killer heal8% maxHP before Brawl healing scalar, shield180 for8s, contributor radius8.
- Rune pickup radius1.1;5s collector heals2.5% maxHP/s before scalar; burst20% maxHP before scalar, area radius5. HP amount/radius are not verified official numbers.
- Barrel pickup radius1.1; travel12 units at20/s; impact radius2; true damage200+10/level; untargetable.35s. Exact values are project tuning.
- Cloud base radius4; travel18 at14/s; cooldown25s. References verify the feature/reset, not these numbers.
- Franco's shared hero model, skill assets/timing/stat tables are unchanged. No unverified Brawl hero-specific modifier or skill cooldown reduction has been invented.

## Unsupported architecture, not pretended complete

The existing game has **one battle-spell slot**. This delivery provides one real default Flicker and does **not** claim to implement default Flicker plus a second spell. Adding a genuinely selectable/castable second spell requires a separately authorized input/selection architecture change. Brawl HUD explicitly says “single spell slot in this build.” Existing bots likewise retain their existing hero-kit/equipment architecture, without fabricated automatic second spells.

Sources inspected2026-10-24: https://event.bittopup.com/news/2-1-88-patch-notes ; https://mlbbdex.com/en/game-modes/brawl ; https://mobile-legends.fandom.com/wiki/Brawl ; https://mobile-legends.fandom.com/wiki/Death . June patch selected over conflicting older barrel/shop descriptions. Reference uncertainty is intentional, not an official-rules claim.
