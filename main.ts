// main.ts — hands Lumen Grove in: copies game/ and screenshots/ into the
// output directory and writes dossier.json with the kit's buildDossier.
// Node 22, standard library only. Deterministic: both grader runs write the
// same bytes. Never removes the output directory itself (it may be a mount);
// only the game/ and screenshots/ subdirectories inside it are cleared.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function clearSubdir(dir: string): void {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
}

mkdirSync(out, { recursive: true });
clearSubdir(join(out, 'game'));
clearSubdir(join(out, 'screenshots'));
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`wrote ${out}/dossier.json (${dossier.length} bytes)`);
