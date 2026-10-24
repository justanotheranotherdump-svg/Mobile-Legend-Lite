// Original vector illustration: a beveled eight-sided guard, not extracted art.
// Kept inline for crisp scaling and a truly self-contained file:// deliverable.
export function attackFrame() {
  return `<svg class="attack-frame" viewBox="0 0 140 140" aria-hidden="true">
    <defs>
      <linearGradient id="strike-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f8e6b6"/><stop offset=".27" stop-color="#8b8975"/><stop offset=".52" stop-color="#d9bc7e"/><stop offset="1" stop-color="#4b555d"/></linearGradient>
      <radialGradient id="strike-core" cx=".38" cy=".22" r=".9"><stop stop-color="#3b7895"/><stop offset=".48" stop-color="#173c62"/><stop offset="1" stop-color="#0a172e"/></radialGradient>
    </defs>
    <path class="attack-rim" d="M42 3 103 10 137 47 130 104 96 137 36 130 3 96 10 36Z" fill="#081722" stroke="url(#strike-metal)" stroke-width="4"/>
    <path d="M44 11 99 17 129 50 123 100 93 129 40 123 11 93 17 40Z" fill="url(#strike-core)" stroke="#7398b1" stroke-width="1.2"/>
    <path d="m18 42 28-27 51 6 M124 54l-5 44-25 25" fill="none" stroke="#b2d6e5" stroke-opacity=".45" stroke-width="2"/>
    <path d="m13 73 12-20 5 36Z M126 71l-12 22-5-36Z" fill="#4b7997" fill-opacity=".4"/>
    <path d="m43 16 10 15 42-8 M39 122l10-14 43 17" fill="none" stroke="#0a1c35" stroke-width="4"/>
  </svg>`;
}
