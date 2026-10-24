import baseData from "../data/match/recipes.json" with { type: "json" };
import extra from "../data/match/extra-items.json" with {type:"json"};
const data={...baseData,items:{...baseData.items,...extra.recipes}};
import {equipment,isBootItem} from "./catalog.js";
export {isBootItem};
export { data as recipeData };
export const items = equipment.items;
export const getItem = (id) => items.find((i) => i.id === id);
export function validateRecipes() {
  const walk = (id, ancestors = []) => {
    const i = getItem(id),
      r = data.items[id];
    if (!i || !r) throw Error("Missing recipe/item: " + id);
    if (ancestors.includes(id)) throw Error("Recipe cycle: " + id);
    if (
      !["component", "intermediate", "completed"].includes(r.tier) ||
      !Array.isArray(r.components)
    )
      throw Error("Invalid recipe " + id);
    let cost = 0;
    for (const c of r.components) {
      walk(c, [...ancestors, id]);
      cost += getItem(c).cost;
    }
    if (cost > i.cost) throw Error("Negative combination fee: " + id);
  };
  for (const i of items) walk(i.id);
  return true;
}
validateRecipes();
export function recipeQuote(id, inventory) {
  if (!getItem(id)) return { error: "unknown-item" };
  const used = new Set();
  const tree = (key, path, root = false) => {
    const item = getItem(key),
      slot = root
        ? -1
        : inventory.findIndex((v, n) => v === key && !used.has(n));
    if (slot >= 0) used.add(slot);
    const node = {
      id: key,
      path,
      total: item.cost,
      ownedSlot: slot,
      children: [],
    };
    if (slot < 0)
      node.children = data.items[key].components.map((c, n) =>
        tree(c, `${path}.${n}`),
      );
    node.credit =
      slot >= 0 ? item.cost : node.children.reduce((n, c) => n + c.credit, 0);
    return node;
  };
  const node = tree(id, "0", true);
  return {
    id,
    tree: node,
    consumed: [...used].sort((a, b) => a - b),
    credit: node.credit,
    total: getItem(id).cost,
    remaining: getItem(id).cost - node.credit,
  };
}
export function purchaseQuote(gold, inventory, id) {
  if (
    !Number.isSafeInteger(gold) ||
    gold < 0 ||
    !Array.isArray(inventory) ||
    inventory.length !== 6
  )
    return { error: "invalid-purchase-state" };
  if(getItem(id)?.type==='consumable')return {error:'use-consumable-purchase'};
  const q = recipeQuote(id, inventory);
  if (q.error) return q;
  const item = getItem(id),
    next = [...inventory];
  for (const slot of q.consumed) next[slot] = null;
  if (
    isBootItem(item) &&
    next.some((k) => isBootItem(getItem(k)))
  )
    return { ...q, error: "one-boots-only" };
  const slot = next.findIndex((x) => !x);
  if (slot < 0) return { ...q, error: "equipment-full" };
  if (gold < q.remaining) return { ...q, error: "insufficient-gold" };
  next[slot] = id;
  return { ...q, gold: gold - q.remaining, inventory: next };
}
export function priorityStep(gold, inventory, id) {
  const item = getItem(id);
  if (!item) return { error: "no-priority" };
  if (isBootItem(item) && inventory.includes(id)) return { completed: true, id, remaining: 0 };
  const final = purchaseQuote(gold, inventory, id);
  if (!final.error) return { id, remaining: final.remaining, finalId: id };
  const q = recipeQuote(id, inventory),
    missing = [];
  const visit = (n) => {
    if (n.ownedSlot >= 0) return;
    for (const c of n.children) visit(c);
    if (n.id !== id && !inventory.includes(n.id)) missing.push(n.id);
  };
  visit(q.tree);
  const candidate =
    [...missing]
      .sort((a, b) => getItem(b).cost - getItem(a).cost)
      .find((k) => !purchaseQuote(gold, inventory, k).error) ||
    [...missing].sort(
      (a, b) =>
        purchaseQuote(gold, inventory, a).remaining -
        purchaseQuote(gold, inventory, b).remaining,
    )[0] ||
    id;
  const quote = purchaseQuote(gold, inventory, candidate);
  return {
    id: candidate,
    finalId: id,
    remaining: q.remaining,
    nextCost: quote.remaining,
    error: quote.error,
  };
}

// Presentation-only expansion keeps the entire recipe visible beneath owned
// upgrades. Covered descendants are not additional owned credit.
export function recipeDisplayTree(node, covered = false) {
  const children = node.children.length
    ? node.children
    : data.items[node.id].components.map((id) => ({
        id,
        total: getItem(id).cost,
        ownedSlot: -1,
        children: [],
      }));
  return {
    ...node,
    covered,
    children: children.map((n) =>
      recipeDisplayTree(n, covered || node.ownedSlot >= 0),
    ),
  };
}
