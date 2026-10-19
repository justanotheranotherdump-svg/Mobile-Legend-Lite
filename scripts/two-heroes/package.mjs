import { existsSync } from "node:fs";
import { copyFile, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
await mkdir("deliverables", { recursive: true });
const html = "deliverables/MOBA-Lab-Layla-Franco.html",
  archive = "deliverables/MOBA-Lab-Layla-Franco-source.zip";
await copyFile("index.html", html);
await rm(archive, { force: true });
const roots = [
  "src",
  "tests",
  "scripts",
  "docs",
  "previews",
  "public",
  "assets",
  "dev.html",
  "index.html",
  "package.json",
  "package-lock.json",
  "vite.config.js",
  ".gitignore",
  ".gitattributes",
  "README.md",
  "PROJECT_RULES.md",
  "THIRD_PARTY_NOTICES.md",
  "deliverables/README.md",
].filter(existsSync);
execFileSync(
  "zip",
  [
    "-q",
    "-X",
    "-r",
    archive,
    ...roots,
    "-x",
    "docs/references/*",
    "previews/*Animation-Preview.html",
    "*/node_modules/*",
    "*/.git/*",
    "*/__pycache__/*",
    "*.blend1",
    "docs/preparation-expansion-delivery-audit.json",
    "docs/preparation-expansion-verification.json",
    "docs/final-gameplay-polish-delivery-audit.json",
    "docs/final-gameplay-polish-verification.json",
  ],
  { stdio: "inherit" },
);
execFileSync("unzip", ["-tq", archive], { stdio: "inherit" });
const manifest = { stage: "Approved Layla + Franco only", files: {} };
for (const path of [html, archive]) {
  const b = await readFile(path);
  manifest.files[path] = {
    bytes: b.length,
    sha256: createHash("sha256").update(b).digest("hex"),
  };
}
await writeFile(
  "deliverables/Layla-Franco-Delivery-Manifest.json",
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(JSON.stringify(manifest, null, 2));
