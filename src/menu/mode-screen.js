import { imageIcon } from "./art.js";
export function mountModes(root, onBack, onTraining) {
  const cards = [
    ["classic", "CLASSIC", "A familiar battlefield", "Coming later"],
    ["ranked", "RANKED", "Rise to the challenge", "Coming later"],
    ["brawl", "BRAWL", "Straight into the action", "Coming later"],
    [
      "training",
      "AI TRAINING ROOM",
      "Master movement, aim and abilities",
      "PLAY OFFLINE",
    ],
  ];
  root.innerHTML = `<section class="mode-ui" aria-labelledby="modes-title"><button id="modes-back" class="menu-back" type="button">${imageIcon("back")}<span>Back to lobby</span></button><div class="mode-panel"><p class="menu-kicker">CHOOSE YOUR EXPERIENCE</p><h1 id="modes-title">The arena is calling.</h1><p class="menu-subtitle">Only AI Training Room is playable in this prototype.</p><div class="mode-grid">${cards.map(([id, name, description, status]) => `<button id="mode-${id}" class="mode-card ${id === "training" ? "available" : "unavailable"}" type="button" ${id === "training" ? "" : 'disabled data-placeholder="' + id + '"'}>${imageIcon(id, "mode-art")}<span class="mode-card-copy"><strong>${name}</strong><span>${description}</span><small>${status}</small></span></button>`).join("")}</div></div><div class="mode-character-label"><span class="menu-kicker">YOUR TRAINING PARTNER</span><strong>Layla</strong><span>Existing 3D character</span></div></section>`;
  root.querySelector("#modes-back").addEventListener("click", onBack);
  root.querySelector("#mode-training").addEventListener("click", onTraining);
}
