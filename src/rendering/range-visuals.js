import * as THREE from "three";
import { rangeSnapshot } from "../simulation/ranges.js";
export class RangeVisuals {
  constructor(scene) {
    this.scene = scene;
    this.player = this.ring("#89f4ec");
    this.towers = new Map();
  }
  ring(color) {
    const r = new THREE.Mesh(
      new THREE.RingGeometry(0.992, 1, 128),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: false,
      }),
    );
    r.rotation.x = -Math.PI / 2;
    r.renderOrder = 7;
    this.scene.add(r);
    return r;
  }
  update(s) {
    const snap = rangeSnapshot(s),
      p = snap.player;
    this.player.visible = p.visible;
    this.player.position.set(p.x, 0.09, p.z);
    this.player.scale.setScalar(p.radius);
    this.player.material.color.set(p.targetInRange ? "#a4ffd1" : "#81dfed");
    for (const [id, r] of this.towers)
      if (!snap.towers.some((t) => t.id === id)) {
        this.scene.remove(r);
        r.geometry.dispose();
        r.material.dispose();
        this.towers.delete(id);
      }
    for (const t of snap.towers) {
      if (!this.towers.has(t.id))
        this.towers.set(t.id, this.ring(t.enemy ? "#f69975" : "#77b7ef"));
      const r = this.towers.get(t.id);
      r.visible = t.visible;
      r.position.set(t.x, 0.085, t.z);
      r.scale.setScalar(t.radius);
      r.material.opacity =
        t.enemy && t.inside ? 0.8 + 0.15 * Math.sin(s.time * 5) : 0.5;
      r.material.color.set(
        t.enemy ? (t.inside ? "#ff554e" : "#efab72") : "#80b9ec",
      );
    }
  }
}
