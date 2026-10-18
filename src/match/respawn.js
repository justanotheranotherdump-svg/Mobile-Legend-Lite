export function respawnDelay(scenario, matchTime) {
  const r = scenario.respawn;
  if (!r || !Number.isFinite(matchTime) || matchTime < 0)
    throw Error("Invalid match-time respawn rules");
  for (const k of ["base", "perCompletedMinute", "cap"])
    if (!Number.isFinite(r[k]) || r[k] < 0)
      throw Error("Invalid respawn setting: " + k);
  if (r.cap < r.base) throw Error("Respawn cap below base");
  return Math.min(
    r.cap,
    r.base + Math.floor(matchTime / 60) * r.perCompletedMinute,
  );
}
export function restoreActor(actor, spawn, time, protection) {
  Object.assign(actor, {
    x: spawn.x,
    z: spawn.z + (actor.laneOffset || 0),
    hp: actor.maxHp,
    mana: actor.maxMana,
    deathHandled: false,
    spawnProtectedUntil: time + protection,
    stunned: false,
    stunnedUntil: 0,
    mark: null,
    contributors: {},
    intent: null,
    nextThink: 0,
    respawnAt: null,
    respawnDuration: null,
    aiState: null,
    retreating: false,
    marks: {},
  });
}
