import * as THREE from "three";
// Read-only presentation of spell events/active state; never applies damage/heals.
export class SpellVfx {
  constructor(scene, s) {
    this.scene = scene;
    this.s = s;
    this.transient = [];
    this.rings = new Map();
    this.off = s.events.subscribe((e) => {
      if (!e.type.startsWith("spell-") || !e.point) return;
      if (e.type === "spell-feedback") return;
      const ring = this.ring(e.radius || 0.9, e.color || "#9ddcea");
      ring.position.set(e.point.x, 0.08, e.point.z);
      this.transient.push({ ring, until: s.time + 0.55 });
      if (e.departure) {
        const r = this.ring(0.8, e.color);
        r.position.set(e.departure.x, 0.08, e.departure.z);
        this.transient.push({ ring: r, until: s.time + 0.55 });
      }
    });
  }
  ring(radius, color) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(radius * 0.9, radius, 48),
      new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    this.scene.add(mesh);
    return mesh;
  }
  remove(r) {
    r.removeFromParent();
    r.geometry.dispose();
    r.material.dispose();
  }
  update() {
    const s = this.s,
      spell = s.spells;
    if (!spell) return;
    for (const r of this.transient) if (s.time >= r.until) this.remove(r.ring);
    this.transient = this.transient.filter((r) => s.time < r.until);
    const active = [];
    for (const [key, value] of Object.entries(spell.active))
      if ((typeof value === "number" ? value : value.until) > s.time)
        active.push({
          id: key,
          x: s.player.x,
          z: s.player.z,
          radius: 1,
          color: spell.definition.color,
        });
    for (const spring of spell.springs)
      active.push({
        id: "spring-" + spring.id,
        x: spring.x,
        z: spring.z,
        radius: 4,
        color: "#69dfb0",
      });
    if (spell.channel) {
      const a = s.actors.find((a) => a.id === spell.channel.targetId);
      if (a)
        active.push({
          id: "destination",
          x: a.x,
          z: a.z,
          radius: 1.5,
          color: "#8fe9ff",
        });
    }
    for (const a of s.actors)
      if (a.shields?.length)
        active.push({
          id: "shield-" + a.id,
          x: a.x,
          z: a.z,
          radius: a.radius + 1,
          color: "#edcf77",
        });
    for (const [id, ring] of this.rings)
      if (!active.some((x) => x.id === id)) {
        this.remove(ring);
        this.rings.delete(id);
      }
    for (const e of active) {
      if (!this.rings.has(e.id))
        this.rings.set(e.id, this.ring(e.radius, e.color));
      const ring = this.rings.get(e.id);
      ring.position.set(e.x, 0.1, e.z);
      ring.material.opacity = 0.45 + Math.sin(s.time * 5) * 0.15;
    }
  }
  dispose() {
    this.off();
    for (const r of this.transient) this.remove(r.ring);
    for (const r of this.rings.values()) this.remove(r);
    this.rings.clear();
    this.transient = [];
  }
}
