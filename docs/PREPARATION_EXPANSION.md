# Visual Preparation & Equipment Expansion

**Review handoff — 2026-10-19.** Implementation and automated verification completed. Documented prototype/source discrepancies and manual-platform limits remain below. No push performed.

## Scope and workflow

Built on the existing reviewed offline game, not a rebuild. The original equipment wiki layout, Layla model/materials/kit, camera, map, account identity/wallet, loading pipeline, controls, match history and shared authoritative combat remain in place. Changes are for review on `arena/55ce0f80-mobile-legend-lite`; **no new push was requested or performed**.

The baseline was **576 passing unit tests** after `npm ci`. An earlier dependency-missing attempt failed and is not counted as a pass. Checkpoint `0e55576` preserved the reviewed workspace and published ancestry without reset, force push or switching branches.

Implementation followed the requested sequence: inspect → visual editor → community templates → direct spells → empty Emblems → catalog/types/recipes → restricted mechanics → original individual PNGs → persistence/match integration → regression/offline packaging. Relevant unit/build/browser logs are retained under the preparation-expansion verification records.

## Player-visible changes

- Owned Layla portrait/name, selected custom-build indication, and **six visible equipment-icon positions**.
- Select a slot and click an actual equipment card to place/replace an item. Remove, move earlier/later, reset the unsaved draft, rename, save/use, duplicate and delete custom builds. Reordering uses explicit controls rather than requiring drag-and-drop.
- Existing one-copy, one-boots and six-position rules remain enforced. Winter Crown/Wind of Nature also enforce the one-active-item rule. Invalid edits are atomic. Consumables and special blessings cannot be stored in the six-item build.
- Three custom builds remain available per hero, with version-1 backward-compatible, user-scoped saves. Templates do not consume custom-build capacity until saved as a copy. No write goes back into a template.
- Catalog search/category filtering, actual stats/descriptions, connected recipe trees and build-toward links. **Recipes remain explicitly local prototype reconstructions, not claims of exact official recipes.** Repeated ingredients credit only actual owned copies; any unpaid balance is still charged.
- Battle Spells sidebar opens the complete existing 12-spell browser **directly**, embedded in Preparation. Selection-room/modal spell access still works. No extra Browse/Change interstitial.
- Emblems has seven empty family positions, an empty three-position orbit, empty future talent selections and empty attributes. No family/talent selection, currency, upgrades or bonuses are implemented or preselected.
- One independent next-match Jungle/Roam intention, visible requirements and compatibility warnings. Selecting it never buys an item or grants stats.

### Layla community templates

Research page: [1](https://mlbb.io/en/hero/layla/build). Read 2026-10-19; page labeled October 2026; six submissions from August 14–October 7. This is **community-submission evidence, not a measured win-rate dataset**. Windtalker is the reported early common core; five of six submitted builds use Flicker. No claim of optimality or highest win rate is made.

| Template | Ordered items | Suggested spell |
|---|---|---|
| Standard / Balanced | Tough Boots → Windtalker → Haas' Claws → Berserker's Fury → Blade of Despair → Malefic Gun | Flicker |
| Anti-Healing | Tough Boots → Windtalker → Berserker's Fury → Haas' Claws → Malefic Gun → Sea Halberd | Flicker |
| Attack Speed / On-Hit | Tough Boots → Corrosion Scythe → Golden Staff → Demon Hunter Sword → Malefic Gun → Rose Gold Meteor | Vengeance, as in the alternative submission |

Spell suggestions show account requirements and are equipped separately through the real spell catalog; copying a build never bypasses spell unlocks. Marksman/Fatal/Weapon Master/Quantum Charge are research notes only, **not functional emblem preselection**. Sea Halberd is the actual anti-heal choice. Rose Gold Meteor is not mislabeled as anti-healing; its existing low-HP shield remains unchanged.

## Canonical catalog and source reconciliation

`src/match/catalog.js` joins the unchanged original 45 records, 54 new paid records and nine explicitly typed non-purchase records into **108 unique IDs**. All consumers use that canonical composition rather than copying an independent wiki database.

| Category | Visible unique entries | Notes |
|---|---:|---|
| Magic | 31 | Includes two unavailable Floryn-only references and one consumed Magic Potion. Adaptive/hybrid items have a canonical Magic home here. |
| Defense | 25 | The supplied 26-name list repeats Fleeting Time, which is listed once under Magic, not duplicated as a second Defense record. Includes Rock Potion. |
| Jungling | 3 | Bloody / Flame / Ice Retribution; all `jungle_blessing`. |
| Roaming | 4 | Conceal / Dire Hit / Encourage / Favor; all `roaming_blessing`. |
| Attack / Movement / Legacy | Original 45 total | Original 37 named Attack/Movement and eight legacy prototype records preserved. |

**97 ordinary equipment records + two consumables = 99 paid shop entries.** Seven role blessings plus two hero-exclusive references are excluded from ordinary purchase/recipe/inventory/sale paths. Zero Gold means special acquisition, never free equipment.

New normal-item facts were reconciled principally against the dated September 29, 2026 dataset at [2](https://www.mlbbguides.com/items/), checked October 19. That source labels tiers broadly; the prototype retains explicit component/intermediate/completed recipe tiers rather than copying every website card's generic “Tier 3” label.

Public sources are not internally consistent and this is **not a certified live-patch clone**:

- Brute Force Breastplate: the older Liquipedia/hub listing gives 1870 / 600 HP; the current dated reference gives **2070 / 800 HP**. This expansion uses the latter for the new record.
- Guardian Helmet: older listing 2200 / 1550 HP versus current **2500 / 1800 HP**; the latter is used.
- Ares Belt **700**, Black Ice Shield **780**, Starlium Scythe **2120** follow the current reference. Book of Sages uses its current +8 Magic Power / 5% CDR at 450. Hero's Ring uses 150 HP / 5% CDR at 450.
- Fleeting Time, Sky Piercer and Winter Crown are hybrid/adaptive rather than a second physical/magic copy. Expert Gloves is likewise adaptive. Only Layla is playable, so its flat adaptive attack resolves to Physical Attack; this is not an excuse to introduce unowned heroes.
- Flower of Hope requires Floryn's sharing passive; Lantern of Hope is Floryn-exclusive. Neither can exist through a Layla free-buy exploit. Their historical descriptions also conflict, so the wiki explains acquisition/unavailability without applying an invented bonus.
- Original Attack/Movement facts and Layla formulas were deliberately **not silently overwritten** to match newer web pages. Examples include the prototype's established Retribution base formula and Rapid Boots behavior. This is a versioned local ruleset with research notes, not a uniform assertion that every subsystem matches one live commercial patch.

The generated `docs/preparation-expansion-catalog.json` records the exact chosen local name/category/price/type/recipe/attributes/effects for review. The source JSON is authoritative at runtime.

## Restricted special mechanics

### Explicit classic boot-blessing ruleset

`ROLE_RULES.version = classic-boots-600-v1` is intentionally visible in diagnostics and documented in the wiki. Older item pages support a 600-Gold unlock / 1500 scaling cap and offensive Encourage, while newer guides disagree between 1000 unlocks, a defensive Encourage, a marked-target Dire Hit and a movement-stack Dire Hit. The current roaming guide explicitly describes a different patch-2.1.88 movement-stack version [3](https://mlbbhub.com/guides/roaming-guide). It does **not** supply enough mutually consistent numeric details to silently present that as verified implementation.

Rather than combine incompatible generations or invent coefficients, this game implements a coherent **classic, clearly labeled prototype ruleset**, using the classic item-page formulas. **Modern movement-stack Dire Hit/defensive Encourage/1000-Gold rules are not implemented and are not claimed.**

### Jungling

References: [4](https://liquipedia.net/mobilelegends/Bloody_Retribution), [5](https://liquipedia.net/mobilelegends/Flame_Retribution), [6](https://liquipedia.net/mobilelegends/Ice_Retribution).

- One selected jungle intention, actual Retribution and actual equipped boots are required for effects. A different spell or sold boots disables the blessing; swapping gear cannot duplicate it.
- Five real creep kills, hero kills or credited hero assists unlock the selected modification. Ordinary lane-minion kills do not count. Fifteen qualifying actions unlock the existing +10 PA/+10 MP/+100 HP bonus **only while valid configured jungle boots remain equipped**, not from an unconfigured spell alone.
- Farm-target Retribution deals 150% of the established prototype spell's base damage once upgraded.
- Hero-target Bloody deals 100 True Damage, then drains a total 250 +20% extra caster HP over four seconds, healing only actual HP stolen.
- Flame deals 100 True Damage and steals 58–100 Physical Attack/Magic Power for four seconds, scaling with hero level; victim stat reductions clamp at legal zero, Movement Speed at legal positive minimum. Buffs expire and do not permanently mutate hero definitions.
- Ice deals 100 True Damage and steals 72–100 Movement Speed for four seconds, scaling with hero level.
- Existing cooldown, range, action locks, source ownership, no-share restrictions and creep reward/reduction hooks remain authoritative.
- **The existing lane map does not spawn jungle camps or define allied-jungle zones.** This task did not replace the approved map. Hero kills/assists can legitimately unlock the blessing in live lane play; creep/region hooks are tested using explicit unit-test fixtures, not falsely claimed as a live jungle map. No lane minion is relabeled as a creep to manufacture progress.

### Roaming

Classic references include [7](https://liquipedia.net/mobilelegends/Encourage), [8](https://liquipedia.net/mobilelegends/Conceal), [9](https://www.oneesports.gg/mobile-legends/4-roaming-blessings-best-heroes/). Thriving descriptions also appear in [10](https://mlbbhub.com/items/encourage); newer support/roaming guides disagree and are not substituted into these classic effects.

- One roaming intention plus boots; incompatible with Retribution. No occupied normal inventory slot, free purchase, resale, ordinary component credit or duplicate blessing.
- Classic Devotion suppresses the wearer's shared minion/creep rewards near allies for the first eight minutes. Solo rewards remain the existing classic behavior; restrictions expire at 480 seconds.
- Team-unique Thriving distributes 8 Gold / 20 XP every five seconds to the lowest-income/lowest-XP allied hero, with 25% extra when the wearer is that recipient. Actual NPC income is tracked. Actual credited hero assists receive the prototype's base assist reward plus 45% extra; only the bonus advances the role-Gold meter. Passive owner Gold also advances it, capped at 1500. Purchase, selling and developer wallet additions do not count.
- 600 **earned role Gold** unlocks the effect; bonus scaling continues to 1500. Selling boots pauses effects and income; no clock catch-up from time without valid boots.
- Conceal: nearby allies gain actual target-filtered camouflage and **24%–60%** Movement Speed for five seconds, damage breaks it; prototype near-reveal distance 2 units, radius 5 and cooldown 80s. The 24%–60% value follows the fetched classic Conceal page, not a guessed 30%–75% range. Camouflage affects bot targeting, player target eligibility and enemy rendering, not just a label.
- Dire Hit: the explicitly classic execute version adds 7%–18% target Max HP split physical/magic after damaging a hero below 35% HP; 30s cooldown, no recursion.
- Encourage: actual nearby ally/self +12–30 PA/MP and 15% Attack Speed; no stacking per frame; leaves range or boot loss reverses the aura.
- Favor: a support-capable skill heals the lowest-relative-HP ally within five units for 480–1200, on a 15s cooldown. Revitalize can trigger it. Self-only Aegis, recovery, lifesteal and Regen cannot. Existing anti-heal/recovery amplification still applies, so final healed HP can differ from the base number.
- The existing map has **no bush/vision-reveal economy**. No fabricated vision event or reward is shipped; modern vision-income/movement-stack reworks are outside this explicit classic implementation.

## Magic / Defense gameplay hooks

New ordinary equipment participates in existing atomic purchases, component credit, sales, attribute validation, live combat and offline save/build recommendations. Added hooks cover:

- Magic Power, Mana/HP/regen, CDR (including Enchanted Talisman's 45% cap), hybrid lifesteal, adaptive attack, penetration/shred and shared anti-healing.
- Blood Wings shield/recharge/speed; Clock of Destiny defensive stacks/Gift; Concentrated Energy stacks; Holy Crystal scaling; Mana Spring; Feather on-hit/Impulse; Azure/Starlium skill-to-basic procs; Genius/Divine defense changes; Glowing burns; Ice Queen stacks; Lightning echoes; Wishing Lantern accumulation; Sky Piercer bounded kill/death stacks/execute; Fleeting Time real kill/assist ultimate-CD reduction.
- Defense auras, Deter attacker debuffs, Blade Armor reflection/crit reduction, Brute Force stacks, Chastise/Redemption, Cursed Helmet/Molten burns and curse, Guardian out-of-combat recovery/Defender, Oracle recovery, Queen's Wings, Radiant stacks, Thunder Belt damage/permanent role-scaled defense.
- Immortality's pending resurrection prevents duplicate kill/assist/gold/death rewards, revives in-place after 2.5 seconds with real HP/shield and enforces its 210s cooldown.
- Winter Crown's functional USE button applies two-second target/damage immunity and blocks movement/new actions while existing projectiles remain; 100s cooldown, mutually exclusive with Wind of Nature.
- Flask of Oasis connects to the actual support-capable Revitalize target/threshold shield hook. No support hero is fabricated to demonstrate it.
- Magic/Rock Potions are consumed on purchase, take no slot, cannot be sold/used as recipes, replace the one potion effect and expire after 120s. Recalculation cannot refill resources. Rock adds 500 maximum HP and 5% non-True-damage reduction; Magic adds 30 MP / 10% CDR.

Local approximations are explicit: reconstructed recipes; spell/effect world-unit conversion; echo/burn radii; bounded proc cascade (to avoid self-recursive item loops); no negative-defense amplification; one copy per equipment under the previously approved prototype constraint. This is functional prototype behavior, **not frame-perfect live-client equivalence**.

## Player-like AI improvements

The same Layla kit, actual ranks/mana/cooldowns/projectiles/windup locks and difficulty reaction delays still execute bot actions. Policy changes add stable individual firing arcs, movement-only hero separation, cooldown-window kiting/repositioning, last-hit preference and waiting for minion cover rather than blindly entering a defended tower. Separation respects existing bounds/obstacles, never teleports bodies and never moves the human automatically. Exact-overlap steering avoids NaN facing.

Smart Attack also now distinguishes a temporary moving-body obstruction from a permanently unreachable world route. It retains the selected target category, waits/replans at bounded intervals without walking through bodies, and still cancels on an impassable static route or a crowd that never clears (2.5s bounded retry). The original Normal-difficulty 1v1 tower-priority browser assertion was left intact: diagnostic runs reproduced the cancellation, the engine was fixed, and that same native scenario then passed. Unit tests cover recovery, immediate static-wall cancellation and the retry deadline.

This remains heuristic offline lane AI, not human-level play, learned agents, multiplayer, a new jungle/map or a full strategic MOBA macro simulation. Bots still use the existing permitted hero roster rather than inventing unavailable heroes.

## Original assets / offline delivery

63 new, separate original **160×160 RGBA PNGs** in `src/ui/assets/items/`, authored from explicit item-specific silhouettes by `scripts/create-expansion-art.py`. Existing correct item PNGs are reused unchanged. No spritesheet, emoji, screenshot extraction, downloaded game art or unrelated substituted icon. `src/ui/item-art.js` already embeds each PNG with the existing eager inline Vite mapping.

`docs/preparation-expansion-asset-manifest.json` records every ID/path/dimension/SHA-256 and original-art provenance. `npm run validate:preparation-assets` verifies all 63 unique files, every exact embedded base64 payload, canonical IDs and the approved unchanged Layla GLB hash. Python/Pillow is an optional development-only regeneration dependency; neither is required to run the HTML.

Primary downloads: `MOBA-Lab-Preparation-Expansion.html` and `MOBA-Lab-Preparation-Expansion-source.zip`. The ZIP contains playable root `index.html`, source, tests, scripts, docs and original assets, not dependencies/Git/references/screenshots/duplicate builds. Legacy download filenames are compatibility aliases of the current standalone, not additional payloads inside the source archive.

## Test record and limits

### Final actual results

| Verification | Result | Evidence |
|---|---|---|
| Full Node suite | **741/741 pass**, zero failures/cancellations/skips | `preparation-expansion-unit-results.txt` |
| Production build / offline structure | **PASS**; complete single HTML, approximately 10 MiB. Vite's large-bundle advisory is expected, not suppressed | `preparation-expansion-build-results.txt` |
| Original regression suites | **14/14 pass — 205 check groups**, including unchanged Normal 1v1 tower assertions, genuine unattended core destruction/results/history and clean replay | `preparation-expansion-regression-results.json` and per-suite records |
| Expanded Preparation integration | **13/13 pass** — native editor/presets/spells/empty Emblems/108-entry wiki/PNG decode/save→reload→match/real boots spending/typed role gates/HUD disposal | `preparation-expansion-focused-root-results.json` |
| Isolated standalone HTML | **13/13 repeated native checks pass**, HTML alone in Unicode/spaces directory, offline `file://`; zero runtime errors/warnings/external requests | `preparation-expansion-isolated-standaloneFile.json` / text log |
| Isolated source-ZIP HTML payload | **13/13 repeated native checks pass**, extracted root HTML alone in a second Unicode/spaces directory, same offline/security constraints | `preparation-expansion-isolated-archiveFile.json` / text log |
| New-art integrity | **63/63 original individual PNGs**, unique SHA-256, all canonical IDs and exact payloads embedded; approved Layla GLB unchanged | `preparation-expansion-asset-validation.txt` and asset manifest |
| Final archive / aliases | CRC, exact root payload, all 63 PNG hashes, aliases and exclusions audited after final documentation packaging | `preparation-expansion-delivery-audit.json` / final certificate |

That is **218 distinct browser check groups across 15 suites**, plus **26 isolated-payload repetitions** (244 final browser-group executions). Historical failed/intermediate attempts are not counted as passes. Final tested playable payload SHA-256: `fdb043347dfc131b6df8eb21118c6f7e2aeec5795876040ed849bf8fdf20a626`. The final archive audit proves its root HTML is byte-identical to that tested payload.

The first full regression caught the real moving-body path cancellation. Its failed ledger and diagnostic reproduction are retained; after the engine correction, the entire 14-suite run was repeated successfully against the final payload. No difficulty, roster, tower-target assertion, collision rule or ordinary file-origin security was relaxed.

Corrections found by real checks: initial absent npm dependencies; catalog-count assertions updated while retaining original 37/45 coverage; consumable tests gained lifecycle/expiry/no-resale assertions instead of pretending potions are equipment; config initially omitted the new role intention (caught by mechanical tests); temporary max-HP changes initially refilled HP (fixed without altering normal level-up resource rules); bounded editor grid originally overflowed into later preset rows (fixed with real nested scroll, **not forced clicks**); integration fixture initially omitted adding an opponent in the real room (fixed by the same native Add Computer control a player uses); Brute Force tenacity was compounding on repeated runtime updates (now composed once from actual boots, with repeated-frame regression); Elegant Gem recovery missed the final exact interval (now tested over three whole one-second intervals); and changed NPC movement exposed an existing immediate-cancel-on-transient-crowd path bug (fixed in the engine, preserving the original browser assertions, roster and difficulty). No test was deleted, skipped or bypassed; old native workflows were updated only for the authorized visual/direct-navigation replacement.

Native browser coverage distinguishes acquisition/affordability from activation. The saved Jungle/Conceal intentions, real boots purchases, still-locked upgrades, insufficient-Gold Winter/Potion purchases and HUD disposal are exercised through actual controls. Activated Winter, earned Conceal activation, potion expiry and the other expensive item procs have mechanical unit coverage, **not a claim of native-browser visual certification**. No combat-Gold/progression injection was added just to force those purchases. They remain in the manual review checklist.

Artifact-hash certificates are kept outside the source ZIP they hash to avoid a self-referential hash. The ZIP includes source, tests, test records, canonical catalog snapshot and original icon manifest.

Automated browser environment is Linux Chromium with software WebGL, actual `file://` standalone and offline networking. It is not native Windows, physical-touch or speaker certification. Manual Windows double-click, real phone gestures, performance, speakers and subjective AI/gamefeel review remain necessary.

## Manual review checklist

1. Double-click the HTML with networking disabled; create/reload an account without reinstalling anything.
2. Create/edit/reorder/remove/reset/duplicate a six-icon custom build; copy each template; reload and inspect the same active build.
3. Open Battle Spells directly, inspect all 12, confirm locked spells cannot equip; verify the selected spell reaches a real match.
4. Confirm all Emblem slots remain empty and no bonus/currency appears.
5. Inspect all four new categories and new icons; verify Fleeting Time appears once, Floryn items are unavailable and 0-Gold blessings cannot be bought/sold.
6. Choose a role intention; test incompatible spell/missing boots; purchase boots and play genuine qualifying hero kills/assists. Do not count lane minions as jungle kills.
7. Check classic roaming restrictions, real earned progression, distinct effects, active buttons/cooldowns and boot-loss suspension.
8. Inspect Magic/Defense purchases, component credit, temporary procs, resurrection, Frozen and consumable expiry; no resource refill/resale exploit.
9. Watch bots spread, kite during cooldowns, wait for waves and retreat/recover; check the original camera/map/animations and all input modes.
10. Try Windows/local-storage blocking, physical touch, speakers and slower hardware. Review known classic/live-patch differences before approval.

## Handoff inventory

- [Changed-file list](PREPARATION_EXPANSION_CHANGES.md).
- [Exact canonical 108-entry inventory](preparation-expansion-catalog.json).
- [63 original PNG files and hashes](preparation-expansion-asset-manifest.json).
- Final HTML/source-ZIP sizes, hashes, archive checks and environment limits: `preparation-expansion-verification.json` (external to the archive it hashes).

Download the named HTML alone to play; download the source ZIP to edit. No new feature milestone or publication is being started. Awaiting user review/approval.
