import creationArtwork from "../assets/images/layla-creation.png?inline";
import lobbyBackground from "./assets/lobby-citadel-optimized.png?inline";
export const LOBBY_BACKGROUND = lobbyBackground;
const icons = import.meta.glob("./assets/icons/*.png", {
  eager: true,
  query: "?inline",
  import: "default",
});
const flags = import.meta.glob("./assets/flags/*.png", {
  eager: true,
  query: "?inline",
  import: "default",
});
export const CREATION_ARTWORK = creationArtwork;
export const menuIcon = (name) => icons[`./assets/icons/${name}.png`];
export const flagIcon = (code) => flags[`./assets/flags/${code}.png`];
export const imageIcon = (name, cls = "") =>
  `<img class="menu-icon ${cls}" src="${menuIcon(name)}" alt="" draggable="false">`;
export const flagImage = (code) =>
  `<img class="country-flag" src="${flagIcon(code)}" alt="${code}" draggable="false">`;
