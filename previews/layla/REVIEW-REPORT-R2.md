# Layla R2 — distinct Malefic Energy effects

**2026-10-19 · Effects/comparison revision only · STOP for user review.**

## Open and inspect

- Main standalone deliverable: `deliverables/Layla-Animation-Preview-R2.html`.
- Editable local assets/source: `deliverables/Layla-Animation-Preview-R2-Source.zip`.
- Specification: `docs/LAYLA_PREVIEW_SPEC.md`; controls/build guide: `previews/layla/README.md`.

Open the HTML directly in a modern Chrome/Edge WebGL2 browser. No server, adjacent assets, installation or internet is needed for viewing. The live workshop serves the same canonical build.

1. Click **Four-attack comparison** in the left navigation. It opens paused at each attack's release/flight phase so the small basic bolt, elongated bomb, spherical orb and beam are visible together.
2. Use **Wind-up**, **Initial impact**, **Mark state**, **Mark trigger / stun**, and **End / cleared** to inspect separate events. Each card reports its actual seconds; phase alignment is explicitly not equal elapsed-time alignment.
3. Use **Play all from input**, or each card's own Play / Restart / timeline. Comparison speed is independently selectable at0.1/0.25/0.5/1×. It defaults0.25× for inspection; the ordinary workshop still defaults1×.
4. Toggle **Shared full-range scale** to fit the distant ultimate endpoint. Every panel uses the same camera and world scale. The close crop intentionally shows only the beginning of the beam, not a shorter beam.
5. Return to the workshop, choose **Destruction Rush**, then **Near + mid + far line**. Press Play, or jump to Release / Contact. Close, Medium and Far end presets are also available. The numeric range, width, flash duration and halo strength controls are independent.

## Effects implemented

| Attack | Distinct geometry and behavior |
|---|---|
| Basic | Small white-cyan plasma bolt, narrow short blue wake, focused muzzle flash and sharp small impact. Existing source firing/recoil/recovery animation unchanged. |
| S1 Malefic Bomb | Pointed lathed energy spindle, brighter substantial white core, blue shell, violet edging, rotating fins/streaks and long tapered trail. Stronger muzzle/impact flash and short successful-hit cyan actor streaks. Default visual speed24u/s is faster than basic18u/s; both remain editable proposals. |
| S2 Void Projectile | Real3D spherical reactor with layered core/shell, three rotating bands, curved energy arcs, pulse and controlled wake. Initial collapse/flash/fragments, expanding ring and explicit configured-radius boundary/fill. Persistent hovering diamond/ring Magic Mark sigils. A later compact cross-burst and stun stars are visually separate; affected neighbors get their own smaller flashes without chain-consuming marks. |
| Ultimate Destruction Rush | Converging muzzle streaks, rotating charge bands and cannon lighting, then a powerful brief continuous beam: white-cyan core, electric-blue/cyan body, restrained violet border, moving internal shader streaks, connected muzzle base and far endpoint. Distinct contact ripples/flashes at all eligible targets; clean final fade. No tiny travelling bullet or separated ball chain. |

All effects share a white/cyan/blue/violet cannon-energy palette. The supplied multiskin screenshots guide beam structure, not a switch to orange/red skin effects or an inference of measured range/timing. Effects are original procedural local meshes, particles, additive layers and a beam-flow shader; no supplied screenshot is used as a runtime texture and no online effects are loaded.

### Explicit prototype geometry and timing

- Basic: radius.055u / body length.24u / trail.32u / speed18u/s.
- S1: nominal radius.15u / pointed body approximately.82u / trail1.25u / speed24u/s. It is a travelling bomb, not a continuous beam.
- S2: spherical shell approximately.29u radius with surrounding bands/arcs; speed10u/s. The initial and trigger **candidate hit areas** use the editable1.4u radius. The trigger's compact decorative burst is smaller; its violet boundary and nearby hit responses still show the proposed area behavior.
- Ultimate: default48u actor-center maximum reach,1u luminous main-body diameter,.24s complete flash including its last30%fade, and.7 halo intensity. Independently editable range3–120u, width.2–3u, duration.08–1s and halo0–1.5. Decorative halo may extend to1.28×body diameter; it does not widen collision. The main luminous body diameter equals the displayed candidate lane width.
- Default superline dummies:3.4u /24u /45.12u. The beam hits all eligible targets along the line immediately in the default mode. Optional extending-front mode also stays connected to the cannon, never a short detached projectile.
- Input-to-release candidates remain basic.25 / S1.25 / S2.40 / ultimate.65s. Attack interval remains APS-based. Existing commitment toggle remains a prototype comparison, not official complete uncancellability. Beam flash duration does not change cast commitment or add damage-over-time.

**These are visual workshop proposals, not verified MLBB ranges, speeds, meters, frame measurements or final combat hitboxes.** Candidate linear overlap also accounts for dummy radius; no hidden extra beam width is added. Existing research conflicts/status labels remain intact.

## Preservation

The original GLB, Blender project, rig/action manifest, author script and research JSON are byte-identical to R1. All ten source animation clips, model geometry/materials, face/outfit/hair/twin tails/cannon, basic attack animation and locomotion were retained. No model reauthoring or unrelated animation replacement was necessary. Existing source recoil supports the revised muzzle effects.

The extended preservation audit checks **342 unchanged protected files**: the337 original game/Layla/Franco/source files plus five frozen Layla asset/research/authoring files. No new runtime file was added to `src`; no playable-game registration/integration occurred. Parked Franco is untouched. R1 source/HTML fallback is retained separately in `previews/layla/revisions/r1`; existing versioned R1 downloads are not overwritten. R1 duplicates are excluded from the R2 ZIP.

## Actual verification

- **32/32 focused tests**, zero skipped: original21 mechanics/asset tests plus11 effects/preservation tests.
- **34/34 motion/mechanics browser groups** and **17/17 dedicated R2 effects/comparison groups**, zero runtime errors, console warnings or external requests. The existing travel-mode test now explicitly selects that mode because R2 defaults immediate; the independent-speed test explicitly seeds its original14u/s comparison. No assertions were removed or weakened.
- Rendered framebuffer samples verify a bright continuous ultimate core at at least17 of19 positions along its full projected path. Geometry checks separately verify live-muzzle connection, stable distant endpoint and main-body/candidate-width equality.
- Real normal-speed and0.25× playback, per-card clocks, pause/restart/seek, all requested actor studies through completion, actual release sampling, S1 hit/miss, S2 initial/mark/trigger separation and neighboring responses, all-target beam hits, cleanup, independent controls and390px emulated layout were exercised.
- Screenshots were directly inspected for four-way flight, orb initial impact, persistent marks, separate trigger/stun, ultimate charge and super-long beam. Impact flashes intentionally render visibly over dummy surfaces; targets retain readable silhouettes.
- **Fresh-folder packaging check: passed.** The packaged HTML alone (one file in a fresh directory) passed all34+17 browser groups offline with zero runtime errors, warnings or external requests. A separately extracted source directory passed `npm ci`,32/32 focused tests and a production rebuild; the rebuilt HTML is byte-identical to the delivered HTML. See `fresh-directory-r2.json`.
- **Full repository827/828 pass**, zero skipped. The sole unchanged failure is “Saved Plan A HTML and source hashes are preserved exactly for fallback”: historical ignored Franco Plan A downloads were already absent at the initial795/796 baseline (R1 was816/817). No Franco reconstruction, skipped tests or concealed green-suite claim was used to hide it.

Delivered HTML SHA-256: `2eb710ea10ed8193f05615acc6d8bc581b4831c5ccbc89a8d89ed8077f1863a0`.

Evidence: `unit-r2-results.txt`, `full-unit-r2-results.txt`, `browser-results.json`, `browser-effects-results.json`, `verification-r2.json`, and final fresh-directory evidence.

## Remaining limitations

This is a separate visual/dummy prototype, not applied HP/damage/mana, final collision, AI, navigation, balance or gameplay integration. The same original fixed-direction lane and baked firing actions are reused; there is no new arbitrary-aim IK, cloth/hair physics, facial rig or audio. Glow is controlled additive geometry/shader layering, not physically simulated volumetric bloom. Simultaneous four-panel rendering costs more GPU/CPU than the ordinary workshop; very short shots may occupy only a few frames at1×, so slow/pause inspection is provided. The full-arena camera necessarily makes the character and basic bolt small; close comparison uses equal camera scaling rather than enlarging one attack artificially.

Linux software-WebGL testing and390px emulation do not certify native Windows, Safari/iOS, a physical touch device or every GPU. Modern WebGL2 is required. Visual strength, palette, orb/mark readability and ultimate flash timing remain for the user's judgment, not claimed approved by tests.

**Stop here. Await feedback on S1, S2 and especially Destruction Rush. No gameplay integration, Franco work, next hero or approval on the user's behalf.**
