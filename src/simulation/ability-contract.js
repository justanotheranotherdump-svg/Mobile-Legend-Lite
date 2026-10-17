// Code-owned schemas and handlers; JSON can never execute arbitrary code.
const schemas = Object.freeze({
  "distance-scaling": {
    referenceDistance: [0.01, 1000],
    maxMultiplier: [1, 10],
    excludedKinds: "kinds",
  },
  "line-projectile": {
    speed: [0.1, 100],
    radius: [0.01, 5],
    buffDuration: [0, 60],
    speedMultiplier: [1, 3],
    attackRangeBonus: [0, 30],
    skill2RangeBonus: [0, 30],
    collidesWithWalls: "boolean",
  },
  "orb-mark": {
    speed: [0.1, 100],
    radius: [0.01, 5],
    blastRadius: [0.1, 20],
    markDuration: [0.01, 60],
    bonusDamage: [0, 100000],
    stunDuration: [0, 10],
    stunRadius: [0.1, 20],
    collidesWithWalls: "boolean",
  },
  "line-blast": { width: [0.01, 20] },
});
export function validateCombatAbility(a, path) {
  const fail = (m) => {
    throw Error(`${path}: ${m}`);
  };
  const fields = [
    "id",
    "name",
    "slot",
    "effectId",
    "range",
    "damage",
    "manaCost",
    "cooldown",
    "castTime",
    "parameters",
  ];
  if (
    !a ||
    typeof a !== "object" ||
    Array.isArray(a) ||
    Object.keys(a).length !== fields.length ||
    fields.some((k) => !Object.hasOwn(a, k))
  )
    fail("invalid combat ability fields");
  if (
    !/^[a-z][a-z0-9-]{0,63}$/.test(a.id) ||
    typeof a.name !== "string" ||
    !a.name.trim()
  )
    fail("invalid ability identity");
  if (
    !["passive", "skill-1", "skill-2", "skill-ultimate"].includes(a.slot) ||
    !Object.hasOwn(schemas, a.effectId)
  )
    fail("unknown slot/effect");
  if ((a.slot === "passive") !== (a.effectId === "distance-scaling"))
    fail("passive requires distance-scaling");
  for (const k of ["range", "damage", "manaCost", "cooldown", "castTime"])
    if (!Number.isFinite(a[k]) || a[k] < 0 || a[k] > 100000)
      fail(`invalid ${k}`);
  if (
    a.castTime > 5 ||
    (a.slot !== "passive" && (a.cooldown <= 0 || a.range <= 0))
  )
    fail("invalid cast time/cooldown/range");
  const p = a.parameters,
    s = schemas[a.effectId];
  if (
    !p ||
    typeof p !== "object" ||
    Object.keys(p).length !== Object.keys(s).length
  )
    fail("invalid parameter fields");
  for (const [k, rule] of Object.entries(s)) {
    if (rule === "boolean") {
      if (typeof p[k] !== "boolean") fail(`invalid ${k}`);
    } else if (rule === "kinds") {
      if (
        !Array.isArray(p[k]) ||
        p[k].some((v) => !["turret", "tower"].includes(v))
      )
        fail("invalid excludedKinds");
    } else if (!Number.isFinite(p[k]) || p[k] < rule[0] || p[k] > rule[1])
      fail(`invalid ${k}`);
  }
}
