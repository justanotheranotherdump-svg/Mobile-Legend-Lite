# Editable rosters, hero draft, equipment and lane presentation

2026-10-18 · follow-up to pushed commit `172cc8c` on `arena/55ce0f80-mobile-legend-lite`.
This new work is for review; the earlier push authorization was fulfilled and no
fresh commit/push is performed for this follow-up.

## What changed / how to play

1. Open root **index.html** or the identical named HTML in `deliverables/`.
   Existing local profile/account coins/Layla ownership/audio are preserved.
2. MODE → **BRAWL** now opens a PNG-backed, staggered-slot room. It starts with
   the human only. Tap an empty slot to add an allied/enemy **Computer**; × removes
   it. Up to four allied and five enemy Computers. **Start is disabled and the
   flow authority refuses entry without an enemy.** Fill both teams is a real
   configuration shortcut. Other lane rooms keep their useful populated defaults
   and support editing; Practice remains the separate dummy sandbox.
3. START GAME → the real shared Layla GLB, hero details/icons, available hero pick
   on the right, **actual teammate picks/ready states on the left**, 45-second
   selection timer. Pick Layla and Confirm to start early (all local Computers are
   ready); expiry selects the only available hero and confirms. Back cancels the
   owned timer. Replay uses the same guarded selection again.
4. Loading shows **every actual allied and enemy hero**, names and local Computer
   labels. Seven preparation tasks control progress. A completed lineup is shown
   for a minimum total presentation of 1.2 seconds; this is explicitly completed
   preparation, not fake internet progress or separate AI download percentages.
5. Lane gameplay now uses the **actual Layla hero kit for Computers**, not the
   former generic pulse. They have separate progression, legal ranks, mana, skill
   cooldowns, projectile/mark ownership and accepted action locks. Both blue and
   red kits validate team-relative targets. Rendering clones the approved model's
   object hierarchy and shares its immutable geometry/materials/clips, with an
   independent mixer per Computer; no second GLB parse or replacement rig.
6. **Duplicates are allowed while fewer than five playable heroes exist.** The
   team-pick allocator enforces per-team uniqueness once there are five. Currently
   only Layla is implemented/available; no reference characters/skins are faked.
   Adding actual future hero assets and kits remains separate work.
7. The **wide landscape shop** returns: categories, All Equipment / Simple Mode,
   catalog, recommendation strip, item detail/purchase side, six equipped slots
   along the bottom. The playable catalog is **29 Attack items + 8 Movement boots**.
   Magic/Defense are visibly unavailable. Search and ascending/descending price or
   listed-stat sorting operate on real catalog metadata. Recommendations inspect
   actual items; no recipe tree, prioritized builds or build costs are fabricated.
8. Inspect an item → select a free/replacement slot → Purchase. **Select an equipped
   slot to inspect it and reveal Sell; selection alone never sells.** Sell refunds
   floor(60% cost), frees exactly that slot and recomputes bonuses. Replacement
   credits that refund once. One copy per item; at most one Movement pair. Match
   gold is separate from the account wallet. The previous eight prototype item
   records remain hidden for compatibility/regression coverage, not in the shop.
9. **Javelin costs 320 and grants +8% critical chance**. All 37 visible items have
   original local 128×128 PNG illustrations, not extracted screenshot sprites or
   reused skill icons. The supplied typed attack prices/stats are authoritative
   (including Rogue Meteor 900). Boot values follow the supplied reference; Rapid
   Boots' unusual +12 HP is retained literally rather than silently corrected.
10. **Basic → skill follow-up:** submit one valid skill during the basic attack's
    full adjusted Shoot lock. It is queued without spending mana/cooldown or
    interrupting the attack; at lock completion it revalidates target, mana,
    learned rank, status and cooldown, then casts once with the original 1.05s
    skill lock. Latest valid submission replaces the one queued skill. There is
    no infinite combo queue. Cancel/blur/pause/reset/death clear it. Hold/aim/
    release/cancel and native/rebound keys use the same path.
11. **Recall (B):** eight-second channel, return to own configured spawn; movement,
    attack/cast, damage, stun or death cancels. No new instant invulnerability or
    full-resource refill; existing spawn recovery remains real. **Regen (V):**
    restores 18% max HP / 9% max mana over six seconds, 60s cooldown, capped to
    current maxima; combat/casting, damage or death interrupts it. These utility
    values are explicit local prototype rules, not claimed official patch parity.
    Native Space/Enter on a focused utility/shop button activates that button without leaking into attack; rebound B/V still work. The F battle-spell slot remains reserved.
12. The original volumetric stone causeway now has engraved stone material,
    railings/braziers, canyon rock supports, original statues, chains, bank
    greenery and distinct spawn pads. **Blue base is bottom-left, red top-right**
    in camera and minimap; WASD and pointer projection match that orientation.
    Greenery is scenery, not a falsely implemented stealth/bush mechanic. Practice
    camera, map/config and the legacy modal fixture remain separate.

## Item mechanics implemented

The authoritative `src/match/item-effects.js` owns timers/stacks/procs. The shop
only submits transactions/active commands. All time is simulation time; pause
freezes effects. Attribute recalculation starts from immutable base/growth + the
current inventory and active temporary layer, never repeated additive mutation.
Selling removes item-dependent bonuses; sell/rebuy does **not** clear unique
Lifeline/Wind Chant cooldowns. Gold and equipment are reset on fresh matches.

- **Berserker's Fury:** +40 percentage points to crit multiplier; Doom +5% PA / 2s
  on a real critical basic. **Despair:** pre-damage PA bonus against low-HP
  non-minions, 2s. **Heptaseas:** quiet-time Ambush damage and slow, consumed once;
  minion combat does not itself reset the non-minion quiet timer.
- **Corrosion:** +80 physical on-hit, five ranged-adjusted slow stacks, Impulse
  AS stacks. **DHS:** current-HP extra damage (minion cap 60), Devour lifesteal.
  **Swift Crossbow:** adaptive extra damage and weaker Impulse. Stronger shared
  named Impulse wins rather than stacking two copies of that unique effect.
- **Endless Battle:** skill arms a 3s Divine Justice window; next basic deals true
  bonus and real heal, 1.5s cooldown. **Golden Staff:** crit → AS conversion; every
  third basic accelerates the same Shoot clip/accepted lock and triggers on-hit
  effects twice more, with a 5.0 rate cap for that attack.
- **Great Dragon Spear:** ultimate speed buff 7.5s, 15s cooldown. **Haas:** 2s AS on
  crit. **Hunter Strike:** consecutive same-hero hits and decaying movement buff.
- **Magic Blade / Rose Gold:** shared Lifeline cooldown, pre-hit shield and
  decaying speed; stronger Rose shield wins. Rose's lifesteal-derived defenses
  use the supplied non-Fighter half effect. Damage is absorbed by actual shields.
- **Malefic Gun:** range increase, unique percent penetration, short hit speed
  buff. **Malefic Roar:** additional target-defense-dependent penetration. Shared
  Armor Buster applies once; flat penetration from distinct items adds.
- **Sea Halberd:** timed healing/new-shield reduction and actual bonus-HP damage
  comparison. Existing shields are not retroactively shredded. **War Axe:** timed
  combat stacks, class-adjusted PA and full-stack true bonus; actual spell vamp.
- **Wind of Nature:** **USE on the equipped icon**, or Activate in the shop,
  grants actual physical-only immunity for 2s on Layla; 90s cooldown. Not a fourth
  hero skill or a fabricated F spell. Magic/true damage remain valid.
- **Windtalker:** timed three-target magic chain, level scaling, minion multiplier,
  crit eligibility and basic-hit recharge reduction.
- **Components** grant their supplied stats. CD reduction caps at 40%, basic
  lifesteal at the existing 50% prototype cap. Penetration/crit/HP/AS/movement/
  magic power/defenses are real computed fields, not only descriptions.
- **Boots:** actual display→world movement conversion; Arcane magic penetration;
  Demon Shoes recent real minion kill/contribution mana recovery; Magic Shoes
  CDR; Rapid temporary combat penalty; Swift AS; Tough control/slow reduction;
  Warrior timed incoming-physical-hit defense stacks.

## Architecture / assets

- `src/menu/match-flow.js`: roster bounds, start/confirm guard, pick policy.
- `src/menu/match-screens.js`, `match-flow.css`: room/draft/actual loading layout,
  owned selection timer, responsive landscape. `assets/room-sky.png`: original
  generated PNG sky; no screenshot or copyrighted reference pixels embedded.
- `src/match/hero-bots.js`: same-kit AI adapter; `src/simulation/targeting.js` and
  hero combat now support an explicit source team while preserving default legacy
  eligibility. Marks are owned by their caster, not globally stolen by duplicates.
- `src/rendering/heroes/clone-visual.js`: independent object/mixer clones of shared
  approved assets; safe disposal detaches them before scene resources are freed.
- `src/data/match/items.json`, `equipment.js`, `item-effects.js`: catalog, atomic
  transactions/modifier aggregation, stateful effects. Generic pulse balance in
  the older lane data is retained for compatibility; normal Computer damage now
  comes from actual hero definitions/ranks, not that retired generic pulse.
- `src/ui/match-shop.js`, `item-art.js`, `assets/items/`: wide live shop and local
  PNGs. `scripts/create-item-art.py` authors those illustrations (optional Pillow
  development dependency only; game/source archive already includes the PNGs).
- `src/simulation/utilities.js`, `src/ui/utility-hud.js`: real utility commands,
  timers/healing and input/readouts. Shared hero-combat input buffer preserves
  original accepted basic/skill animation locks and assets.
- `lane-view.js`, `world.js`, `minimap.js`: original scene, flipped projection,
  compatible camera-relative input and scene-owned texture/resource disposal.

## Honest limits

This is a local prototype reconstruction of the supplied item snapshot, not a
claim of exact current official MLBB parity. Passive trigger ordering is explicit
in the item module; generated damage procs do not recursively generate more item
damage procs. No recipe/component discount tree was supplied, so purchases are
direct full-price. No jungling, neutral creeps, networking/friends, skins, extra
playable heroes, or new official art is added. Computer equipment shopping and
advanced team tactics/crowd avoidance remain out of scope. Dense unit labels and
bodies can still overlap. No promise of performance on physical phones or native
Windows: tests use Linux Chromium software WebGL and trusted touch emulation.

The approved GLB and creation illustration retain their recorded SHA-256 hashes.
Historical reports remain evidence of their own milestone, not descriptions of
this superseding UI/catalog. Current execution counts/evidence are recorded below
when the final serial browser verification completes. No new commit/push.


## Test-run corrections / regression intent

Baseline before this follow-up: **333/333 unit tests passed**. Current unit run:
**407/407 passed** (74 additional checks including 37 catalog modifier cases).
The existing basic-lock test now expects the explicitly authorized buffered skill
rather than rejection, without changing its full lock/no-early-mana assertions.
NPC tests now inspect real hero-kit cooldowns instead of the retired generic
pulse timer; retreat fixtures isolate the actor from other heroes' legitimate
stuns. The real-projectile crit/lifesteal test equips items and uses a deterministic
RNG instead of mutating fields overwritten by authoritative stat recomputation.

Validation caught and fixed the old enemy-only eligibility assumption when reusing
the hero kit for red Computers: both teams now use source-relative eligibility,
with an explicit live-kit damage/no-friendly-fire regression. It also caught a
procedural texture unpack-state warning: the new floor texture explicitly disables
flipY. The corrected connected/draft runs have zero warnings. An initial draft
assertion expected the old renderer's parse count on a newly created returned
renderer; it now correctly asserts **zero new parses** with the retained visual.
Incomplete/diagnostic runs are not counted as completed passing suites.

Browser verification includes the real 45-second timer, ten actual loading cards,
9 real-model Computers, native utility activation without extra attack, equipped
slot selection/explicit Sell, Javelin/boots stats, flipped view/input/minimap,
offline resources, legacy fixtures and actual core results/replay. Final completed
suite counts are appended after execution; screenshots are development evidence,
not runtime art. Native Windows/physical touch/speakers remain manual.


## Final executed verification

| Command / suite | Passed |
|---|---:|
| Baseline `npm test` before this follow-up | 333 / 333 |
| Final `npm test` | **407 / 407** |
| `test:browser:roster` | 9 |
| `test:browser:draft` (real timer / full 5v5 lineup / touch) | 5 |
| `test:browser:layla` | 19 |
| `test:browser:progression` | 10 |
| `test:browser:panels` | 16 |
| `test:browser:recovery` | 5 |
| `test:browser:menu` | 11 |
| `test:browser:polish` | 13 |
| `test:browser:heroes` | 9 |
| `test:browser` (legacy foundation / HUD / input) | 50 |
| `test:browser:match` (complete result / replay / return) | 10 |
| **Browser total** | **157** |

The final connected suite tested the exact hash-identified delivered HTML, with
zero JavaScript errors, warnings or runtime asset requests. It exercised full
5v5 initialization earlier in the flow, and used the newly editable **1v1 Brawl**
roster for the unattended natural core result: **Defeat at 5:04**, actual player
level 5, 0 eliminations/deaths/assists, 0 earned gold, 0 enemy structures destroyed.
Those are observations of that idle run, not fabricated player achievements or
promised outcomes. Fresh replay reset the match and restored menu GLB reuse.
Pure simulation also executed a complete normal full-size 5v5 core outcome; the
separate draft browser suite verified all ten real-model actors and live touch.

The actual 45-second selection timeout was awaited, not injected/fast-forwarded.
Both complete team rows were audited in loading. Fault recovery intentionally
produced four expected WebGL creation error entries across two denied contexts;
there were **zero unexpected errors**. Exact HTML/source-ZIP isolation and
Unicode/spaces file paths remain covered by the retained browser suites.

Final screenshot inspection covered room/selection/map at 1280×720, 960×540 and
844×390, compact shop and full-roster touch. The original hero, skill badges and
lower-right attack/utility anchors remain intact. No physical-device performance,
Windows double-click or speaker-listening certification is implied.

An initial expanded-shop assertion exposed affordability only refreshing on the
next frame after item inspection; it now updates synchronously on inspection and
replacement changes. The live-economy assertions also account for **real combat
income occurring while the non-modal shop is open**, rather than misclassifying
that income as a shop grant. No simulation mutation was used in connected tests.

### Evidence / reproduce

- `docs/roster-baseline-unit-output.txt`, `roster-unit-output.txt`,
  `roster-unit-results.json`: actual baseline/final units.
- `docs/roster-browser-output.txt`, `roster-browser-suites.json`: all 157 executed
  browser check messages and commands; incomplete attempts are excluded.
- `docs/roster-browser-results.json`, `roster-draft-browser-results.json`, current
  `match-browser-results.json` and `match-recovery-browser-results.json`: detailed
  connected/draft/core/recovery evidence. Prior expansion result is preserved in
  `match-browser-results-before-roster.json`.
- `docs/roster-verification.json`: summary, exact tested HTML and immutable hashes.
- `docs/ROSTER_EQUIPMENT_CHANGED_FILES.md`: changed-file inventory relative to the
  prior pushed commit, including local PNG assets and authored tests.
- `deliverables/ROSTER-EQUIPMENT-SHA256.txt`: final download checksums, generated
  after source packaging (outside the ZIP to avoid a circular checksum).

Development: `npm ci`, `npm test`, `npm run package:source`, then the eleven
browser commands in the table. Actual timer/full-match checks take real time under
software WebGL. Normal play requires **only the HTML**, not npm, Python or a server.
`validate:heroes`, `validate:offline`, build, ZIP integrity and equality checks pass.
Root, dist, named HTML and the ZIP's root HTML are identical. Dependencies,
screenshots, references and duplicate builds are excluded from the archive.

**Review handoff only. No new commit or push performed.**
