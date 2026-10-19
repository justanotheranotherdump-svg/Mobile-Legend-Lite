// Audit generated deliverables; run only after final packaging.
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const digest=b=>createHash('sha256').update(b).digest('hex');
const htmlPath='deliverables/MOBA-Lab-Preparation-Expansion.html';
const zipPath='deliverables/MOBA-Lab-Preparation-Expansion-source.zip';
const html=await readFile(htmlPath),zip=await readFile(zipPath);
for(const p of ['index.html','dist/index.html','deliverables/MOBA-Lab-Game-Polish.html','deliverables/MOBA-Lab-Phase-3.html'])assert.ok(html.equals(await readFile(p)),p+' differs');
assert.ok(zip.equals(await readFile('deliverables/MOBA-Lab-Game-Polish-source.zip')));
const payload=execFileSync('unzip',['-p',zipPath,'index.html'],{maxBuffer:20*1024*1024});
assert.ok(payload.equals(html),'Archive root index differs');
const entries=execFileSync('unzip',['-Z1',zipPath],{encoding:'utf8'}).trim().split('\n');
const prohibited=new Set(['node_modules','.git','.venv','dist','artifacts','__pycache__','.cache']);
for(const name of entries){assert.ok(!name.split('/').some(s=>prohibited.has(s)),name);assert.ok(!name.startsWith('docs/references/'),name);assert.ok(!/\.zip$/i.test(name),name)}
const standaloneEntries=entries.filter(n=>n.endsWith('.html'));
assert.deepEqual(standaloneEntries.sort(),['dev.html','index.html']); // dev.html is source entry, not a second build.
const manifest=JSON.parse(await readFile('docs/preparation-expansion-asset-manifest.json','utf8'));
for(const a of manifest.assets){assert.ok(entries.includes(a.path));const b=execFileSync('unzip',['-p',zipPath,a.path]);assert.equal(digest(b),a.sha256);assert.ok(html.includes(Buffer.from('data:image/png;base64,'+b.toString('base64'))))}
assert.equal(execFileSync('python3',['-c','import zipfile,sys; z=zipfile.ZipFile(sys.argv[1]); assert z.testzip() is None; print("PASS")',zipPath],{encoding:'utf8'}).trim(),'PASS');
const temporary=await mkdtemp(join(tmpdir(),'MOBA preparation — Unicode space '));
const loose=join(temporary,'Standalone only — 测试');
const extracted=join(temporary,'Source ZIP index only — 测试');
await mkdir(loose);await mkdir(extracted);
const standaloneFile=join(loose,'Play preparation.html'),archiveFile=join(extracted,'index.html');
await copyFile(htmlPath,standaloneFile);await writeFile(archiveFile,payload);
const report={status:'passed',html:{path:htmlPath,bytes:html.length,sha256:digest(html)},sourceZip:{path:zipPath,bytes:zip.length,sha256:digest(zip),entries:entries.length,files:entries.filter(n=>!n.endsWith('/')).length,crc:'all entries passed',rootHtmlByteIdentical:true},aliasesByteIdentical:true,newPngPayloadsVerified:manifest.assets.length,excluded:'dependencies/Git/virtualenv/cache/test captures/reference screenshots/duplicate builds',isolatedBrowserTargets:{standaloneFile,archiveFile},note:'This static/archive audit alone is not a browser certificate. Use PREP_ENTRY with test:browser:preparation for isolated native offline verification. ZIP hash is recorded outside the archive to avoid a self-referential hash.'};
await writeFile('docs/preparation-expansion-delivery-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
