import {getHeroPortrait} from "../ui/portraits.js";
import {heroSkillArt} from "../heroes/art.js";
import {abilityDescription} from "./hero-presentation.js";
import { getSpell } from "../spells/catalog.js";
import { COMBAT_ART } from "../ui/combat-art.js";
import { imageIcon } from "./art.js";
import { rosterFor } from "./match-flow.js";
const back = (id, label = "Back") =>
  `<button type="button" id="${id}" class="flow-back">${imageIcon("back")} ${label}</button>`;
const safe = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
export function mountAiModes(root, onBack, onChoose) {
  const cards = [
    [
      "practice",
      "PRACTICE",
      "Target dummies · no competitive result",
      "recall",
    ],
    ["vs-ai", "VS A.I.", "One lane · local computer teams", "bot"],
    ["custom", "CUSTOM", "Configure an offline room", "skill-2"],
    [
      "ai-training",
      "AI TRAINING",
      "One lane + testing tools",
      "skill-ultimate",
    ],
  ];
  root.innerHTML = `<section class="flow-screen">${back("ai-modes-back")}<p class="menu-kicker">LOCAL PLAY · NO NETWORK REQUIRED</p><h1>VS A.I. Mode</h1><p>Choose a scenario. Practice stays separate from the lane battlefield.</p><div class="ai-mode-grid">${cards.map(([id, name, desc, icon]) => `<button type="button" id="ai-mode-${id}" class="ai-mode-card"><img src="${COMBAT_ART[icon]}" alt=""><strong>${name}</strong><small>${desc}</small></button>`).join("")}</div></section>`;
  root.querySelector("#ai-modes-back").onclick = onBack;
  for (const [id] of cards)
    root.querySelector("#ai-mode-" + id).onclick = () => onChoose(id);
}
export function mountRoom(root, flow, profile, { onBack, onStart }) {
  const practice = flow.mode === "practice",
    roster = flow.roster(profile),
    slots = (team, blue) => {
      const members = roster[team],
        limit = practice ? members.length : 5;
      return `<div class="room-team ${blue ? "blue-team" : "red-team"}">${Array.from(
        { length: limit },
        (_, index) => {
          const a = members[index],
            human = a?.kind === "PLAYER";
          return `<article class="room-slot ${a ? "occupied" : "vacant"}"><button type="button" class="room-avatar" ${a ? "disabled" : `data-add="${team}"`} aria-label="${a ? a.name : `Add ${blue ? "ally" : "enemy"} Computer`}">${a ? `<img src="${COMBAT_ART[human ? "layla" : "bot"]}" alt="${human ? "Player" : "Computer"}">` : "<span>?</span><small>＋ COMPUTER</small>"}</button>${a ? `<strong>${safe(a.name)}</strong><small>${a.kind}</small>${!human && !practice ? `<button type="button" class="remove-computer" data-remove="${team}" aria-label="Remove ${safe(a.name)}">×</button>` : ""}` : ""}</article>`;
        },
      ).join("")}</div>`;
    };
  root.innerHTML = `<section class="flow-screen room-screen roster-room">${back("room-back")}<header class="room-heading"><h1>${practice ? "PRACTICE" : flow.mode === "brawl" ? "CUSTOM–BRAWL" : flow.mode.toUpperCase().replace("-", " ")} <span>LOCAL ROOM</span></h1><label>AI <select id="room-difficulty" ${practice ? "disabled" : ""}>${["easy", "normal", "hard"].map((d) => `<option value="${d}" ${flow.difficulty === d ? "selected" : ""}>${d.toUpperCase()}</option>`).join("")}</select></label>${flow.mode === "custom" ? `<label>Preset <select id="room-team-size">${[1, 3, 5].map((n) => `<option ${flow.teamSize === n ? "selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}</header><p class="room-local-note">OFFLINE · NO ACCOUNT REWARDS · ${practice ? "Stationary dummy practice" : "Add Computers to either team"}</p><div class="room-roster">${slots("player", true)}<strong class="room-vs">VS</strong>${slots("enemy", false)}</div><aside class="room-sidebar"><h3>LOCAL COMPUTERS</h3><p>No friends or network services.</p><p id="room-summary">${practice ? "Preserved dummy sandbox" : `${flow.allyCount + 1} vs ${flow.enemyCount} · ${flow.difficulty.toUpperCase()} AI`}</p><p>Available heroes: Layla / Franco (Tank, Roam).<br>Duplicates allowed while fewer than five heroes are available.</p><button type="button" id="room-fill" ${practice ? "hidden" : ""}>Fill both teams</button></aside><footer><button id="room-start" class="flow-primary" type="button" ${!practice && flow.enemyCount === 0 ? "disabled" : ""}>START GAME</button><p role="status">${!practice && flow.enemyCount === 0 ? "Add at least one enemy Computer to start." : practice ? "No competitive win condition." : "2 towers + core per team · selection comes next"}</p></footer></section>`;
  const redraw = () => mountRoom(root, flow, profile, { onBack, onStart });
  root.querySelector("#room-back").onclick = onBack;
  root.querySelector("#room-difficulty").onchange = (e) => {
    flow.difficulty = e.target.value;
    redraw();
  };
  root.querySelector("#room-team-size")?.addEventListener("change", (e) => {
    flow.configure(flow.difficulty, Number(e.target.value));
    redraw();
  });
  for (const b of root.querySelectorAll("[data-add]"))
    b.onclick = () => {
      flow.editComputer(b.dataset.add, 1);
      redraw();
    };
  for (const b of root.querySelectorAll("[data-remove]"))
    b.onclick = () => {
      flow.editComputer(b.dataset.remove, -1);
      redraw();
    };
  root.querySelector("#room-fill").onclick = () => {
    flow.allyCount = 4;
    flow.enemyCount = 5;
    redraw();
  };
  root.querySelector("#room-start").onclick = () => {
    if (!practice && flow.enemyCount < 1) return;
    root.querySelector("#room-start").disabled = true;
    onStart();
  };
}
export function mountSelection(root,flow,onBack,onConfirm,profile,onPick=()=>{},registry) {
 const roster=flow.roster(profile),team=roster.player;
 root.innerHTML=`<section class="flow-screen selection-screen team-selection">${back('selection-back','Leave room')}<div class="selection-clock"><small>SELECT YOUR HERO</small><span id="selection-time" aria-live="off">45</span><small>LOCAL · ${flow.difficulty.toUpperCase()}</small></div><aside class="selection-team">${team.map((a,i)=>`<article class="selection-teammate" data-roster-kind="${a.kind}"><span class="selection-member-portrait" ${i?'':'data-human-portrait'}>${i?`<img src="${getHeroPortrait(a.heroId)}" alt="${a.hero}">`:''}</span><div><strong>${safe(a.name)}</strong><span>${i?`${a.hero} · Computer ready`:'Choose your hero'}</span></div><small>${i?'READY':'PICKING'}</small></article>`).join('')}</aside><div id="selection-prompt" class="selection-prompt">Select a hero</div><div class="selection-skills" id="chosen-hero-skills" hidden></div><section id="selection-ability-details" class="selection-ability-details" hidden><button type="button" id="selection-ability-close" aria-label="Close ability details">×</button><h3></h3><p></p></section><aside class="hero-pick-grid"><h2>Hero</h2><p>Owned heroes only · unlock more in Shop</p>${flow.selectableHeroes().map(id=>`<button type="button" id="pick-${id}" data-pick-hero="${id}" aria-pressed="false"><img src="${getHeroPortrait(id)}" alt="${id} portrait"><strong>${id[0].toUpperCase()+id.slice(1)}</strong><small>${id==='franco'?'TANK · ROAM':'MARKSMAN'} · ${flow.ownedHeroes.includes(id)?'OWNED':'LOCKED'}</small></button>`).join('')}<button type="button" id="selection-clear" disabled>Clear selection</button><p id="selection-lock-reason" role="status" hidden></p><button type="button" id="hero-confirm" class="flow-primary" disabled>CONFIRM</button></aside></section>`;
 let finished=false;
 const renderSelection=()=>{
  const id=flow.heroId,selected=Boolean(id),owned=flow.ownedHeroes.includes(id),hero=selected?registry?.get(id):null;
  root.querySelector('[data-human-portrait]').innerHTML=selected?`<img src="${getHeroPortrait(id)}" alt="${id} selected portrait">`:'';
  root.querySelector('#selection-prompt').hidden=selected;
  root.querySelector('#selection-prompt').textContent=selected&&!owned?'Locked hero preview · unlock in Shop to play':'Select a hero';
  const skills=root.querySelector('#chosen-hero-skills');skills.hidden=!selected;skills.replaceChildren();
  if(hero)for(const a of hero.abilities){const b=document.createElement('button');b.type='button';b.dataset.selectionAbility=a.id;b.innerHTML=`<img src="${heroSkillArt(id,a.slot)}" alt=""><span>${a.name}</span>`;b.onclick=()=>{const detail=root.querySelector('#selection-ability-details');detail.hidden=false;detail.querySelector('h3').textContent=a.name;detail.querySelector('p').textContent=abilityDescription(a);};skills.append(b);}
  root.querySelector('#selection-ability-details').hidden=true;
  for(const b of root.querySelectorAll('[data-pick-hero]'))b.setAttribute('aria-pressed',String(b.dataset.pickHero===id));
  root.querySelector('#hero-confirm').disabled=!selected||!owned;
  root.querySelector('#hero-confirm').textContent=selected&&!owned?'LOCKED · UNLOCK IN SHOP':'CONFIRM';
  const reason=root.querySelector('#selection-lock-reason');reason.hidden=!selected||owned;reason.textContent=selected&&!owned?'Franco is not owned. Unlock in Shop: 32,000 Coins OR 749 Diamonds.':'';
  root.querySelector('#selection-clear').disabled=!selected;
  root.querySelector('.selection-teammate span:not(.selection-member-portrait)').textContent=selected?`${hero?.name||id} · ${owned?'selected':'locked preview'}`:'Choose your hero';
 };
 const pick=id=>{flow.selectHero(id);renderSelection();onPick(id);};renderSelection();
 const finish=()=>{if(finished||!flow.heroId||!flow.ownedHeroes.includes(flow.heroId))return;finished=true;clearInterval(timer);root.querySelector('#hero-confirm').disabled=true;onConfirm();};
 root.querySelector('#selection-back').onclick=onBack;
 for(const b of root.querySelectorAll('[data-pick-hero]'))b.onclick=()=>pick(b.dataset.pickHero);
 root.querySelector('#selection-clear').onclick=()=>pick(null);
 root.querySelector('#hero-confirm').onclick=finish;
 root.querySelector('#selection-ability-close').onclick=()=>root.querySelector('#selection-ability-details').hidden=true;
 const update=()=>{if(flow.selectionPausedAt)return;const seconds=Math.max(0,Math.ceil((flow.selectionEndsAt-Date.now())/1000)),el=root.querySelector('#selection-time');if(!el)return;el.textContent=seconds;if(seconds===0&&!finished){if(flow.heroId&&flow.ownedHeroes.includes(flow.heroId))finish();else root.querySelector('#selection-prompt').textContent='Select an owned hero to continue';}};
 const timer=setInterval(update,250);update();return()=>clearInterval(timer);
}
export function mountLoading(root, flow, profile) {
  const roster = flow.confirmedRoster || flow.roster(profile),
    cards = (team, blue) =>
      `<div class="loading-team ${blue ? "blue-team" : "red-team"}">${team.map((a) => `<article class="loading-hero"><img src="${a.kind === "STATIONARY" ? COMBAT_ART.bot : getHeroPortrait(a.heroId)}" alt="${a.hero}"><div><strong>${a.hero}</strong><span>${safe(a.name)}</span><small>${a.kind === "PLAYER" ? "LOCAL PLAYER" : a.kind === "STATIONARY" ? "DUMMY PRACTICE" : "COMPUTER"}</small></div></article>`).join("")}</div>`;
  root.innerHTML = `<section class="flow-screen loading-screen roster-loading"><p class="menu-kicker">${flow.mode.toUpperCase()} · PREPARING LOCALLY · ${flow.mode === "practice" ? "DUMMY PRACTICE · SPELLS INACTIVE" : getSpell(flow.config?.spellId || "execute").name}</p>${cards(roster.player, true)}<div class="loading-middle"><strong>VS</strong><p class="loading-tip">TIP · Stay behind allied minions when approaching a tower.</p></div>${cards(roster.enemy, false)}<div class="lineup-view-time"><span id="lineup-view-status" role="status"></span><progress id="lineup-view-progress" value="0" max="10000" aria-label="Minimum lineup viewing time"></progress></div><progress id="local-load-progress" value="0" max="7" aria-label="Completed local setup tasks"></progress><p id="local-load-stage" role="status">Validating actual picks and roster…</p><small>Progress represents local preparation, not internet speed or separate player downloads.</small></section>`;
}
export function mountResults(root, result, { onReplay, onRoom, onMenu }) {
  root.innerHTML = `<section class="flow-screen results-screen"><p class="menu-kicker">LOCAL MATCH COMPLETE · ${result.accountXpEarned ? `ACCOUNT XP +${result.accountXpEarned} · LV ${result.accountLevel}` : "NO ACCOUNT CURRENCY REWARDS"}</p><h1>${result.outcome}</h1><p>Core destruction decided this result.</p><dl>${Object.entries(
    {
      Duration: `${Math.floor(result.duration / 60)}:${String(Math.floor(result.duration % 60)).padStart(2, "0")}`,
      Eliminations: result.eliminations,
      Deaths: result.deaths,
      Assists: result.assists,
      "Hero level": result.level,
      "Match gold earned": result.goldEarned,
      "Enemy structures destroyed": result.structures,
    },
  )
    .map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`)
    .join(
      "",
    )}</dl><button type="button" id="results-replay" class="flow-primary">PLAY AGAIN</button><button type="button" id="results-room">Return to Training Lobby</button><button type="button" id="results-menu">Main Menu</button></section>`;
  root.querySelector("#results-replay").onclick = onReplay;
  root.querySelector("#results-room").onclick = onRoom;
  root.querySelector("#results-menu").onclick = onMenu;
}
