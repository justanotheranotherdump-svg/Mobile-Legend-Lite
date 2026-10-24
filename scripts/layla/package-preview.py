"""Package only Layla workshop assets/source. Never full game, Franco, references or caches."""
from pathlib import Path
import json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2];out=ROOT/'deliverables/Layla-Animation-Preview-R1-Source.zip'
verification=json.loads((ROOT/'previews/layla/verification.json').read_text());assert verification['gameIntegration'] is False and not verification['differences'] and not verification['addedRuntime'];assert verification['focusedUnitTests']['fail']==0;assert verification['browserGroups']==34
for p,h in verification['assets'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,p
package={'name':'layla-animation-workshop','version':'0.1.0','type':'module','private':True,'scripts':{'build':'node scripts/layla/build-preview.mjs','test':'node --test tests/layla-preview.test.js','test:browser':'node tests/browser-layla-preview.mjs'},'dependencies':{'three':'0.186.1'},'devDependencies':{'@sparticuz/chromium':'153.0.0','playwright-core':'1.64.1','vite':'7.3.7'}}
lock=json.loads((ROOT/'package-lock.json').read_text());lock['name']=package['name'];lock['packages']['']['name']=package['name']
files=[p for p in(ROOT/'previews/layla').rglob('*')if p.is_file()]
files+=[ROOT/'assets/source_blender/layla-rework-preview.blend',ROOT/'tests/layla-preview.test.js',ROOT/'tests/browser-layla-preview.mjs',ROOT/'tests/helpers/offline-browser.mjs',ROOT/'docs/LAYLA_PREVIEW_SPEC.md']
files+=list((ROOT/'scripts/layla').glob('*.mjs'))+list((ROOT/'scripts/layla').glob('*.py'))
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=8)as z:
 for p in sorted(set(files)):
  relative=p.relative_to(ROOT);assert not any(x in('.git','node_modules','.cache','references','artifacts','__pycache__','deliverables')for x in relative.parts);z.write(p,relative.as_posix())
 z.writestr('package.json',json.dumps(package,indent=2)+'\n');z.writestr('package-lock.json',json.dumps(lock,indent=2)+'\n')
 z.writestr('README.md','# Layla Energy Gunner workshop R1 — preview only\n\nOpen `previews/layla/Layla-Animation-Preview.html` alone in Chrome/Edge with WebGL2. No installation, adjacent assets, server or internet required for viewing.\n\nSee `previews/layla/README.md` for controls, original GLB/Blender source, true clip durations versus editable presentation sampling, provisional geometry/math, limitations and test scope. `docs/LAYLA_PREVIEW_SPEC.md` is the human-readable preliminary research specification; `research.json` and `settings.json` are editable records.\n\n`npm ci && npm run build` rebuilds only the named preview. `npm test` runs21 focused preview tests, not the full817-test repository. Full-suite evidence reports816/817 with the unchanged pre-existing missing-Franco-Plan-A-download failure. That failure was not hidden or repaired by editing parked Franco. The audit script requires the original full repository to check preservation; its completed certificate is included.\n\nBlender4.2/bpy is optional only for reauthoring. Genuine editable source is `assets/source_blender/layla-rework-preview.blend`. No dependencies/native authoring libraries, uploaded references, screenshots, official/ripped assets, Franco models, Git or full-game duplicate builds are included. No gameplay integration is authorized. STOP for review.\n')
with zipfile.ZipFile(out)as z:
 assert z.testzip()is None;names=z.namelist();assert len(names)==len(set(names));assert z.read('previews/layla/Layla-Animation-Preview.html')==(ROOT/'previews/layla/Layla-Animation-Preview.html').read_bytes();assert 'assets/source_blender/layla-rework-preview.blend'in names
print(out,out.stat().st_size,'bytes;',len(names),'entries; CRC/HTML equality verified')
