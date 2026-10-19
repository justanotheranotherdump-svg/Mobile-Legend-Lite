# Layla — intentional reconstruction, not recovered gameplay

The authorized recovery search found no previous working kit. `hero.json` and
`abilities.json` contain editable **initial reconstruction values**, not official or
recovered MLBB balance. See `docs/LAYLA_INTEGRATION.md` for initial mechanics and `docs/COMBAT_CONTROLS.md` for the current tap/hold/homing correction.

- `hero.json`: identity, retained arena HP/speed/collider/basic numerical defaults,
  new mana/regen, basic projectile speed/windup and 1.05s full-Shoot action lock.
- `abilities.json`: passive and exactly three active slots; strict allowlisted
  effect parameters. Change numbers here, never add executable JSON/script fields.
- `animations.json`: `move → Walk`, `basicAttack/cast → Shoot`. No Idle/Death or
  dedicated skill clips exist. Adapter stops tracks for rest-pose idle.
- `visual.json`: model reference, scale, facing adjustment and ground offset.
- `assets/layla.glb`: exact approved forward-shoot study copied without edits.
  64,808 bytes, SHA256
  `963a4902955cb8ad345c74eb63b76e602ade5247c2bd94544ce3000cba6edd51`.

Simulation execution is shared code, independent of mesh/colliders. Procedural
VFX are in `src/rendering/combat-vfx.js`; they consume authoritative events and
projectile/status state, and cannot apply damage. No runtime asset requests.
