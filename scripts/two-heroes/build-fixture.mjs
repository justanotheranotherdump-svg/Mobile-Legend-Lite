import { build } from "vite";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
await mkdir("artifacts/two-heroes", { recursive: true });
const result = await build({
  configFile: false,
  root: resolve("."),
  logLevel: "silent",
  assetsInclude: ["**/*.glb"],
  build: {
    write: false,
    target: "es2022",
    assetsInlineLimit: 100000000,
    lib: {
      entry: resolve("tests/two-heroes-render-fixture.js"),
      name: "IntegrationFixture",
      formats: ["iife"],
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const js = result[0].output.find((x) => x.type === "chunk").code;
await writeFile(
  "artifacts/two-heroes/Render-Fixture.html",
  `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#14283a;width:100%;height:100%;overflow:hidden}canvas{width:100%;height:100%;display:block}#enemy-labels{display:none}</style><canvas id="world"></canvas><div id="enemy-labels"></div><script>${js.replace(/<\/script/gi, "<\\/script")}</script>`,
);
console.log("Built isolated actual-engine / actual-renderer fixture");
