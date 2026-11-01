/* Derived from Hellslicer/fivem-radio (MIT, Kevin Poirot 2017).
 * Server timeline is new; no HTTP services or client-driven playlist changes. */
(() => {
  'use strict';
  const resource = GetCurrentResourceName();
  const readJson = (path) => {
    const contents = LoadResourceFile(resource, path);
    if (!contents) throw new Error(`Missing ${path}`);
    return JSON.parse(contents);
  };
  try {
    const config = readJson('config/station.json');
    const catalog = readJson('config/playlist.json');
    if (catalog.songs.length !== config.expectedSongCount) throw new Error(`Expected ${config.expectedSongCount} songs, found ${catalog.songs.length}`);
    if (!Number.isInteger(config.snapshotIntervalMs) || config.snapshotIntervalMs < 1000) throw new Error('snapshotIntervalMs must be an integer >= 1000');
    const fs = require('fs');
    const path = require('path');
    for (const item of [...catalog.songs, ...catalog.dj, ...catalog.ads, ...catalog.ids]) {
      if (!/^audio\/(songs|dj|ads|ids)\/[a-zA-Z0-9_-]+\.ogg$/.test(item.file)) throw new Error(`Invalid local audio path: ${item.file}`);
      const absolute = path.join(GetResourcePath(resource), item.file);
      if (!fs.statSync(absolute).isFile()) throw new Error(`Missing audio file: ${item.file}`);
    }
    // A resource restart begins a fresh broadcast. Wall-clock rollback is clamped.
    let lastNow = Date.now();
    const now = () => (lastNow = Math.max(lastNow, Date.now()));
    const scheduler = new VisaUSDCore.BroadcastScheduler({ catalog, config: config.schedule, nowMs: now() });
    const epoch = `${lastNow}-${Math.random().toString(36).slice(2)}`;
    const lastRequest = new Map();
    const packet = (nonce = null) => {
      const serverTimeMs = now();
      return { epoch, serverTimeMs, nonce, snapshot: scheduler.current(serverTimeMs) };
    };
    onNet('visausd-radio:requestState', (nonce) => {
      const player = Number(global.source);
      if (!Number.isInteger(player) || player <= 0) return;
      const at = now();
      if (at - (lastRequest.get(player) || 0) < 500) return;
      lastRequest.set(player, at);
      emitNet('visausd-radio:state', player, packet(typeof nonce === 'string' ? nonce.slice(0, 80) : null));
    });
    on('playerDropped', () => lastRequest.delete(Number(global.source)));
    let lastSequence = 0;
    let lastBroadcast = 0;
    setInterval(() => {
      const state = packet();
      if (state.snapshot.sequence !== lastSequence || state.serverTimeMs - lastBroadcast >= config.snapshotIntervalMs) {
        emitNet('visausd-radio:state', -1, state);
        lastSequence = state.snapshot.sequence;
        lastBroadcast = state.serverTimeMs;
      }
    }, 100);
    console.log(`[${resource}] ${catalog.songs.length} local songs; shared server broadcast started (Worldwide FM only).`);
  } catch (error) {
    console.error(`[${resource}] NOT STARTED: ${error.message}. Run npm run validate before deployment.`);
  }
})();
