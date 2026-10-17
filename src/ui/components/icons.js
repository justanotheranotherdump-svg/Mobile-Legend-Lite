// Original local vector symbols. No extracted artwork, font or remote asset.
const paths = {
  map: '<path d="m3 5 6-2 6 3 6-2v15l-6 2-6-3-6 2Z M9 3v15 M15 6v15"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6Z"/>',
  shop: '<path d="M4 9h16l-2-5H6Z M5 10v10h14V10 M9 20v-7h6v7"/>',
  settings:
    '<path d="m10 3-1 3-3 1-3 3 2 3-1 3 3 2 3-1 3 2 3-2 1-3 3-2-1-4-3-1-2-3Z"/><circle cx="12" cy="12" r="3"/>',
  coin: '<path d="m12 2 9 5v10l-9 5-9-5V7Z M15 8h-4a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4H9 M12 6v12"/>',
  sword:
    '<path d="m7 16 2-6L20 2l-2 11-6 4 M5 13l7 7 M8 17l-5 5 M3 19l2 3 M10 14l8-9"/>',
  strike:
    '<g stroke="none"><path d="m12 1 6 6-4 5v8l-4 3V12L6 7Z" fill="currentColor"/><path d="m2 6 7 5v6L2 11Z M22 6l-7 5v6l7-6Z" fill="#78c9ed"/><path d="m12 1 2 8-2 3-2-3Z" fill="#e7fcff"/><path d="m10 14 4-2v2l-4 2Z" fill="#286b9d"/></g>',
  "minion-crest":
    '<g stroke="none"><path d="m4 9 4-6 4 2 4-2 4 6v8l-8 6-8-6Z" fill="#b7c6c9"/><path d="m5 10 7-4 7 4-2 9-5 3-5-3Z" fill="#4c7086"/><path d="m5 11 7 2 7-2-2 5-5 2-5-2Z" fill="#132b42"/><path d="m7 12 3 1v2l-3-1Z M17 12l-3 1v2l3-1Z" fill="#bfe8ec"/><path d="m12 6 2 3-2 2-2-2Z" fill="#e4c590"/></g>',
  "tower-crest":
    '<g stroke="none"><path d="M4 2h4v4h2V2h4v4h2V2h4v8l-3 2v7l3 2v2H4v-2l3-2v-7l-3-2Z" fill="#b7c6c9"/><path d="M8 10h8v10H8Z" fill="#50778a"/><path d="m12 8 3 3-3 3-3-3Z" fill="#e4c590"/><path d="M11 16h2v5h-2Z" fill="#152d43"/><path d="M6 8h12v2H6Z" fill="#d5e9e6"/></g>',
  arc: '<path d="M3 18C4 7 10 3 21 3 17 8 13 14 3 18Z M3 18l13-9 M9 21l3-4"/>',
  spark: '<path d="m14 2-9 12h6l-1 8 9-13h-6Z M3 4l2 2 M20 18l2 2"/>',
  shield:
    '<path d="m12 2 8 4v7c-1 4-4 7-8 9-4-2-7-5-8-9V6Z M12 6v12 M7 10h10"/>',
  ultimate: '<path d="m12 2 3 6 7 4-7 4-3 6-3-6-7-4 7-4Z M12 7l3 5-3 5-3-5Z"/>',
  recall:
    '<ellipse cx="12" cy="18" rx="9" ry="3"/><path d="M7 15V6 M17 15V6 M12 16V2 M9 5l3-3 3 3"/>',
  regen:
    '<path d="M12 21C2 18 2 8 5 3c7 0 14 4 14 10 0 4-3 7-7 8Z M7 7l7 10 M11 12l5-2 M11 12l-4 2"/>',
  spell: '<path d="m14 2-2 7h7l-9 13 2-9H5Z"/>',
  minion:
    '<path d="m5 10 3-6 4 2 4-2 3 6v6l-7 5-7-5Z M5 11h14 M9 15h1 M14 15h1"/>',
  tower:
    '<path d="M4 3v6h3v10H5v2h14v-2h-2V9h3V3h-4v3h-2V3h-4v3H8V3Z M11 13h2v6h-2Z"/>',
  bag: '<path d="M4 8h16l-1 13H5Z M8 8V6a4 4 0 0 1 8 0v2 M8 13h8"/>',
  plus: '<path d="M12 5v14 M5 12h14"/>',
  close: '<path d="m6 6 12 12 M18 6 6 18"/>',
  reset: '<path d="M4 10a8 8 0 1 1 1 8 M4 3v7h7"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  lock: '<rect x="6" y="10" width="12" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3 M12 14v3"/>',
};
export function icon(name, extra = "") {
  if (!Object.hasOwn(paths, name))
    throw new Error(`Unknown local icon: ${name}`);
  return `<svg class="icon ${extra}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
}
