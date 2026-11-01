'use strict';
const test = require('node:test'); const assert = require('node:assert/strict');
const { RadioController, STATION } = require('../core/radio-controller');
function harness() { const calls = []; const c = new RadioController({ setNativeSuppressed: v => calls.push(['native', v]), setListening: v => calls.push(['listening', v]), setVolume: v => calls.push(['volume', v]) }); return { c, calls }; }
const tuned = { inVehicle: true, radioEnabled: true, station: STATION };
test('only Worldwide FM selection suppresses native audio; switching restores it', () => {
  const { c, calls } = harness();
  c.update({ ...tuned, station: 'RADIO_02_POP' }); assert.deepEqual(calls, [['volume', 1]]);
  c.update(tuned); c.update(tuned); assert.deepEqual(calls.slice(1), [['native', true], ['listening', true]]);
  c.update({ ...tuned, station: 'RADIO_01_CLASS_ROCK' }); assert.deepEqual(calls.slice(-2), [['native', false], ['listening', false]]);
});
test('pause/resume while tuned keeps Worldwide muted; exiting or radio off restores native', () => {
  const { c, calls } = harness(); c.update(tuned); calls.length = 0;
  c.update({ ...tuned, paused: true }); c.update(tuned); assert.deepEqual(calls, [['listening', false], ['listening', true]]);
  c.update({ ...tuned, inVehicle: false }); assert.deepEqual(calls.slice(-2), [['native', false], ['listening', false]]);
  c.update(tuned); c.update({ ...tuned, radioEnabled: false }); assert.equal(c.suppressed, false);
});
test('GTA music, station gain, and local user volume multiply without changing other stations', () => {
  const { c, calls } = harness();
  assert.equal(c.update({ ...tuned, musicVolume: 0.5, userVolume: 0.5, stationGain: 0.8 }).volume, 0.2);
  c.update({ ...tuned, musicVolume: 0 }); assert.deepEqual(calls.at(-1), ['volume', 0]);
  c.update({ ...tuned, userPaused: true }); assert.equal(c.listening, false); assert.equal(c.suppressed, true);
  c.stop(); assert.deepEqual(calls.slice(-2), [['listening', false], ['native', false]]);
});
