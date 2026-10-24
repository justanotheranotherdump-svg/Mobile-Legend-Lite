import { spawn, execFileSync } from "node:child_process";
import assert from "node:assert/strict";
import { readFile, writeFile, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const suites = [
  "browser.mjs",
  "browser-layla.mjs",
  "browser-panels.mjs",
  "browser-menu.mjs",
  "browser-polish.mjs",
  "browser-hero-browser.mjs",
  "browser-progression.mjs",
  "browser-match.mjs",
  "browser-recovery.mjs",
  "browser-roster.mjs",
  "browser-draft.mjs",
  "browser-batch1.mjs",
  "browser-shop-spells.mjs",
  "browser-game-polish.mjs",
  "browser-preparation-expansion.mjs",
];
// Independent browser processes and profiles; no test assertions, application
// clocks, native timeouts or inputs are changed. Keep concurrency modest for
// software WebGL and retain every suite's full stdout/stderr on failure too.
const workers = Math.max(
  1,
  Math.min(3, Number(process.env.FINAL_REGRESSION_WORKERS) || 1),
);
const bundleSha256 = createHash("sha256")
  .update(await readFile("index.html"))
  .digest("hex");
const zipped = execFileSync(
  "unzip",
  ["-p", "deliverables/MOBA-Lab-Game-Polish-source.zip", "index.html"],
  { maxBuffer: 20 * 1024 * 1024 },
);
assert.equal(
  createHash("sha256").update(zipped).digest("hex"),
  bundleSha256,
  "Build/package the current source ZIP before starting regressions",
);
const previous =
  process.env.FINAL_REGRESSION_RETRY_FAILED === "1"
    ? JSON.parse(
        await readFile(
          "docs/final-gameplay-polish-regression-results.json",
          "utf8",
        ),
      )
    : null;
if (previous) {
  assert.equal(
    previous.bundleSha256,
    bundleSha256,
    "Cannot reuse results for a different HTML",
  );
  await copyFile(
    "docs/final-gameplay-polish-regression-results.json",
    "docs/final-gameplay-polish-regression-initial-results.json",
  );
  for (const r of previous.results.filter((r) => r.exitCode !== 0))
    await copyFile(r.log, r.log.replace(".txt", "-initial.txt"));
}
const pending = previous
  ? suites.filter((s) =>
      previous.results.some((r) => r.suite === s && r.exitCode !== 0),
    )
  : suites;
const results = previous
  ? previous.results.filter((r) => r.exitCode === 0)
  : [];
let next = 0,
  queue = Promise.resolve();
const save = (status) => {
  const data = {
    status,
    bundleSha256,
    workers,
    results: [...results].sort(
      (a, b) => suites.indexOf(a.suite) - suites.indexOf(b.suite),
    ),
    totalCheckGroups: results.reduce((n, r) => n + r.checkGroups, 0),
    failed: results.filter((r) => r.exitCode !== 0).map((r) => r.suite),
    environment:
      "Linux Chromium, software WebGL, standalone file://, offline networking; no native Windows or physical-device claim",
  };
  queue = queue.then(() =>
    writeFile(
      "docs/final-gameplay-polish-regression-results.json",
      JSON.stringify(data, null, 2) + "\n",
    ),
  );
  return queue;
};
async function worker() {
  while (next < pending.length) {
    const suite = pending[next++],
      started = Date.now();
    console.log("START " + suite);
    const result = await new Promise((resolve) => {
      const child = spawn(process.execPath, ["tests/" + suite], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      let stdout = "",
        stderr = "",
        error = null;
      child.stdout.on("data", (b) => (stdout += b));
      child.stderr.on("data", (b) => (stderr += b));
      child.on("error", (e) => (error = e.message));
      const timer = setTimeout(() => {
        error = "Suite exceeded original runner 1800-second cap";
        child.kill("SIGKILL");
      }, 1800000);
      child.on("close", (exitCode) => {
        clearTimeout(timer);
        resolve({ exitCode, stdout, stderr, error });
      });
    });
    const log = "docs/final-gameplay-polish-" + suite.replace(".mjs", ".txt");
    await writeFile(log, result.stdout + "\n" + result.stderr);
    results.push({
      suite,
      exitCode: result.exitCode,
      error: result.error,
      seconds: Math.round((Date.now() - started) / 1000),
      checkGroups: (result.stdout.match(/^PASS:/gm) || []).length,
      log,
    });
    await save("running");
    const old = previous?.results.find((r) => r.suite === suite);
    if (old)
      results.at(-1).attempts = [
        ...(old.attempts || [
          { ...old, log: old.log.replace(".txt", "-initial.txt") },
        ]),
        { ...results.at(-1) },
      ];
    console.log(
      (result.exitCode === 0 ? "PASS " : "FAIL ") +
        suite +
        " " +
        results.at(-1).checkGroups +
        " check groups (" +
        results.at(-1).seconds +
        "s)",
    );
    if (result.exitCode !== 0)
      console.log((result.stdout + "\n" + result.stderr).slice(-5000));
  }
}
await Promise.all(Array.from({ length: workers }, worker));
const failed = results.some((r) => r.exitCode !== 0);
await save(failed ? "failed" : "passed");
console.log("COMPLETE " + (failed ? "FAIL" : "PASS"));
process.exitCode = failed ? 1 : 0;
