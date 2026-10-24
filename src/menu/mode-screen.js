import {heroArt} from "../heroes/art.js";
import { imageIcon } from "./art.js";
export function mountModes(root, onBack, onTraining, onBrawl) {
  const cards = [
    ["classic", "CLASSIC", "A familiar battlefield", "Coming later"],
    ["ranked", "RANKED", "Rise to the challenge", "Coming later"],
    ["brawl", "BRAWL", "One lane · local computer teams", "PLAY OFFLINE"],
    [
      "training",
      "AI TRAINING ROOM",
      "Master movement, aim and abilities",
      "PLAY OFFLINE",
    ],
  ];
  root.innerHTML = `<section class="mode-ui" aria-labelledby="modes-title"><img class="mode-illustration" src="${heroArt("layla","character")}" alt="Layla 2D illustration" draggable="false"><button id="modes-back" class="menu-back" type="button">${imageIcon("back")}<span>Back to lobby</span></button><div class="mode-panel"><p class="menu-kicker">CHOOSE YOUR EXPERIENCE</p><h1 id="modes-title">The arena is calling.</h1><p class="menu-subtitle">AI Training Room and Brawl are playable offline. Classic and Ranked are not implemented.</p><div class="mode-grid">${cards.map(([id, name, description, status]) => `<button id="mode-${id}" class="mode-card ${["training","brawl"].includes(id) ? "available" : "unavailable"}" type="button" ${["training","brawl"].includes(id) ? "" : 'disabled data-placeholder="' + id + '"'}>${imageIcon(id, "mode-art")}<span class="mode-card-copy"><strong>${name}</strong><span>${description}</span><small>${status}</small></span></button>`).join("")}</div></div><div class="mode-character-label"><span class="menu-kicker">YOUR TRAINING PARTNER</span><strong>Layla</strong><span>Illustrated training partner</span></div></section>`;
  root.querySelector("#modes-back").addEventListener("click", onBack);
  root.querySelector("#mode-training").addEventListener("click", onTraining);
  root.querySelector("#mode-brawl").addEventListener("click", onBrawl);
}
