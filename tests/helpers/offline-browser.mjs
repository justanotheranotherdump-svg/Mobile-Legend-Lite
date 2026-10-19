import { readFile, writeFile, mkdtemp } from "node:fs/promises";
import { resolve, join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { brotliDecompressSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import bundledChromium from "@sparticuz/chromium";
import { chromium } from "playwright-core";
async function offlineLaunchOptions() {
  let executablePath = process.env.BROWSER_PATH;
  const env = { ...process.env };
  if (!executablePath) {
    executablePath = await bundledChromium.executablePath();
    if (process.platform === "linux") {
      const temp = await mkdtemp(join(tmpdir(), "phase1-browser-"));
      const root = resolve(
        dirname(fileURLToPath(import.meta.resolve("@sparticuz/chromium"))),
        "..",
      );
      await writeFile(
        join(temp, "libraries.tar"),
        brotliDecompressSync(await readFile(join(root, "bin/al2023.tar.br"))),
      );
      execFileSync("tar", ["xf", join(temp, "libraries.tar"), "-C", temp]);
      env.LD_LIBRARY_PATH = `${join(temp, "lib")}:${process.env.LD_LIBRARY_PATH || ""}`;
    }
  }
  return {
    executablePath,
    env,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  };
}

export async function launchOfflineBrowser() {
  return chromium.launch(await offlineLaunchOptions());
}
// A fresh on-disk profile models a normal user's file:// storage. Incognito
// contexts in bundled Chromium can isolate file origins again on reload.
export async function launchPersistentOfflineContext(options = {}) {
  return chromium.launchPersistentContext(
    await mkdtemp(join(tmpdir(), "moba-clean-profile-")),
    { ...(await offlineLaunchOptions()), ...options },
  );
}
