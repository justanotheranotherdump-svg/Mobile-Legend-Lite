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
  const roster = rosterFor(
    { mode: flow.mode, teamSize: flow.teamSize },
    profile,
  );
  const slots = (team, blue) =>
    `<div class="room-team ${blue ? "blue-team" : "red-team"}">${team.map((a) => `<article class="room-slot"><img src="${COMBAT_ART[a.kind === "PLAYER" ? "layla" : "bot"]}" alt=""><div><small>${a.kind}</small><strong>${safe(a.name)}</strong><span>${a.hero}</span></div></article>`).join("")}</div>`;
  root.innerHTML = `<section class="flow-screen room-screen">${back("room-back")}<p class="menu-kicker">OFFLINE LOCAL ROOM · NO FRIENDS / NETWORK SERVICES</p><h1>${flow.mode === "practice" ? "DUMMY PRACTICE" : flow.mode.toUpperCase().replace("-", " ")} ROOM</h1><div class="room-config"><label>${flow.mode === "practice" ? "Difficulty · not used for dummies" : "AI Difficulty"}<select id="room-difficulty" ${flow.mode === "practice" ? "disabled" : ""}>${["easy", "normal", "hard"].map((d) => `<option value="${d}" ${d === flow.difficulty ? "selected" : ""}>${d.toUpperCase()}</option>`).join("")}</select></label>${flow.mode === "custom" ? `<label>Units per team<select id="room-team-size">${[1, 3, 5].map((n) => `<option ${n === flow.teamSize ? "selected" : ""}>${n}</option>`).join("")}</select></label>` : ""}<p id="room-summary">${flow.mode === "practice" ? "Existing dummy sandbox · level 1 · resets / stats · no win condition" : `${flow.teamSize}v${flow.teamSize} · Crystal Causeway · 2 towers + core per team · ${flow.difficulty.toUpperCase()} decisions`}</p></div><div class="room-roster">${slots(roster.player, true)}<strong class="room-vs">VS</strong>${slots(roster.enemy, false)}</div><footer><p>Training Bots use temporary original geometry. Only Layla is a playable pick.</p><button id="room-start" class="flow-primary" type="button">START GAME</button></footer></section>`;
  root.querySelector("#room-back").onclick = onBack;
  root.querySelector("#room-difficulty").onchange = (e) => {
    flow.configure(e.target.value, flow.teamSize);
    mountRoom(root, flow, profile, { onBack, onStart });
  };
  root.querySelector("#room-team-size")?.addEventListener("change", (e) => {
    flow.configure(flow.difficulty, Number(e.target.value));
    mountRoom(root, flow, profile, { onBack, onStart });
  });
  root.querySelector("#room-start").onclick = () => {
    root.querySelector("#room-start").disabled = true;
    onStart();
  };
}
export function mountSelection(root, flow, onBack, onConfirm) {
  root.innerHTML = `<section class="flow-screen selection-screen">${back("selection-back", "Leave to room")}<div class="selection-info"><p class="menu-kicker">CONFIRM YOUR PICK</p><h1>Layla</h1><h3>MARKSMAN</h3><p>A ranged gunner. Aim projectiles, exploit distance and time your movement between shots.</p><div class="selection-skills">${["skill-1", "skill-2", "skill-ultimate"].map((id, i) => `<figure><img src="${COMBAT_ART[id]}" alt=""><figcaption>${["Malefic Bomb", "Void Projectile", "Destruction Rush"][i]}</figcaption></figure>`).join("")}</div><small>Approved rigid-part GLB · Walk / Shoot. No new hero assets.</small></div><aside class="hero-pick-grid"><h2>Available hero</h2><button type="button" id="pick-layla" aria-pressed="false"><img src="${COMBAT_ART.layla}" alt="Layla portrait"><strong>Layla</strong><small>OWNED · MARKSMAN</small></button>${Array.from({ length: 3 }, () => '<button type="button" disabled class="upcoming-pick">UPCOMING<br><small>Not playable</small></button>').join("")}<button type="button" id="hero-confirm" class="flow-primary" disabled>OK / CONFIRM</button></aside></section>`;
  root.querySelector("#selection-back").onclick = onBack;
  root.querySelector("#pick-layla").onclick = () => {
    flow.selectHero("layla");
    root.querySelector("#pick-layla").setAttribute("aria-pressed", "true");
    root.querySelector("#hero-confirm").disabled = false;
  };
  root.querySelector("#hero-confirm").onclick = () => {
    root.querySelector("#hero-confirm").disabled = true;
    onConfirm();
  };
}
export function mountLoading(root, flow, profile) {
  root.innerHTML = `<section class="flow-screen loading-screen"><p class="menu-kicker">PREPARING LOCAL ${flow.mode.toUpperCase()} · OFFLINE</p><div class="versus-cards"><article><small>BLUE TEAM · PLAYER</small><img src="${COMBAT_ART.layla}" alt="Layla"><h2>${safe(profile.username)}</h2><p>Layla · Marksman</p></article><strong>VS</strong><article><small>RED TEAM · ${flow.mode === "practice" ? "STATIONARY TARGETS" : "COMPUTER"}</small><img src="${COMBAT_ART.bot}" alt="Original training placeholder"><h2>${flow.mode === "practice" ? "Target Dummies" : "TRAINING BOT"}</h2><p>Original placeholder visual</p></article></div><progress id="local-load-progress" value="0" max="7" aria-label="Completed local setup tasks"></progress><p id="local-load-stage" role="status">Validating local mode and roster…</p><p class="loading-tip">TIP · Layla’s damage increases with distance. Learn skills with the + beside each icon.</p></section>`;
}
export function mountResults(root, result, { onReplay, onRoom, onMenu }) {
  root.innerHTML = `<section class="flow-screen results-screen"><p class="menu-kicker">LOCAL MATCH COMPLETE · NO ACCOUNT REWARDS</p><h1>${result.outcome}</h1><p>Core destruction decided this result.</p><dl>${Object.entries(
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
