import { getCatalogItem } from "../match/catalog.js";
export function validateRoleSetup(raw) {
  const i = getCatalogItem(raw?.blessingId);
  return i &&
    ((raw.kind === "jungle" && i.type === "jungle_blessing") ||
      (raw.kind === "roam" && i.type === "roaming_blessing"))
    ? { kind: raw.kind, blessingId: i.id }
    : { kind: "none", blessingId: null };
}
