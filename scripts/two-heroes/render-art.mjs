import { build } from "vite";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";
import chromiumBinary from "@sparticuz/chromium";
await mkdir(".cache/two-heroes", { recursive: true });
const entry = resolve(".cache/two-heroes/art-entry.js");
await writeFile(
  entry,
  `import * as T from 'three';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import layla from '../../src/heroes/layla/assets/energy-gunner.glb?inline';
import franco from '../../src/heroes/franco/assets/franco.glb?inline';
window.renderHero=async(id,portrait)=>{document.body.style.margin='0';document.body.style.background='transparent';const width=512,height=portrait?512:768;let canvas=document.querySelector('canvas');if(!canvas){canvas=document.createElement('canvas');document.body.append(canvas);}const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,preserveDrawingBuffer:true});renderer.setSize(width,height);renderer.setClearColor(0,0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;const scene=new T.Scene();scene.add(new T.HemisphereLight('#f4f7ff','#48505d',2.8));const key=new T.DirectionalLight('#fff3d7',3.1);key.position.set(-3,6,7);scene.add(key);const rim=new T.DirectionalLight(id==='layla'?'#75dfff':'#ffaf76',2.3);rim.position.set(4,4,-3);scene.add(rim);const url=id==='layla'?layla:franco;const bytes=Uint8Array.from(atob(url.split(',')[1]),c=>c.charCodeAt(0));const gltf=await new GLTFLoader().parseAsync(bytes.buffer,'');const root=gltf.scene;scene.add(root);const mixer=new T.AnimationMixer(root);const idle=gltf.animations.find(c=>c.name==='Idle');mixer.clipAction(idle).play();mixer.setTime(.3);root.updateMatrixWorld(true);const box=new T.Box3().setFromObject(root),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3());root.position.x-=center.x;root.position.z-=center.z;const target=new T.Vector3(0,portrait?box.min.y+size.y*.65:center.y,0);const viewHeight=portrait?size.y*.79:Math.max(size.y,size.x/(width/height))*1.12;const camera=new T.PerspectiveCamera(30,width/height,.01,100);const distance=viewHeight/(2*Math.tan(T.MathUtils.degToRad(15)));camera.position.set(distance*.13,target.y+distance*.055,distance);camera.lookAt(target);renderer.render(scene,camera);const data=canvas.toDataURL('image/png');renderer.dispose();return data;};`,
);
await build({
  configFile: false,
  root: resolve("."),
  logLevel: "silent",
  assetsInclude: ["**/*.glb"],
  build: {
    write: true,
    outDir: ".cache/two-heroes/bundle",
    emptyOutDir: true,
    lib: {
      entry,
      name: "HeroArt",
      formats: ["iife"],
      fileName: () => "art.js",
    },
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
});
const browser = await chromium.launch({
  executablePath: await chromiumBinary.executablePath(),
  args: [
    ...chromiumBinary.args,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.setContent("<!doctype html><body></body>");
  await page.addScriptTag({ path: ".cache/two-heroes/bundle/art.js" });
  for (const hero of ["layla", "franco"])
    for (const portrait of [true, false]) {
      const data = await page.evaluate(
        ([id, p]) => window.renderHero(id, p),
        [hero, portrait],
      );
      const path = `src/heroes/${hero}/assets/${portrait ? "portrait" : "character-portrait"}.png`;
      await writeFile(path, Buffer.from(data.split(",")[1], "base64"));
      console.log(path);
    }
} finally {
  await browser.close();
}
