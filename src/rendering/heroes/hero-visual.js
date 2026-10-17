import { Group, AnimationMixer, AnimationClip, LoadingManager, Vector3, LoopOnce, LoopRepeat } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createTrainingPlaceholder } from '../../heroes/training/placeholder.js';
import { inspectEmbeddedGlb } from '../../heroes/model-contract.js';

function createEmbeddedLoader() {
  const manager = new LoadingManager();
  manager.setURLModifier(url => {
    if (!/^(data:|blob:)/.test(url)) throw new Error(`External model resource blocked: ${url}`);
    return url;
  });
  return new GLTFLoader(manager);
}

// Presentation-only adapter. Positions/facing/colliders remain simulation-owned.
export async function createHeroVisual(hero, bytes, { loader = createEmbeddedLoader(), warn = console.warn } = {}) {
  const root = new Group();
  const anchor = new Group();
  const config = hero.presentation;
  anchor.scale.setScalar(config.scale);
  anchor.rotation.y = config.rotationY;
  anchor.position.set(config.offset.x, config.offset.y, config.offset.z);
  root.add(anchor);
  let model = null, mixer = null, current = null, oneShot = false, clips = new Map(), status = 'placeholder';
  if (config.kind === 'glb') {
    try {
      inspectEmbeddedGlb(bytes, `${hero.id}/${config.model}`);
      const result = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
      if (!result.scene?.isObject3D) throw new Error('GLB has no usable scene');
      for (const clip of Object.values(hero.animations.clips)) {
        if (!AnimationClip.findByName(result.animations, clip)) throw new Error(`Actual loaded animation clip missing: ${clip}`);
      }
      model = result.scene;
      model.traverse(object => { if (object.isMesh) { object.castShadow = true; object.receiveShadow = true; } });
      clips = new Map(result.animations.map(clip => [clip.name, clip]));
      mixer = new AnimationMixer(model);
      mixer.addEventListener('finished', () => { oneShot = false; current = null; });
      status = 'glb';
    } catch (error) {
      status = 'placeholder-fallback';
      anchor.scale.setScalar(1); anchor.position.set(0, 0, 0); anchor.rotation.y = 0;
      warn(`Hero ${hero.id}: ${error.message}. Retaining functional temporary placeholder.`);
    }
  }
  model ??= createTrainingPlaceholder();
  anchor.add(model);
  function play(state, once = false) {
    const clip = hero.animations.clips[state];
    if (!mixer) return;
    if (!clip) { mixer.stopAllAction(); current=null; oneShot=false; return; }
    if (!once && clip === current) return;
    mixer.stopAllAction();
    const action = mixer.clipAction(clips.get(clip));
    action.setLoop(once ? LoopOnce : LoopRepeat, once ? 1 : Infinity);
    action.clampWhenFinished = once;
    action.reset().play();
    current = clip; oneShot = once;
  }
  return {
    root,
    status,
    diagnostics: () => ({status, clips:[...clips.keys()], current, oneShot, skeletal:model.getObjectsByProperty("isBone",true).length>0}),
    muzzlePosition() { root.updateMatrixWorld(true); const muzzle=model.getObjectByName("MuzzleFlash"); return muzzle ? muzzle.getWorldPosition(new Vector3()) : null; },
    play,
    update(dt, state) {
      if (state === "dead" || !oneShot) play(state);
      mixer?.update(dt);
    },
    reset() { mixer?.stopAllAction(); current = null; oneShot = false; },
  };
}
