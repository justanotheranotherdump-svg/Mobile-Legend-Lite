import { aimingShape } from "../input/directional-aim.js";
import * as THREE from "three";

// Original lightweight ground sight; it reads the same range/width/point as combat.
export class AimSight {
  constructor(scene) {
    this.group = new THREE.Group();
    scene.add(this.group);
    this.group.visible = false;
    this.outline = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute(
        "position",
        new THREE.Float32BufferAttribute(new Float32Array(768), 3),
      ),
      new THREE.LineBasicMaterial({
        color: "#5ef4ff",
        transparent: true,
        opacity: 0.95,
        depthTest: false,
      }),
    );
    this.outline.renderOrder = 10;
    this.group.add(this.outline);
    this.blast = new THREE.Mesh(
      new THREE.RingGeometry(0.97, 1, 64),
      new THREE.MeshBasicMaterial({
        color: "#b999ff",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        depthTest: false,
      }),
    );
    this.blast.rotation.x = -Math.PI / 2;
    this.blast.renderOrder = 10;
    this.group.add(this.blast);
    this.range = new THREE.Mesh(
      new THREE.RingGeometry(0.993, 1, 96),
      new THREE.MeshBasicMaterial({
        color: "#80c6df",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthTest: false,
      }),
    );
    this.range.rotation.x = -Math.PI / 2;
    this.range.renderOrder = 9;
    this.group.add(this.range);
  }
  update(state) {
    this.group.visible = Boolean(state.aiming && state.player.hp > 0);
    if (!this.group.visible) return;
    const a = state.ability(state.aiming.slot),
      r = state.abilityRange(a),
      p = state.player,
      d = state.direction(state.aiming.point) || state.facing;
    this.outline.visible = true;
    this.range.visible = true;
    const shape = aimingShape(a);
    this.range.visible = state.combatSettings?.skillRanges !== false;
    if (shape === "none") {
      this.group.visible = false;
      return;
    }
    if (shape === "self-area") {
      this.outline.visible = false;
      this.range.visible = false;
      this.blast.visible = true;
      this.blast.position.set(p.x, 0.08, p.z);
      this.blast.scale.setScalar(a.parameters.radius);
      return;
    }
    const dist =
      shape === "circle"
        ? Math.min(
            r,
            Math.hypot(state.aiming.point.x - p.x, state.aiming.point.z - p.z),
          )
        : r;
    const width = a.parameters.width || a.parameters.radius * 2 || 0.4;
    const pos = (along, side) =>
      new THREE.Vector3(
        p.x + d.x * along + d.z * side,
        0.085,
        p.z + d.z * along - d.x * side,
      );
    const pairs = [
      [pos(0.35, -width / 2), pos(dist - 0.5, -width / 2)],
      [pos(0.35, width / 2), pos(dist - 0.5, width / 2)],
      [pos(dist - 0.5, -width / 2), pos(dist, 0)],
      [pos(dist - 0.5, width / 2), pos(dist, 0)],
      [pos(0.35, -width / 2), pos(0.35, width / 2)],
    ];
    for (const f of [0.3, 0.55, 0.8]) {
      const n = dist * f;
      pairs.push(
        [pos(n - 0.3, -Math.max(width / 2, 0.28)), pos(n, 0)],
        [pos(n - 0.3, Math.max(width / 2, 0.28)), pos(n, 0)],
      );
    }
    if (shape === "cone") {
      pairs.length = 0;
      const angle = a.parameters.angle || Math.PI / 3;
      const edge = (t) => {
        const cx = d.x * Math.cos(t) - d.z * Math.sin(t),
          cz = d.z * Math.cos(t) + d.x * Math.sin(t);
        return new THREE.Vector3(p.x + cx * r, 0.085, p.z + cz * r);
      };
      pairs.push([pos(0, 0), edge(-angle / 2)], [pos(0, 0), edge(angle / 2)]);
      for (let n = 0; n < 24; n++)
        pairs.push([
          edge(-angle / 2 + (angle * n) / 24),
          edge(-angle / 2 + (angle * (n + 1)) / 24),
        ]);
    }
    const attr = this.outline.geometry.attributes.position;
    let i = 0;
    for (const pair of pairs)
      for (const v of pair) attr.setXYZ(i++, v.x, v.y, v.z);
    this.outline.geometry.setDrawRange(0, i);
    attr.needsUpdate = true;
    this.outline.geometry.computeBoundingSphere();
    this.range.position.set(p.x, 0.06, p.z);
    this.range.scale.setScalar(r);
    this.range.visible = state.combatSettings?.skillRanges !== false;
    this.blast.visible = ["circle", "targeted"].includes(shape);
    this.blast.position.copy(pos(dist, 0));
    this.blast.scale.setScalar(
      shape === "targeted"
        ? 0.6
        : a.parameters.blastRadius || a.parameters.radius || 1,
    );
  }
}
