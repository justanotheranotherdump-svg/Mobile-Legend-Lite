import {isBootItem} from "../match/catalog.js";
import { getItem } from "../match/recipes.js";
// Six visual positions are editor state; persisted builds retain the compatible
// compact ordered list. Failed edits return the original slots unchanged.
export function placeBuildItem(slots, index, id) {
  const item = getItem(id);
  if (
    !item ||
    item.type !== "standard_purchase" ||
    !Number.isInteger(index) ||
    index < 0 ||
    index > 5
  )
    return { error: "invalid-slot-or-item", slots };
  const next = Array.from({ length: 6 }, (_, n) => slots[n] || null);
  next[index] = id;
  if (next.filter((x) => isBootItem(getItem(x))).length > 1)
    return { error: "one-boots-only", slots };
  return { slots: next };
}
export function moveBuildSlot(slots, from, to) {
  const next = [...slots];
  if (from >= 0 && from < 6 && to >= 0 && to < 6)
    [next[from], next[to]] = [next[to], next[from]];
  return next;
}
