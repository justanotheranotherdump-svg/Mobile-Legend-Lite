import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import manifest from "../docs/preparation-expansion-asset-manifest.json" with { type: "json" };
import extra from "../src/data/match/extra-items.json" with { type: "json" };
import special from "../src/data/match/special-equipment.json" with { type: "json" };
test("all 63 new equipment entries have unique, original individual square RGBA PNGs with verified registry IDs and hashes", async () => {
  const ids = new Set([...extra.items, ...special.items].map((i) => i.id)),
    hashes = new Set();
  assert.equal(manifest.count, 63);
  assert.equal(manifest.assets.length, ids.size);
  for (const a of manifest.assets) {
    assert.ok(ids.has(a.id));
    assert.equal(a.path, "src/ui/assets/items/" + a.id + ".png");
    const bytes = await readFile(a.path);
    assert.deepEqual(
      [...bytes.subarray(0, 8)],
      [137, 80, 78, 71, 13, 10, 26, 10],
    );
    assert.equal(bytes.readUInt32BE(16), 160);
    assert.equal(bytes.readUInt32BE(20), 160);
    assert.equal(bytes[25], 6);
    assert.ok(bytes.length > 3000);
    const hash = createHash("sha256").update(bytes).digest("hex");
    assert.equal(hash, a.sha256);
    assert.equal(hashes.has(hash), false);
    hashes.add(hash);
  }
  assert.equal(hashes.size, 63);
});
