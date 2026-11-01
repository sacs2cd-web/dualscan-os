'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const { BroadcastScheduler, ShuffleBag } = require('../core/scheduler.js');

function seeded(seed = 7) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
}
function item(id, type = 'song', durationSeconds = 10) {
  return { id, type, file: `audio/${id}.ogg`, title: id, artist: 'VisaUSD™', durationSeconds };
}
const noBreaks = { songsBetweenAds: 0, songsBetweenDj: 0, songsBetweenIds: 0 };
function catalog(n = 51) {
  return { songs: Array.from({ length: n }, (_, i) => item(`song-${i + 1}`)), dj: [], ads: [], ids: [] };
}

test('each complete 51-song cycle is a permutation without immediate cycle-boundary repeats', () => {
  const scheduler = new BroadcastScheduler({ catalog: catalog(), config: noBreaks, rng: seeded() });
  const played = Array.from({ length: 51 * 20 }, (_, i) => scheduler.current(i * 10000).item.id);
  for (let start = 0; start < played.length; start += 51) {
    assert.equal(new Set(played.slice(start, start + 51)).size, 51);
    if (start) assert.notEqual(played[start], played[start - 1]);
  }
  assert.notDeepEqual(played.slice(0, 51), played.slice(51, 102));
});

test('shuffle is reproducible when supplied the same RNG and validates RNG output', () => {
  const a = new ShuffleBag([1, 2, 3, 4], seeded(10));
  const b = new ShuffleBag([1, 2, 3, 4], seeded(10));
  assert.deepEqual(Array.from({ length: 30 }, () => a.draw()), Array.from({ length: 30 }, () => b.draw()));
  assert.throws(() => new ShuffleBag([1, 2], () => 1).draw(), /rng/);
  assert.throws(() => new ShuffleBag([1, 2], () => NaN).draw(), /rng/);
  assert.throws(() => new ShuffleBag([]), /nonempty/);
});

test('DJ, ads, and IDs occur only between songs and honor independent song frequencies', () => {
  const library = catalog(5);
  library.dj = [item('dj', 'dj', 2)];
  library.ads = [item('ad-a', 'ad', 3), item('ad-b', 'ad', 3)];
  library.ids = [item('id', 'id', 1)];
  const scheduler = new BroadcastScheduler({ catalog: library, rng: seeded(), config: {
    songsBetweenDj: 2, songsBetweenAds: 3, songsBetweenIds: 1, adsPerBreak: 2,
  } });
  const events = [];
  let now = 0;
  while (events.filter(x => x.type === 'song').length < 7) {
    const current = scheduler.current(now);
    events.push(current.item);
    now = current.endsAtMs;
  }
  assert.deepEqual(events.map(x => x.type), [
    'song', 'id',
    'song', 'dj', 'id',
    'song', 'ad', 'ad', 'id',
    'song', 'dj', 'id',
    'song', 'id',
    'song', 'dj', 'ad', 'ad', 'id',
    'song',
  ]);
  const ads = events.filter(x => x.type === 'ad');
  assert.notEqual(ads[0].id, ads[1].id);
  assert.notEqual(ads[1].id, ads[2].id);
});

test('empty optional categories and zero frequencies produce uninterrupted songs', () => {
  const empty = new BroadcastScheduler({ catalog: catalog(2), rng: seeded() });
  assert.equal(empty.current(10000).item.type, 'song');
  const populated = catalog(2);
  populated.dj = [item('dj', 'dj')];
  populated.ads = [item('ad', 'ad')];
  populated.ids = [item('id', 'id')];
  const disabled = new BroadcastScheduler({ catalog: populated, config: noBreaks });
  assert.equal(disabled.current(100000).sequence, 11);
  assert.equal(disabled.current(100000).item.type, 'song');
});

test('listeners and late joins share the same authoritative item and exact broadcast offset', () => {
  const scheduler = new BroadcastScheduler({ catalog: catalog(), config: noBreaks, rng: seeded(), nowMs: 5000 });
  const listenerA = scheduler.current(17750);
  const listenerB = scheduler.current(17750);
  assert.deepEqual(listenerA, listenerB);
  assert.equal(listenerA.sequence, 2);
  assert.equal(listenerA.startedAtMs, 15000);
  assert.equal(listenerA.endsAtMs, 25000);
  assert.equal(listenerA.offsetSeconds, 2.75);
  const lateJoin = scheduler.current(98000);
  assert.equal(lateJoin.sequence, 10);
  assert.equal(lateJoin.offsetSeconds, 3);
  assert.equal(lateJoin.startedAtMs, 95000);
});

test('delayed updates match continuously stepped playback including every missed break', () => {
  const library = catalog();
  library.ads = [item('ad-a', 'ad', 1.5), item('ad-b', 'ad', 2.25)];
  library.ids = [item('id', 'id', 0.25)];
  const a = new BroadcastScheduler({ catalog: library, rng: seeded() });
  const b = new BroadcastScheduler({ catalog: library, rng: seeded() });
  for (let now = 0; now < 10000000; now += 1371) a.current(now);
  assert.deepEqual(a.current(10000000), b.current(10000000));
});

test('exact end boundaries select the next item without accumulating drift', () => {
  const scheduler = new BroadcastScheduler({ catalog: { songs: [item('one', 'song', 1.25)] }, config: noBreaks });
  assert.equal(scheduler.current(1249).offsetSeconds, 1.249);
  assert.equal(scheduler.current(1250).sequence, 2);
  assert.equal(scheduler.current(1250).offsetSeconds, 0);
  assert.equal(scheduler.current(2500000).startedAtMs, 2500000);
});

test('explicit next advances precisely one item and can anchor a skip to the current time', () => {
  const scheduler = new BroadcastScheduler({ catalog: catalog(3), config: noBreaks, rng: seeded() });
  assert.equal(scheduler.next().sequence, 2);
  assert.equal(scheduler.current(10000).offsetSeconds, 0);
  assert.equal(scheduler.next(11500).sequence, 3);
  assert.equal(scheduler.current(12000).offsetSeconds, 0.5);
});

test('invalid catalog, duplicate IDs, invalid timing, and invalid frequencies fail explicitly', () => {
  assert.throws(() => new BroadcastScheduler({ catalog: { songs: [] } }), /at least one song/);
  for (const duration of [0, -1, Infinity, NaN, '10']) {
    assert.throws(() => new BroadcastScheduler({ catalog: { songs: [item('bad', 'song', duration)] } }), /durationSeconds/);
  }
  assert.throws(() => new BroadcastScheduler({ catalog: { songs: [item('same'), item('same')] } }), /unique/);
  assert.throws(() => new BroadcastScheduler({ catalog: { songs: [item('bad', 'ad')] } }), /type/);
  assert.throws(() => new BroadcastScheduler({ catalog: catalog(), config: { songsBetweenAds: -1 } }), /songsBetweenAds/);
  assert.throws(() => new BroadcastScheduler({ catalog: catalog(), config: { songsBetweenDj: 1.5 } }), /songsBetweenDj/);
  assert.throws(() => new BroadcastScheduler({ catalog: catalog(), config: { adsPerBreak: 101 } }), /adsPerBreak/);
  const scheduler = new BroadcastScheduler({ catalog: catalog(), config: noBreaks });
  assert.throws(() => scheduler.current(NaN), /timestamp/);
  scheduler.current(20000);
  assert.throws(() => scheduler.current(10000), /rewind/);
});

test('returned metadata and arrays cannot be mutated to corrupt subsequent playback', () => {
  const source = catalog(1);
  const scheduler = new BroadcastScheduler({ catalog: source, config: noBreaks });
  source.songs[0].durationSeconds = 999;
  assert.equal(scheduler.current(0).endsAtMs, 10000);
  assert.throws(() => { scheduler.current(0).item.durationSeconds = 999; }, TypeError);
  assert.throws(() => { scheduler.catalog.songs.push(item('other')); }, TypeError);
});

test('core loads in a FiveM-style script context without CommonJS or browser APIs', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../core/scheduler.js'), 'utf8'), context);
  assert.equal(typeof context.VisaUSDCore.BroadcastScheduler, 'function');
  const result = vm.runInContext(`new VisaUSDCore.BroadcastScheduler({catalog:{songs:[{
    id:'one',type:'song',file:'audio/one.ogg',durationSeconds:1
  }]}}).current(500)`, context);
  assert.equal(result.offsetSeconds, 0.5);
});
