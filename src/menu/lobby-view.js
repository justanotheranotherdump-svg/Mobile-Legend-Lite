import * as THREE from "three";
import { createHeroVisual } from "../rendering/heroes/hero-visual.js";
// One renderer, race-safe per-hero model cache and a truly nullable showcase.
export class LobbyView {
  constructor(canvas, registry, sharedVisual = null) {
    Object.assign(this, {
      canvas,
      registry,
      visual: null,
      heroId: null,
      active: false,
      disposed: false,
      modelLoads: 0,
      selection: false,
      generation: 0,
    });
    this.cache = new Map();
    if (sharedVisual)
      this.cache.set(sharedVisual.heroId, Promise.resolve(sharedVisual));
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.scene.add(new THREE.HemisphereLight("#e5f6ff", "#5d6688", 2.6));
    for (const [color, intensity, position] of [
      ["#fff0cc", 3.4, [-4, 7, 6]],
      ["#71e4ff", 2.2, [5, 3, -2]],
    ]) {
      const l = new THREE.DirectionalLight(color, intensity);
      l.position.set(...position);
      this.scene.add(l);
    }
    this.abort = new AbortController();
    const options = { signal: this.abort.signal };
    this.onResize = () => this.resize();
    window.addEventListener("resize", this.onResize, options);
    let pointer = null;
    canvas.addEventListener(
      "pointerdown",
      (e) => {
        if (!this.visual) return;
        pointer = { id: e.pointerId, x: e.clientX, y: e.clientY };
        canvas.setPointerCapture(e.pointerId);
      },
      options,
    );
    canvas.addEventListener(
      "pointermove",
      (e) => {
        if (!pointer || !this.visual) return;
        this.visual.root.rotation.y += (e.clientX - pointer.x) * 0.012;
        pointer.x = e.clientX;
        this.draw();
      },
      options,
    );
    const end = () => {
      pointer = null;
    };
    canvas.addEventListener("pointerup", end, options);
    canvas.addEventListener("pointercancel", end, options);
    canvas.addEventListener(
      "wheel",
      (e) => {
        e.preventDefault();
        this.zoom = THREE.MathUtils.clamp(
          (this.zoom || 1) * (1 + e.deltaY * 0.001),
          0.7,
          1.6,
        );
        this.frame();
        this.resize();
      },
      { ...options, passive: false },
    );
    canvas.setAttribute("tabindex", "0");
    canvas.addEventListener(
      "keydown",
      (e) => {
        if (!this.visual) return;
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
          e.preventDefault();
          this.visual.root.rotation.y += e.key === "ArrowLeft" ? -0.2 : 0.2;
          this.draw();
        }
      },
      options,
    );
    const animate = (stamp) => {
      if (this.disposed) return;
      this.raf = requestAnimationFrame(animate);
      if (!this.active || document.hidden) return;
      const dt = Math.min(0.05, (stamp - (this.stamp ?? stamp)) / 1000);
      this.stamp = stamp;
      this.visual?.update(dt, "idle");
      this.draw();
    };
    this.raf = requestAnimationFrame(animate);
  }
  async prepare(id = this.heroId || "layla") {
    if (this.disposed) throw Error("Showcase already released");
    const generation = ++this.generation;
    this.heroId = id;
    if (!this.cache.has(id)) {
      this.modelLoads++;
      this.cache.set(
        id,
        createHeroVisual(this.registry.get(id), this.registry.modelBytes(id))
          .then((v) => {
            if (v.status !== "glb")
              throw Error(`Approved ${id} model could not be loaded.`);
            return v;
          })
          .catch((e) => {
            this.cache.delete(id);
            throw e;
          }),
      );
    }
    const visual = await this.cache.get(id);
    if (this.disposed || generation !== this.generation || this.heroId !== id)
      return visual;
    if (this.visual !== visual) {
      this.visual?.root.removeFromParent();
      this.visual = visual;
      visual.reset();
      visual.root.visible = true;
      visual.root.scale.setScalar(1);
      visual.root.position.set(this.selection ? 0 : -1.15, 0, 0);
      visual.root.rotation.set(0, 0.15, 0);
      this.scene.add(visual.root);
      visual.play("idle");
      this.zoom = 1;
      this.frame();
    }
    this.canvas.setAttribute(
      "aria-label",
      `Interactive 3D ${this.registry.get(id).name}. Drag or use arrow keys to rotate; scroll to zoom.`,
    );
    this.resize();
    return visual;
  }
  frame() {
    if (!this.visual) return;
    const root = this.visual.root,
      box = new THREE.Box3().setFromObject(root),
      size = box.getSize(new THREE.Vector3()),
      center = box.getCenter(new THREE.Vector3()),
      h = Math.max(size.y, size.x / 0.9) * 1.18 * (this.zoom || 1),
      distance = h / (2 * Math.tan(THREE.MathUtils.degToRad(16)));
    this.camera.position.set(center.x, center.y + 0.08, distance);
    this.camera.lookAt(center);
  }
  clear() {
    ++this.generation;
    this.visual?.root.removeFromParent();
    this.visual = null;
    this.heroId = null;
    this.draw();
  }
  resize() {
    if (this.disposed) return;
    const w = this.canvas.clientWidth || 1,
      h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.draw();
  }
  draw() {
    if (this.active && !this.disposed && !document.hidden)
      this.renderer.render(this.scene, this.camera);
  }
  setSelection(active) {
    this.selection = active;
    if (this.visual) {
      this.visual.root.position.x = active ? 0 : -1.15;
      this.frame();
      this.resize();
    }
  }
  setActive(active) {
    this.active = active;
    this.canvas.hidden = !active;
    if (active) this.resize();
  }
  async release() {
    const visual = await this.prepare(this.heroId);
    this.disposed = true;
    this.active = false;
    ++this.generation;
    cancelAnimationFrame(this.raf);
    this.abort.abort();
    visual.root.removeFromParent();
    for (const promise of this.cache.values()) {
      promise
        .then((v) => {
          if (v === visual) return;
          const gs = new Set(),
            ms = new Set();
          v.root.traverse((o) => {
            if (o.geometry) gs.add(o.geometry);
            for (const m of [o.material].flat()) if (m) ms.add(m);
          });
          gs.forEach((g) => g.dispose());
          ms.forEach((m) => m.dispose());
        })
        .catch(() => {});
    }
    this.cache.clear();
    this.renderer.dispose();
    this.canvas.remove();
    visual.root.position.set(0, 0, 0);
    visual.root.rotation.set(0, 0, 0);
    visual.reset();
    return visual;
  }
  diagnostics() {
    return {
      status: this.visual?.status || "not-loaded",
      heroId: this.heroId,
      modelLoads: this.modelLoads,
      rendering: Boolean(this.active && !this.disposed),
      disposed: this.disposed,
      clips: this.visual?.diagnostics().clips || [],
      modelParent: this.visual?.root.parent?.type || null,
      interactive: Boolean(this.active && this.selection && !this.disposed),
      rotationY: this.visual?.root.rotation.y ?? null,
      zoom: this.zoom || 1,
    };
  }
}
