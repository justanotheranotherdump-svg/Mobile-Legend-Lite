import { LoopOnce, LoopRepeat, Vector3 } from "three";
const releaseTimes = {
  layla: {
    basicAttack: 0.25,
    "skill-1": 0.25,
    "skill-2": 0.4,
    "skill-ultimate": 0.65,
  },
  franco: {
    basicAttack: 0.4,
    "skill-1": 0.15,
    "skill-2": 0.3,
    "skill-ultimate": 0,
  },
};
const recoveries = {
  layla: {
    basicAttack: 0.16,
    "skill-1": 0.18,
    "skill-2": 0.16,
    "skill-ultimate": 0.2,
  },
  franco: {
    basicAttack: 0.22,
    "skill-1": 0.45,
    "skill-2": 0.3,
    "skill-ultimate": 1.8,
  },
};
// Sample existing approved clips, without re-authoring tracks. Gameplay clocks own
// release/strike timing. Piecewise mapping preserves those source release poses.
export function createPoseDriver(root, mixer, clips, hero) {
  let key = null,
    time = 0,
    deathAt = null,
    basicBlend = null,
    lastDriveTime = null,
    frameDelta = 0;
  const sample = (state, t, once = true) => {
    const clip = clips.get(hero.animations.clips[state]);
    if (!clip || !mixer) return;
    // Only blend Franco's basic recovery/cancel back to locomotion/hit. Skills
    // keep their exact approved release poses and are never cross-faded here.
    const locomotion = ["idle", "move", "hit"].includes(state);
    if (hero.id === "franco" && key === "basicAttack" && locomotion) {
      const from=[];
      root.traverse(o=>{if(o.isBone)from.push([o,o.quaternion.clone()]);});
      basicBlend={from,age:0};
    }
    mixer.stopAllAction();
    const a = mixer.clipAction(clip);
    a.reset();
    a.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    a.clampWhenFinished = once;
    a.play();
    a.paused = true;
    a.time = Math.max(0, Math.min(clip.duration - 1e-5, t));
    mixer.update(0);
    if(basicBlend && locomotion) {
      basicBlend.age += frameDelta;
      const alpha=Math.min(1,basicBlend.age/.09);
      for(const [bone,from] of basicBlend.from)bone.quaternion.slerpQuaternions(from,bone.quaternion.clone(),alpha);
      if(alpha>=1)basicBlend=null;
    } else if(!locomotion) basicBlend=null;
    key = state;
    time = a.time;
    root.updateMatrixWorld(true);
  };
  return {
    sample,
    drive(s, moving = false) {
      const p = s.player,
        now = s.time;
      frameDelta = Math.max(0,Math.min(.1,now-(lastDriveTime??now)));
      lastDriveTime=now;
      if (hero.id === "franco") {
        const hook = root.getObjectByName("HookHead");
        if (hook)
          hook.visible = !(
            s.projectiles?.some((p) => p.a.effectId === "iron-hook") ||
            s.hookPull ||
            s.hookReturn
          );
      }
      if (p.hp <= 0) {
        deathAt ??= now;
        sample("dead", now - deathAt);
        return;
      }
      deathAt = null,
    basicBlend = null,
    lastDriveTime = null,
    frameDelta = 0;
      const a = s.heroAction;
      if (a) {
        const sourceRelease = releaseTimes[hero.id]?.[a.key] ?? a.release,
          recovery = a.recovery ?? recoveries[hero.id]?.[a.key] ?? 0.2,
          duration = a.release + recovery,
          age = now - a.start,
          clip = clips.get(hero.animations.clips[a.key]);
        if (clip && age >= 0 && age <= duration && !p.stunned && !p.frozen) {
          const t =
            a.release > 0 && age < a.release
              ? (age / a.release) * sourceRelease
              : sourceRelease +
                ((age - a.release) / Math.max(recovery, 0.001)) *
                  (clip.duration - sourceRelease);
          sample(a.key, t);
          return;
        }
      }
      if (
        p.lastHitAt != null &&
        now - p.lastHitAt >= 0 &&
        now - p.lastHitAt < 0.4
      ) {
        sample("hit", now - p.lastHitAt);
        return;
      }
      const state = moving ? "move" : "idle",
        clip = clips.get(hero.animations.clips[state]);
      sample(state, clip ? now % clip.duration : 0, false);
      if (hero.id === "franco")
        root.traverse((o) => {
          if (o.name.toLowerCase().includes("hook") && o.isMesh)
            o.visible = !(
              s.projectiles?.some((p) => p.a.effectId === "iron-hook") ||
              s.hookPull ||
              s.hookReturn
            );
        });
    },
    socket(name) {
      root.updateMatrixWorld(true);
      const object = root.getObjectByName(name);
      return object ? object.getWorldPosition(new Vector3()) : null;
    },
    diagnostics: () => ({ pose: key, poseTime: time }),
    reset() {
      key = null;
      time = 0;
      deathAt = null;
      basicBlend = null;
      lastDriveTime = null;
      frameDelta = 0;
    },
  };
}
