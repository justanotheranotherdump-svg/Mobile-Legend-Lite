// Separate mode actions; existing hero skills, battle-spell slot and keybinds stay intact.
export class BrawlHud {
 constructor(s,view){
  this.s=s;this.view=view;this.scope=new AbortController();const options={signal:this.scope.signal};
  this.el=document.createElement('section');this.el.id='brawl-actions';this.el.setAttribute('aria-label','Brawl movement and object status');
  this.el.style.cssText='position:absolute;right:18px;top:94px;max-width:230px;padding:6px 9px;background:#102535dd;border:1px solid #638392;border-radius:7px;color:#e0eeee;font:11px sans-serif;pointer-events:auto';
  this.el.innerHTML='<div><button type="button" data-cloud>Flying Cloud</button> <button type="button" data-barrel>Barrel</button></div><p style="margin:5px 0" data-status></p><small>Flicker · single spell slot in this build</small>';
  document.querySelector('#hud-root').append(this.el);
  this.el.querySelector('[data-cloud]').onclick=()=>{this.feedback=s.brawl.useCloud();};
  this.el.querySelector('[data-barrel]').onclick=()=>{this.aiming=!this.aiming;this.update();};
  view.canvas.addEventListener('pointerdown',e=>{
   if(!this.aiming)return;e.preventDefault();e.stopImmediatePropagation();
   const point=view.groundAtClient(e.clientX,e.clientY);if(point)this.feedback=s.brawl.launchBarrel(point);this.aiming=false;
  },{...options,capture:true});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')this.aiming=false;},options);
 }
 update(){
  const s=this.s,p=s.player,q=s.brawl.q,cloud=this.el.querySelector('[data-cloud]'),barrel=this.el.querySelector('[data-barrel]');
  cloud.disabled=s.paused||!s.brawl.canMove(p)||s.time<p.cloudReadyAt||Math.hypot(p.x-s.scenario.spawn.player.x,p.z-s.scenario.spawn.player.z)>q.cloud.baseRadius;
  cloud.textContent=s.time<p.cloudReadyAt?`Cloud ${Math.ceil(p.cloudReadyAt-s.time)}s`:'Flying Cloud';
  barrel.disabled=s.paused||!p.barrel||!s.brawl.canMove(p);barrel.textContent=p.barrel?`Barrel ${Math.ceil(p.barrel.expiresAt-s.time)}s`:'No barrel';
  const w=p.brawlShop,shop=s.brawl.canShop()?(w.leftAt===null?'Shop open this spawn':`Shop ${Math.ceil(Math.max(0,w.leftAt+q.shopGrace-s.time))}s`):'Shop closed until respawn';
  this.el.querySelector('[data-status]').textContent=this.aiming?'Click/tap the lane to aim and launch. Escape cancels.':`${shop}${p.brawlBushId?' · Bush cover':''}${p.brawlTravel?' · '+p.brawlTravel.kind+' travel':''}`;
 }
 dispose(){this.scope.abort();this.el.remove();}
}
