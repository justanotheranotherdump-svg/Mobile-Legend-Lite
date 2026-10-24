import data from '../data/preparation/franco-presets.json' with {type:'json'};
export const francoPresets=Object.freeze(data.presets.map(p=>Object.freeze({...p,items:Object.freeze([...p.items])})));
export {data as francoPresetInfo};
export const sameBuildOrder=(a,b)=>Array.isArray(a)&&a.length===b.length&&a.every((id,i)=>id===b[i]);
// Templates are never saved/mutated directly. Reuse an existing matching copy,
// otherwise go through the normal ownership/three-build-limit validation.
export function useFrancoPreset(builds,id){
 const preset=francoPresets.find(p=>p.id===id);
 if(!preset||!builds?.owned.includes('franco'))return 'invalid-build';
 const existing=builds.hero('franco').builds.find(b=>sameBuildOrder(b.items,preset.items));
 if(existing)return builds.select('franco',existing.id)?'ok':'invalid-build';
 return builds.saveBuild('franco',{name:preset.name,items:[...preset.items]});
}
