import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

const root = resolve('dist');
async function asset(path) {
  const fullPath = resolve(root, path.replace(/^\.\//, ''));
  if (!fullPath.startsWith(root + sep)) throw new Error(`Unsafe output path: ${path}`);
  return readFile(fullPath, 'utf8');
}
let html = await readFile('dist/dev.html', 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*><\/script>/g)];
if (scripts.length !== 1) throw new Error('Expected exactly one bundled entry script');
for (const match of scripts) {
  const js = (await asset(match[1])).replace(/<\/script/gi, '<\\/script');
  html = html.replace(match[0], () => `<script type="module">${js}</script>`);
}
const styles = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
if (!styles.length) throw new Error('Expected bundled CSS');
for (const match of styles) {
  const css = (await asset(match[1])).replace(/<\/style/gi, '<\\/style');
  html = html.replace(match[0], () => `<style>${css}</style>`);
}
html = html.replace('</head>', '<meta name="moba-build" content="standalone-offline" />\n</head>');
const notices = await readFile('THIRD_PARTY_NOTICES.md', 'utf8');
html = html.replace('</head>', () => `<!--\n${notices}\n-->\n</head>`);
// Intentionally version the root standalone entry: GitHub ZIP downloads must
// be playable by double-clicking index.html, without asking players to build.
await writeFile('index.html', html);
await writeFile('dist/index.html', html);
await rm('dist/dev.html');
await rm('dist/assets', { recursive: true, force: true });
await mkdir('deliverables', { recursive: true });
await writeFile('deliverables/MOBA-Lab-Phase-1.html', html);
console.log(`Standalone HTML generated: ${(Buffer.byteLength(html) / 1024).toFixed(0)} KiB`);
await import('./check-offline.mjs');
