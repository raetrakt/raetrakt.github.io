import { readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

// add extensions if you use them (e.g. avif, svg)
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|avif)$/i;

const IMAGES_DIR = path.resolve('witzfindig', 'bilder_v1');
const OUT_FILE = path.resolve('witzfindig', 'manifest.json');

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (ent.isFile() && IMAGE_EXT_RE.test(ent.name)) {
      // URL from site root (works on Live Server + GitHub Pages)
      const relFromRepoRoot = path.relative(path.resolve('.'), full).split(path.sep).join('/');
      files.push('/' + relFromRepoRoot); // "/witzfindig/bilder_v1/.../file.jpg"
    }
  }
  return files;
}

const list = (await walk(IMAGES_DIR)).sort();
await writeFile(OUT_FILE, JSON.stringify(list, null, 2) + '\n', 'utf8');
console.log(`Scanned: ${IMAGES_DIR}`);
console.log(`Wrote ${list.length} entries to ${OUT_FILE}`);

// HEIC conversion

// $files = Get-ChildItem -Recurse -File | Where-Object { $_.Name -match '\.(heic|heif)$' }

// $files | ForEach-Object {
//   $out = Join-Path $_.DirectoryName ($_.BaseName + ".jpg")
//   Write-Host "Converting:" $_.FullName "->" $out
//   magick "$($_.FullName)" -quality 90 "$out"
// }
