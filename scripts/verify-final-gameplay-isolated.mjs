import assert from "node:assert/strict";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
const audit = JSON.parse(
  await readFile("docs/final-gameplay-polish-delivery-audit.json", "utf8"),
);
const digest = (b) => createHash("sha256").update(b).digest("hex");
const results = [];
for (const [label, entry] of Object.entries(audit.isolatedBrowserTargets)) {
  assert.equal(digest(await readFile(entry)), audit.html.sha256);
  console.log(
    "START isolated " + label + " (only HTML in Unicode/spaces directory)",
  );
  const started = Date.now();
  const r = spawnSync(
    process.execPath,
    ["tests/browser-final-gameplay-polish.mjs"],
    {
      env: { ...process.env, POLISH_ENTRY: entry },
      encoding: "utf8",
      timeout: 600000,
      maxBuffer: 20 * 1024 * 1024,
    },
  );
  const log = "docs/final-gameplay-polish-isolated-" + label + ".txt";
  await writeFile(log, (r.stdout || "") + "\n" + (r.stderr || ""));
  if (r.status !== 0) {
    console.error((r.stdout || "") + "\n" + (r.stderr || ""));
    throw Error(
      "Isolated browser failed: " +
        label +
        " / " +
        r.status +
        " / " +
        (r.error?.message || ""),
    );
  }
  const focused = JSON.parse(
    await readFile("docs/final-gameplay-polish-browser-results.json", "utf8"),
  );
  assert.equal(focused.checks.length, 5);
  for (const key of ["errors", "warnings", "requests"])
    assert.deepEqual(focused[key], []);
  const record = "docs/final-gameplay-polish-isolated-" + label + ".json";
  await copyFile("docs/final-gameplay-polish-browser-results.json", record);
  results.push({
    label,
    entry,
    sha256: audit.html.sha256,
    seconds: Math.round((Date.now() - started) / 1000),
    checkGroups: focused.checks.length,
    log,
    record,
    status: "passed",
  });
  console.log(
    "PASS isolated " +
      label +
      ": " +
      focused.checks.length +
      " native check groups; no runtime errors/warnings/external requests",
  );
}
await writeFile(
  "docs/final-gameplay-polish-isolated-results.json",
  JSON.stringify(
    {
      status: "passed",
      bundleSha256: audit.html.sha256,
      environment:
        "Linux Chromium/software WebGL, offline file:// with ordinary file-origin security; no sibling assets; Unicode and spaces paths; no diagnostic simulation mutations; the only Gold grant is the requested native Settings Cheats button",
      results,
    },
    null,
    2,
  ) + "\n",
);
