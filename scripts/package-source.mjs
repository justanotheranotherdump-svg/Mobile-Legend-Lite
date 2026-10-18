import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
await mkdir('deliverables', { recursive: true });
const output = 'deliverables/MOBA-Lab-Game-Polish-source.zip';
await rm(output, { force: true });
// public/assets may be absent in a clean Git checkout until real assets exist.
const paths = ['src', 'tests', 'scripts', 'docs', 'public', 'assets', 'dev.html', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', '.gitignore', '.gitattributes', 'README.md', 'PROJECT_RULES.md', 'THIRD_PARTY_NOTICES.md', 'deliverables/README.md'].filter(existsSync);
execFileSync('zip', ['-q', '-r', output, ...paths, '-x', 'docs/references/*'], { stdio: 'inherit' });
console.log(`Source archive generated: ${output} (includes playable root index.html; no dependencies or duplicate builds).`);
