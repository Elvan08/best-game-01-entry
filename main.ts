// AEGIS ORBIT — entry program for best-game-01 (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// browser, no build step, no network). This program hands it in: it copies
// game/ and screenshots/ into the output directory and writes dossier.json
// there with the kit's vendored library, exactly as the scorer rebuilds it.
//
// Run it the way the grader does:
//   node main.ts                       (writes /output)
//   MAKEFUN_OUTPUT_DIR=out node main.ts (writes ./out anywhere else)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(root, 'game'), join(outDir, 'game'), { recursive: true });

const shotsDir = join(root, 'screenshots');
if (existsSync(shotsDir)) {
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });
}

// The caps are the scorer's own (see the competition's gate): at most 4
// screenshots of 256 KiB, at most 993 files / 48 MiB under game/, paths of at
// most 1000 bytes, and the dossier's text fields capped at 160 KiB.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`AEGIS ORBIT handed in at ${outDir}`);
