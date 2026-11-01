'use strict';
// Integration tests execute the real FiveM scripts against mocked host APIs.
// They verify protocol/control behavior, not the GTA engine's audio mix.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.join(__dirname, '..');
const TARGET = 'RADIO_13_JAZZ';
const SCENE = 'DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE';
const plain = (value) => JSON.parse(JSON.stringify(value));
const config = () => ({
  stationName: 'VisaUSD™ Radio', expectedSongCount: 3, stationGain: 0.8,
  defaultUserVolume: 0.7, followGameMusicVolume: true, pauseOnPauseMenu: true,
  snapshotIntervalMs: 5000, clockSyncIntervalMs: 15000,
  driftToleranceSeconds: 0.75,
  schedule: { songsBetweenAds: 0, songsBetweenDj: 0, songsBetweenIds: 0, adsPerBreak: 0 },
});
const catalog = () => ({
  songs: [1, 2, 3].map((id) => ({ id: `song-${id}`, type: 'song', file: `audio/songs/track-${id}.ogg`, title: `Song ${id}`, artist: 'Test', durationSeconds: 10 })),
  dj: [], ads: [], ids: [],
});
const snapshot = (startedAtMs = 1000000, sequence = 1) => ({
  sequence, item: catalog().songs[0], startedAtMs, endsAtMs: startedAtMs + 10000, offsetSeconds: 0,
});
function host(options = {}) {
  const clock = { now: 1000000 };
  const events = new Map(), netEvents = new Map(), commands = new Map(), timers = new Map();
  const calls = [], outbound = [], messages = [], errors = [], logs = [];
  let timerId = 0;
  class FakeDate extends Date { static now() { return clock.now; } }
  const state = { inVehicle: false, dead: false, enabled: true, station: TARGET, paused: false, music: 10, vehicle: 42 };
  const settings = options.config || config();
  const library = options.catalog || catalog();
  const native = (name, result) => (...args) => { calls.push([name, ...args]); return typeof result === 'function' ? result(...args) : result; };
  const sandbox = {
    Date: FakeDate, Math, JSON, URL, Map, Set,
    console: { log: (...args) => logs.push(args.join(' ')), error: (...args) => errors.push(args.join(' ')) },
    GetCurrentResourceName: () => 'visausd-radio',
    GetResourcePath: () => '/mock/resources/visausd-radio',
    LoadResourceFile: (_resource, file) => file === 'config/station.json' ? JSON.stringify(settings) : file === 'config/playlist.json' ? JSON.stringify(library) : null,
    GetLabelText: () => 'Worldwide FM localized',
    GetResourceKvpString: () => Object.hasOwn(options, 'kvp') ? options.kvp : null,
    SetResourceKvp: native('SetResourceKvp'),
    GetResourceState: () => 'missing',
    AddTextEntry: native('AddTextEntry'),
    SetFrontendRadioActive: native('SetFrontendRadioActive'),
    StartAudioScene: native('StartAudioScene', true),
    StopAudioScene: native('StopAudioScene'),
    SetPositionedPlayerVehicleRadioEmitterEnabled: native('SetPositionedPlayerVehicleRadioEmitterEnabled'),
    SendNuiMessage: (message) => messages.push(JSON.parse(message)),
    RegisterNuiCallbackType: native('RegisterNuiCallbackType'),
    PlayerPedId: () => 7,
    IsPedInAnyVehicle: () => state.inVehicle,
    IsEntityDead: () => state.dead,
    IsPlayerVehRadioEnable: () => state.enabled,
    GetPlayerRadioStationName: () => state.station,
    IsPauseMenuActive: () => state.paused,
    GetProfileSetting: (id) => { assert.equal(id, 306); return state.music; },
    GetVehiclePedIsIn: () => state.inVehicle ? state.vehicle : 0,
    SetVehRadioStation: native('SetVehRadioStation'),
    on: (name, fn) => events.set(name, fn),
    onNet: (name, fn) => netEvents.set(name, fn),
    emit: native('emit'),
    emitNet: (...args) => outbound.push(plain(args)),
    RegisterCommand: (name, fn, restricted) => { assert.equal(restricted, false); commands.set(name, fn); },
    setInterval: (fn, interval) => { const id = ++timerId; timers.set(id, { fn, interval }); return id; },
    clearInterval: (id) => timers.delete(id),
    require: (name) => name === 'fs' ? { statSync: () => {
      if (options.missingFile) throw new Error('ENOENT missing fixture');
      return { isFile: () => true };
    } } : require(name),
  };
  const context = vm.createContext(sandbox);
  context.global = context;
  function load(file) { vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file }); }
  function tick(interval) { for (const entry of [...timers.values()]) if (entry.interval === interval) entry.fn(); }
  function receive(name, ...args) { assert.ok(netEvents.has(name), `${name} registered`); netEvents.get(name)(...args); }
  function request(source, nonce) { context.source = source; receive('visausd-radio:requestState', nonce); }
  function ready() { let response; events.get('__cfx_nui:ready')({}, (value) => { response = plain(value); }); return response; }
  return { clock, state, calls, outbound, messages, errors, logs, events, netEvents, commands, timers, context, load, tick, receive, request, ready };
}
function client(options) { const h = host(options); h.load('core/radio-controller.js'); h.load('client/fivem.js'); return h; }
function server(options) { const h = host(options); h.load('core/scheduler.js'); h.load('server/fivem.js'); return h; }
function tuneClient(h) { h.ready(); h.receive('visausd-radio:state', { epoch: 'server-1', serverTimeMs: h.clock.now, snapshot: snapshot() }); h.state.inVehicle = true; h.tick(100); }
const audioCalls = (h) => h.calls.filter(([name]) => ['SetFrontendRadioActive', 'StartAudioScene', 'StopAudioScene', 'SetPositionedPlayerVehicleRadioEmitterEnabled'].includes(name));

test('client init and ready race retain selected station, snapshot and current volume', () => {
  const h = client();
  assert.ok(h.context.VisaUSDRadioController, 'UMD exports available across real script loads');
  assert.deepEqual(h.calls[0], ['AddTextEntry', TARGET, 'VisaUSD™ Radio']);
  assert.equal(h.outbound[0][0], 'visausd-radio:requestState');
  h.state.inVehicle = true;
  h.tick(100);
  h.receive('visausd-radio:state', { epoch: 'server-1', serverTimeMs: h.clock.now, nonce: h.outbound[0][1], snapshot: snapshot() });
  assert.equal(h.messages.length, 0, 'NUI messages are not lost into an unready UI');
  const data = h.ready();
  assert.equal(data.listening, false, 'native radio stays active until the NUI is ready');
  assert.equal(data.volume, 0.7 * 0.8);
  assert.equal(data.snapshot.item.id, 'song-1');
  assert.equal(data.config.stationName, 'VisaUSD™ Radio');
  assert.equal(h.outbound.length, 2, 'ready requests a fresh authoritative snapshot');
  assert.deepEqual(audioCalls(h), [], 'unready NUI does not silence the native station');
  h.tick(100);
  assert.deepEqual(audioCalls(h), [
    ['SetFrontendRadioActive', false], ['StartAudioScene', SCENE], ['SetPositionedPlayerVehicleRadioEmitterEnabled', false],
  ]);
});

test('switching to another station restores native audio without forcing a station', () => {
  const h = client(); tuneClient(h);
  h.state.station = 'RADIO_01_CLASS_ROCK'; h.tick(100);
  assert.deepEqual(audioCalls(h).slice(-3), [
    ['SetFrontendRadioActive', true], ['StopAudioScene', SCENE], ['SetPositionedPlayerVehicleRadioEmitterEnabled', true],
  ]);
  assert.equal(h.messages.at(-1).type, 'listening');
  assert.equal(h.messages.at(-1).listening, false);
  const count = audioCalls(h).length; h.tick(100);
  assert.equal(audioCalls(h).length, count, 'no repeated interference with native station');
  assert.equal(h.calls.some(([name]) => name === 'SetVehRadioStation'), false);
});

test('vehicle exit, radio off and death each stop custom audio and restore native mixing', () => {
  for (const leave of [(s) => { s.inVehicle = false; }, (s) => { s.enabled = false; }, (s) => { s.dead = true; }]) {
    const h = client(); tuneClient(h);
    leave(h.state); h.tick(100);
    assert.equal(h.messages.at(-1).listening, false);
    assert.deepEqual(audioCalls(h).at(-1), ['SetPositionedPlayerVehicleRadioEmitterEnabled', true]);
  }
});

test('local pause/resume and music/user volume controls do not alter broadcast or station', () => {
  const h = client(); tuneClient(h);
  const command = h.commands.get('visausdradio');
  const requestCount = h.outbound.length;
  command(0, ['pause']);
  assert.deepEqual(h.messages.at(-1), { type: 'listening', listening: false });
  command(0, ['resume']);
  assert.deepEqual(h.messages.at(-1), { type: 'listening', listening: true });
  h.state.paused = true; h.tick(100);
  assert.equal(h.messages.at(-1).listening, false);
  h.state.paused = false; h.tick(100);
  assert.equal(h.messages.at(-1).listening, true);
  command(0, ['volume', '50']);
  assert.deepEqual(h.calls.find(([name]) => name === 'SetResourceKvp'), ['SetResourceKvp', 'visausd-radio:volume', '0.5']);
  assert.equal(h.messages.at(-1).volume, 0.4);
  h.state.music = 5; h.tick(100); assert.equal(h.messages.at(-1).volume, 0.2);
  const messageCount = h.messages.length;
  command(0, ['volume', '-1']); command(0, ['volume', '101']); command(0, ['volume']);
  assert.equal(h.messages.length, messageCount);
  assert.equal(h.outbound.length, requestCount, 'local controls do not request a playlist change');
  assert.equal(audioCalls(h).length, 3, 'pause keeps native replacement suppressed');
  assert.equal(h.calls.some(([name]) => name === 'SetVehRadioStation'), false);
});

test('stored zero is preserved, while absent/null/undefined volume uses default', () => {
  for (const kvp of [null, undefined]) {
    const h = client({ kvp }); h.tick(100); assert.equal(h.ready().volume, 0.7 * 0.8);
  }
  const muted = client({ kvp: '0' }); muted.tick(100); assert.equal(muted.ready().volume, 0);
});

test('resource stop cleans timers, NUI and native mix, restoring prior localized label', () => {
  const h = client(); tuneClient(h);
  h.events.get('onClientResourceStop')('another-resource'); assert.equal(h.timers.size, 2);
  h.events.get('onClientResourceStop')('visausd-radio');
  assert.equal(h.timers.size, 0);
  assert.deepEqual(h.messages.at(-1), { type: 'shutdown' });
  assert.deepEqual(h.calls.at(-1), ['AddTextEntry', TARGET, 'Worldwide FM localized']);
  assert.deepEqual(audioCalls(h).slice(-3), [
    ['SetFrontendRadioActive', true], ['StopAudioScene', SCENE], ['SetPositionedPlayerVehicleRadioEmitterEnabled', true],
  ]);
});

test('only explicit tune command sets Worldwide FM and requires a vehicle', () => {
  const h = client();
  const command = h.commands.get('visausdradio'); command(0, ['tune']);
  assert.equal(h.calls.some(([name]) => name === 'SetVehRadioStation'), false);
  h.state.inVehicle = true; command(0, ['tune']);
  assert.deepEqual(h.calls.find(([name]) => name === 'SetVehRadioStation'), ['SetVehRadioStation', 42, TARGET]);
});

test('client ignores malformed/stale snapshots, updates server epoch and bounds audio errors', () => {
  const h = client(); h.ready();
  h.receive('visausd-radio:state', { serverTimeMs: 'bad', snapshot: snapshot() });
  assert.equal(h.messages.length, 0);
  h.receive('visausd-radio:state', { epoch: 'epoch-1', serverTimeMs: 1000001, snapshot: snapshot() });
  h.receive('visausd-radio:state', { epoch: 'epoch-1', serverTimeMs: 1000000, snapshot: snapshot(1000000, 99) });
  assert.equal(h.messages.length, 1);
  assert.equal(h.messages[0].snapshot.sequence, 1);
  h.receive('visausd-radio:state', { epoch: 'epoch-2', serverTimeMs: 999999, snapshot: snapshot(999999, 2) });
  assert.equal(h.messages.at(-1).snapshot.sequence, 2);
  const report = h.events.get('__cfx_nui:audioError'); let acks = 0;
  report({ message: 'x'.repeat(500) }, () => { acks += 1; });
  report({ message: 'again' }, () => { acks += 1; });
  assert.equal(acks, 2); assert.equal(h.errors.length, 1);
  assert.ok(h.errors[0].length < 350);
});

test('real server scheduler gives multiple clients the same timeline and late join offset', () => {
  const h = server(); assert.equal(h.errors.length, 0);
  assert.ok(h.context.VisaUSDCore, 'UMD exports available across server scripts');
  h.request(1, 'first'); h.request(2, 'second');
  const first = h.outbound.find((message) => message[1] === 1)[2];
  const second = h.outbound.find((message) => message[1] === 2)[2];
  assert.deepEqual(first.snapshot, second.snapshot);
  assert.equal(first.epoch, second.epoch);
  assert.equal(first.nonce, 'first'); assert.equal(second.nonce, 'second');
  h.clock.now += 7500; h.request(3, 'late');
  const late = h.outbound.at(-1)[2];
  assert.equal(late.snapshot.sequence, first.snapshot.sequence);
  assert.equal(late.snapshot.item.id, first.snapshot.item.id);
  assert.equal(late.snapshot.offsetSeconds, 7.5);
  assert.equal(late.snapshot.startedAtMs, first.snapshot.startedAtMs);
  h.clock.now += 3000; h.tick(100);
  const broadcast = h.outbound.at(-1);
  assert.equal(broadcast[1], -1);
  assert.equal(broadcast[2].snapshot.sequence, 2);
  assert.equal(broadcast[2].snapshot.startedAtMs, 1010000);
  assert.equal(broadcast[2].snapshot.offsetSeconds, 0.5);
});

test('server throttles each player separately, bounds nonce and clears departed players', () => {
  const h = server();
  h.request(1, 'a'.repeat(200)); h.request(1, 'flood'); h.request(2, 'other');
  assert.equal(h.outbound.length, 2); assert.equal(h.outbound[0][2].nonce.length, 80);
  h.request(0, 'invalid'); h.request(-1, 'invalid'); h.request('bad', 'invalid');
  assert.equal(h.outbound.length, 2);
  h.clock.now += 500; h.request(1, {});
  assert.equal(h.outbound.at(-1)[2].nonce, null);
  h.context.source = 1; h.events.get('playerDropped')(); h.request(1, 'reconnected');
  assert.equal(h.outbound.at(-1)[2].nonce, 'reconnected');
});

test('server refuses missing files, external audio and song-count mismatch before accepting clients', () => {
  const external = catalog(); external.songs[0].file = 'https://stream.example/music.ogg';
  const wrongCount = config(); wrongCount.expectedSongCount = 51;
  for (const options of [{ missingFile: true }, { catalog: external }, { config: wrongCount }]) {
    const h = server(options);
    assert.equal(h.netEvents.size, 0); assert.equal(h.timers.size, 0);
    assert.equal(h.errors.length, 1); assert.match(h.errors[0], /NOT STARTED/);
  }
});

test('client clock calibration keeps the lowest RTT sample instead of a slower noisy reply', () => {
  const h = client();
  const nonce = h.outbound[0][1];
  h.clock.now += 100;
  h.receive('visausd-radio:state', { epoch: 'clock-epoch', serverTimeMs: 2000050, nonce, snapshot: snapshot(2000000) });
  assert.equal(h.ready().clockOffsetMs, 1000000);
  const slowerNonce = h.outbound.at(-1)[1];
  h.clock.now += 800;
  h.receive('visausd-radio:state', { epoch: 'clock-epoch', serverTimeMs: 2001000, nonce: slowerNonce, snapshot: snapshot(2000000) });
  assert.equal(h.messages.at(-1).clockOffsetMs, 1000000);
});

test('server clamps host clock rollback so clients cannot rewind the shared timeline', () => {
  const h = server(); h.request(1, 'initial');
  const initial = h.outbound.at(-1)[2];
  h.clock.now -= 50000; h.request(2, 'after-clock-change');
  const after = h.outbound.at(-1)[2];
  assert.equal(after.serverTimeMs, initial.serverTimeMs);
  assert.deepEqual(after.snapshot, initial.snapshot);
  assert.equal(h.errors.length, 0);
});
