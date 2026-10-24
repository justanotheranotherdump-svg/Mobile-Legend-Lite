# Existing Test Hero

This is the original training placeholder, not an implemented Layla kit.

- `hero.json`: exact original HP/speed/radius/basic-attack values and identity.
- `abilities.json`: empty; no abilities, mana rules or passive existed to migrate.
- `animations.json`: empty mapping; placeholder has no actual animation clips.
- `visual.json`: placeholder reference and presentation-only transform.
- `placeholder.js`: original temporary mesh, moved out of the world renderer.

Future actual models belong in this hero's `assets/*.glb`; no such files exist now.
Changing the model/animation mapping must not change hero stats or shared combat.
See ../../../docs/HERO_ARCHITECTURE.md for validation and offline embedding rules.
