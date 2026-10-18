import * as THREE from "three";
import { WorldView } from "./world.js";
// Original volumetric causeway, towers, cores and placeholder bots. No flat map
// image, screenshot textures, gameplay timers, target decisions or damage here.
export class LaneView extends WorldView {
  constructor(...args) {
    super(...args);
    this.renderer.shadowMap.enabled = false;
  }

  makeArena(arena) {
    this.scene.background = new THREE.Color("#0a1830");
    this.scene.fog = new THREE.Fog("#112b48", 45, 100);
    this.scene.add(this.box(74, 1.5, 18, "#263c55", 0, -0.85, 0));
    const tile = new THREE.BoxGeometry(3.9, 0.15, 3.4),
      material = this.material("#718c9a");
    const matrices = [];
    for (let x = -34; x <= 34; x += 4)
      for (let z = -5.2; z <= 5.2; z += 3.5)
        matrices.push(new THREE.Matrix4().makeTranslation(x, -0.05, z));
    const floor = new THREE.InstancedMesh(tile, material, matrices.length);
    matrices.forEach((matrix, i) => floor.setMatrixAt(i, matrix));
    floor.instanceMatrix.needsUpdate = true;
    this.scene.add(floor);
    for (const side of [-1, 1]) {
      this.scene.add(this.box(74, 0.7, 0.8, "#344c70", 0, 0.2, side * 7.5));
      this.scene.add(this.box(72, 0.05, 0.13, "#73cbd3", 0, 0.6, side * 7.4));
      for (let x = -32; x <= 32; x += 8) {
        this.scene.add(this.box(1.4, 2, 1.4, "#4c6480", x, 0.5, side * 8));
        const crystal = this.mesh(
          new THREE.OctahedronGeometry(0.75),
          this.material("#69cee1", {
            emissive: "#1c7195",
            emissiveIntensity: 0.5,
          }),
          x,
          2.2,
          side * 8,
        );
        this.scene.add(crystal);
        const rock = this.mesh(
          new THREE.DodecahedronGeometry(3),
          this.material("#17283d"),
          x,
          -2.4,
          side * 12,
        );
        rock.scale.set(1, 2.4, 1);
        this.scene.add(rock);
      }
    }
    for (const sign of [-1, 1]) {
      const platform = this.mesh(
        new THREE.CylinderGeometry(4, 4.8, 0.5, 12),
        this.material(sign < 0 ? "#345b7e" : "#744a65"),
        sign * 31,
        -0.1,
        0,
      );
      this.scene.add(platform);
      for (const r of [2.4, 3.4]) {
        const ring = this.circle(r, sign < 0 ? "#83edff" : "#ff9ea6", 0.7);
        ring.position.x = sign * 31;
        this.scene.add(ring);
      }
    }
  }
  makeActor(actor) {
    const g = new THREE.Group(),
      color = actor.team === "player" ? "#5dcfe9" : "#eb827e";
    if (actor.kind === "tower" || actor.kind === "core") {
      g.add(
        this.mesh(
          new THREE.CylinderGeometry(1, 1.5, 0.5, 8),
          this.material("#52667a"),
          0,
          0.25,
          0,
        ),
      );
      g.add(this.box(0.9, 2.3, 0.9, "#c0c7c2", 0, 1.5, 0));
      const gem = this.mesh(
        new THREE.OctahedronGeometry(actor.kind === "core" ? 1.25 : 0.65),
        this.material(color, { emissive: color, emissiveIntensity: 0.35 }),
        0,
        3,
        0,
      );
      g.add(gem);
      g.add(this.circle(actor.range, color, 0.13, true));
    } else {
      const small = actor.kind === "minion";
      g.add(
        this.mesh(
          new THREE.CylinderGeometry(
            small ? 0.26 : 0.4,
            small ? 0.35 : 0.5,
            small ? 0.6 : 1.1,
            6,
          ),
          this.material(color),
          0,
          small ? 0.5 : 0.8,
          0,
        ),
      );
      g.add(
        this.mesh(
          new THREE.IcosahedronGeometry(small ? 0.25 : 0.38, 0),
          this.material("#c4d9d9"),
          0,
          small ? 0.95 : 1.6,
          0,
        ),
      );
      if (!small) g.add(this.box(0.13, 0.2, 1.1, "#f3dba4", 0.4, 1.15, 0.4));
      g.add(this.circle(small ? 0.4 : 0.65, color, 0.7));
    }
    g.userData.enemyId = actor.id;
    this.scene.add(g);
    return g;
  }
  render(state, pointer) {
    const actors = state.actors.filter((a) => a !== state.player);
    for (const [id, mesh] of this.dummies)
      if (!actors.some((a) => a.id === id)) {
        this.scene.remove(mesh);
        mesh.traverse((o) => {
          o.geometry?.dispose();
          if (o.material) o.material.dispose();
        });
        this.dummies.delete(id);
      }
    for (const actor of actors) {
      if (!this.dummies.has(actor.id))
        this.dummies.set(actor.id, this.makeActor(actor));
      const model = this.dummies.get(actor.id);
      model.position.set(actor.x, 0, actor.z);
      model.scale.y = actor.hp > 0 ? 1 : 0.12;
      model.visible = actor.hp > 0 || ["core", "tower"].includes(actor.kind);
    }
    super.render(state, pointer);
  }
}
