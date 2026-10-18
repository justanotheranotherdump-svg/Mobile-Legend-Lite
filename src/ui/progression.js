import { statText } from '../simulation/stats/attributes.js';
import './styles/progression.css';

// Session-only debugging UI. All commands go through the authoritative simulation.
export class ProgressionHud {
  constructor(simulation, controls) {
    if (!simulation.progression) return;
    this.simulation = simulation;
    const info = document.querySelector('.hero-info');
    info.insertAdjacentHTML('beforeend', '<div class="xp-caption"><strong id="hero-level"></strong><span id="hero-xp"></span></div><div class="xp-track" role="progressbar" aria-label="Hero experience" aria-valuemin="0"><i></i></div>');
    this.meter = info.querySelector('.xp-track');
    this.root = document.createElement('section');
    this.root.className = 'progression-tools';
    this.root.setAttribute('aria-label', 'Skill upgrades and practice tools');
    this.root.innerHTML = `<details id="practice-tools"><summary>Attributes / Practice · Testing</summary><section class="practice-body"><h2>Practice / Testing</h2><p>Session-only. No match rewards, wallet changes or equipment.</p><dl id="live-attributes"></dl><p class="practice-note">Display movement/range → world units. Physical and magic damage use defense; Prototype balance; match equipment adds supported bonuses.</p><label>Set level (1–15; resets ranks)<input id="practice-level" type="number" min="1" max="15" step="1" value="1"></label><button id="practice-set-level" type="button">Set level</button><label>XP to grant<input id="practice-xp" type="number" min="0" max="9007199254740991" step="1" value="200"></label><button id="practice-grant-xp" type="button">Grant XP</button><div class="practice-actions"><button id="practice-reset" type="button">Reset to level 1</button><button id="practice-restore" type="button">Restore HP / mana</button></div><p id="practice-result" role="status">Changing level cancels actions and cooldowns; set-level preserves numerical resource deficits. Reset restores resources. Targets are unchanged.</p></section></details>`;
    document.querySelector('#hud-root').append(this.root);
    const points=document.createElement('span');points.className='available-skill-points';points.innerHTML='POINTS <strong id="skill-points"></strong>';info.querySelector('.xp-caption').insertBefore(points,info.querySelector('#hero-xp'));
    this.points=points.querySelector('strong');
    this.upgrades = simulation.hero.abilities.filter(a => a.slot !== 'passive').map((a, i) => {
      const button = document.getElementById(`upgrade-${a.slot}`);
      return { a, button, label: ['S1','S2','ULT'][i] };
    });
    const commands = {
      'practice-set-level': () => { simulation.setPracticeLevel(this.root.querySelector('#practice-level').valueAsNumber); controls.clear(); },
      'practice-grant-xp': () => simulation.grantXp(this.root.querySelector('#practice-xp').valueAsNumber),
      'practice-reset': () => { simulation.setPracticeLevel(1); simulation.restoreResources(); controls.clear(); },
      'practice-restore': () => simulation.restoreResources(),
    };
    for (const [id, command] of Object.entries(commands)) this.root.querySelector(`#${id}`).addEventListener('click', e => {
      try { if(simulation.paused)throw Error("Paused — resume before using testing commands"); command(); this.root.querySelector('#practice-result').textContent = `${e.currentTarget.textContent}: applied. No rewards generated.`; }
      catch (error) { this.root.querySelector('#practice-result').textContent = error.message; }
      e.currentTarget.blur();
    });
    const fields = [ ['hp','HP'], ['mana','Mana'], ['physicalAttack','Physical attack'], ['physicalDefense','Physical defense'], ['magicDefense','Magic defense'], ['magicPower','Magic power'], ['attackSpeed','Attack rate / second'], ['movementSpeed','Movement (display → world/s)'], ['attackRange','Range (display → world)'], ['hpRegen','HP regen / second'], ['manaRegen','Mana regen / second'], ['attackSpeedRatio','Attack-speed ratio'], ['criticalDamage','Critical damage multiplier'] ];
    this.fields = fields.map(([key,label]) => {
      const dt = document.createElement('dt'), dd = document.createElement('dd');
      dt.textContent = label; dd.dataset.attribute = key;
      this.root.querySelector('#live-attributes').append(dt, dd);
      return { key, dd };
    });
  }
  update() {
    if (!this.root) return;
    const s = this.simulation, p = s.player, progress = s.progression.snapshot();
    document.querySelector('#hero-level').textContent = `Lv ${progress.level}`;
    document.querySelector('#hero-xp').textContent = progress.atMax ? 'MAX LEVEL' : `XP ${progress.xp} / ${progress.xpToNext}`;
    this.meter.setAttribute('aria-valuemax', progress.atMax ? 1 : progress.xpToNext);
    this.meter.setAttribute('aria-valuenow', progress.atMax ? 1 : progress.xp);
    this.meter.firstElementChild.style.width = `${progress.atMax ? 100 : progress.xp / progress.xpToNext * 100}%`;
    this.points.textContent = progress.skillPoints;
    for (const {a,button,label} of this.upgrades) {
      const rank = progress.ranks[a.id], reason = s.paused ? "paused" : s.isMatch && s.phase !== "running" ? s.phase : s.progression.upgradeReason(a.slot);
      button.textContent = "+";
      button.hidden = Boolean(reason);
      button.disabled = Boolean(reason);
      button.title = reason ?? `Spend one skill point on ${a.name}`;
      button.setAttribute('aria-label', `Upgrade ${a.name}, rank ${rank} of ${a.ranks.max}${reason ? `, ${reason}` : ', costs one skill point'}`);
    }
    for (const {key,dd} of this.fields) {
      dd.textContent = key === 'hp' ? `${statText(p.hp)} / ${statText(p.maxHp)}`
        : key === 'mana' ? `${statText(p.mana)} / ${statText(p.maxMana)}`
        : key === 'movementSpeed' ? `${statText(p.speed / s.hero.runtimeScale.movement)} → ${statText(p.speed)}`
        : key === 'attackRange' ? `${statText(p.range / s.hero.runtimeScale.range)} → ${statText(p.range)}`
        : statText(key === 'attackSpeed' ? p.attackRate : p.attributes[key]);
    }
  }
}
