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
  "wasteland-force": {noDamageSeconds:[.1,60], movementBonus:[0,1], hpRatioPerSecond:[0,.1], maxStacks:[1,10], stackInterval:[.1,60], bonusPerStack:[0,1]},
  "iron-hook": {speed:[.1,100], radius:[.01,2], pullDuration:[.05,2], pullStop:[.5,3], stunDuration:[0,3], returnDuration:[.05,2], contactPause:[0,.2], heroContactPause:[0,1], hitReturnDuration:[.01,1]},
  "fury-shock": {radius:[.1,10], maxHpScaling:[0,.2], slowRatio:[0,.95], slowDuration:[.1,10]},
  "bloody-hunt": {duration:[.1,5], strikes:[1,12], firstStrike:[0,2], strikeInterval:[.01,1]},
});
export function validateCombatAbility(a, path) {
  const fail = (m, field = "") => {
    throw Error(`${path}${field ? `.${field}` : ""}: ${m}`);
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
  if ((a.slot === "passive") !== (["distance-scaling", "wasteland-force"].includes(a.effectId)))
    fail("passive requires a supported passive effect");
  for (const k of ["range", "damage", "manaCost", "cooldown", "castTime"])
    if (!Number.isFinite(a[k]) || a[k] < 0 || a[k] > 100000)
      fail(`invalid ${k}`, k);
  if (
    a.castTime > 5 ||
    (a.slot !== "passive" && (a.cooldown <= 0 || a.range <= 0))
  )
    fail("invalid cast time/cooldown/range", a.castTime > 5 ? "castTime" : a.cooldown <= 0 ? "cooldown" : "range");
  const requiredSlot = {"distance-scaling":"passive","wasteland-force":"passive","line-projectile":"skill-1","iron-hook":"skill-1","orb-mark":"skill-2","fury-shock":"skill-2","line-blast":"skill-ultimate","bloody-hunt":"skill-ultimate"};
  if(requiredSlot[a.effectId] !== a.slot) fail("effect does not match slot");
  const p = a.parameters,
    s = schemas[a.effectId];
  if (
    !p ||
    typeof p !== "object" ||
    Object.keys(p).length !== Object.keys(s).length
  )
    fail("invalid parameter fields");
  if (a.effectId === "bloody-hunt" && (!Number.isInteger(p.strikes) || p.firstStrike+(p.strikes-1)*p.strikeInterval > p.duration)) fail("invalid channel strike schedule");
  for (const [k, rule] of Object.entries(s)) {
    if (rule === "boolean") {
      if (typeof p[k] !== "boolean") fail(`invalid ${k}`, `parameters.${k}`);
    } else if (rule === "kinds") {
      if (
        !Array.isArray(p[k]) ||
        p[k].some((v) => !["turret", "tower"].includes(v))
      )
        fail("invalid excludedKinds");
    } else if (!Number.isFinite(p[k]) || p[k] < rule[0] || p[k] > rule[1])
      fail(`invalid ${k}`, `parameters.${k}`);
  }
}
