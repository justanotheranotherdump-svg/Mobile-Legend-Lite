// Test-only entry: real shared combat, HUD and pointer gestures. No production cheats.
import {loadHeroRegistry} from '../src/heroes/catalog.js';
import {HeroCombatSimulation} from '../src/simulation/hero-combat.js';
import {HeroSkillHud} from '../src/ui/hero-skills.js';
const simulation=new HeroCombatSimulation({halfSize:60,obstacles:[]},{player:{heroId:'layla',x:0,z:0},dummies:[],targeting:{defaultMode:'nearest'}},loadHeroRegistry());
simulation.setPracticeLevel(4);
for(const slot of ['skill-1','skill-2','skill-ultimate'])simulation.upgradeSkill(slot);
const controls={blocked:false,pointer:{active:false},registerReset(){}};
const view={canvas:document.querySelector('canvas')};
const hud=new HeroSkillHud(simulation,controls,view);
window.gateFixture={
 target(kind='hero',z=5){simulation.enemies=[{id:'enemy',kind,team:'enemy',targetable:true,x:0,z,radius:.45,hp:20000,maxHp:20000}];hud.update();},
 moveOut(){simulation.enemies[0].z=30;hud.update();},
 snapshot(){return {mana:simulation.player.mana,cooldowns:{...simulation.cooldowns},pending:simulation.pending.length,projectiles:simulation.projectiles.length,aiming:simulation.aiming,lastCast:simulation.lastCastResult,serial:simulation.serial,lockUntil:simulation.lockUntil};}
};
function frame(){hud.update();requestAnimationFrame(frame);}frame();
