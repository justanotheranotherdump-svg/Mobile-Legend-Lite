import { cloneHeroVisual } from "./heroes/clone-visual.js";
import * as THREE from "three";
import { WorldView } from "./world.js";
// Original volumetric causeway, towers, cores and placeholder bots. No flat map
// image, screenshot textures, gameplay timers, target decisions or damage here.
export class LaneView extends WorldView {
  constructor(...args) {
    super(...args);
    this.renderer.shadowMap.enabled = false;
    this.botVisuals = new Map();
  }

  makeArena(arena) {
    this.scene.background = new THREE.Color("#243d52");
    this.scene.fog = new THREE.Fog("#294b5d", 44, 105);
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#8c8767";
    ctx.fillRect(0, 0, 512, 512);
    // Original engraved stone texture authored procedurally, never a screenshot.
    for (let row = 0; row < 4; row++)
      for (let col = -1; col < 4; col++) {
        const x = col * 170 + (row % 2) * 85,
          y = row * 128,
          h = (row * 71 + col * 43 + 300) % 35;
        ctx.fillStyle = `rgb(${139 + h},${132 + h},${100 + h})`;
        ctx.fillRect(x + 3, y + 3, 164, 122);
        ctx.strokeStyle = "#c6bd92";
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 7, y + 7, 156, 114);
        ctx.strokeStyle = "#6c715b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 48, y + 3);
        ctx.lineTo(x + 65, y + 27);
        ctx.lineTo(x + 58, y + 42);
        ctx.stroke();
      }
    for (let i = 0; i < 2200; i++) {
      const x = (i * 193) % 512,
        y = (i * 337) % 512;
      ctx.fillStyle = i % 2 ? "#ffffff0a" : "#10292a12";
      ctx.fillRect(x, y, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.flipY = false;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(18, 3);
    texture.colorSpace = THREE.SRGBColorSpace;
    const road = new THREE.Mesh(
      new THREE.BoxGeometry(72, 0.25, 14),
      this.material("#ddd2ad", { map: texture }),
    );
    road.position.y = -0.16;
    this.scene.add(road);
    this.scene.add(this.box(73, 2.4, 16, "#3b514b", 0, -1.5, 0));
    for (const side of [-1, 1]) {
      this.scene.add(this.box(73, 0.6, 0.8, "#566451", 0, 0.1, side * 7.3));
      this.scene.add(this.box(72, 0.13, 0.17, "#c2ba8d", 0, 0.52, side * 7.3));
      for (let x = -34; x <= 34; x += 4) {
        this.scene.add(this.box(0.65, 1.3, 0.8, "#68715a", x, 0.6, side * 7.3));
        this.scene.add(
          this.box(3.1, 0.24, 0.3, "#a9a379", x + 2, 0.9, side * 7.3),
        );
      }
      for (let x = -32; x <= 32; x += 8) {
        const pedestal = this.mesh(
          new THREE.CylinderGeometry(0.5, 0.8, 0.6, 6),
          this.material("#786f54"),
          x,
          0.8,
          side * 7.8,
        );
        this.scene.add(pedestal);
        const gem = this.mesh(
          new THREE.OctahedronGeometry(0.4),
          this.material("#38c7a1", {
            emissive: "#167b66",
            emissiveIntensity: 0.65,
          }),
          x,
          1.5,
          side * 7.8,
        );
        this.scene.add(gem);
        const rock = this.mesh(
          new THREE.DodecahedronGeometry(4, 0),
          this.material(x % 16 === 0 ? "#2b635b" : "#355b54"),
          x,
          -4,
          side * 12,
        );
        rock.scale.set(1.3, 2.1, 1.2);
        rock.rotation.set(0.15, (x + 32) * 0.1, 0.1);
        this.scene.add(rock);
        const buttress = this.mesh(
          new THREE.ConeGeometry(1.5, 6, 4),
          this.material("#52675c"),
          x,
          -3.5,
          side * 8,
        );
        buttress.rotation.y = Math.PI / 4;
        this.scene.add(buttress);
      }
      for (const x of [-22, 0, 22]) {
        const g = new THREE.Group();
        g.add(this.box(1.5, 2.3, 1.4, "#6f775d", 0, 0.9, 0));
        const head = this.mesh(
          new THREE.DodecahedronGeometry(1.1, 0),
          this.material("#8a8a67"),
          0,
          2.5,
          0,
        );
        head.scale.set(1, 1.3, 0.85);
        g.add(head);
        g.add(this.box(1.8, 0.25, 1.1, "#a29a71", 0, 2.8, 0));
        g.add(this.box(0.25, 0.9, 0.4, "#4e6053", -0.4, 2.4, 0.85));
        g.add(this.box(0.25, 0.9, 0.4, "#4e6053", 0.4, 2.4, 0.85));
        g.position.set(x, 0, side * 8.7);
        g.rotation.y = side > 0 ? Math.PI : 0;
        this.scene.add(g);
        for (let i = 0; i < 10; i++) {
          const link = this.mesh(
            new THREE.TorusGeometry(0.48, 0.08, 4, 10),
            this.material("#899d92"),
            x + i * 0.15,
            -1 - i * 0.9,
            side * (10 + i * 0.55),
          );
          link.rotation.y = i % 2 ? Math.PI / 2 : 0;
          link.rotation.z = 0.12;
          this.scene.add(link);
        }
      }
      // Bank greenery is scenery, not a falsely implemented stealth mechanic.
      for (const x of [-17, 17])
        for (let i = 0; i < 18; i++) {
          const blade = this.mesh(
            new THREE.ConeGeometry(0.12, 0.8 + (i % 3) * 0.15, 3),
            this.material(i % 2 ? "#83a286" : "#527962"),
            x + (i % 6) * 0.4,
            0.4,
            side * (6.35 + Math.floor(i / 6) * 0.18),
          );
          blade.rotation.z = ((i % 3) - 1) * 0.18;
          this.scene.add(blade);
        }
    }
    for (const team of ["player", "enemy"]) {
      const spawn = arena.spawn[team],
        color = team === "player" ? "#66e0be" : "#efad76";
      const disc = this.mesh(
        new THREE.CylinderGeometry(2.8, 3.1, 0.2, 24),
        this.material("#747a60"),
        spawn.x,
        -0.02,
        spawn.z,
      );
      this.scene.add(disc);
      for (const r of [2.1, 2.65]) {
        const ring = this.circle(r, color, 0.7);
        ring.position.set(spawn.x, 0.07, spawn.z);
        this.scene.add(ring);
      }
    }
  }
  updateCamera(player) {
    this.camera.position.set(player.x - 18, 24, player.z + 18);
    this.camera.lookAt(player.x, 0, player.z);
    this.camera.updateMatrixWorld();
  }
  dispose() {
    for (const [id, v] of this.botVisuals) {
      v.visual.dispose();
      v.ring.geometry.dispose();
      v.ring.material.dispose();
      this.dummies.delete(id);
    }
    this.botVisuals.clear();
    super.dispose();
  }
  makeActor(actor) {
    if (actor.kind === "bot" && actor.heroId === "layla") {
      const visual = cloneHeroVisual(this.heroVisual, this.lastState.hero),
        g = visual.root;
      const ring = this.circle(
        0.6,
        actor.team === "player" ? "#52e7e8" : "#f68174",
        0.8,
      );
      g.add(ring);
      g.userData.enemyId = actor.id;
      this.botVisuals.set(actor.id, { visual, ring, x: actor.x, z: actor.z });
      this.scene.add(g);
      return g;
    }
    const g = new THREE.Group(),
      color = actor.team === "player" ? "#5dcfe9" : "#eb827e";
    if (actor.kind === "tower" || actor.kind === "core") {
      g.add(
        this.mesh(
          new THREE.CylinderGeometry(1, 1.5, 0.5, 8),
          this.material("#6d7058"),
          0,
          0.25,
          0,
        ),
      );
      g.add(this.box(0.9, 2.3, 0.9, "#9e9b75", 0, 1.5, 0));
      const gem = this.mesh(
        new THREE.OctahedronGeometry(actor.kind === "core" ? 1.25 : 0.65),
        this.material(color, { emissive: color, emissiveIntensity: 0.35 }),
        0,
        3,
        0,
      );
      g.add(gem);
      // Shared RangeVisuals reads each live structure range every frame.
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
    this.lastState = state;
    const dt = Math.min(
      0.1,
      Math.max(0, state.time - (this.botVisualTime ?? state.time)),
    );
    this.botVisualTime = state.time;
    const actors = state.actors.filter((a) => a !== state.player);
    for (const [id, mesh] of this.dummies)
      if (!actors.some((a) => a.id === id)) {
        this.scene.remove(mesh);
        const old = this.botVisuals.get(id);
        if (old) {
          old.visual.dispose();
          old.ring.geometry.dispose();
          old.ring.material.dispose();
          this.botVisuals.delete(id);
          this.dummies.delete(id);
          continue;
        }
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
      if (actor.kind === "bot") {
        const v = this.botVisuals.get(actor.id);
        if (v) {
          if (actor.castSerial !== v.cast) {
            if (actor.castSerial) v.visual.play("cast", true);
            v.cast = actor.castSerial;
          } else if (actor.attackSerial !== v.attack) {
            if (actor.attackSerial)
              v.visual.play("basicAttack", true, actor.actionDuration);
            v.attack = actor.attackSerial;
          }
          if (actor.facing)
            model.rotation.y = Math.atan2(actor.facing.x, actor.facing.z);
          v.visual.update(
            dt,
            actor.hp <= 0
              ? "dead"
              : Math.hypot(actor.x - v.x, actor.z - v.z) > 0.0001
                ? "move"
                : "idle",
          );
          v.x = actor.x;
          v.z = actor.z;
        }
      } else model.scale.y = actor.hp > 0 ? 1 : 0.12;
      model.visible = (actor.hp > 0 || ["core", "tower"].includes(actor.kind))&&!(actor.team!==state.player.team&&actor.camouflaged&&Math.hypot(actor.x-state.player.x,actor.z-state.player.z)>2);
    }
    super.render(state, pointer);
  }
}
