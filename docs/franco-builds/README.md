# Franco recommended equipment builds — 2026-10-24

## Where and how

Lobby → **Preparation → Battle Setup → Owned hero: Franco**. Franco must already be owned; these templates do not unlock him. Three permanent read-only recommendations appear below My Setups:

| Preset | Purchase order |
|---|---|
| **Tank / Roam** | Rapid Boots → Dominance Ice → Fleeting Time → Oracle → Antique Cuirass → Immortality |
| **Hybrid / Pickoff** | Rapid Boots → Dominance Ice → Blade of the Heptaseas → Hunter Strike → Athena's Shield → Immortality |
| **Damage / Burst** | Rapid Boots → Blade of the Heptaseas → Hunter Strike → Sky Piercer → Fleeting Time → Malefic Roar |

These are editable starting points inspired by the supplied screenshots, **not official current-patch optimal builds or a win-rate claim**. All items, prices, stats, recipe components and effects use the game's existing local equipment registry. No new equipment or imported screenshot/art assets.

- **Use build** saves a custom copy and selects it as the active equipment order. An existing identical order is selected instead of duplicated. **IN USE** reflects the active order.
- **Customize copy** opens the existing six-slot editor; source templates never change.
- Existing per-account/per-hero persistence and three-custom-build limit remain. Full slots never overwrite saved work. Duplicate non-boot equipment rules and one-boots rule are unchanged.
- Active order appears in hero selection, then the real match shop's **Recommended** category and Quick Buy. Items still require match gold, normal recipe purchases and six inventory slots. No free items/stats/gold.
- Flicker is a suggestion only, using the actual account unlock status. Use does not select/unlock spells, emblems or a roam blessing. Emblems remain interface/reference-only; no emblem bonuses are applied. Existing Brawl spell/role restrictions remain.
- Layla recommendations, wallet, paid Franco ownership, hero models, hook range8/hero hold0.5s, skills and combat stats are unchanged.

## Changed files

- `src/data/preparation/franco-presets.json`: three documented local item orders, purposes and honest suggestion notes.
- `src/player/franco-presets.js`: immutable templates and normal BuildStore save/select integration, ownership/id/slot-cap checks and identical-copy reuse.
- `src/menu/build-presets.js`: Franco cards with six local item images, visible numbered item names, local total cost, purpose, suggested spell and Use/Customize controls; existing Layla branch preserved.
- `src/menu/visual-build-editor.js`: pass the existing owned BuildStore to the recommendation renderer.
- `src/menu/preparation.css`: scoped responsive name/cost layout only.
- `tests/franco-presets.test.js`, `tests/browser-franco-presets.mjs`: nine unit cases and eight connected standalone browser checks.
- `index.html`, current downloads, docs/rules: regenerated offline artifact and delivery notes.

## Actual checks

- Before edits: player/build regression baseline24/24 pass. Checkpoint16eb752 preserves workspace and published branch ancestry. No push requested/performed.
- Focused unit suite37/37 pass (new9 plus existing player/preparation cases).
- Full `npm test`: **1,061/1,062 pass,0 skipped**. Only existing Saved Plan A historical-download/hash test fails. Not removed/skipped/faked.
- New real standalone browser flow: **8/8 pass**. Real paid Franco purchase in isolated test account; all templates; Use and repeated selection; editable copy and full-slot guard; reload; Layla separation; compact960×540/844×390; selected Hybrid in real match; exact Recommended item order; paid boots purchase and advancement to Dominance Ice; unchanged account funds; zero runtime errors/external requests. QA-only initial test funds are never part of production code.
- Existing `browser-preparation-expansion.mjs`: first8 checks pass, including Layla templates, editor, emblems and canonical equipment art. Then fails at line202 because it expects Retribution/ice blessing in Brawl, while the **pre-edit checkpoint already forces Flicker and disables role effects in Brawl**. This unchanged legacy test was not weakened to hide the discrepancy; do not count the whole suite as passed. The previous source version contains the same Brawl rule.
- Build and standalone validator pass. Browser environment is Linux Chromium/SwiftShader offline file://, not native-GPU/Windows/physical-device certification.

Logs: ignored `artifacts/franco-builds/`. Structured current results in `RESULTS.json`. No user reference screenshots are shipped. No unrelated gameplay changes or next milestone.
