import { execFileSync } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
await mkdir('deliverables', { recursive: true });
const output = 'deliverables/MOBA-Lab-Phase-1-source.zip';
await rm(output, { force: true });
execFileSync('zip', ['-q', '-r', output, 'src', 'tests', 'scripts', 'docs', 'public', 'assets', 'index.html', 'package.json', 'package-lock.json', 'vite.config.js', '.gitignore', 'README.md', 'PROJECT_RULES.md', 'THIRD_PARTY_NOTICES.md', 'deliverables/README.md'], { stdio: 'inherit' });
console.log(`Source archive generated: ${output} (no dependencies or generated builds).`);
