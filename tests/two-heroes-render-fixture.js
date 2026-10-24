import { loadHeroRegistry } from "../src/heroes/catalog.js";
import { HeroCombatSimulation } from "../src/simulation/hero-combat.js";
import { learnBotSkills } from "../src/match/hero-bots.js";
import { createHeroVisual } from "../src/rendering/heroes/hero-visual.js";
import { WorldView } from "../src/rendering/world.js";
// Test-only entry. Never imported by main.js or shipped as a player-facing cheat.
const registry = loadHeroRegistry();
let simulation, visual, view;
window.integrationFixture = {
  async start(hero, targets = [], position = {x:0,z:0}) {
    view?.dispose();
    visual = await createHeroVisual(
      registry.get(hero),
      registry.modelBytes(hero),
    );
    simulation = new HeroCombatSimulation(
      { halfSize: 60, obstacles: [] },
      {
        player: { heroId: hero, ...position },
        targeting: { defaultMode: "nearest" },
        dummies: targets.map((t, i) => ({
          id: t.id || `enemy-${i}`,
          name: "Test target",
          team: "enemy",
          kind: t.kind || "hero",
          targetable: true,
          radius: 0.45,
          hp: 20000,
          maxHp: 20000,
          physicalDefense: 0,
          magicDefense: 0,
          x: t.x || 0,
          z: t.z,
        })),
      },
      registry,
    );
    simulation.setPracticeLevel(15);
    learnBotSkills(simulation);
    view = new WorldView(
      document.querySelector("#world"),
      simulation.arena,
      simulation.enemies,
      visual,
    );
    await view.connectCombat(simulation);
    this.render();
    return this.snapshot();
  },
  render() {
    view.render(simulation, { x: 0, y: 0, valid: false });
  },
  cast(slot, x = 0, z = 48, target = null) {
    const result = simulation.cast(slot, { x, z }, target);
    this.render();
    return result;
  },
  attack(target) {
    const result = simulation.attack(target);
    this.render();
    return result;
  },
  advanceTo(time) {
    while (simulation.time + 1e-8 < time)
      simulation.update(Math.min(1 / 600, time - simulation.time));
    this.render();
    return this.snapshot();
  },
  fullBeamCamera() {
    view.updateCamera = () => {};
    view.camera.position.set(0, 38, 24);
    view.camera.lookAt(0, 0, 24);
    view.camera.left = -12;
    view.camera.right = 12;
    view.camera.top = 27;
    view.camera.bottom = -27;
    view.camera.updateProjectionMatrix();
    this.render();
  },
  snapshot() {
    return {
      time: simulation.time,
      hero: simulation.hero.id,
      player: structuredClone(simulation.player),
      enemies: structuredClone(simulation.enemies),
      pose: visual.diagnostics(),
      muzzle: visual.muzzlePosition?.()?.toArray(),
      hookSocket: visual.socket("HookSocket")?.toArray(),
      originalHookVisible: visual.root.getObjectByName("HookHead")?.visible,
      effects: view.combatVfx.diagnostics(),
      channel: simulation.channel && {
        start: simulation.channel.start,
        end: simulation.channel.end,
        next: simulation.channel.next,
      },
      hookPull: Boolean(simulation.hookPull),
    };
  },
  beamProbe() {
    const shot=this.snapshot().effects.approved.shots.find(s=>s.key==='ult');
    if(!shot)throw Error('No actual beam');
    const [a,b]=[shot.beamStart,shot.beamEnd],cx=(a[0]+b[0])/2,cz=(a[2]+b[2])/2;
    view.updateCamera=()=>{};view.camera.position.set(cx,40,cz+18);view.camera.lookAt(cx,0,cz);
    Object.assign(view.camera,{left:-28,right:28,top:28,bottom:-28});view.camera.updateProjectionMatrix();this.render();
    const canvas=document.createElement('canvas');canvas.width=view.canvas.width;canvas.height=view.canvas.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(view.canvas,0,0);const data=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const samples=[.08,.15,.25,.35,.5,.65,.75,.85,.95].map(t=>{
      const p=view.project(a[0]+(b[0]-a[0])*t,a[1],a[2]+(b[2]-a[2])*t);let brightness=0;
      for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++){const i=(Math.round(p.y+y)*canvas.width+Math.round(p.x+x))*4;if(i>=0&&i<data.length)brightness=Math.max(brightness,Math.min(data[i+1],data[i+2]));}
      return {t,brightness};
    });return{shot,samples};
  },
  framebuffer() {
    view.renderer.render(view.scene, view.camera);
    const c = document.createElement("canvas");
    c.width = view.canvas.width;
    c.height = view.canvas.height;
    const ctx = c.getContext("2d");
    ctx.drawImage(view.canvas, 0, 0);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    return [3, 6, 12, 18, 24, 30, 36, 42, 46].map((z) => {
      const p = view.project(0, 1.22, z);
      let best = 0;
      for (let y = -2; y <= 2; y++)
        for (let x = -2; x <= 2; x++) {
          const i = (Math.round(p.y + y) * c.width + Math.round(p.x + x)) * 4;
          if (i >= 0 && i < data.length)
            best = Math.max(best, Math.min(data[i + 1], data[i + 2]));
        }
      return { z, x: p.x, y: p.y, brightness: best };
    });
  },
};
