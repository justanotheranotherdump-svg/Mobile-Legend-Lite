const routes = {
  create: ["lobby"],
  lobby: ["modes", "shop", "settings"],
  shop: ["lobby", "hero"],
  hero: ["shop"],
  settings: ["lobby"],
  modes: ["lobby", "ai-modes", "room"],
  "ai-modes": ["modes","room"],
  room: ["ai-modes","modes","lobby","selection"],
  selection: ["room","loading"],
  loading: ["training","room"],
  training: ["results","room","lobby"],
  results: ["selection","room","lobby"],
};
export class MenuNavigation {
  constructor(hasProfile = false) {
    this.screen = hasProfile ? "lobby" : "create";
  }
  go(next) {
    if (!routes[this.screen].includes(next)) return false;
    this.screen = next;
    return true;
  }
}
