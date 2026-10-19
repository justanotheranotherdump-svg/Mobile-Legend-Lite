import { validBuild } from "../player/builds.js";
// Remember completed *positions*, not just item IDs: duplicate build entries
// each need a real additional copy. Sales/combines never undo completed steps.
export class BuildPriority {
  constructor(sequence) {
    this.sequence = validBuild(sequence) ? [...sequence] : [];
    this.completed = new Set();
    this.completedSlots = new Set();
    this.previousCounts = new Map();
    this.manual = null;
    this.paused = false;
  }
  refresh(inventory) {
    const counts = new Map();
    for (const id of inventory.filter(Boolean)) counts.set(id,(counts.get(id)||0)+1);
    for (const [id,count] of counts) {
      const added = Math.max(0,count-(this.previousCounts.get(id)||0));
      for(let n=0;n<added;n++) {
        const index=this.sequence.findIndex((key,i)=>key===id&&!this.completedSlots.has(i));
        if(index>=0){this.completedSlots.add(index);this.completed.add(id);}
      }
      if(added && this.manual===id)this.manual=null;
    }
    this.previousCounts=counts;
    if (this.paused) return null;
    return this.manual || this.sequence.find((id,i)=>!this.completedSlots.has(i)) || null;
  }
  prioritize(id) { this.manual=id;this.paused=id===null; }
  resume() { this.manual=null;this.paused=false; }
  snapshot() {
    return {sequence:[...this.sequence],completed:[...this.completed],completedSlots:[...this.completedSlots],manual:this.manual,paused:this.paused};
  }
}
