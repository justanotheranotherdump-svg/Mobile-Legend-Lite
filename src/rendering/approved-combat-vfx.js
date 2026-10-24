import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { decodeEmbeddedAsset } from "../heroes/model-contract.js";
import { createEffects, createMark } from "../heroes/layla/effects.js";
const keys = {
  "basic-projectile": "basic",
  "line-projectile": "s1",
  "orb-mark": "s2",
  "line-blast": "ult",
};
let hookPromise;
const hookUrl = new URL("../heroes/franco/assets/hook.glb", import.meta.url)
  .href;
async function hookModel() {
  if (!hookPromise) {
    const bytes = decodeEmbeddedAsset(hookUrl, "Franco approved hook");
    hookPromise = new GLTFLoader()
      .parseAsync(
        bytes.buffer.slice(
          bytes.byteOffset,
          bytes.byteOffset + bytes.byteLength,
        ),
        "",
      )
      .then((g) => g.scene);
  }
  return hookPromise;
}
export class ApprovedCombatVfx {
  constructor(scene, simulation, view) {
    Object.assign(this, { scene, simulation, view });
    this.view = view || {};
    this.energy = createEffects(scene, {
      shotCapacity: 48,
      impactCapacity: 64,
    });
    this.records = new Map();
    this.events = [];
    this.marks = new Map();
    this.hooks = new Map();
    this.restraints = new Map();
    this.last = {};
    this.unsubscribe = simulation.events.subscribe((e) => this.event(e));
  }
  async prepare() {
    this.hookTemplate = await hookModel();
  }
  kits() {
    return [this.simulation, ...(this.simulation.botEngines?.values() || [])];
  }
  visual(id) {
    return id === (this.simulation.player.id || "player")
      ? this.view.heroVisual
      : this.view.botVisuals?.get(id)?.visual;
  }
  actor(id) {
    return [
      this.simulation.player,
      ...(this.simulation.actors || this.simulation.enemies),
    ].find((a) => a.id === id);
  }
  isLayla(e) {
    const a = this.actor(e.sourceId);
    return a?.heroId === "layla" || (!a && e.heroId === "layla");
  }
  event(e) {
    if (e.type === "reset") {
      this.clear();
      return;
    }
    if (!this.isLayla(e)) return;
    const key = keys[e.effect],
      sourceId = e.sourceId || "player",
      id = `${sourceId}:${e.castId ?? e.id}`;
    if (key && ["cast", "launch", "beam"].includes(e.type)) {
      let r = this.records.get(id);
      if (!r) {
        r = {
          id,
          key,
          sourceId,
          start: e.time,
          release: e.time + (e.duration || 0),
          end: Infinity,
          origin: [e.source.x, e.source.y ?? 1.22178475, e.source.z],
          range: 48,
          speed: 0,
        };
        this.records.set(id, r);
      }
      if (e.type !== "cast") {
        r.release = e.time;
        r.origin = [e.source.x, e.source.y ?? 1.22178475, e.source.z];
        r.endPoint = [e.end.x, r.origin[1], e.end.z];
        if (e.type === "beam") r.end = e.time;
      }
    }
    if (["impact", "explosion"].includes(e.type)) {
      const r = this.records.get(id);
      if (r) r.end = e.time;
    }
    if (["impact", "explosion", "mark-trigger"].includes(e.type) && e.point) {
      this.events.push({
        kind: e.type === "mark-trigger" ? "mark-trigger" : "impact",
        key: key || (e.type === "mark-trigger" ? "s2" : "basic"),
        at: e.time,
        x: e.point.x,
        z: e.point.z,
        target: e.targetId,
      });
    }
    if (e.type === "hit" && e.point) {
      const newest = [...this.records.values()]
        .filter(
          (r) =>
            r.sourceId === sourceId &&
            r.key === "ult" &&
            e.time >= r.release - 0.03 &&
            e.time <= r.release + 0.05,
        )
        .at(-1);
      if (newest)
        this.events.push({
          kind: "impact",
          key: "ult",
          at: e.time,
          x: e.point.x,
          z: e.point.z,
          target: e.targetId,
        });
    }
  }
  disposeObject(root) {
    root.removeFromParent();
    root.traverse((o) => {
      o.geometry?.dispose();
      for (const m of [o.material].flat()) m?.dispose();
    });
  }
  clear() {
    this.energy.root.removeFromParent();
    this.last = {};
    this.records.clear();
    this.events = [];
    for (const m of this.marks.values()) this.disposeObject(m);
    for (const m of this.restraints.values()) this.disposeObject(m);
    this.restraints.clear();
    this.marks.clear();
    for (const h of this.hooks.values()) {
      h.root.removeFromParent();
      h.chain.geometry.dispose();
      h.chain.material.dispose();
    }
    this.hooks.clear();
  }
  chain(a, b, mesh) {
    const n = Math.min(110, Math.max(2, Math.ceil(a.distanceTo(b) / 0.056))),
      o = new T.Object3D();
    mesh.count = n;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      o.position.copy(a).lerp(b, f);
      o.position.y -= Math.sin(f * Math.PI) * 0.07;
      const tangent = b.clone().sub(a);
      tangent.y -= Math.cos(f * Math.PI) * Math.PI * 0.07;
      o.quaternion.setFromUnitVectors(
        new T.Vector3(0, 1, 0),
        tangent.normalize(),
      );
      o.rotateY(i % 2 ? Math.PI / 2 : 0);
      o.scale.set(0.72, 1.08, 0.72);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  update() {
    if (!this.energy.root.parent) this.scene.add(this.energy.root);
    const s = this.simulation,
      time = s.time,
      shots = [],
      aliveHooks = new Set();
    for (const kit of this.kits()) {
      const actor = kit.player,
        sourceId = actor.id || "player",
        visual = this.visual(sourceId);
      if (kit.hero.id === "layla") {
        for (const p of kit.projectiles) {
          const id = `${sourceId}:${p.id}`,
            r = this.records.get(id);
          if (!r) continue;
          r.position = [p.x, 1.22178475, p.z];
          r.direction = { x: p.dx, z: p.dz };
          r.speed = p.speed;
          r.end = Infinity;
        }
        for (const [id, r] of this.records)
          if (r.sourceId === sourceId) {
            const pending = kit.pending.find(
                (p) => p.id === Number(id.split(":").at(-1)),
              ),
              flying = kit.projectiles.some(
                (p) => p.id === Number(id.split(":").at(-1)),
              );
            if (
              actor.hp <= 0 ||
              (r.end === Infinity &&
                !pending &&
                !flying &&
                time > r.release + 0.04)
            )
              r.end = Math.min(r.end, time);
            if (time > r.end + 0.55) {
              this.records.delete(id);
              continue;
            }
            r.muzzle = visual?.muzzlePosition?.()?.toArray();
            shots.push({ ...r, id: shots.length });
          }
      }
      if (kit.hero.id === "franco" && actor.hp > 0) {
        const shot = kit.projectiles.find((p) => p.a.effectId === "iron-hook"),
          pull = kit.hookPull,
          back = kit.hookReturn,
          socket = visual?.socket("HookSocket");
        if (!socket) continue;
        if (shot || pull || back) {
          aliveHooks.add(sourceId);
          let h = this.hooks.get(sourceId);
          if (!h) {
            const root = new T.Group(),
              hook = this.hookTemplate.clone(true),
              chain = new T.InstancedMesh(
                new T.TorusGeometry(0.052, 0.012, 5, 12),
                new T.MeshStandardMaterial({
                  color: "#b8c5c7",
                  metalness: 0.85,
                  roughness: 0.32,
                }),
                110,
              );
            chain.instanceMatrix.setUsage(T.DynamicDrawUsage);
            chain.frustumCulled = false;
            hook.scale.setScalar(0.72);
            root.add(hook, chain);
            this.scene.add(root);
            h = { root, hook, chain };
            this.hooks.set(sourceId, h);
          }
          let end = shot
            ? new T.Vector3(shot.x, socket.y, shot.z)
            : pull
              ? new T.Vector3(pull.target.x, socket.y, pull.target.z)
              : new T.Vector3(back.point.x, socket.y, back.point.z).lerp(
                  socket,
                  Math.min(1, (time - back.start) / (back.end - back.start)),
                );
          h.hook.position.copy(end);
          const d = end.clone().sub(socket);
          h.hook.rotation.set(-Math.PI / 2, 0, Math.atan2(d.x, d.z));
          this.chain(socket, end, h.chain);
        }
      }
    }
    for (const [id, h] of this.hooks)
      if (!aliveHooks.has(id)) {
        h.root.removeFromParent();
        h.chain.geometry.dispose();
        h.chain.material.dispose();
        this.hooks.delete(id);
      }
    this.events = this.events.filter((e) => time - e.at < 0.6);
    const actors = s.actors || [s.player, ...s.enemies],
      targets = actors.map((a) => ({
        id: a.id,
        x: a.x,
        z: a.z,
        alive: a.hp > 0,
        empty: false,
      }));
    this.energy.update(
      {
        shots: shots.slice(-48).map((r, id) => ({ ...r, id })),
        events: this.events.slice(-64),
        targets,
        actor: { key: "runtime" },
        msBonus: 0,
        buffAt: -Infinity,
        heroX: s.player.x,
      },
      time,
      {
        beamMode: "instant",
        beamWidth: 1,
        beamDuration: 0.24,
        beamGlow: 0.7,
        aoeRadius: 1.4,
      },
      this.view.heroVisual?.muzzlePosition?.(),
    );
    const restrained = new Set();
    for (const actor of actors)
      if (actor.hp > 0 && actor.suppressionUntil > time) {
        restrained.add(actor.id);
        let m = this.restraints.get(actor.id);
        if (!m) {
          m = new T.Mesh(
            new T.TorusGeometry(0.35, 0.016, 6, 48),
            new T.MeshStandardMaterial({
              color: "#cfaa67",
              metalness: 0.8,
              roughness: 0.35,
            }),
          );
          m.rotation.x = Math.PI / 2;
          this.scene.add(m);
          this.restraints.set(actor.id, m);
        }
        m.position.set(actor.x, 0.95, actor.z);
      }
    for (const [id, m] of this.restraints)
      if (!restrained.has(id)) {
        this.disposeObject(m);
        this.restraints.delete(id);
      }
    const marked = new Set();
    for (const actor of actors) {
      if (
        actor.hp <= 0 ||
        (!actor.mark &&
          !Object.values(actor.marks || {}).some((m) => m.until > time))
      )
        continue;
      if (
        actor.mark?.until <= time &&
        !Object.values(actor.marks || {}).some((m) => m.until > time)
      )
        continue;
      marked.add(actor.id);
      let m = this.marks.get(actor.id);
      if (!m) {
        m = createMark();
        this.scene.add(m);
        this.marks.set(actor.id, m);
      }
      m.position.set(actor.x, 1.85, actor.z);
      m.rotation.y = time * 0.9;
    }
    for (const [id, m] of this.marks)
      if (!marked.has(id)) {
        this.disposeObject(m);
        this.marks.delete(id);
      }
    this.last = {
      ...this.energy.snapshot(),
      marks: this.marks.size,
      hooks: this.hooks.size,
      restraints: this.restraints.size,
    };
  }
  projectileCount() {
    return this.kits().reduce(
      (n, s) => n + s.projectiles.filter((p) => keys[p.effect]).length,
      0,
    );
  }
  diagnostics() {
    return structuredClone(this.last);
  }
  dispose() {
    this.unsubscribe();
    this.clear();
    this.energy.root.removeFromParent();
    const g = new Set(),
      m = new Set();
    this.energy.root.traverse((o) => {
      if (o.geometry) g.add(o.geometry);
      if (o.material) m.add(o.material);
    });
    g.forEach((x) => x.dispose());
    m.forEach((x) => x.dispose());
  }
}
