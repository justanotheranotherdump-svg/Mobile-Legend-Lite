import test from "node:test";
import assert from "node:assert/strict";
import { firingPosition, spacedDirection } from "../src/match/ai-spacing.js";
import { loadSourceHeroRegistry } from "../scripts/lib/hero-files.mjs";
import { MatchSimulation } from "../src/match/simulation.js";
import { createMatchConfig } from "../src/match/config.js";
test("five identical ranged bots choose distinct stable firing arcs within their actual range", () => {
  const target = { x: 5, z: 0 },
    points = [];
  for (let i = 0; i < 5; i++) {
    const a = { team: "player", range: 6, laneOffset: (i - 1.5) * 1.1 },
      point = firingPosition(a, target);
    assert.ok(Math.hypot(point.x - target.x, point.z - target.z) < 6);
    points.push(JSON.stringify(point));
  }
  assert.equal(new Set(points).size, 5);
});
test("exact overlaps produce deterministic opposite steering, never a teleport or shared zero direction", () => {
  const a = { id: "ally-1", kind: "bot", x: 0, z: 0, hp: 100, radius: 0.4 },
    b = { ...a, id: "ally-2" },
    v = spacedDirection(a, { x: 0, z: 0 }, [a, b]),
    w = spacedDirection(b, { x: 0, z: 0 }, [a, b]);
  assert.equal(v.spacing, true);
  assert.ok(v.x * w.x < 0);
  assert.ok(Math.abs(Math.hypot(v.x, v.z) - 1) < 1e-8);
});
test("real 5v5 autonomous simulation uses separate firing destinations and keeps movement within collision/bounds", async () => {
  const s = new MatchSimulation(
    await loadSourceHeroRegistry(),
    createMatchConfig("brawl", "normal", 5),
    { username: "Spacing_Test" },
  );
  let moves = 0,
    attacks = 0;
  const destinations = new Set();
  for (let i = 0; i < 60 * 90; i++) {
    s.update(1 / 60);
    for (const a of s.bots) {
      if (a.intent?.type === "move") {
        moves++;
        destinations.add([a.id, a.intent.z].join(":"));
      }
      if (a.intent?.type === "attack") attacks++;
      assert.ok(Math.abs(a.z) <= s.scenario.laneHalfWidth);
      assert.ok(Number.isFinite(a.x) && Number.isFinite(a.z));
    }
  }
  assert.ok(moves > 100);
  assert.ok(attacks > 100);
  assert.ok(destinations.size > 20);
});
test('real zero-distance overlap steering keeps bot facing finite and respects real movement step',async()=>{const s=new MatchSimulation(await loadSourceHeroRegistry(),createMatchConfig('brawl','normal',2),{username:'Overlap_Test'});const a=s.bots[0],b=s.bots[1];Object.assign(b,{x:a.x,z:a.z});const before={x:a.x,z:a.z};s.moveNpc(a,a.x,a.z,1/60);assert.ok(Number.isFinite(a.facing.x)&&Number.isFinite(a.facing.z));assert.ok(Math.hypot(a.x-before.x,a.z-before.z)<=a.speed/60+1e-8)});
