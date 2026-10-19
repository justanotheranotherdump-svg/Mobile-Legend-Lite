// Presentation only: actor HP/mana/ranks come from the authoritative simulation.
export const isHeroActor = (a) =>
  a && ["bot", "player", "hero"].includes(a.kind);
export function heroNameplate(label) {
  label.classList.add("hero-nameplate");
  label.innerHTML =
    '<span class="actor-name"></span><div class="actor-vitals"><b class="actor-level"></b><div class="actor-bars"><div><i class="actor-hp"></i></div><div class="actor-mana-track"><i class="actor-mana"></i></div></div></div><small class="actor-values"></small>';
}
export function syncHeroNameplate(label, a) {
  const level = a.progression?.level ?? a.level,
    usesMana =
      Number.isFinite(a.maxMana) && a.maxMana > 0 && Number.isFinite(a.mana);
  label.querySelector(".actor-name").textContent = a.name;
  label.querySelector(".actor-level").textContent = Number.isFinite(level)
    ? level
    : "";
  label.querySelector(".actor-hp").style.width =
    `${(Math.max(0, a.hp) / a.maxHp) * 100}%`;
  label.querySelector(".actor-mana-track").hidden = !usesMana;
  if (usesMana)
    label.querySelector(".actor-mana").style.width =
      `${(a.mana / a.maxMana) * 100}%`;
  label.querySelector(".actor-values").textContent =
    `${Math.ceil(a.hp)}/${a.maxHp}${usesMana ? " HP · " + Math.floor(a.mana) + "/" + a.maxMana + " MP" : " HP"}`;
  label.dataset.team = a.team;
  label.dataset.hp = a.hp;
  label.dataset.mana = usesMana ? a.mana : "";
  label.dataset.level = level ?? "";
}
export class EnemyInfo {
  constructor(root) {
    this.root = document.createElement("aside");
    this.root.id = "selected-enemy-info";
    this.root.hidden = true;
    this.root.setAttribute("aria-label", "Selected enemy hero");
    this.root.innerHTML =
      '<header><strong id="enemy-info-name"></strong><b id="enemy-info-level"></b></header><div class="enemy-info-values" id="enemy-info-hp"></div><div class="enemy-info-track"><i id="enemy-info-hp-bar"></i></div><div id="enemy-info-mana-row"><div class="enemy-info-values" id="enemy-info-mana"></div><div class="enemy-info-track mana"><i id="enemy-info-mana-bar"></i></div></div>';
    root.append(this.root);
  }
  update(s) {
    const a = s.selectedTarget,
      show =
        isHeroActor(a) &&
        a.team !== s.player.team &&
        a.hp > 0 &&
        a.targetable !== false &&
        !a.protected;
    this.root.hidden = !show;
    if (!show) {
      this.root.dataset.targetId = "";
      return;
    }
    this.root.dataset.targetId = a.id;
    this.root.querySelector("#enemy-info-name").textContent = a.name;
    const level = a.progression?.level ?? a.level;
    this.root.querySelector("#enemy-info-level").textContent = Number.isFinite(
      level,
    )
      ? `Lv ${level}`
      : "";
    this.root.querySelector("#enemy-info-hp").textContent =
      `HP ${Math.ceil(a.hp)} / ${a.maxHp}`;
    this.root.querySelector("#enemy-info-hp-bar").style.width =
      `${(a.hp / a.maxHp) * 100}%`;
    const mana =
      Number.isFinite(a.maxMana) && a.maxMana > 0 && Number.isFinite(a.mana);
    this.root.querySelector("#enemy-info-mana-row").hidden = !mana;
    if (mana) {
      this.root.querySelector("#enemy-info-mana").textContent =
        `MP ${Math.floor(a.mana)} / ${a.maxMana}`;
      this.root.querySelector("#enemy-info-mana-bar").style.width =
        `${(a.mana / a.maxMana) * 100}%`;
    }
  }
}
