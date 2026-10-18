const routes = {
  create: ["lobby"],
  lobby: ["modes", "shop", "settings"],
  shop: ["lobby", "hero"],
  hero: ["shop"],
  settings: ["lobby"],
  modes: ["lobby", "training"],
  training: [],
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
