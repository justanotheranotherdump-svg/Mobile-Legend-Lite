import { spawn } from "node:child_process";
import { writeFile, readFile, mkdir,appendFile } from "node:fs/promises";
await mkdir("artifacts/two-heroes/regressions", { recursive: true });
const suites = process.argv.slice(2);
const results = [];
for (const file of suites) {
  const path = `artifacts/two-heroes/regressions/${file}.txt`;
  let output = "";
  await writeFile(path+".live", "");
  const p = spawn(process.execPath, [`tests/${file}.mjs`], {
    env: process.env,
  });
  p.stdout.on("data", (b) => {output += b;appendFile(path+".live",b);});
  p.stderr.on("data", (b) => {output += b;appendFile(path+".live",b);});
  const code = await new Promise((r) => p.on("exit", r));
  await writeFile(path, output);
  results.push({
    suite: file,
    exitCode: code,
    passes: output.split("\n").filter((s) => s.startsWith("PASS")).length,
    log: path,
  });
  await writeFile(
    process.env.REGRESSION_REPORT || "artifacts/two-heroes/regression-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(file, code === 0 ? "PASS" : "FAIL", results.at(-1).passes);
}
if (results.some((x) => x.exitCode !== 0)) process.exitCode = 1;
