import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
const html = await readFile('deliverables/MOBA-Lab-Phase-1.1.html', 'utf8');
// Inspect markup outside script/style bodies; library code may legitimately contain
// unused URL loaders. The browser test checks whether any request actually occurs.
const markup = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');
assert.doesNotMatch(markup, /\b(?:src|href|srcset)\s*=\s*["'](?!data:|#)/i, 'External runtime resource in HTML');
assert.doesNotMatch(html, /<script\b[^>]*\bsrc=/i);
assert.doesNotMatch(html, /<link\b[^>]*rel=["'](?:stylesheet|modulepreload)/i);
const css = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]).join('\n');
assert.ok(!/@import\s|url\(\s*["']?(?!data:|#)/i.test(css), 'External CSS dependency');
assert.deepEqual(await readdir('dist'), ['index.html'], 'dist must contain just one HTML file');
assert.equal(html, await readFile('dist/index.html', 'utf8'));
assert.ok(html === await readFile('index.html', 'utf8'), 'Root index.html must match the standalone download; run npm run build before committing');
assert.ok(html.includes('name="moba-build" content="standalone-offline"'), 'Standalone build marker missing');
assert.ok(css.length > 1000 && /<script type="module">/.test(html), 'Missing inline application/CSS');
console.log('PASS: one HTML, inline JS/CSS, no external markup/CSS dependencies; root index, dist and download match.');
