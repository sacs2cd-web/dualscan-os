#!/usr/bin/env node
'use strict';
const fs = require('node:fs'); const path = require('node:path'); const crypto = require('node:crypto'); const { spawnSync } = require('node:child_process');
const { BroadcastScheduler } = require('../core/scheduler'); const { localAssetUrl } = require('../core/player');
const root = path.resolve(__dirname, '..');
try {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'config/station.json')));
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'config/playlist.json')));
  new BroadcastScheduler({ catalog, config: config.schedule });
  if (catalog.songs.length !== config.expectedSongCount) throw new Error(`Expected ${config.expectedSongCount} songs, got ${catalog.songs.length}`);
  const probe = process.env.VISAUSD_FFPROBE || 'ffprobe';
  const items = [...catalog.songs, ...catalog.dj, ...catalog.ads, ...catalog.ids];
  let totalSeconds = 0; let totalBytes = 0;
  for (const item of items) {
    localAssetUrl(item.file, 'https://local/');
    const file = path.join(root, item.file); const buffer = fs.readFileSync(file);
    if (!Number.isSafeInteger(item.bytes) || item.bytes < 1 || item.bytes !== buffer.length) throw new Error(`${item.file}: byte count differs from catalog`);
    if (buffer.toString('ascii', 0, 4) !== 'OggS') throw new Error(`${item.file}: not an OGG container`);
    if (item.sha256 && crypto.createHash('sha256').update(buffer).digest('hex') !== item.sha256) throw new Error(`${item.file}: checksum differs from catalog`);
    const result = spawnSync(probe, ['-v', 'error', '-show_entries', 'stream=codec_name:format=duration', '-of', 'json', file], { encoding: 'utf8' });
    if (result.error) throw new Error(`ffprobe is required for asset validation: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`${item.file}: ${result.stderr}`);
    const info = JSON.parse(result.stdout);
    if (!info.streams.some(stream => stream.codec_name === 'vorbis')) throw new Error(`${item.file}: OGG must contain Vorbis`);
    if (Math.abs(Number(info.format.duration) - item.durationSeconds) > 0.05) throw new Error(`${item.file}: duration metadata is stale`);
    totalSeconds += item.durationSeconds; totalBytes += buffer.length;
  }
  console.log(`Validated ${catalog.songs.length} songs + ${items.length - catalog.songs.length} optional segments: ${(totalSeconds / 60).toFixed(1)} minutes, ${(totalBytes / 1048576).toFixed(1)} MiB, all local OGG Vorbis.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
