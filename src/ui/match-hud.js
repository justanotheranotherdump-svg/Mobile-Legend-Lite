import { MatchShop } from "./match-shop.js";
import "./styles/match.css";
export class MatchHud {
  constructor(simulation, { onPause, onQuit }) {
    this.simulation = simulation;
    this.shop = new MatchShop(simulation);
    this.root = document.createElement("section");
    this.root.id = "match-live";
    this.root.innerHTML =
      '<div class="live-objectives" id="objective-status"></div><div class="live-record"><span id="match-record"></span><button id="match-pause" type="button">Pause / Quit</button></div><div id="match-countdown" role="status"></div><p id="match-feed" role="status"></p><div id="match-pause-panel" hidden><section><h2>Match paused</h2><p>Quit this local match? No account currency or rank is awarded.</p><button id="match-resume" type="button">Resume</button><button id="match-quit-room" type="button">Leave to room</button><button id="match-quit-menu" type="button">Main Menu</button></section></div>';
    document.querySelector("#hud-root").append(this.root);
    const paused = this.root.querySelector("#match-pause-panel");
    this.root.querySelector("#match-pause").addEventListener("click", () => {
      onPause(true);
      paused.hidden = false;
    });
    this.root.querySelector("#match-resume").addEventListener("click", () => {
      paused.hidden = true;
      onPause(false);
    });
    this.root
      .querySelector("#match-quit-room")
      .addEventListener("click", () => onQuit("room"));
    this.root
      .querySelector("#match-quit-menu")
      .addEventListener("click", () => onQuit("lobby"));
    document.querySelector(".match-kind").textContent =
      simulation.matchConfig.mode.toUpperCase();
    document.querySelector("#shop small").textContent = "MATCH GOLD";
    document.querySelector(".gold").dataset.controlKind = "functional";
    document.querySelector("#shop").dataset.controlKind = "functional";
    document
      .querySelector("#shop-dialog")
      .setAttribute("aria-label", "Match equipment shop");
    document.querySelector("#shop-dialog").removeAttribute("aria-labelledby");
    document.querySelector(".gold").title =
      "Current match gold — separate from account wallet";
    if (!simulation.matchConfig.tools) {
      document.querySelector("#reset").disabled = true;
      for (const el of document.querySelectorAll(
        ".practice-body label,.practice-body button,.practice-actions",
      ))
        el.hidden = true;
      document.querySelector("#practice-result").textContent =
        "Live attributes. XP and gold come only from configured combat rewards.";
    }
    document.querySelector(".practice-body>p").textContent =
      "Session-only attributes and equipment. No account wallet or ranked rewards.";
    document.querySelector(".map-legend").innerHTML =
      "<i></i> BLUE <i></i> RED <span>CAUSEWAY</span>";
    document.querySelector(".reserved-caption").textContent =
      "EQUIPMENT · RECALL / REGEN LIVE · SPELL RESERVED";
    this.unsubscribe = simulation.events.subscribe((e) => {
      const messages = {
        "objective-destroyed": `${e.team === "enemy" ? "Enemy" : "Allied"} ${e.kind} destroyed`,
        "gold-gained": `+${e.amount} match gold`,
        "xp-gained": `+${e.amount} XP`,
        respawn: e.id === "player" ? "You have respawned" : null,
        "item-purchased": "Equipment purchased",
      };
      if (messages[e.type]) {
        this.root.querySelector("#match-feed").textContent = messages[e.type];
        this.feedUntil = simulation.time + 2.5;
      }
    });
  }
  update() {
    const s = this.simulation;
    const scores = document.querySelectorAll(".team-score");
    scores[0].textContent = s.score.player;
    scores[1].textContent = s.score.enemy;
    for (const score of scores) {
      score.dataset.controlKind = "functional";
      score.title = "Actual hero eliminations";
      score.setAttribute(
        "aria-label",
        `${score === scores[0] ? "Allied" : "Enemy"} hero eliminations: ${score.textContent}`,
      );
    }
    document.querySelector(".gold>span").innerHTML =
      `${s.gold}<small>MATCH GOLD</small>`;
    this.root.querySelector("#match-record").textContent =
      `Lv ${s.progression.level} · XP ${s.progression.snapshot().xp} · ${s.stats.eliminations}/${s.stats.deaths}/${s.stats.assists} K/D/A`;
    this.root.querySelector("#objective-status").textContent = s.structures
      .map(
        (o) =>
          `${o.team === "player" ? "B" : "R"} ${o.kind === "core" ? "CORE" : o.order === 0 ? "OUTER" : "INNER"} ${o.hp > 0 ? (o.protected ? "🔒 " : "") + Math.ceil(o.hp) : "DOWN"}`,
      )
      .join("  ·  ");
    const countdown = this.root.querySelector("#match-countdown");
    countdown.textContent =
      s.phase === "countdown"
        ? String(Math.ceil(s.countdown))
        : s.time < 0.7
          ? "GO"
          : s.player.hp <= 0
            ? `Respawn ${Math.max(0, Math.ceil(s.player.respawnAt - s.time))}s`
            : "";
    countdown.hidden = !countdown.textContent;
    if (s.time > this.feedUntil)
      this.root.querySelector("#match-feed").textContent = "";
    this.shop.sync();
  }
  dispose() {
    this.unsubscribe();
    this.root.remove();
  }
}
