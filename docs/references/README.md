# User-provided visual references

Saved 2026-10-17 from the ten uploaded images, byte-for-byte. These files are for internal visual analysis and planning, not runtime textures, UI overlays, licensed game assets, or evidence of working 3D models. Do not include them in the shipped game as proprietary artwork.

## Per-image observations and future uses

| File | Visible reference | Design guidance |
| --- | --- | --- |
| image-1.png | Whole battlefield on a rocky slab; opposing corner bases, perimeter routes, diagonal central route, river and two circular river areas, clustered vegetation and rocks | Overall topology, readable terrain regions, boundary silhouette, distinguish traversable paths from blockers |
| image-2.png | Community-style map collage with lane, bush, buff, neutral-creature and wall examples | Bush placement near paths and objectives; separate environment decoration from gameplay concealment/collision. Text is not an authoritative rules specification |
| image-3.png | Stylized whole-map view with blue lower-left and red upper-right bases, river, lanes, jungle clearings, defensive structures | Team-color landmarks, three-lane readability, jungle negative space, strong base silhouettes and coherent original environment palette |
| image-4.png | Simplified map diagram using colored structure, camp, and objective symbols | Data-driven map layout and a future minimap. Do not infer exact object counts/types or scale from an unlabeled symbol alone |
| image-5.png | Enlarged minimap with hero portraits, structure markers, and objective/camp information | Later live-state minimap hierarchy and marker legibility; not a screenshot to display as a fake minimap |
| image-6.png | Close gameplay view with heroes, minions, turret, grass, overhead bars and ability controls | Camera framing, unit scale, hero/minion readability, ground shadows, HP/mana/level labels, clear playable space |
| image-7.png | Lane/river combat view with range markings, turret, rocks, bushes and cooldown controls | Target/range telegraphs, readable combat contrast, navigation chokepoints, clickable ability feedback paired with desktop hotkeys |
| image-8.png | Promotional jungle scene with a hero and dragon-like creatures, plus logos/store badges | Creature silhouette and camp-enclosure mood only; do not copy branding, promotional claims or proprietary creature assets |
| image-9.png | Hero with overhead HP/level, bright effect and a large kill-streak banner | Later combat feedback and announcement hierarchy; keep announcements from obscuring aiming. Does not specify skill behavior |
| image-10.png | Multiple heroes around a large neutral creature, HP bars, announcement and item suggestions | Objective encounter readability, team distinction, health feedback and later shop suggestions; visual presence is not proof of implemented systems |

## Cross-image interpretation

- Use an elevated, ground-readable view for play; whole-map images guide topology, not the normal gameplay zoom.
- Opposing corner bases connect through three routes. Jungle clearings, rock walls, brush, and a crossing river organize movement and conflict.
- Use green vegetation, stone paths/walls, blue-green water, and contrasting team accents as broad inspiration for original stylized assets.
- Separate collision, walkability, concealment, and cosmetic vegetation. Bush concealment is a future gameplay system, not automatically implemented by rendering grass.
- Keep hero silhouettes, effects, team allegiance, HP/mana, level indicators, targeting and cooldown feedback readable at gameplay distance.
- Preserve desktop WASD/mouse control; a mobile joystick visible in a reference is not a request to replace the approved control scheme.
- Final skills must be clickable as well as keyboard accessible. Do not add decorative or nonfunctional future controls to the foundation milestone.
- Use original/appropriately licensed UI icons and 3D art rather than cropping these screenshots.
- Screenshots cannot establish accurate scale, collision meshes, hidden map areas, exact camera parameters, animation clips, hero stats, targeting logic, or objective rules. These require explicit design and gameplay testing.
- The references show map/version variations. A coherent original map specification must be agreed during the appropriate milestone; do not silently merge every visible detail or claim a faithful reconstruction.

## Integrity

SHA-256 for the preserved uploads:

```text
e5be06c31de984d333fa39aad251edbb2e95fa61f62afa068356cccd36042a83  image-1.png
aff9d465c00b1c3213110ffaf3112a48a49993ddd701c313c89aae8eb63efaf1  image-2.png
fce2ed1c6af52fc1cdff3073f1cc8410565cebb427ce2d7056982bc10ae54792  image-3.png
af6ccb374b45890a086fcb5b34bd9fc0d07eafdb269c157c9d35b407966e0339  image-4.png
30bc3a389650efe1ca193be9438637f4cfdda4190a2740c0c6a79fe7c44fa7cf  image-5.png
5813099ea87195540e22e9ed2f558d5ec835d8194090fdac7f5e845b09f355fe  image-6.png
759ef9652e034d3ba7bbad1759a1540b7af4560e7b6f5c1de5678bd254c3e3f1  image-7.png
ff7e1f2144a61d6d642a9197e474d3c8434a08c97f38e4574d57fa9b57cea85f  image-8.png
06b7fda85120bbe423ab2de4cc70d0bd401ecedafabe0a9890da01772d856341  image-9.png
fa99614e39a39b8b215e0120f2c9e808b2cb6dc4f96efe41d0ce0fe815a5ce63  image-10.png
```
