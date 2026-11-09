import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = process.cwd();
const output = resolve(root, 'public');
const files = [
  'index.html',
  'styles.css',
  'script.js',
  'board.css',
  'board.js',
  'og-image.svg',
  'national-bike-route-map.png',
  'route-data.json',
  'center-data.json',
  'robots.txt',
  'sitemap.xml',
  'google276f98d801cbc50d.html',
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) {
  try {
    await cp(resolve(root, file), resolve(output, file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
console.log(`Built ${files.length} static asset entries into public/.`);