import settings from '../../data/match/brawl.json' with {type:'json'};
export {settings as brawlSettings};
export const laneCenter = x => 1.2 * Math.sin(x * Math.PI / 36);
export function createBrawlScenario(lane) {
 const scenario=structuredClone(lane);
 Object.assign(scenario,{id:'frozen-causeway-brawl',name:'Frozen Causeway',brawl:structuredClone(settings),laneHalfWidth:11,spawnHealPerSecond:0,respawn:{...settings.respawn}});
 scenario.wave={...scenario.wave,...structuredClone(settings.wave)};
 scenario.bot={...scenario.bot,noBaseRecovery:true};
 // Mirrored, bent banks with traversable side pockets; these very boxes also
 // drive rendering and all world movement/path tests.
 scenario.obstacles=[];
 for(let x=-34;x<=34;x+=4) {
   const half=7.8+1.7*Math.sin((x+36)/72*Math.PI)**2, center=laneCenter(x);
   for(const side of [-1,1])scenario.obstacles.push({x,z:center+side*(half+10),width:4,depth:20,height:2.3});
 }
 for(const side of [-1,1])scenario.obstacles.push({x:side*5,z:side*5.8,width:2,depth:1.5,height:1.4,cover:true});
 return scenario;
}
