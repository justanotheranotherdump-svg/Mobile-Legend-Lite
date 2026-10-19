# Layla rework research checkpoint — 2026-10-19

**Intake/research only, not a replacement model, implemented mechanic or certified current-patch dataset.** Existing playable game and Layla remain unchanged. Franco Plan B selected and parked. The user selected modern Energy Gunner appearance, the written 115%-passive/stun-mark direction, .25/.40/.65-second S1/S2/ultimate input-to-release times and .25 basic release at1.06 APS, with separate projectile travel and cancellable post-release recovery. The user requested research and approval of the numeric baseline before implementation. Recorded in `previews/layla/rework-intake.json`.

## Sources actually inspected

Retrieved 2026-10-19. These are community/secondary pages, not an instrumented live game or official exported frame data. A guide's update timestamp is not proof every stat/ability on that page matches that date.

- [5](https://liquipedia.net/mobilelegends/Layla): actual fetched hero page, base stats and rank tables; source for the primary candidate below.
- [14](https://liquipedia.net/mobilelegends/Patch_2.1.67): actual fetched patch page, release date **2026-04-22** in its body, Layla section in chunks2–3. Search metadata labeled a different date; use the page's explicit release date, not search crawl/publication age as patch release.
- [2](https://www.mlbbguides.com/heroes/layla/skills/): fetched body says **Updated Sep29,2026** from its local dataset; several mana entries differ from Liquipedia. Source text includes unrendered template tokens and endpoint-only damage descriptions, so do not pretend it is an independently authoritative raw game export.
- [12](https://mlbb.io/en/hero/layla): fetched page says data updated Oct18,2026 but retains older stat values and a130% passive description. Not proof those hero numbers are Oct18 live values.

No proprietary images/icons/meshes were downloaded as runtime/source assets. Supplied videos have not been frame-measured; exact cast values are user-approved custom preview proposals, not official timings.

## Main conflicts and recommendation

Use Liquipedia's coherent **observed hero-page snapshot** as the candidate for base stats and skill rank tables, supplemented only by the explicitly identified patch changes; do not claim a fully verified latest-live dataset. Keep unknown geometry/travel/growth values unresolved rather than fabricate them. Confirm this candidate before using it. Modern appearance is independent of which numeric data revision is chosen.

### Base stats

| Stat | Current local game | Liquipedia observed candidate |
|---|---:|---:|
| HP |2250|2320|
| Mana |500|500|
| HP regen |5.4|5.4|
| Mana regen |4|4|
| Physical attack |133|133|
| Physical defense |15|17|
| Magic defense |15|15|
| Magic power |0|0|
| Base attacks/s |1.06|1.06|
| Attack-speed ratio coefficient |1.0|100% =1.0|
| Movement speed |240|250|

External candidate column from [5](https://liquipedia.net/mobilelegends/Layla); local column from `src/heroes/layla/hero.json`. Do not confuse1.06 starting attacks/s with the1.0 ratio coefficient. No hidden player/AI differences are proposed.

The patch page records HP2250→2320, HPgrowth152→150, physicalDEF15→17, MS240→250 and PA growth10→9. [14](https://liquipedia.net/mobilelegends/Patch_2.1.67) These support the observed new base stats but do not validate all current growth. The local game's PA growth is8.5, not the patch's before-value10, so this is a real data-version mismatch. Combining observed baseHP2320 with recorded growth150 gives **4420 at level15 by arithmetic**; basePA133 with growth9 gives **259 by arithmetic**. These are proposed derived endpoints, not observed level15 measurements. Other growth fields and critical/AS cap behavior need confirmation.

MLBB.io instead lists2250HP,15physicalDEF,240MS, growth152HP/8.5PA and130% passive despite a recent overall data timestamp. [12](https://mlbb.io/en/hero/layla) This is why a recent page date alone is not enough to silently call its tables current.

### Skill candidate (before defense/passive/crit modifiers)

| Value | Candidate | Source |
|---|---|---|
| Passive |100–115% with distance, cap at6 units; no turret bonus|[5](https://liquipedia.net/mobilelegends/Layla)|
| S1 base damage, ranks1–6 |200/240/280/320/360/400 +80% totalPA; first enemy hit; can crit|[5](https://liquipedia.net/mobilelegends/Layla)|
| S1 cooldown |6/5.6/5.2/4.8/4.4/4 s|[5](https://liquipedia.net/mobilelegends/Layla)|
| S1 mana |35/40/45/50/55/60|[5](https://liquipedia.net/mobilelegends/Layla)|
| S1 buffs |basic/S2 extra range3s; +60% MS decaying over1.2s, duration doubled on hero hit|[5](https://liquipedia.net/mobilelegends/Layla)|
| S2 base damage |170/200/230/260/290/320 +65% totalPA|[5](https://liquipedia.net/mobilelegends/Layla)|
| S2 cooldown |7.5/7.3/7.1/6.9/6.7/6.5 s|[5](https://liquipedia.net/mobilelegends/Layla)|
| S2 mana |70 all ranks, candidate patch-supported rule|[14](https://liquipedia.net/mobilelegends/Patch_2.1.67)|
| S2 mark |3s; triggered explosion100/120/140/160/180/200 +35% totalPA; stun.25s|[5](https://liquipedia.net/mobilelegends/Layla)|
| Ultimate base damage |500/650/800 +150% totalPA, line blast|[5](https://liquipedia.net/mobilelegends/Layla)|
| Ultimate cooldown |37/32/27 s|[5](https://liquipedia.net/mobilelegends/Layla)|
| Ultimate mana |130/150/170|[5](https://liquipedia.net/mobilelegends/Layla)|
| Ultimate passive range |+.6/1.2/1.8 units to basic/S2; slight sight increase, amount not specified|[5](https://liquipedia.net/mobilelegends/Layla)|

Candidate mana differs from MLBBGuides' S1 40→65 and S2 65→90. [2](https://www.mlbbguides.com/heroes/layla/skills/) Liquipedia's patch explicitly states S1 25–50→35–60 and S2 35–60→70 at all levels, making that the documented choice for this candidate. [14](https://liquipedia.net/mobilelegends/Patch_2.1.67)

The researched ultimate values **37/32/27 and130/150/170** are corroborated by both fetched skill pages, unlike the user's explicitly estimated30/26/22 and100/120/140. [5](https://liquipedia.net/mobilelegends/Layla) [2](https://www.mlbbguides.com/heroes/layla/skills/) These are a proposed correction awaiting approval, not a silent registry edit.

The user's115%/stun direction agrees with these two fetched skill pages. [5](https://liquipedia.net/mobilelegends/Layla) [2](https://www.mlbbguides.com/heroes/layla/skills/) Passive exact interpolation/distance sampling, secondary explosion chaining, mark consume/order/refresh rules, skill-specific crit interactions and turret eligibility still require explicit design/verification; the short text is not enough to invent those rules.

## Unresolved before a meaningful motion/range prototype

- **Range/unit mapping:** local base range stat4.3 maps to6 world units; current S1/S2/ultimate runtime ranges are9/7/12. Local S2 starts farther than the basic, whereas fetched descriptions describe shared upgrades but do not give a complete geometric table. Decide a consistent world conversion and approve base/S1/S2/ultimate reaches and collision widths; do not label old runtime numbers official.
- **Projectile travel:** separate input-to-release (already approved) from release-to-target. Current local speeds18/14/10 worldunits/s are implementation values, not independently verified MLBB speeds. Need approved custom values or time/distance measurements. Near targets must arrive sooner under a constant-speed rule; different distances should not all use one fixed arrival time.
- **Ultimate beam:** choose an instant line hit at release versus a finite-speed travelling beam front, plus visual fade and nonblocking recovery. User has approved a.65s committed wind-up, not those other values.
- **S2 targeting:** Liquipedia says 'at the target enemy'; its trajectory, tracking/ground skillshot mode and miss/interception rules need explicit choice. [5](https://liquipedia.net/mobilelegends/Layla) Do not assume the existing local directional orb is already correct.
- **S1 range buff:** duration is documented but the exact bonus/stacking with ultimate/item range must be confirmed before coding. Never derive it from image width.
- **Animations:** .25 basic/.25S1/.40S2/.65ult are release points, not necessarily full visual clip lengths. Author recovery as nonblocking, preserve projectile and original basic cooldown after cancel, reject free duplicate attacks. Exact recovery lengths and locomotion/gun/hand/pony-tail rig quality need a declared proposal.
- **Vision/turrets:** do not invent an absent fog/vision subsystem or certify safe turret outranging from one image; validate actual local turret acquisition/projectile and actor collision rules later.

## Next gate

Approve/revise the researched candidate numbers, then settle travel/range/targeting/recovery proposals and build a separate original modern-Layla offline 3D preview. No current model has been replaced and no gameplay tests were required/run for these documentation-only changes. The earlier796/32 results belong to the delivered Franco PlanB milestone, not an unbuilt Layla rework.
