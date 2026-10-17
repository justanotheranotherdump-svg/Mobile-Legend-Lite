const NS = "http://www.w3.org/2000/svg";
export function mapPoint(x, z, halfSize) {
  return {
    x: 100 + ((x - z) * 44) / halfSize,
    y: 100 + ((x + z) * 44) / halfSize,
  };
}
function svgNode(name, attrs, parent) {
  const element = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs))
    element.setAttribute(key, value);
  parent.append(element);
  return element;
}
export class Minimap {
  constructor(root, arena, enemies) {
    this.arena = arena;
    this.svg = svgNode(
      "svg",
      {
        viewBox: "0 0 200 200",
        role: "img",
        "aria-label": "Live arena map: player, obstacles and training targets",
        id: "arena-map",
      },
      root,
    );
    svgNode(
      "polygon",
      { points: "100,12 188,100 100,188 12,100", class: "map-floor" },
      this.svg,
    );
    for (let step = 1; step < 6; step++)
      for (const axis of ["x", "z"]) {
        const n = -arena.halfSize + (step * arena.halfSize) / 3;
        const a = mapPoint(
          axis === "x" ? n : -arena.halfSize,
          axis === "z" ? n : -arena.halfSize,
          arena.halfSize,
        );
        const b = mapPoint(
          axis === "x" ? n : arena.halfSize,
          axis === "z" ? n : arena.halfSize,
          arena.halfSize,
        );
        svgNode(
          "line",
          { x1: a.x, y1: a.y, x2: b.x, y2: b.y, class: "map-grid" },
          this.svg,
        );
      }
    for (const box of arena.obstacles) {
      const points = [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ].map(([x, z]) =>
        mapPoint(
          box.x + (x * box.width) / 2,
          box.z + (z * box.depth) / 2,
          arena.halfSize,
        ),
      );
      svgNode(
        "polygon",
        {
          points: points.map((p) => `${p.x},${p.y}`).join(" "),
          class: "map-obstacle",
        },
        this.svg,
      );
    }
    this.range = svgNode("circle", { class: "map-range" }, this.svg);
    this.targets = new Map(
      enemies.map((enemy) => {
        const marker = svgNode(
          "circle",
          { r: 4, class: "map-target", "data-map-enemy": enemy.id },
          this.svg,
        );
        const title = svgNode("title", {}, marker);
        title.textContent = enemy.name;
        return [enemy.id, marker];
      }),
    );
    this.player = svgNode("g", { id: "map-player" }, this.svg);
    svgNode("circle", { r: 7, class: "map-player-halo" }, this.player);
    svgNode(
      "path",
      { d: "M0 -7 5 5 0 3 -5 5Z", class: "map-player-arrow" },
      this.player,
    );
    this.heading = 0;
  }
  update(state, aim) {
    const p = mapPoint(state.player.x, state.player.z, this.arena.halfSize);
    if (aim) {
      const a = mapPoint(aim.x, aim.z, this.arena.halfSize);
      this.heading = (Math.atan2(a.x - p.x, -(a.y - p.y)) * 180) / Math.PI;
    }
    this.player.setAttribute(
      "transform",
      `translate(${p.x} ${p.y}) rotate(${this.heading})`,
    );
    this.player.dataset.x = state.player.x;
    this.player.dataset.z = state.player.z;
    for (const [key, value] of Object.entries({
      cx: p.x,
      cy: p.y,
      r: (state.player.range * 44 * Math.SQRT2) / this.arena.halfSize,
    }))
      this.range.setAttribute(key, value);
    for (const enemy of state.enemies) {
      const marker = this.targets.get(enemy.id),
        point = mapPoint(enemy.x, enemy.z, this.arena.halfSize);
      marker.setAttribute("cx", point.x);
      marker.setAttribute("cy", point.y);
      marker.classList.toggle("selected", state.selectedTargetId === enemy.id);
      marker.classList.toggle("defeated", enemy.hp <= 0);
      marker.dataset.hp = enemy.hp;
    }
  }
}
