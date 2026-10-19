import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";
import { inflateSync } from "node:zlib";
const manifest = JSON.parse(
    await readFile("src/heroes/integration-manifest.json"),
  ),
  preserved = JSON.parse(
    await readFile("docs/two-heroes/approved-preservation.json"),
  );
let assets = 0,
  originals = 0;
const excludedCompiledPreviews = [];
for (const [path, entry] of Object.entries(manifest.assets)) {
  const b = await readFile(path);
  assert.equal(b.length, entry.bytes, path);
  assert.equal(
    createHash("sha256").update(b).digest("hex"),
    entry.sha256,
    path,
  );
  assets++;
}
for (const [path, hash] of Object.entries(preserved)) {
  if (
    process.argv.includes("--source-only") &&
    path.startsWith("previews/") &&
    path.endsWith("Animation-Preview.html")
  ) {
    excludedCompiledPreviews.push(path);
    continue;
  }
  const b = await readFile(path);
  assert.equal(createHash("sha256").update(b).digest("hex"), hash, path);
  originals++;
}
// Decode actual RGBA PNG scanlines; an alpha header alone is not evidence of a useful transparent portrait.
function alphaAudit(b) {
  const w = b.readUInt32BE(16),
    h = b.readUInt32BE(20);
  assert.equal(b[24], 8);
  assert.equal(b[25], 6);
  const chunks = [];
  for (let at = 8; at < b.length; ) {
    const length = b.readUInt32BE(at),
      type = b.toString("ascii", at + 4, at + 8);
    if (type === "IDAT") chunks.push(b.subarray(at + 8, at + 8 + length));
    at += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(chunks)),
    stride = w * 4;
  let previous = Buffer.alloc(stride),
    offset = 0,
    clear = 0,
    solid = 0;
  const paeth = (a, b, c) => {
    const p = a + b - c,
      pa = Math.abs(p - a),
      pb = Math.abs(p - b),
      pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  for (let y = 0; y < h; y++) {
    const filter = raw[offset++],
      row = Buffer.from(raw.subarray(offset, offset + stride));
    offset += stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? row[i - 4] : 0,
        up = previous[i],
        c = i >= 4 ? previous[i - 4] : 0;
      row[i] =
        (row[i] +
          [0, a, up, Math.floor((a + up) / 2), paeth(a, up, c)][filter]) &
        255;
    }
    for (let x = 0; x < w; x++) {
      const a = row[x * 4 + 3];
      if (a === 0) clear++;
      if (a > 240) solid++;
    }
    previous = row;
  }
  assert.ok(clear > w * h * 0.1);
  assert.ok(solid > w * h * 0.1);
  return {
    width: w,
    height: h,
    transparentPixels: clear,
    visiblePixels: solid,
  };
}
const portraits = {};
for (const hero of ["layla", "franco"])
  for (const type of ["portrait", "character-portrait"])
    portraits[hero + "/" + type] = alphaAudit(
      await readFile(`src/heroes/${hero}/assets/${type}.png`),
    );
const result = {
  verifiedAssets: assets,
  unchangedApprovedOriginals: originals,
  excludedCompiledPreviews,
  portraits,
};
await mkdir("artifacts/two-heroes", { recursive: true });
await writeFile(
  "artifacts/two-heroes/asset-audit.json",
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
