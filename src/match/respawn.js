export const respawnDelay = (scenario, level) =>
  scenario.respawnBase + level * scenario.respawnPerLevel;
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
  });
}
