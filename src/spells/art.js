import { spells } from "./catalog.js";
const glyphs = [
  "M22 12L11 25h9l-2 11 13-17h-9z",
  "M12 32l20-20m-17 2l17 17M10 28l10 10",
  "M10 30l7-15 6 11 9-14-3 22",
  "M8 20h20m-15 8h22m-17-16h20",
  "M24 9v30M9 24h30",
  "M24 8l14 7-3 17-11 9-11-9-3-17z",
  "M15 9v23l9 7 9-7V9M15 24h18",
  "M24 8l4 11 12 5-12 4-4 12-4-12-12-4 12-5z",
  "M12 37l9-14-1-14 15 14-3 13z",
  "M9 30h28M26 17l11 13-11 10",
  "M11 12l26 26M11 38l26-26M13 12h22v25H13z",
  "M12 36h24L24 9zM18 36V23h12v13",
];
export const SPELL_ART = Object.fromEntries(
  spells.map((s, n) => [
    s.id,
    "data:image/svg+xml," +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs><radialGradient id="g"><stop stop-color="${s.color}"/><stop offset="1" stop-color="#112334"/></radialGradient></defs><circle cx="24" cy="24" r="22" fill="url(#g)" stroke="#b19b62" stroke-width="1.3"/><path d="${glyphs[n]}" fill="none" stroke="#fff0cc" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/><circle cx="24" cy="24" r="19" stroke="${s.color}" fill="none" opacity=".6"/></svg>`,
      ),
  ]),
);
