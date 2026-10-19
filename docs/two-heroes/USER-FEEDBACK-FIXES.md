# User feedback fixes — 2026-10-19

Current local work on `arena/55ce0f80-mobile-legend-lite`. No new commit/push,
new hero/mode, ownership grant, starter-fund change or approved model reauthoring.
This supersedes previous locked-selection-preview and equipment-copy policies.

## 1. Layla ultimate visual versus aimed damage

Root cause: the authoritative `beam` release event omitted `effect: "line-blast"`.
Damage used the aimed world endpoint correctly, but the approved VFX adapter could
not identify the release, leaving the preview's default forward/+Z endpoint.
The event now includes the effect identity and the renderer receives the actual
released endpoint. No range, width, damage, cast timing, model or animation change.

Tests cover ±X, ±Z and all four diagonals, at a translated player origin:
near/mid/far enemies take damage, an off-line enemy does not, actual mesh endpoints
agree with release coordinates, and all eight actual approved-model framebuffer
checks illuminate at least eight of nine samples along the aimed line.

## 2. Repeat equipment purchases

All non-boot ordinary equipment can be bought repeatedly, paid per additional
copy, within the existing **six-slot** inventory. No free copying or automatic
replacement. Shop no longer labels a non-boot purchase button `Owned` or gives a
completed zero-cost quote just because one copy is equipped. Real components
still credit once per actual consumed slot, never from the existing target item.

- Basic additive stats stack per copy; existing caps and identical named unique
  passive effects remain unique. Active copies share their effect's cooldown.
- Different/duplicate non-boot active items may coexist. Every equipped USE button
  has a unique ID and works; buying another copy cannot reset the shared timer.
- Exactly **one pair of boots**, including historical `boots`/Wayfarer Boots,
  which remains in the Legacy catalog category. Legitimate component upgrades
  consume/replace the old pair; unrelated second boots are rejected atomically.
- Duplicate Preparation builds persist and progress **per actual purchased copy**,
  not a Set of item names. Selling/combining does not undo completed build steps.
- One-slot sales refund only that copy and remove only its bonuses. Consumables,
  special/hero-exclusive requirements, currencies and account saves stay separate.

## 3. Owned-only human hero selection

Only implemented, owned heroes appear as human pick buttons. A new account sees
Layla, **not Franco**. The controller also rejects direct unowned selection.
Null entry, Clear and explicit owned confirmation remain. Buying Franco normally
in Shop adds him to the list; sufficient funds alone do not convey ownership.
Shop still supports read-only illustration/skill inspection before purchase.
AI availability is independent of the account's owned collection.

Franco still costs **32,000 Coins OR 749 Diamonds**, with explicit confirmation,
one-currency/idempotent debit and persistence. Fresh wallet remains 30,000/0.

## 4. Newly illustrated reference-based assets

The two newly supplied references guide **new painted 2D illustrations**, not
runtime model renders or a claim of exact official artwork reproduction. For
**each** hero in `src/heroes/<id>/assets/`:

| File | Purpose |
|---|---|
| `illustration.png` | Full colored splash/banner; same PNG in Shop and clicked details |
| `showcase-background.png` | Matching environment-only background, no character |
| `character.png` | Full real RGBA transparent character master |
| `character-portrait.png` | Contained 512×768 transparent thumbnail |
| `portrait.png` | 512×512 face icon for profile, roster, pick and loading cards |

Lobby/Modes uses the transparent Layla master, not a rectangular poster. Account
icons use the matching new face crop. Original Layla creation art/avatar remain
intact on disk; username creation still uses the original art. The original hero
selection stage stays fixed, not replaced with a new hero background. Gameplay
and the central owned-hero preview still use the exact approved GLBs.

PNG alpha is decoded/measured, not a checkerboard image. Soft cyan glow is
white-de-matted for transparent compositing. Optional Pillow authoring helper:
`scripts/art-restoration/prepare-illustrations.py`; shipped masters/crops need no
Pillow at runtime/build. Uploaded references and temporary white-matted sources
are excluded from the source ZIP.

## Executed checks and limits

Current machine-readable results: `CURRENT-FEEDBACK-RESULTS.json`.

| Executed check | Result |
|---|---|
| Focused correction + two-hero/guide units | **178/178 PASS**, no skips |
| Full units, root and extracted source | **1010/1011 PASS**, same sole historical Plan A failure, no skips |
| Two-hero offline browser | **18/18 PASS** |
| Actual eight-direction model/beam framebuffer | **8/8 PASS** |
| Existing hero-guide browser | **9/9 PASS** |
| Extracted-source art/selection/commerce/live-Shop/play-return browser | **10/10 PASS** |
| Asset audit | **34 assets, 18 hero PNGs, 71 approved-original hashes unchanged** |
| Fresh extracted npm install/build | PASS; rebuilt HTML byte-identical |
| Package contents/asset hashes/offline checker | PASS; no references/dependencies/screenshots/duplicate builds |

The **45 browser checks** include the source-only run. Exact logs and screenshots
are under `artifacts/current-fixes/` (excluded from source delivery).
- New focused aim/equipment/selection tests include all 97 non-consumable paid
  entries, paid copies/stacked base stats/sale or one-boots enforcement.
- Existing two-hero browser assertions retained: rotation/zoom now uses owned
  Layla; Franco's four-ability drawer and two-hero switch races are checked after
  a real purchase, not removed. Both currency paths and real models/VFX retained.
- UI audit checks new art hashes, owned-only draft, real purchases/loading,
  actual repeated Shop transactions/stats/one-boots/sale, duplicate active buttons
  and shared cooldown, then play → quit → choose another owned hero.
- Visual audit freezes only Date in its first image-inspection scenario to avoid
  consuming the draft window on slow software GPU; its commerce/play scenario and
  the separate two-hero suite use normal timers. No production timer changed.
- Full units retain the sole pre-existing missing historical Plan A HTML/ZIP
  preservation failure. No skip, substitute binary or fake historical hash.
- Older broader legacy-suite reports are historical, not new rerun claims.
- Linux Chromium/SwiftShader and emulated layouts are not Windows, native GPU,
  physical phone or speaker certification.

## Deliveries

- `MOBA-Lab-Layla-Franco.html` — current standalone offline game.
- `MOBA-Lab-Layla-Franco-source.zip` — source plus one playable root HTML.
- `Layla-Franco-Illustrated-Art.zip` — ten separate illustrated PNG variants.
- `Layla-Franco-Delivery-Manifest.json` — current delivery sizes/SHA-256 hashes.

Source packaging excludes dependencies, Git, caches, reference uploads, test
screenshots and duplicate compiled builds. Fresh extracted build/HTML equality,
asset hashes and source-unit results are recorded in the current results JSON.
