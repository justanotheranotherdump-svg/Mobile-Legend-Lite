import * as THREE from "three";
import { createHeroVisual } from "../rendering/heroes/hero-visual.js";
// Presentation only. No simulation, Controls or Hud is instantiated in the lobby.
export class LobbyView {
  constructor(canvas, registry, sharedVisual = null) {
    this.canvas = canvas;
    this.registry = registry;
    this.ready = null;
    this.visual = sharedVisual;
    this.disposed = false;
    this.active = true;
    this.modelLoads = 0;
  }
  prepare() {
    if (this.ready) return this.ready;
    this.ready = this.initialize().catch(error=>{this.ready=null;if(this.visual?.status!=="glb")this.visual=null;this.renderer?.dispose();throw error;});
    return this.ready;
  }
  async initialize() {
    if(!this.visual){this.modelLoads++;
    this.visual = await createHeroVisual(
      this.registry.get("layla"),
      this.registry.modelBytes("layla"),
    );
    }
    if (this.visual.status !== "glb")
      throw new Error("The approved lobby model could not be loaded.");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.Fog("#9fbcd3", 14, 65);
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.camera.position.set(0, 1.35, 4.25);
    this.camera.lookAt(0, 1.02, 0);
    this.scene.add(new THREE.HemisphereLight("#e5f6ff", "#5d6688", 2.6));
    const sun = new THREE.DirectionalLight("#fff0cc", 3.4);
    sun.position.set(-4, 7, 6);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight("#71e4ff", 2.2);
    rim.position.set(5, 3, -2);
    this.scene.add(rim);
    // The environment is a locally embedded PNG. Only the approved hero is 3D.
    this.visual.reset();this.visual.root.visible=true;
    this.visual.root.position.set(this.selection?0:-1.15, 0, 0);
    this.visual.root.rotation.y = 0.28;
    this.visual.play("idle");
    this.scene.add(this.visual.root);
    this.canvas.hidden = !this.active;
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize);
    this.onVisibility = () => {
      if (!document.hidden) this.draw();
    };
    document.addEventListener("visibilitychange", this.onVisibility);
    this.resize();
    this.canvas.hidden = !this.active;
    return this.visual;
  }
  resize() {
    if (!this.renderer || this.disposed) return;
    const w = this.canvas.clientWidth,
      h = this.canvas.clientHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.draw();
  }
  draw() {
    if (this.renderer && !this.disposed && this.active && !document.hidden)
      this.renderer.render(this.scene, this.camera);
  }
  setSelection(active){this.selection=active;if(this.visual){this.visual.root.position.x=active?0:-1.15;this.draw();}}
  setActive(active) {
    this.active = active;
    this.canvas.hidden = !active;
    if (active) this.resize();
  }
  async release() {
    const visual = await this.prepare();
    if (this.disposed) return visual;
    this.disposed = true;
    this.active = false;
    window.removeEventListener("resize", this.onResize);
    document.removeEventListener("visibilitychange", this.onVisibility);
    // Transfer the SAME model instance. Dispose only resources still in the lobby scene.
    this.scene.remove(visual.root);
    const geometry = new Set(),
      materials = new Set();
    this.scene.traverse((o) => {
      if (o.geometry) geometry.add(o.geometry);
      for (const m of Array.isArray(o.material) ? o.material : [o.material])
        if (m) materials.add(m);
    });
    geometry.forEach((g) => g.dispose());
    materials.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.canvas.remove();
    visual.root.position.set(0, 0, 0);
    visual.root.rotation.set(0, 0, 0);
    visual.root.scale.setScalar(1);
    visual.reset();
    return visual;
  }
  diagnostics() {
    return {
      status: this.visual?.status || "not-loaded",
      modelLoads: this.modelLoads,
      rendering: Boolean(this.renderer && !this.disposed && this.active),
      disposed: this.disposed,
      clips: this.visual?.diagnostics().clips || [],
      modelParent: this.visual?.root.parent?.type || null,
    };
  }
}
