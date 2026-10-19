import { AnimationMixer, LoopOnce, LoopRepeat } from "three";
import { clone } from "three/addons/utils/SkeletonUtils.js";
// Shares approved immutable geometry/materials/clips; each NPC has its own object
// transforms and mixer. No GLB re-fetch/re-parse, no replacement model or rig.
export function cloneHeroVisual(visual, hero) {
  const root = clone(visual.root),
    clips = visual.animationClips,
    mixer = new AnimationMixer(root);
  let current = null,
    once = false;
  function play(state, one = false, duration = null) {
    const name = hero.animations.clips[state],
      clip = clips.get(name);
    if (!clip) {
      mixer.stopAllAction();
      current = null;
      once = false;
      return;
    }
    if (!one && current === name) return;
    mixer.stopAllAction();
    const a = mixer.clipAction(clip);
    a.setLoop(one ? LoopOnce : LoopRepeat, one ? 1 : Infinity);
    a.clampWhenFinished = one;
    a.reset().setEffectiveTimeScale(1);
    if (duration) a.setDuration(duration);
    a.play();
    current = name;
    once = one;
  }
  mixer.addEventListener("finished", () => {
    once = false;
    current = null;
  });
  return {
    root,
    play,
    update(dt, state) {
      if (state === "dead" || !once) play(state);
      mixer.update(dt);
    },
    dispose() {
      mixer.stopAllAction();
      mixer.uncacheRoot(root);
      root.removeFromParent();
    },
  };
}
