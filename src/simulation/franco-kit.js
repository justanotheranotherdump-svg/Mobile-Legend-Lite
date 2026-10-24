import { controlImmune, healActor, slowActor, stunActor } from "./status.js";
import { moveEntity } from "./movement.js";
const owner = (s) => s.player.id || "player";
export const heroTarget = (s, t) =>
  Boolean(
    t &&
      (["player", "bot", "hero"].includes(t.kind) ||
        (!s.isMatch &&
          !["minion", "turret", "tower", "core"].includes(t.kind))),
  );
export function resetFranco(s) {
  interruptFranco(s, "reset");
  s.francoStacks = 0;
  s.francoReady = false;
  s.francoStackAt = 0;
  s.player.lastDamageAt = s.time;
  s.player.channeling = false;
}
export function consumeWasteland(s, cast) {
  if (s.hero.id !== "franco") return;
  const multiplier =
    1 + (s.francoStacks || 0) * s.ability("passive").parameters.bonusPerStack;
  cast.a = {
    ...cast.a,
    damage:
      (cast.a.damage + (cast.a.parameters.maxHpScaling || 0) * s.player.maxHp) *
      multiplier,
    passiveMultiplier: multiplier,
  };
  s.francoStacks = 0;
  s.francoStackAt = s.time + s.ability("passive").parameters.stackInterval;
}
function releaseSuppression(s) {
  const c = s.channel;
  if (!c) return;
  const t = c.target;
  if (t.suppressionBy === c.id) {
    t.suppressionUntil = 0;
    delete t.suppressionBy;
    t.stunned = Boolean(t.hp > 0 && t.stunnedUntil > s.time);
  }
  s.channel = null;
  s.player.channeling = false;
  s.lockUntil = s.time;
  s.lockKind = null;
}
export function interruptFranco(s, reason = "interrupted") {
  if (s.channel) {
    s.emit("channel-end", {
      targetId: s.channel.target.id,
      reason,
      strikes: s.channel.next,
    });
    releaseSuppression(s);
  }
  if (s.hookPull) {
    const p = s.hookPull,
      t = p.target;
    if (t.displacementBy === p.id) {
      delete t.displacementBy;
      if (t.stunnedUntil === p.ownedStunUntil)
        t.stunnedUntil = p.previousStunUntil;
      t.stunned = Boolean(
        t.hp > 0 && (t.stunnedUntil > s.time || t.suppressionUntil > s.time),
      );
    }
    s.hookPull = null;
  }
  s.hookReturn = null;
  s.hookPull = null;
  s.channel = null;
}
export function executeFranco(s, cast) {
  const { a } = cast,
    p = s.player;
  if (a.effectId === "fury-shock") {
    for (const t of s.enemies)
      if (
        s.isHostile(t) &&
        Math.hypot(t.x - p.x, t.z - p.z) <= a.parameters.radius + t.radius
      ) {
        s.damageEnemy(t, a.damage, "physical", { physicalScaling: 0 });
        if (t.hp > 0)
          slowActor(s, t, a.parameters.slowRatio, a.parameters.slowDuration);
      }
    s.emit("explosion", {
      castId: cast.id,
      effect: a.effectId,
      point: { x: p.x, z: p.z },
      radius: a.parameters.radius,
    });
    return true;
  }
  if (a.effectId !== "bloody-hunt") return false;
  const t = s.enemies.find((t) => t.id === cast.targetId);
  if (
    !heroTarget(s, t) ||
    !s.isHostile(t) ||
    Math.hypot(t.x - p.x, t.z - p.z) > a.range + 1e-8 ||
    t.suppressionUntil > s.time
  )
    return true;
  const id = `${owner(s)}:hunt:${cast.id}`;
  s.channel = {
    id,
    target: t,
    a,
    start: cast.at,
    end: cast.at + a.parameters.duration,
    next: 0,
  };
  t.suppressionBy = id;
  t.suppressionUntil = s.channel.end;
  t.stunned = true;
  p.channeling = true;
  s.lockKind = "channel";
  s.lockUntil = s.channel.end;
  s.emit("suppression", {
    castId: cast.id,
    targetId: t.id,
    duration: a.parameters.duration,
  });
  return true;
}
export function hookImpact(s, shot, target) {
  const point = { x: shot.x, z: shot.z };
  s.hookReturn = {
    point,
    start: s.time,
    end: s.time + shot.a.parameters.returnDuration,
  };
  if (!target) return;
  s.damageEnemy(target, shot.a.damage, "physical", {
    physicalScaling:
      shot.a.damageModel.physicalScaling * (shot.a.passiveMultiplier || 1),
  });
  if (target.hp <= 0 || controlImmune(s, target)) {
    s.hookReturn.end = s.time + shot.a.parameters.hitReturnDuration;
    return;
  }
  // Hold caught heroes in place before hauling. Non-hero catches retain their
  // original short contact pause; all actors use the same authoritative clock.
  const contactPause = heroTarget(s, target) && target.kind !== "creep"
    ? shot.a.parameters.heroContactPause
    : shot.a.parameters.contactPause;
  const previousStunUntil = target.stunnedUntil || 0;
  stunActor(
    s,
    target,
    contactPause +
      shot.a.parameters.pullDuration +
      shot.a.parameters.stunDuration,
  );
  const id = `${owner(s)}:hook:${shot.id}`;
  target.displacementBy = id;
  s.hookPull = {
    id,
    target,
    from: { x: target.x, z: target.z },
    start: s.time + contactPause,
    end:
      s.time + contactPause + shot.a.parameters.pullDuration,
    returnDuration: shot.a.parameters.hitReturnDuration,
    stop: shot.a.parameters.pullStop,
    previousStunUntil,
    ownedStunUntil: target.stunnedUntil,
  };
  s.hookReturn = null;
  s.emit("hook-capture", {
    targetId: target.id,
    point,
    duration: shot.a.parameters.pullDuration,
  });
}
export function tickFranco(s, dt) {
  if (s.hero.id !== "franco") return;
  const p = s.player,
    a = s.ability("passive").parameters;
  if (p.hp <= 0) {
    interruptFranco(s, "death");
    s.francoReady = false;
    s.francoStacks = 0;
    return;
  }
  const ready = s.time - (p.lastDamageAt || 0) >= a.noDamageSeconds;
  if (ready) {
    if (!s.francoReady)
      s.francoStackAt =
        Math.max((p.lastDamageAt || 0) + a.noDamageSeconds, s.time - dt) +
        a.stackInterval;
    while (s.francoStackAt <= s.time + 1e-8) {
      s.francoStacks = Math.min(a.maxStacks, (s.francoStacks || 0) + 1);
      s.francoStackAt += a.stackInterval;
    }
    healActor(
      s,
      p,
      p.maxHp *
        a.hpRatioPerSecond *
        Math.min(
          dt,
          Math.max(0, s.time - (p.lastDamageAt || 0) - a.noDamageSeconds),
        ),
    );
  }
  s.francoReady = ready;
  s.applyRangeAndSpeed();
  if (s.hookReturn && s.time >= s.hookReturn.end) s.hookReturn = null;
  if (s.hookPull) {
    const q = s.hookPull,
      t = q.target;
    if (
      !s.isHostile(t) ||
      t.displacementBy !== q.id ||
      p.stunned ||
      p.frozen ||
      controlImmune(s, t)
    )
      interruptFranco(s, "invalid-pull");
    else {
      const n = Math.hypot(q.from.x - p.x, q.from.z - p.z),
        f = Math.min(1, Math.max(0, (s.time - q.start) / (q.end - q.start))),
        stop = Math.min(n, Math.max(q.stop, p.radius + t.radius + 0.05));
      const end = {
        x: p.x + ((q.from.x - p.x) / Math.max(n, 0.001)) * stop,
        z: p.z + ((q.from.z - p.z) / Math.max(n, 0.001)) * stop,
      };
      const to = {
        x: q.from.x + (end.x - q.from.x) * f,
        z: q.from.z + (end.z - q.from.z) * f,
      };
      const length = Math.hypot(to.x - t.x, to.z - t.z),
        forced = { ...t, stunned: false, speed: length / Math.max(dt, 0.0001) };
      moveEntity(
        forced,
        {
          x: (to.x - t.x) / Math.max(length, 0.001),
          z: (to.z - t.z) / Math.max(length, 0.001),
        },
        dt,
        s.arena,
      );
      t.x = forced.x;
      t.z = forced.z;
      if (s.time >= q.end) {
        s.hookReturn = {
          point: { x: t.x, z: t.z },
          start: q.end,
          end: q.end + q.returnDuration,
        };
        delete t.displacementBy;
        s.hookPull = null;
      }
    }
  }
  const c = s.channel;
  if (!c) return;
  if (
    p.stunned ||
    p.frozen ||
    !s.isHostile(c.target) ||
    c.target.suppressionBy !== c.id ||
    Math.hypot(c.target.x - p.x, c.target.z - p.z) > c.a.range + 0.6
  ) {
    interruptFranco(s, "interrupted");
    return;
  }
  while (
    c.next < c.a.parameters.strikes &&
    s.time + 1e-8 >=
      c.start +
        c.a.parameters.firstStrike +
        c.next * c.a.parameters.strikeInterval
  ) {
    const at =
      c.start +
      c.a.parameters.firstStrike +
      c.next * c.a.parameters.strikeInterval;
    c.next++;
    s.damageEnemy(c.target, c.a.damage, "physical", {
      physicalScaling:
        c.a.damageModel.physicalScaling * (c.a.passiveMultiplier || 1),
    });
    s.emit("hunt-strike", {
      targetId: c.target.id,
      index: c.next,
      at,
      point: { x: c.target.x, z: c.target.z },
    });
    if (p.hp <= 0 || p.stunned || p.frozen || s.channel !== c) {
      interruptFranco(s, "interrupted");
      return;
    }
    if (c.target.hp <= 0) {
      interruptFranco(s, "target-death");
      return;
    }
  }
  if (s.time + 1e-8 >= c.end) {
    s.emit("channel-end", {
      reason: "complete",
      strikes: c.next,
      targetId: c.target.id,
    });
    releaseSuppression(s);
  }
}
