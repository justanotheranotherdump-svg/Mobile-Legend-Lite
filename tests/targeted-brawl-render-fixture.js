import {loadHeroRegistry} from '../src/heroes/catalog.js';import {MatchSimulation} from '../src/match/simulation.js';import {createMatchConfig} from '../src/match/config.js';import {LaneView} from '../src/rendering/lane-view.js';import {createHeroVisual} from '../src/rendering/heroes/hero-visual.js';import {BrawlHud} from '../src/ui/brawl-hud.js';
// Isolated test harness only; no mutation endpoints are imported into the game.
const registry=loadHeroRegistry();let s,v,visual,hud;
window.brawlFixture={
 async start(hero='franco') {v?.dispose();hud?.dispose();s=new MatchSimulation(registry,{...createMatchConfig('brawl','normal',1),heroId:hero},{username:'RenderTest'});s.phase='running';s.bots=[];s.syncEnemies();s.waveScheduler.due=()=>[];visual=await createHeroVisual(registry.get(hero),registry.modelBytes(hero));v=new LaneView(document.querySelector('#world'),s.arena,[],visual);await v.prepareHeroes(registry);await v.connectCombat(s);hud=new BrawlHud(s,v);this.render();return this.snapshot();},
 render(){v.render(s,{x:0,y:0,valid:false});hud.update();},
 snapshot(){return {state:s.snapshot(),pose:visual.diagnostics(),objects:v.brawlObjects.size,crabs:[...v.dummies.keys()],selected:s.selectedTargetId,action:s.heroAction};},
 locate(x,z){s.player.x=x;s.player.z=z;this.render();},
 time(time){s.time=time;s.brawl.tick(0);s.syncEnemies();this.render();return this.snapshot();},
 advance(seconds){for(let i=0;i<Math.ceil(seconds*120);i++)s.update(Math.min(1/120,seconds-i/120));this.render();return this.snapshot();},
 tower(){const t=s.structures.find(t=>t.id==='enemy-0');t.damage=0;s.player.x=t.x-6;s.player.z=0;this.render();return {...v.project(t.x,1.5,t.z),id:t.id};},
 click(x,y){const p={x:x/v.width*2-1,y:-(y/v.height*2-1)};const id=v.pickTarget(p);const result=s.requestAttack(id);this.render();return {id,result};},
 attack(){const t=s.structures.find(t=>t.id==='enemy-0');s.player.x=t.x-1.8;s.player.z=0;s.player.cooldown=0;s.lockUntil=s.time;s.pending=[];s.cancelAttackCommand();const result=s.attack(t.id);this.render();return {result,release:s.pending[0]?.at};},
 collect(kind){const o=s.brawl[kind][0];s.player.x=o.x;s.player.z=o.z;s.brawl.tick(0);this.render();return this.snapshot();},
 project(x,z){return v.project(x,.1,z);},
 dispose(){hud.dispose();v.dispose();}
};
