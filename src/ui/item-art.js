const art = import.meta.glob("./assets/items/*.png", {
  eager: true,
  query: "?inline",
  import: "default",
});
export const ITEM_ART = Object.fromEntries(
  Object.entries(art).map(([path, url]) => [
    path.split("/").at(-1).slice(0, -4),
    url,
  ]),
);
