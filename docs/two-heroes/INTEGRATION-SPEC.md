> **Current update:** [USER-FEEDBACK-FIXES.md](USER-FEEDBACK-FIXES.md) supersedes
> earlier artwork, locked-selection-preview and one-copy/one-active-item wording
> below. Earlier results remain historical, not claims of new reruns.

# Approved Layla + Franco integration — 2026-10-19

**Presentation correction:** [ART-RESTORATION.md](ART-RESTORATION.md) supersedes
any 3D-menu/portrait requirement below: Shop/details, lobby, profile, room,
selection thumbnails and loading cards use 2D illustrations; only central
hero selection and gameplay use the approved GLBs. No mechanics change.

This extends the existing offline game on the existing session branch. It does
not implement another hero, Classic, Ranked or a new 5v5 mode. Existing roster
counts/modes, equipment, match gold, progression, saves and input remain in place.
Historical preview files/approval wording describe their earlier, separate stage;
the user's subsequent explicit approval authorizes these two runtime copies.

## Approved visual inputs (not re-authored)

* Layla: `previews/layla/assets/layla-rework.glb` copied byte-for-byte to
  `src/heroes/layla/assets/energy-gunner.glb`. All ten original clips and 25-bone
  skin retained. Blonde twin tails, white/purple/gold costume and cyan cannon.
* Franco: `previews/franco/assets/franco-proposed.glb` and `franco-hook.glb`,
  copied byte-for-byte to `src/heroes/franco/assets/{franco,hook}.glb`.
  All eleven actual clips and 17-bone skin retained, including Plan B's .15s
  IronHook, .30s FuryShock, 1.80s BloodyHunt and enlarged hook.
* Both runtime visual anchors use uniform .72 scale. Layla release socket sampled
  from the actual unchanged rig: local x .00196103, y 1.22178475, z 1.18313066.
  Franco .15s HookSocket: x .00077123, y 1.24082852, z .64332108.
  Physics is plain numeric data, not a mesh or render callback. The renderer
  reads the actual live sockets for the beam and connecting chain.
* Pose sampling maps shared-engine accepted action/release times onto existing
  tracks. Idle/Walk/Run and supported HitReact/Death remain actual animations.
  Skill interruption cancels pending releases without a second resource charge.
* Original Layla R2 energy geometry is reused in a runtime-only adapter. Added
  arbitrary world directions/positions, real projectile positions, finite pools
  and live muzzle anchors; never renderer-owned damage. Distinct compact basic,
  pointed spindle S1, spherical/banded S2, separate impact/mark/trigger and
  continuous layered beam are preserved. No bullet substitutes for the ultimate.
* Exactly fourteen separate PNGs: per hero 512x512 `portrait.png`, transparent
  512x768 `character-portrait.png`, 1280x720 `showcase-background.png`, and four
  distinct 256x256 `passive/skill-1/skill-2/ultimate.png` icons. Character PNGs are
  renders of the approved GLBs, not new character designs. Icons/backgrounds are
  original local procedural artwork. No screenshot extraction or remote assets.
* Manifest: `src/heroes/integration-manifest.json` hashes every runtime hero
  model, PNG, kit/animation/visual config and VFX/pose adapter; declares real clips
  and approved source paths. Historical originals are separately hash-preserved.

## Selection, purchase and save contract

Entry and clear have actual `heroId = null`, empty model parent, no selected
portrait or ability buttons, and disabled confirmation/build selection. No hidden
Layla default. Explicit picking switches model/background/portrait/all four
skills together. Locked Franco remains inspectable, but cannot confirm or enter.
The interactive showcase supports pointer/arrow rotation and wheel zoom. Model
loads are cached per hero and guarded against stale async completion after clear.
All actual NPCs clone their own hero's parsed GLB and own animation mixer, not the
human's model. Non-current GPU templates are released when leaving a session.

Franco offer is data in `src/heroes/franco/commerce.json`: **32000 Coins OR 749
Diamonds**, initial user-selected prices supported by mlbb.io. It is not both
currencies, match gold, a skin, recharge or an earning implementation. Existing
30000 Coins / 0 Diamonds starter wallet and Layla ownership are unchanged, so
Franco stays locked on a fresh account. No test fixture balances reach a real
player save. No currency grants or new player-facing cheats were added.

A currency-specific quote opens a clear confirmation; cancel does nothing. The
quote is consumed synchronously before awaiting a serialized transaction. Web
Locks serialize browser tabs where supported; a per-account promise queue also
serializes same-page stores and the Node harness. The transaction re-reads the
latest valid wallet, ownership and configured price, checks funds, then writes
one wallet+ownership JSON atomically. Repeated, stale or cross-account quotes
cannot purchase twice. Storage failure does not create session-only ownership or
apply a session debit. Purchases require writable storage. Valid v1 balances are
not re-granted, known ownership is retained/deduplicated, corrupt wallets recover
at zero, and unknown hero IDs are filtered. Build, profile, history, roster and
loading/HUD identity use the actual hero. Franco history uses existing v1 format.

## Gameplay data and provenance (not official world-unit/frame claims)

Secondary sources read 2026-10-19:

* <https://mlbb.io/en/hero/franco> — Tank / Roam, 32000 Gold / 749 Diamonds,
  passive and base/growth candidates. Account Coins are the user's chosen local
  purchase currency; match gold is not converted into account currency.
* <https://liquipedia.net/mobilelegends/Franco> — active/rank damage, mana, CD,
  physical scaling, 70% / 1.5s Fury slow and 1.8s / six-hit Hunt.
* Existing `docs/LAYLA_REWORK_RESEARCH.md` records conflicting Layla references.
  Page timestamps are not proof of current official balance or measured frames.

Franco base candidates: HP2600 (+281), mana500 (+100), PA116 (+7.21), physical
DEF25 (+4.86), magic DEF15 (+2.5), HPregen9.2 (+.67), MPregen4 (+.2), MS260,
APS1.03 (+.02 as an explicitly editable local growth candidate). Published
rounded max-level APS and per-level growth conflict; the JSON growth is the
actual formula, not a claim that every secondary-source table agrees.

* Wasteland: after five damage-free seconds +10% speed, +1% max HP/sec using
  shared anti-heal/recovery rules, up to ten stacks. **One stack/sec is a local
  configuration choice** because references do not specify the interval. Next
  accepted active skill consumes all for +15% skill damage/stack (max+150%).
* Iron Hook: physical [400,450,500,550,600,650] +100% PA; mana135–160 by5;
  CD[15,14.2,13.4,12.6,11.8,11]. **6.4 local units and .15s release + .25s
  maximum outbound travel are the approved custom Plan B**, not official range
  measurements. First enemy hero/minion swept contact, directional (no homing or
  target bypass), .18s collision-aware pull toward caster, .5s configured stun,
  minimum body separation, .02s contact pause, .08s hit return and .2s miss return. Stun/stop/return are explicit local
  simulation parameters. Structures are not hook captures. Miss, immunity,
  invalidation, caster/target death and resets clean up their owned state.
* Fury: physical [300,330,360,390,420,450] +4% caster max HP, mana40–65 by5,
  CD[7,6.5,6,5.5,5,4.5], 70% slow1.5s. Approved .30s slam; **3.2 local radius**.
* Hunt: enemy hero (or practice hero dummy) only; six physical hits, each
  [50,60,70] +70% PA; mana[110,125,140], CD[62,55,48]. Approved timestamps
  [.15,.45,.75,1.05,1.35,1.65] within a 1.80s suppression channel. No normal
  movement/attack/cast during channel; suppression survives cleanse. Death,
  interruption, invalid target or reset releases owned suppression immediately.

Layla deliberately retains existing base stats, physical scaling, damage/mana/CD
rank tables and numeric world conversion, rather than silently adopting one of
several conflicting secondary-source balance revisions. Approved R2 releases
are .25 basic, .25 S1, .40 S2, .65 ultimate; speeds18/24/10. R2 area1.4, mark3s,
trigger stun.25s and width1 beam are explicit integration changes. The ultimate
extends **48 custom local units**, including when locked on a near target, hits
all valid line contacts once at release, follows the live muzzle visually and
has a stable full-range endpoint, with .24s layered light fade. This is an
approved visual/gameplay prototype reach, **not an official 48-metre claim**.
Existing distance scaling excludes towers and the same owner-specific S2 mark
is only consumed by a later hit, not its application or neighboring mark chains.
Existing S1 hit benefits and input/lock policy remain on the shared engine.

## Shared player/NPC implementation

Both kits use HeroCombatSimulation, the same rank/stats, defense, equipment,
resource/cooldown, projectile collision, status and damage paths. There are no
role/difficulty stat bonuses. Difficulty changes policy/aim, not numeric kits.
Franco submits Tank/Roam peel/catch/frontline/objective intents, using actual
available skill ranges, first-unit hook blocking, shared retreat hysteresis and
tower cover. His committed objective/farm goal is independent of Layla movement.
Existing ranged Layla spacing, last hits, retreat, wave/tower and sustain policy
are retained. No Assassin, Mage or Support implementation is added.

## Rebuild and verification

`npm ci && npm test` runs the full existing suite plus new tests. The historical
Franco Plan A downloadable HTML/ZIP are absent in this checkout; the pre-existing
hash-preservation test still reports that absence. Do not weaken it, invent
matching files or interpret its failure as a passed full suite.

`npm run build` embeds all assets into root `index.html`. `npm run
test:browser:two-heroes` builds the isolated render harness and verifies a copy of
**only** that HTML opened as file:// with offline Chromium, plus the same actual
engine/renderer in its test-only fixture. The fixture is not imported by the
game and adds no player-facing mutation/cheat. `npm run package:two-heroes`
creates the current HTML and organized source ZIP, excluding Git, dependencies,
cache, reference uploads, screenshots, old compiled previews and duplicate
builds. Approved preview source/GLBs and Blender inputs are retained so their
source-preservation tests can still run. See `VERIFICATION.md` for executed
results, delivery hashes and limitations. Windows/native GPU and physical mobile
hardware are **not** certified by Linux software-WebGL/viewport tests.

The packaged source retains the small editable preview `index.html` entry files;
only the three multi-megabyte compiled historical `*-Animation-Preview.html`
files are omitted. In an extracted source archive, use `node
scripts/two-heroes/audit.mjs --source-only` to verify all30runtime entries and
68approved original source/authoring entries, explicitly listing those three
omitted compiled files. Default audit in this full workspace verifies all71.
