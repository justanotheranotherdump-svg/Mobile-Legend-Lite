// Plain numbers only: gameplay does not depend on Three.js or a character mesh.
export function cameraRelativeDirection(horizontal, vertical) {
  const length = Math.hypot(horizontal, vertical);
  if (!length) return { x: 0, z: 0 };
  const scale = 1 / Math.max(1, length);
  const h = horizontal * scale;
  const v = vertical * scale; // positive is screen-up
  return { x: (h - v) * Math.SQRT1_2, z: (-h - v) * Math.SQRT1_2 };
}

export function overlapsBox(x, z, radius, box) {
  const closestX = Math.max(box.x - box.width / 2, Math.min(x, box.x + box.width / 2));
  const closestZ = Math.max(box.z - box.depth / 2, Math.min(z, box.z + box.depth / 2));
  return Math.hypot(x - closestX, z - closestZ) < radius - 1e-8;
}

export function moveEntity(entity, direction, dt, arena, circles = []) {
  if (entity.stunned || entity.hp <= 0) return;
  const distance = entity.speed * dt;
  // Small bounded steps prevent crossing thin obstacles at low render rates.
  const steps = Math.max(1, Math.ceil(distance / (entity.radius * 0.4)));
  const dx = direction.x * distance / steps;
  const dz = direction.z * distance / steps;
  const limit = arena.halfSize - entity.radius;
  const blocked = (x, z) => arena.obstacles.some(box => overlapsBox(x, z, entity.radius, box))
    || circles.some(c => c !== entity && c.hp > 0 && Math.hypot(c.x - x, c.z - z) < c.radius + entity.radius - 1e-8);
  for (let step = 0; step < steps; step++) {
    const before = { x: entity.x, z: entity.z };
    const x = Math.max(-limit, Math.min(limit, entity.x + dx));
    if (!blocked(x, entity.z)) entity.x = x;
    const z = Math.max(-limit, Math.min(limit, entity.z + dz));
    if (!blocked(entity.x, z)) entity.z = z;
    // Dynamic bodies may be walked around, never phased through. Keep this
    // local tangential fallback scoped to lane matches, not forced skill motion.
    if (arena.unitCollision && circles.length && Math.hypot(dx, dz) > 0 &&
        Math.hypot(entity.x-before.x, entity.z-before.z) < 1e-8) {
      const blocker=circles.filter(c=>c!==entity&&c.hp>0&&
        Math.hypot(before.x+dx-c.x,before.z+dz-c.z)<entity.radius+c.radius+.03)
        .sort((a,b)=>Math.hypot(a.x-before.x,a.z-before.z)-Math.hypot(b.x-before.x,b.z-before.z))[0];
      if(!blocker)continue;
      const rx=before.x-blocker.x,rz=before.z-blocker.z,r=Math.max(.001,Math.hypot(rx,rz)),length=Math.hypot(dx,dz);
      // Follow the contact's tangent, including a small retreat component when
      // needed, rather than bouncing forever between two adjacent minions.
      const preferred=(-rz/r)*(-dz)+(rx/r)*dx >= 0 ? 1 : -1;
      for (const side of [preferred, -preferred]) {
        const tx = Math.max(-limit, Math.min(limit, before.x - rz/r*length*side));
        const tz = Math.max(-limit, Math.min(limit, before.z + rx/r*length*side));
        if (!blocked(tx, tz)) { entity.x = tx; entity.z = tz; break; }
      }
    }
  }
}

// Repair spawn/forced-displacement overlaps after movement, without changing hit
// detection or stopping hooks/dashes at a unit wall. Structures remain fixed.
export function separateLivingUnits(actors, arena) {
  const living = actors.filter(a => a.hp > 0);
  const fixed = a => ["tower", "core"].includes(a.kind) || a.kind === "creep" && !a.speed || a.displacementBy || a.brawlTravel;
  const structures = living.filter(a => ["tower", "core"].includes(a.kind));
  const shift = (a, x, z) => {
    const distance = Math.hypot(x,z);
    if (!distance) return;
    moveEntity({...a, stunned:false, speed:distance, get x(){return a.x}, set x(v){a.x=v}, get z(){return a.z}, set z(v){a.z=v}},
      {x:x/distance,z:z/distance}, 1, {...arena,unitCollision:false}, structures.filter(b=>b!==a));
  };
  for (let pass=0; pass<5; pass++) {
   let overlaps = false;
   for (let i=0;i<living.length;i++) for(let j=i+1;j<living.length;j++) {
    const a=living[i], b=living[j];
    if(fixed(a)&&fixed(b)) continue;
    let x=b.x-a.x,z=b.z-a.z;
    if(x*x+z*z >= (a.radius+b.radius)**2)continue;
    let d=Math.hypot(x,z);
    const overlap=a.radius+b.radius-d;
    if(overlap<=0.001) continue;
    overlaps = true;
    if(d<1e-8) { x=1; z=((i+j)%2 ? 1:-1); d=Math.SQRT2; }
    const mass = a => fixed(a) ? 0 : (["player","bot"].includes(a.kind) ? .5 : 1);
    const ma=mass(a),mb=mass(b), amount=Math.min(overlap+.001,.3);
    if(ma) shift(a,-x/d*amount*ma/(ma+mb),-z/d*amount*ma/(ma+mb));
    if(mb) shift(b,x/d*amount*mb/(ma+mb),z/d*amount*mb/(ma+mb));
  }
   if(!overlaps) break;
  }
}
