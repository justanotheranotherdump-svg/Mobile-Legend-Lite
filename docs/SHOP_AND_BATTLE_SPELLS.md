> **Subsequent branch-update authorization:** the user requested committing and pushing this reviewed work to `arena/55ce0f80-mobile-legend-lite`. This supersedes the historical review-only/no-push handoff below; it does not authorize another feature batch.

# Authorized Batch 2 → Batch 3: equipment progression and battle spells

2026-10-18 · `arena/55ce0f80-mobile-legend-lite`.

The user explicitly chose **both, in order, without an intermediate approval stop**
after the conflicting boundaries were clarified. No further milestone is started.
The current Batch 1 working tree was captured first in local checkpoint
`b60f96cf240485186e5e6d7f7bd5dcfcf10cf8b0` (no push). Before edits: **448 units**
and **16 native standalone Batch 1 browser checks** passed. Actual baseline output
is preserved in `b23-baseline-{unit,browser}-output.txt`.

## Batch 2 — actual recipes, upgrades, automatic slots and quick buy

### Data and provenance

- All **45 supported equipment records** are now exposed, including the eight
  previously hidden legacy prototypes. Existing item prices/stats/effect IDs and
  original local icons are retained. Attack, Movement and Legacy categories are
  available. Recommended is **unavailable**, not a pretend full-build recommender.
- `src/data/match/recipes.json` holds an explicit tier and component list for every
  catalog entry. No prior recipe relationships existed. These are **editable local
  prototype reconstructions, NOT official recipes**. This is labeled in the shop
  and data. Original totals are authoritative; no price was invented from the
  user's illustrative 3,000/600 example. Legacy prototypes stay direct-purchase
  completed items because no recipe was supplied for them.
- All Equipment includes components/intermediates/completed entries. Simple
  actually filters to **completed only**, not just a different grid width. Item
  details/tree still expose every required ingredient in either view. Metadata,
  titles and detail panels show stats/passives, tier, ownership and affordability.
- Every recipe is validated for references, cycles and non-negative combination
  fee. Completed boots descend from basic Boots; appropriate advanced Attack
  items descend from existing components/intermediates.

### Atomic accounting

`src/match/recipes.js` owns quotes/consumption and automatic purchase planning.
The shop and quick buy call the same existing `simulation.purchaseItem` authority.

1. Walk the selected recipe. For each branch, credit a matching owned ancestor
   first; otherwise walk its components. Inventory slot indices may contribute
   **once only**, including repeated ingredient branches.
2. Remaining price = unchanged final total − actual contributed component totals.
3. Prepare a new inventory, remove only those credited components, and find its
   first free slot. Validate money, unique-item limits, one-pair rule and six-slot
   capacity **before committing anything**.
4. Place the result in the first free slot, debit the remaining price and recompute
   stats/effects from immutable hero data plus the resulting inventory.

Example from actual data: **Dagger 250 + Knife 280 → Regular Spear 600**, remaining
70. Total spent is 600, not 1,130. The Spear gives its own +20 PA/+10% AS, not the
sum of removed Dagger/Knife bonuses plus Spear bonuses. Nested quotes do not also
credit descendants of a consumed parent. Extra unrelated equipment stays intact.

Full inventory rejects a purchase needing a new slot. It **allows** an upgrade
whose credited components free the required space. Insufficient/invalid/full/
unique/second-pair failures never debit gold or remove items. Direct completion
is allowed without manually purchasing every component.

The existing **one copy per item**, **one Movement pair**, **six slots**, and
**60% explicit sale refund** rules remain. Consequently a repeated-ingredient
recipe may credit only the one copy actually owned; pay the remaining balance
directly to finish it. This deliberate inherited rule is not claimed to match
commercial MLBB duplicate-component inventory behavior. Manually selecting an
arbitrary replacement slot is removed; sell explicitly or combine valid components.

### Shop and individual priority

- No Equip-in/Free-slot selector or arbitrary replacement transaction. Clicking
  equipment still opens inspection and a separate explicit Sell action.
- Real connected build tree highlights owned ingredients and shows total, credit,
  remaining cost, missing nodes and completed/owned state. Components are selectable.
  The detail/tree side shares a readable scroll area on compact landscape.
- Prioritize Item stores **one match-local item**, never a six-item hero build.
  The quick panel remains on the gameplay HUD with icon/name, final remaining
  cost, next purchasable ingredient/upgrade, affordability/capacity reason and Clear.
- If the final item is affordable and valid, quick buy completes it directly.
  Otherwise it chooses an eligible affordable missing component/intermediate,
  or explains why the next step cannot be purchased. It does not bypass the
  authoritative quote, consume free equipment or silently choose another build.
- Gold, inventory and tree/quick state refresh immediately after transactions and
  as actual combat income changes. Selling an ingredient reverses its credit;
  owning the final item marks the priority completed. Fresh matches clear priority.
- The match remains running behind this non-modal shop; shop clicks and focused
  native button activation do not leak into battlefield attack/cast commands.

## Batch 3 — one equipped spell, twelve real effects

### Selection, account progression and save compatibility

- Battle Spells can be opened from lobby, local room or hero selection. The
  original dark patterned/gold-bordered screen has twelve distinct bundled SVG
  icons, blue Ability panels, gold Strategy panels, exact metadata, role badges,
  locked/unlocked/equipped states and responsive 3/2/1-column layouts.
- Roles are informational only. A hero can equip any unlocked spell.
- Exactly one spell is selected and preserved through confirmation, loading and
  lane gameplay. The local hero draft pauses while choosing a spell, then resumes;
  no automatic timeout races the selection overlay. New matches reset spell
  cooldowns/temporary effects, not the persistent choice/unlocks.
- `moba-lab.battle.v1:<username>` is a **separate versioned local extension**.
  Existing identity/wallet/owned-hero formats and the starter coin grant are not
  rewritten. Old saves naturally begin at account level 1 with Execute selected.
- Level is derived from validated account XP, never trusted from a saved `level`
  field; invalid/locked saved choices fall back to Execute. Values outside the
  bounded XP schema are rejected. Blocked storage uses a session account.
- Explicit **local prototype earning rule**: +100 account XP per genuinely completed
  lane match (win or loss), 100 XP per account level, max level25 at XP2400.
  Quit/Practice give no account XP. A bounded completion journal prevents duplicate
  application of the same match result. No coins/diamonds/rank are awarded.
  The rule is editable in `battle-account.js`, not represented as official MLBB
  account progression. Offline local storage is not an anti-cheat server.
- Hero level still exclusively scales in-match formulas. The account level controls
  unlocks. There is **no normal unlock-all UI**; tests use an isolated level25 save.

### Authoritative cooldowns and unlocks

| Spell | Cooldown | Account unlock |
|---|---:|---:|
| Execute | 90s | 1 |
| Retribution | 35s | 1 |
| Inspire | 75s | 5 |
| Sprint | 100s | 9 |
| Revitalize | 75s | 11 |
| Aegis | 75s | 13 |
| Petrify | 75s | 15 |
| Purify | 90s | 17 |
| Flameshot | 50s | 19 |
| Flicker | 120s | 21 |
| Vengeance | 75s | 23 |
| Arrival | 75s | 25 |

All values, roles, descriptions, targets, durations, effect parameters, modes and
VFX identifiers live in validated `src/data/spells/spells.json`. Missing required
parameters/unknown executors/targets/invalid cooldowns are errors, not fake casts.

### Actual mechanics and explicit prototype choices

- **Execute:** enemy hero only, valid manual hero pin then settings-aware hero
  resolution, prototype range6. `100 + 10×heroLevel + .13×lostHP` true damage;
  shared shield absorption is explicitly bypassed. On a kill the 90s remaining
  cooldown becomes54s. No target/invalid status rejects without starting cooldown.
- **Retribution:** actual enemy creep/minion, prototype range6; `750+150×heroLevel`
  true damage. Real creep type receives +60% gold/XP rewards and −40% basic-creep
  incoming damage. First120s allied-jungle reduction15% is conditional on an actual
  configured allied jungle region. First300s shared minion rewards exclude sharing
  between the Retribution player and allied heroes. Qualifying creep kills/hero
  kills/assists count once: five marks the blessing extension ready, fifteen grants
  +10 PA/+10 Magic Power/+100 max HP once per match through normal stat recompute.
  **No jungle spawner/regions, Jungling Boots' Blessing or evolved definitions
  exist in this project.** No jungle entities are fabricated; the empty
  data extension and readiness are explicit. Evolution is not claimed functional
  without those missing definitions. Base Retribution works on lane minions.
- **Inspire:** five seconds/eight successfully landed valid basics; ×1.5 actual AS
  with cap5.0, `.08+.01×heroLevel` additional defense penetration, +60 shared heal
  per landed attack. Invalid/dead/rejected attacks do not spend hits; shielded
  contact counts as landed. The accepted attack interval/full same-Shoot animation
  still controls attack timing. Named item effects are not double-triggered by it.
- **Sprint:** six seconds +50% movement once, removes active slow and grants slow
  immunity. Existing item/skill speed is composed once; all temporary speed expires.
- **Revitalize:** four seconds, ten 0.4s ticks, 2.5% max HP per tick to real allied
  heroes in radius4 including caster. Prototype spring follows caster. Received
  healing/shield multiplier is at most1.25, not additive between aura instances;
  area membership is refreshed and leaving/expiry removes it. This boosts the
  spring's own healing too. Shared regen/utility/item heals and shields use the
  same received-effect/anti-heal rules, not a separate HP system.
- **Aegis:** `750+90×heroLevel` shield, five seconds. Shared shield pools are separate
  from permanent HP and absorbed once in the damage authority. No max-HP increase.
- **Petrify:** radius3 prototype, `100+15×heroLevel` magic, 0.8s stun then 50% slow
  0.8s once. Teams, life, control/slow immunity and existing tenacity apply.
- **Purify:** clears known removable stun/slow/marks/anti-heal/delayed-control fields;
  leaves Suppression untouched. +15% speed/control immunity 1.2s, not damage
  immunity. Activation while suppressed is rejected. Suppression is a classified
  supported status extension; no new suppression-casting hero is fabricated.
- **Flameshot:** existing hold/aim/release/cancel interface, numeric projectile,
  prototype range12/speed18/radius.2; first eligible hero/creep, not lane minions.
  `damage = 200 + 480 × clamp(actualTravel/12,0,1)` magic. Arena obstacles/bounds
  stop it. On cast, nearby enemies within2.5 are knocked back1.5 along safe movement
  paths unless control-immune. Renderer draws orb/trail/impact and never deals damage.
- **Flicker:** aimed fixed3.5 prototype world units; bounded swept path stops before
  solid arena obstacles/structures. +`5+heroLevel` physical/magic defense for1s,
  ordinary temporary modifiers. Departure/arrival effects, no teleport through walls.
- **Vengeance:** three seconds, incoming damage ×.65 after ordinary defense; reflect
  .35 of **actual post-mitigation HP damage**, excluding shield-absorbed damage,
  as magic against a valid living attacker. Reflected damage cannot reflect again;
  source must still be living. This is one consistent documented ordering.
- **Arrival:** selected existing allied tower/core/minion destination, three-second
  channel. Movement, damage, death/stun, another action or destination loss cancels;
  refund30s once from the75s cooldown. Safe nearby landing, +60% speed linearly
  decaying over3s. No traps exist, so no pretend trap option is shown.

### Shared integration / mode honesty

`src/spells/system.js` submits numeric commands to the same match `deal`/death/
rewards, stats, collision and clock. `src/simulation/status.js` centralizes shared
healing, shield absorption, slow/stun/cleanse/immunity. Temporary spell stats merge
into the existing item/temporary modifier calculation. Defense→spell mitigation→
item safeguards→single shield absorption→HP→guarded reflection is the damage order.
Execute's bypass is explicit, never a second health system.

F / clickable battle slot use the same validations. Directional spells reuse the
existing gesture and aim-sight adapter; instant/self spells do not show fake
projectile arrows. Cooldown/active/shield/channel/destination readouts are real.
Original bundled VFX observe events/state only; combat/AI/reset/death remain owned
by the simulation. Exactly three hero skill controls remain, with unchanged Layla
asset/ability definitions. No unrelated maps or playable heroes were added.

Battle spells are enabled in **Brawl, VS AI, Custom and AI Training lane modes**.
The separate legacy/dummy Practice has no match damage/hero-entity authority and
keeps its existing utilities/skills; battle spells are explicitly inactive there,
not falsely enabled. Selection/loading label this limitation. Tests of unsupported
creep/jungle conditions use isolated fixtures, not fabricated production entities.

## Known limits / manual checklist

- Recipes are local reconstructions; review/edit relationships before treating them
  as a balance target. Prices/stats stay the supplied project snapshot, not official
  live MLBB parity. Component bonuses disappear on combination, not inherited into
  finished stats (e.g. a supplied final item's omitted crit chance is not invented).
- No full hero build recommender, monetization, online accounts, evolved jungle
  blessing, jungle map or traps. Local account saves are validated but not tamper-proof.
- Current playable hero is Layla; role tags impose no restrictions. NPCs retain
  their existing real hero-kit AI and do not automatically choose/equip battle spells.
- Manual: open the HTML offline, compare All/Simple, inspect a deep recipe, buy
  ingredients and combine; repeat with full inventory. Prioritize an item, close
  shop, use quick buy, sell a contributing component and inspect the changed cost.
- Manual: open Battle Spells at account1; only Execute/Retribution available. Complete
  a genuine lane match to see account XP (separate from hero XP). Select unlocked
  spells before confirmation; check cooldown/aim/cancel/buff feedback in the lane.
- At higher legitimate account levels, try all spells tactically, especially area
  membership/healing, shield+Execute interaction, control immunity, safe flicker/
  knockback and Arrival interruption. See exact assumptions above before comparing
  to another game's mechanics. No normal unlock-all control was added.
- Physical phones, native Windows double-click/performance, speakers, long-session
  tactical feel, dense 5v5 readability and every spell's visual polish still need
  human verification. Automated Linux software WebGL/trusted touch is not hardware
  certification. Final executed counts/evidence are appended only after completion.

**Both authorized milestones only. Stop afterward; no fresh push.**


## Final actually executed validation

| Check | Passed |
|---|---:|
| Pre-edit units | 448 / 448 |
| Pre-edit native Batch 1 flow | 16 |
| Final units | **555 / 555** |
| New equipment/spell native flow | 11 |
| Retained Batch 1 selection/loading/targeting/enemy HUD | 16 |
| Retained roster/shop/utility flow | 9 |
| Actual draft timeout / full 5v5 / trusted touch | 5 |
| Layla controls | 19 |
| Progression | 10 |
| Non-modal panels | 16 |
| Failure/retry/input recovery | 5 |
| Menu | 11 |
| Wallet/audio/lobby polish | 13 |
| Hero guide | 9 |
| Legacy foundation / input / offline isolation | 50 |
| Natural core outcome / replay / return / touch | 10 |
| **Final browser total** | **184** |

All twelve spell effects were tested in the authoritative simulation, not merely
counted as icons. Coverage includes exact metadata/roles, unlocks/save validation,
rejected casts, formulas, shields/bypass, cooldowns/reduction/refunds, eight-hit
Inspire/expiry/timing, Sprint, ten healing ticks/aura membership/nonstacking received
bonus, Aegis, timed Petrify→slow, Purify exclusions/speed/immunity, actual projectile
travel/collision/first hit/knockback, safe Flicker and defense expiry, Vengeance
ordering/no recursion, Arrival targeting/channel/cancel/death/cleanup, and match reset.
Isolated creep/jungle fixtures test conditional rules without adding production
jungle entities. Invalid/missing spell data produces useful errors.

Recipe tests include every catalog record, quotes/direct purchases, multiple and
nested owned components, repeated-branch credit-once, full inventory failure and
valid full-slot combining, original one-copy/one-pair constraints, invalid/no-money
atomicity, remaining costs and quick-buy planning/completion. The native flow buys
Dagger250 + Knife280, then combines Regular Spear for70: actual total600, one
resulting item, real +20 PA/+10% AS without duplicate component stats. It sells the
result and checks gold, stat reversal, recipe credit and quick-panel changes.

Actual final `file://` browser coverage includes all45/filtered Simple, owned build
trees, disabled Recommended, no slot selector, individual priority while shop is
closed, exact native F Retribution, account1 lock behavior, separate account25
fixture for all unlocks, native held/released Flicker aiming, visible Flameshot
projectile/trail/impact, Aegis1020 at hero-level3 with shield duration/HUD/VFX, and
Revitalize aura/VFX. Final active status layout is asserted above equipment and
utility controls in compact landscape. Desktop/compact card/shop screenshots were
inspected. This is not a claim that every spell's tactical VFX has been manually
played on physical devices; spell effects beyond these native cases have explicit
unit coverage and remain in the manual checklist.

The final natural idle Brawl reached actual sequential core destruction:
**Defeat 4:32, hero level6, 0 eliminations/deaths/assists, 0 earned match gold and
0 enemy structures destroyed**. It explicitly verified **account XP +100 → account
level2**, with the account wallet unchanged, then fresh replay/menu restoration.
These are observed idle-run results, not promised outcomes or fabricated rewards.
The final equipment/spell and complete-match suites identify the exact delivered
HTML hash, with **zero unexpected runtime errors, warnings or external runtime
asset requests**. Recovery intentionally denies two graphics contexts and checks
four expected error entries separately; those are not hidden unexpected errors.

### Iterations / nonpassing attempts (not counted above)

- The first native quick-buy test tried clicking the gameplay quick-panel Clear
  behind the open shop. The shop correctly intercepted it. The test now closes
  the shop before operating the gameplay panel, then reopens for screenshots.
- The old complete-match script clicked an already owned item again. The new
  validated UI correctly disables that purchase. The test now checks disabled +
  explicit `unique-item` reason rather than trying to click a disabled control.
- Three retained unit expectations changed for the explicitly authorized rules:
  arbitrary replacement is rejected in favor of sale/combine; basic Boots can
  upgrade to Swift Boots; a consumed Crossbow cannot also retain its on-hit effect.
  The combined two-item passive test purchases the independent item afterward.
  Other economic/damage assertions remain. No simulation mutation was used in the
  connected standalone tests and no unlock-all control entered the player UI.
- Visual review caught status text too close to utility icons in compact layout.
  Final CSS places it above equipment; native layout assertions and full-match/
  equipment-spell tests were rerun on the final exact bundle.

### Files, artifacts and reproduce

- `SHOP_AND_BATTLE_SPELLS_CHANGED_FILES.md`: exhaustive changes from checkpoint.
- `b23-unit-output.txt`, `b23-browser-output.txt`, `b23-browser-suites.json`:
  actual passing output and all commands/check messages (incomplete attempts excluded).
- `b23-browser-results.json`, `b23-verification.json`, current
  `match-browser-results.json`: exact final bundle, native cases, account result,
  metadata, inactive systems and environment limits.
- `src/data/match/recipes.json`: editable prototype tier/recipe configuration.
- `src/data/spells/spells.json`: exact twelve-spell configuration/strategies/roles.
- `deliverables/SHOP-SPELLS-SHA256.txt`: final artifact and immutable-asset checksums.

Development: `npm ci`, `npm test`, `npm run package:source`; run the thirteen browser
commands listed in `b23-browser-suites.json` (real timers/full matches take real
time). Normal play needs only the HTML. Source ZIP contains root standalone HTML,
editable modules/data/original assets and tests, not dependencies/references/
screenshots/duplicate builds. Build, hero/offline validation, ZIP CRC/current-source
inclusion and equality of root/dist/named/archived HTML pass. Approved GLB/creation
art bytes, Layla definition/ability/animation data, lane map and manual movement
are unchanged. No push performed. **Stop; await further approval.**
