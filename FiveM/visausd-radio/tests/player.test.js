'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { LocalAudioPlayer, localAssetUrl } = require('../core/player');
class AudioMock {
  constructor() { this.handlers = {}; this.readyState = 1; this.duration = 100; this.currentTime = 0; this.paused = true; this.volume = 1; this.playCalls = 0; }
  addEventListener(key, handler) { this.handlers[key] = handler; }
  removeEventListener(key) { delete this.handlers[key]; }
  load() {}
  removeAttribute() { this.src = ''; }
  play() { this.playCalls++; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
}
const snapshot = (sequence = 1, startedAtMs = 1000) => ({ sequence, startedAtMs, endsAtMs: startedAtMs + 100000, item: { id: 'track-001', file: 'audio/songs/track-001.ogg', durationSeconds: 100 } });
const settle = () => new Promise(resolve => setImmediate(resolve));
test('only packaged OGG paths can reach audio loader', () => {
  assert.equal(localAssetUrl('audio/songs/track-001.ogg', 'https://cfx-nui-visausd-radio/'), 'https://cfx-nui-visausd-radio/audio/songs/track-001.ogg');
  for (const file of ['https://example.com/song.ogg', '../song.ogg', 'audio/songs/../../secret.ogg', 'audio/songs/a.mp3', 'audio/songs/a%2f.ogg']) assert.throws(() => localAssetUrl(file, 'https://local/'));
});
test('late join seeks to shared broadcast offset and plays only when listening', async () => {
  const audio = new AudioMock(); const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 21000 });
  p.apply(snapshot()); assert.equal(audio.currentTime, 20); assert.equal(audio.playCalls, 0);
  p.setListening(true); await settle(); assert.equal(audio.paused, false); assert.equal(audio.playCalls, 1);
});
test('pause stops sound, resume rejoins live time and volume clamps', async () => {
  let now = 11000; const audio = new AudioMock(); const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => now });
  p.apply(snapshot()); p.setListening(true); await settle(); p.setListening(false); assert.equal(audio.paused, true);
  now = 51000; p.setListening(true); await settle(); assert.equal(audio.currentTime, 50);
  p.setVolume(0.3); assert.equal(audio.volume, 0.3); p.setVolume(5); assert.equal(audio.volume, 1); p.setVolume(-2); assert.equal(audio.volume, 0);
  p.destroy(); assert.equal(audio.paused, true); assert.equal(audio.src, ''); assert.deepEqual(audio.handlers, {});
});
test('periodic snapshots correct drift without restarting stable playback', async () => {
  const audio = new AudioMock(); const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 21000 });
  p.apply(snapshot()); p.setListening(true); await settle(); audio.currentTime = 19.8; p.apply(snapshot()); assert.equal(audio.currentTime, 19.8);
  audio.currentTime = 3; p.apply(snapshot()); assert.equal(audio.currentTime, 20); assert.equal(audio.playCalls, 1);
});
test('metadata readiness applies pending seek; decode errors are reported', () => {
  const audio = new AudioMock(); audio.readyState = 0; const errors = [];
  const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 11000, onError: e => errors.push(e) });
  p.apply(snapshot()); assert.equal(audio.currentTime, 0); audio.readyState = 1; audio.handlers.loadedmetadata(); assert.equal(audio.currentTime, 10);
  audio.error = { code: 3 }; audio.handlers.error(); assert.match(errors[0].message, /track-001.ogg/);
});
test('tune-away during pending play leaves element paused', async () => {
  const audio = new AudioMock(); let resolvePlay;
  audio.play = () => new Promise(resolve => { resolvePlay = () => { audio.paused = false; resolve(); }; });
  const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 11000 });
  p.apply(snapshot()); p.setListening(true); p.setListening(false); resolvePlay(); await settle(); assert.equal(audio.paused, true);
});
test('changing tracks during pending play retries the new segment', async () => {
  const audio = new AudioMock(); let resolveFirst; let calls = 0;
  audio.play = () => { calls++; if (calls === 1) return new Promise(resolve => { resolveFirst = resolve; }); audio.paused = false; return Promise.resolve(); };
  const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 11000 });
  p.apply(snapshot()); p.setListening(true);
  p.apply(snapshot(2, 2000)); resolveFirst(); await settle();
  assert.equal(calls, 2); assert.equal(audio.paused, false);
});
test('rapid pause/resume while play is pending retries the same source', async () => {
  const audio = new AudioMock(); let resolveFirst; let calls = 0;
  audio.play = () => { calls++; if (calls === 1) return new Promise(resolve => { resolveFirst = resolve; }); audio.paused = false; return Promise.resolve(); };
  const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 11000 });
  p.apply(snapshot()); p.setListening(true); p.setListening(false); p.setListening(true);
  resolveFirst(); await settle(); assert.equal(calls, 2); assert.equal(audio.paused, false);
});
test('optional buffered loader starts only after bytes resolve and releases obsolete object URLs', async () => {
  const audio = new AudioMock(); const loads = []; const released = [];
  const p = new LocalAudioPlayer({ audio, baseUrl: 'https://local/', now: () => 11000, assetLoader: url => new Promise(resolve => loads.push({url,resolve})) });
  p.apply(snapshot()); p.setListening(true); await settle(); assert.equal(audio.playCalls, 0);
  p.apply(snapshot(2, 2000)); await settle(); assert.equal(loads.length, 2);
  loads[0].resolve({url:'blob:old',release:()=>released.push('old')}); await settle(); assert.deepEqual(released, ['old']); assert.notEqual(audio.src, 'blob:old');
  loads[1].resolve({url:'blob:new',release:()=>released.push('new')}); await settle(); assert.equal(audio.src, 'blob:new'); assert.equal(audio.playCalls, 1);
  p.destroy(); assert.deepEqual(released, ['old','new']);
});
test('buffered loading failures report once and do not play missing media', async () => {
  const audio = new AudioMock(); const errors = [];
  const p = new LocalAudioPlayer({ audio, baseUrl:'https://local/', now:()=>11000, assetLoader:async()=>{throw new Error('download failed');}, onError:e=>errors.push(e) });
  p.apply(snapshot()); p.setListening(true); await settle(); p.apply(snapshot()); await settle(); assert.equal(errors.length, 1); assert.equal(audio.playCalls, 0);
});
