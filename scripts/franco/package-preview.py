"""Package only the isolated Franco preview/source; never the game, references or caches."""
from pathlib import Path
import json,zipfile,hashlib
ROOT=Path(__file__).resolve().parents[2]
out=ROOT/'deliverables/Franco-Animation-Preview-Source.zip';out.parent.mkdir(exist_ok=True)
package={'name':'franco-animation-preview','version':'0.1.0','private':True,'type':'module','scripts':{'build':'node scripts/franco/build-preview.mjs','test':'node --test tests/franco-preview.test.js','test:browser':'node tests/browser-franco-preview.mjs'},'dependencies':{'three':'0.186.1'},'devDependencies':{'@sparticuz/chromium':'153.0.0','playwright-core':'1.64.1','vite':'7.3.7'}}
lock=json.loads((ROOT/'package-lock.json').read_text());lock['name']=package['name'];lock['packages']['']['name']=package['name']
verification=json.loads((ROOT/'previews/franco/verification.json').read_text())
assert verification['gameIntegration'] is False and verification['differences']==[] and verification['unitTests']['failed']==0
for p,h in verification['assets'].items():assert hashlib.sha256((ROOT/p).read_bytes()).hexdigest()==h,p
files=[p for p in (ROOT/'previews/franco').rglob('*') if p.is_file() and p.name not in ('browser-isolated-results.json','REVIEW-REPORT.md')]
files+=[ROOT/'assets/source_blender/franco-preview.blend',ROOT/'tests/franco-preview.test.js',ROOT/'tests/browser-franco-preview.mjs',ROOT/'tests/helpers/offline-browser.mjs',ROOT/'docs/HERO_MODEL_ANIMATION_INTAKE.md']
files+=list((ROOT/'scripts/franco').glob('*.mjs'))+list((ROOT/'scripts/franco').glob('*.py'))
with zipfile.ZipFile(out,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for p in sorted(set(files)):
  assert not any(part in ('node_modules','.git','references','artifacts','__pycache__','deliverables') for part in p.relative_to(ROOT).parts)
  z.write(p,p.relative_to(ROOT).as_posix())
 z.writestr('package.json',json.dumps(package,indent=2)+'\n');z.writestr('package-lock.json',json.dumps(lock,indent=2)+'\n')
 z.writestr('README.md','# Franco — animation preview only\n\nOpen `previews/franco/Franco-Animation-Preview.html` offline. This is an unapproved original visual proposal, not a playable-game update.\n\nSee `previews/franco/README.md` for separate sequences, actual clips/assets, limitations, controls and rebuild/test commands. It includes the editable Blender source and both real local GLBs.\n\n`npm ci && npm run build` rebuilds only the Franco preview. `npm test` runs its nineteen isolated tests. The included full-suite log records the 796-test repository run, not 796 tests in this smaller package. `audit-preview.mjs` requires the original full repository for the game-preservation comparison; its completed verification report is included.\n\nNo official/ripped model, uploaded reference images, caches, dependencies, screenshots or duplicate full-game build is included. No gameplay integration has been authorized.\n')
with zipfile.ZipFile(out) as z:
 assert z.testzip() is None
 names=z.namelist();assert len(names)==len(set(names));assert 'previews/franco/assets/franco-proposed.glb'in names;assert 'assets/source_blender/franco-preview.blend'in names
 assert z.read('previews/franco/Franco-Animation-Preview.html')==(ROOT/'previews/franco/Franco-Animation-Preview.html').read_bytes()
print(str(out),out.stat().st_size,'bytes',len(names),'entries; CRCs and embedded preview byte equality verified.')
