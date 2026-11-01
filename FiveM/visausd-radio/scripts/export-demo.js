#!/usr/bin/env node
'use strict';
const fs = require('node:fs'); const path = require('node:path');
const root = path.resolve(__dirname, '..');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output || output === root || output.startsWith(root + path.sep)) throw new Error('Choose an output directory outside the resource folder');
if (fs.existsSync(output) && fs.readdirSync(output).length) throw new Error('Output directory must be empty');
const copy = (relative, target = relative) => { const dest = path.join(output, target); fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(root, relative), dest); };
for (const name of ['index.html', 'style.css', 'demo.js']) copy(`web/${name}`, name);
// The export flattens web/ to its root; keep every URL relative to that root
// so the player also works when hosted beneath an arbitrary URL prefix.
const htmlPath = path.join(output, 'index.html');
fs.writeFileSync(htmlPath, fs.readFileSync(htmlPath, 'utf8').replaceAll('../core/', 'core/'));
const demoPath = path.join(output, 'demo.js');
fs.writeFileSync(demoPath, fs.readFileSync(demoPath, 'utf8').replace("new URL('../', location.href)", "new URL('./', location.href)"));
copy('web/assets/visausd-logomark.png', 'assets/visausd-logomark.png');
copy('web/assets/vice-city-sunset.png', 'assets/vice-city-sunset.png');
for (const name of ['scheduler.js', 'player.js']) copy(`core/${name}`);
for (const name of ['playlist.json', 'station.json']) copy(`config/${name}`);
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'config/playlist.json')));
for (const item of [...catalog.songs, ...catalog.dj, ...catalog.ads, ...catalog.ids]) {
  if (!/^audio\/(songs|dj|ads|ids)\/[a-zA-Z0-9_-]+\.ogg$/.test(item.file)) throw new Error('Invalid asset path');
  copy(item.file);
}
copy('LICENSE'); copy('ASSET-NOTICE.md');
console.log(`Exported VisaUSD™ Radio browser player to ${output}`);
