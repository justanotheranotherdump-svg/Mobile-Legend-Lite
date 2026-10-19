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
  if (next.filter((x) => x === id).length > item.maxCopies)
    return { error: "duplicate-item", slots };
  if (next.filter((x) => getItem(x)?.category === "Movement").length > 1)
    return { error: "one-boots-only", slots };
  if (
    next.filter((id) =>
      getItem(id)?.effects?.some((e) => ["wind-chant", "frozen"].includes(e)),
    ).length > 1
  )
    return { error: "one-active-item-only", slots };
  return { slots: next };
}
export function moveBuildSlot(slots, from, to) {
  const next = [...slots];
  if (from >= 0 && from < 6 && to >= 0 && to < 6)
    [next[from], next[to]] = [next[to], next[from]];
  return next;
}
