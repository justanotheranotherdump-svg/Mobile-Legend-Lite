import * as THREE from "three";
const colors = {
  flameshot: "#ff9c53",
  "line-projectile": "#ffd877",
  "basic-projectile": "#b9f8ff",
  "orb-mark": "#c391ff",
  "line-blast": "#ffe4ab",
};

// Read-only event/state adapter. Removing this entire module cannot affect combat.
export class CombatVfx {
  constructor(scene, simulation) {
    this.scene = scene;
    this.simulation = simulation;
    this.shots = new Map();
    this.statuses = new Map();
    this.transients = [];
    this.counters = {};
    this.unsubscribe = simulation.events.subscribe((e) => this.event(e));
  }
  mesh(geometry, color) {
    return new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      }),
    );
  }
  addTransient(mesh, time, duration) {
    if (this.transients.length >= 160) {
      const old = this.transients.shift();
      this.dispose(old.mesh);
    }
    this.scene.add(mesh);
    this.transients.push({ mesh, start: time, end: time + duration });
  }
  dispose(mesh) {
    this.scene.remove(mesh);
    mesh.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) for (const m of [o.material].flat()) m.dispose();
    });
  }
  clear() {
    for (const m of this.shots.values()) this.dispose(m);
    for (const m of this.statuses.values()) this.dispose(m);
    for (const t of this.transients) this.dispose(t.mesh);
    this.shots.clear();
    this.statuses.clear();
    this.transients = [];
    this.counters = {};
  }
  line(source, end, width, color, height = 0.9) {
    const n = Math.hypot(end.x - source.x, end.z - source.z);
    const m = this.mesh(new THREE.BoxGeometry(width, 0.12, n), color);
    m.position.set((source.x + end.x) / 2, height, (source.z + end.z) / 2);
    m.rotation.y = Math.atan2(end.x - source.x, end.z - source.z);
    return m;
  }
  ring(point, radius, color) {
    const m = this.mesh(
      new THREE.RingGeometry(Math.max(0.01, radius - 0.07), radius, 48),
      color,
    );
    m.userData.expand = true;
    m.rotation.x = -Math.PI / 2;
    m.position.set(point.x, 0.08, point.z);
    return m;
  }
  event(e) {
    if (e.type === "reset") {
      this.clear();
      return;
    }
    this.counters[e.type] = (this.counters[e.type] || 0) + 1;
    if (e.type === "cast") {
      const line = this.line(
        e.source,
        e.end,
        e.effect === "line-blast" ? e.width : 0.08,
        colors[e.effect],
        0.08,
      );
      line.material.opacity = 0.25;
      this.addTransient(line, e.time, Math.max(0.1, e.duration));
      if (e.effect === "orb-mark")
        this.addTransient(
          this.ring(e.end, e.width, colors[e.effect]),
          e.time,
          Math.max(0.1, e.duration),
        );
    }
    if (e.type === "launch") {
      const flash = this.mesh(
        new THREE.SphereGeometry(0.17, 8, 6),
        colors[e.effect],
      );
      flash.position.set(e.source.x, 1.11, e.source.z);
      this.addTransient(flash, e.time, 0.1);
    }
    if (e.type === "beam") {
      this.addTransient(
        this.line(
          e.source,
          e.end,
          Math.min(0.22, e.width * 0.2),
          "#fffbdc",
          1.11,
        ),
        e.time,
        0.2,
      );
      this.addTransient(
        this.line(e.source, e.end, e.width, colors["line-blast"], 1.11),
        e.time,
        0.28,
      );
    }
    if (["hit", "impact", "explosion", "mark-trigger"].includes(e.type)) {
      const color =
        e.type === "mark-trigger"
          ? "#f6b5ff"
          : e.type === "explosion"
            ? "#b988ff"
            : e.type === "hit"
              ? "#fff1c6"
              : colors[e.effect] || "#fff";
      this.addTransient(
        this.ring(e.point, e.radius || 0.42, color),
        e.time,
        e.radius ? 0.42 : 0.18,
      );
      const spark = this.mesh(
        new THREE.SphereGeometry(e.radius ? 0.3 : 0.12, 8, 6),
        color,
      );
      for (let k = 0; k < 5; k++) {
        const angle = (k / 5) * Math.PI * 2,
          shard = this.mesh(new THREE.OctahedronGeometry(0.065, 0), color);
        shard.material.blending = THREE.AdditiveBlending;
        shard.position.set(e.point.x, 0.7, e.point.z);
        shard.userData.origin = { x: e.point.x, z: e.point.z };
        shard.userData.velocity = {
          x: Math.cos(angle) * 1.8,
          z: Math.sin(angle) * 1.8,
        };
        this.addTransient(shard, e.time, 0.28);
      }
      spark.position.set(e.point.x, 0.85, e.point.z);
      this.addTransient(spark, e.time, 0.15);
    }
  }
  update() {
    const s = this.simulation,
      time = s.time,
      ids = new Set();
    for (const p of [
      ...(s.renderProjectiles || s.projectiles),
      ...(s.npcProjectiles || []),
    ]) {
      ids.add(p.id);
      let g = this.shots.get(p.id);
      if (!g) {
        g = new THREE.Group();
        const orb = this.mesh(
          new THREE.SphereGeometry(p.radius, 10, 8),
          colors[p.effect],
        );
        g.add(orb);
        const halo = this.mesh(
          new THREE.SphereGeometry(p.radius * 1.7, 8, 6),
          colors[p.effect],
        );
        halo.material.opacity = 0.15;
        halo.material.blending = THREE.AdditiveBlending;
        g.add(halo);
        const trail = this.mesh(
          new THREE.ConeGeometry(p.radius * 0.7, 0.7, 8),
          colors[p.effect],
        );
        trail.rotation.x = -Math.PI / 2;
        trail.position.z = -0.4;
        trail.material.opacity = 0.45;
        g.add(trail);
        this.shots.set(p.id, g);
        this.scene.add(g);
      }
      g.position.set(p.x, 1.11, p.z);
      g.rotation.y = Math.atan2(p.dx, p.dz);
    }
    for (const [id, g] of this.shots)
      if (!ids.has(id)) {
        this.dispose(g);
        this.shots.delete(id);
      }
    for (const [id, mesh] of this.statuses)
      if (!s.enemies.some((e) => e.id === id)) {
        this.dispose(mesh);
        this.statuses.delete(id);
      }
    for (const e of s.enemies) {
      let g = this.statuses.get(e.id);
      if (!g) {
        g = new THREE.Group();
        g.add(this.ring({ x: 0, z: 0 }, 0.85, "#bd8eff"));
        const stun = this.mesh(
          new THREE.TorusGeometry(0.3, 0.035, 6, 16),
          "#fff4b4",
        );
        stun.position.y = 2;
        stun.rotation.x = Math.PI / 2;
        g.add(stun);
        this.statuses.set(e.id, g);
        this.scene.add(g);
      }
      g.position.set(e.x, 0, e.z);
      g.children[0].visible = Boolean(
        e.hp > 0 && e.mark && e.mark.until > time,
      );
      g.children[1].visible = Boolean(e.hp > 0 && e.stunned);
      g.children[1].rotation.z = time * 3;
    }
    this.transients = this.transients.filter((t) => {
      if (time >= t.end) {
        this.dispose(t.mesh);
        return false;
      }
      const f = (time - t.start) / (t.end - t.start);
      t.mesh.material.opacity = Math.max(0, (1 - f) * 0.8);
      if (t.mesh.userData.expand) t.mesh.scale.setScalar(0.65 + 0.35 * f);
      const o = t.mesh.userData.origin,
        v = t.mesh.userData.velocity;
      if (o && v) {
        const elapsed = time - t.start;
        t.mesh.position.set(
          o.x + v.x * elapsed,
          0.7 + elapsed * 0.8,
          o.z + v.z * elapsed,
        );
        t.mesh.rotation.y = f * 4;
      }
      return true;
    });
  }
  diagnostics() {
    return {
      projectiles: this.shots.size,
      transients: this.transients.length,
      events: { ...this.counters },
    };
  }
}
