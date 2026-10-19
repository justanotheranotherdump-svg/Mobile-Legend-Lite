import {build} from 'vite';import{readFile,writeFile,mkdir,mkdtemp,rm}from'node:fs/promises';import{resolve}from'node:path';import{tmpdir}from'node:os';
const root=resolve('previews/layla'),out=await mkdtemp(resolve(tmpdir(),'layla-preview-'));
await build({configFile:false,root,base:'./',assetsInclude:['**/*.glb'],build:{outDir:out,emptyOutDir:true,target:'es2022',chunkSizeWarningLimit:4000,assetsInlineLimit:100000000,modulePreload:false,rollupOptions:{input:resolve(root,'index.html'),output:{inlineDynamicImports:true}}}});
let html=await readFile(out+'/index.html','utf8');
for(const m of [...html.matchAll(/<script\b[^>]*src="([^"]+)"[^>]*><\/script>/g)]){const js=(await readFile(resolve(out,m[1].replace(/^\.\//,'')),'utf8')).replace(/<\/script/gi,'<\\/script');html=html.replace(m[0],()=>'<script type="module">'+js+'</script>')}
for(const m of [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)]){const css=await readFile(resolve(out,m[1].replace(/^\.\//,'')),'utf8');html=html.replace(m[0],()=>'<style>'+css+'</style>')}
await mkdir('deliverables',{recursive:true});for(const p of['deliverables/Layla-Animation-Preview.html','previews/layla/Layla-Animation-Preview.html'])await writeFile(p,html);console.log('Standalone Layla preview: '+Buffer.byteLength(html)+' bytes; playable game untouched.');
await rm(out,{recursive:true,force:true});
