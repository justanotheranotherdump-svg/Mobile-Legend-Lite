import { launchOfflineBrowser } from "../../tests/helpers/offline-browser.mjs";
import { writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const b = await launchOfflineBrowser();
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on("pageerror", (e) => console.log("PAGE ERROR", e));
p.on("console", (m) => {
  if (["warning", "error"].includes(m.type())) console.log(m.type(), m.text());
});
await p.addInitScript(() => {
  localStorage.setItem(
    "moba-lab.profile.v1",
    JSON.stringify({
      version: 1,
      username: "TwoHeroAudit",
      country: "PH",
      gender: "Male",
    }),
  );
});
await p.goto(pathToFileURL(resolve("index.html")).href + "#diagnostics");
await p.waitForFunction(() => window.menuDiagnostics);
await p.locator("#open-hero-shop").click();
await p.locator('[data-hero-id="franco"]').click();
await p.waitForFunction(
  () =>
    window.menuDiagnostics.snapshot().lobby.heroId === "franco" &&
    window.menuDiagnostics.snapshot().lobby.status === "glb",
);
await p.waitForTimeout(500);
await p.screenshot({ path: "artifacts/two-heroes/franco-details-work.png" });
console.log(
  JSON.stringify(
    await p.evaluate(() => ({
      snapshot: menuDiagnostics.snapshot(),
      canvas: (() => {
        const r = document
          .querySelector("#lobby-preview")
          .getBoundingClientRect();
        return { x: r.x, y: r.y, w: r.width, h: r.height };
      })(),
    })),
    null,
    2,
  ),
);
await b.close();
