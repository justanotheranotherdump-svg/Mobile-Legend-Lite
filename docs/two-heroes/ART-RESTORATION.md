> **Current update:** [USER-FEEDBACK-FIXES.md](USER-FEEDBACK-FIXES.md) supersedes
> earlier artwork, locked-selection-preview and one-copy/one-active-item wording
> below. Earlier results remain historical, not claims of new reruns.

# Illustrated UI restoration — 2026-10-19

This corrects the unwanted replacement of illustrated menu art with GLB renders.
Work remains local on `arena/55ce0f80-mobile-legend-lite`; no new commit or push.
The published ancestry and the approved gameplay models/kits are unchanged.

## Artwork and presentation

- **Layla:** `src/heroes/layla/assets/illustration.png` is byte-for-byte the
  original `src/assets/images/layla-creation.png`. The account/lobby circular
  avatar is the original `src/ui/assets/layla-portrait.png`.
- **Franco:** no older anime illustration was located in the checkout/history
  search. His new `illustration.png` is an original AI-generated 2D illustration,
  explicitly not described as recovered historical artwork or a model render.
- Shop cards and clicked hero details use the **same per-hero illustrated PNG**.
  Details are full-opacity artwork, not an interactive 3D canvas. All four skill
  guide buttons, roles/ratings, filtering, navigation and purchases remain.
- Canonical square/character portraits are genuine crops of those illustrations.
  Profile statistics/history, owned heroes, room/human avatar, selection roster,
  pick thumbnails and loading lineups therefore no longer use model screenshots.
  Empty-account statistics remain empty: no fabricated production history.
- Layla's lobby illustration is left of, and does not overlap, the invitation.
  Modes also shows illustrated Layla. No menu hero model is loaded for lobby,
  Shop, profile or clicked details.
- The original `hero-selection-stage.png` remains the backdrop on entry, Layla,
  Franco and clear. The approved interactive GLB stays in the **central explicit
  hero-selection preview**, with rotation/zoom, and in actual gameplay.
- Null entry/clear remains real null. Preview resources are recreated on returning
  from gameplay, including entering selection with no hero picked yet.
- Locked Franco has an explicit reason and disabled `LOCKED · UNLOCK IN SHOP`
  confirmation. He costs **32,000 Coins OR 749 Diamonds**, through an explicit
  Shop confirmation; a sufficient balance alone is not ownership. AI selecting
  Layla is unrelated. No funds or ownership were granted to a real save.
- Lock text does not flex-shrink hero/Clear buttons. Portrait authoring is
  reproducible with the optional Pillow helper
  `scripts/art-restoration/prepare-illustrations.py`. The old GLB render comparison
  helper now writes **only to artifacts**, never over canonical illustrated PNGs.

## Executed verification

| Check | Actual outcome |
|---|---|
| `npm run build` + standalone checker | PASS; root/dist/current download identical; inline assets |
| Focused restoration/two-hero/guide Node tests | **70/70 PASS**, no skips |
| Full `npm test` | **902/903 PASS**, no skips; sole historical Plan A failure below |
| Current two-hero offline browser suite | **18/18 PASS**, no browser errors, warnings or external resource requests |
| Added illustrated-UI offline browser suite | **8/8 PASS**, including PNG byte hashes, fixed stage, actual purchase/AI Layla, loading images and play → quit → choose again |
| Existing hero-browser suite, updated to the user's 2D policy | **9/9 PASS**; original creation-art layouts, guide/skills, filters, wallet, touch/back, training/audio and offline assertions retained |
| Runtime asset audit | **32 assets**, **71 approved-original hashes unchanged**, **16 separate hero PNGs**; character cutouts retain useful alpha |
| Optional illustration crop helper | Reproduced all four portrait hashes exactly |
| Final source ZIP, extracted cleanly | Fresh `npm ci`/build PASS, byte-identical HTML; full units reproduce 902/903 with the same historical failure; final HTML-only UI browser suite **8/8 PASS** |

The two-hero suite still verifies actual selection rotation/zoom (moved from
unauthorized 3D details), both-currency purchase/cancel/idempotency/reload,
null/clear/async races, real approved player and mixed NPC rigs, shared combat,
Layla's distinct S1/S2/48-unit beam and Franco hook/chain/six-strike suppression.
No mechanics test was deleted or skipped. Other older legacy-suite reports are
historical baseline only, **not claims of new reruns for this correction**.

The sole full-suite failure remains `tests/franco-preview.test.js`:
`Saved Plan A HTML and source hashes are preserved exactly for fallback` /
`Full repository must contain saved Plan A downloads`. Those ignored historical
binaries were absent in the supplied checkout before these edits. No replacement
binary, fake hash, skip or weaker assertion was introduced.

Logs/screenshots are in `artifacts/art-restoration/`; portable browser summaries
are checked into this directory. Tests use fresh isolated browser profiles; test
funds are seeded only there to exercise the real purchase path. Production fresh
accounts remain **30,000 Coins / 0 Diamonds / Layla owned**.

The added visual audit freezes only wall-clock `Date` in its first scenario, so
slow software-GPU image inspection does not consume the 45-second pick window.
RAF, performance time, loading timers and real button interactions still run.
Commerce/play uses another fresh browser with normal time. The separate 18-check
two-hero suite continues to use normal time; no production timer was changed.

Linux Chromium/SwiftShader and emulated landscape/touch checks are not Windows,
native-GPU, speaker or physical-device certification.

## Delivery

- `deliverables/MOBA-Lab-Layla-Franco.html`: current standalone offline game.
- `deliverables/MOBA-Lab-Layla-Franco-source.zip`: organized source, illustrated
  PNGs, approved GLBs/configs/effects, tests/docs and one playable root HTML.
- `deliverables/Layla-Franco-Delivery-Manifest.json`: current byte counts/hashes.

Packaging excludes dependencies, Git, caches, uploaded references, test captures
and duplicate compiled builds. Source ZIP contents/hashes and an isolated
install/rebuild are checked separately; see `RESTORATION-PACKAGE-RESULTS.json`.
