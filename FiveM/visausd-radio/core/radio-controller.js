/* SPDX-License-Identifier: MIT — Pure station selection state machine. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VisaUSDRadioController = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const STATION = 'RADIO_13_JAZZ';
  const clamp = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  class RadioController {
    constructor(effects) { this.effects = effects; this.suppressed = false; this.listening = false; this.volume = -1; }
    update({ inVehicle, radioEnabled, station, paused = false, userPaused = false, musicVolume = 1, userVolume = 1, stationGain = 1 }) {
      const selected = Boolean(inVehicle && radioEnabled && station === STATION);
      const listening = selected && !paused && !userPaused;
      if (selected !== this.suppressed) {
        this.effects.setNativeSuppressed(selected);
        this.suppressed = selected;
      }
      if (listening !== this.listening) {
        this.effects.setListening(listening);
        this.listening = listening;
      }
      const volume = clamp(clamp(musicVolume) * clamp(userVolume) * clamp(stationGain));
      if (volume !== this.volume) { this.effects.setVolume(volume); this.volume = volume; }
      return { selected, listening, volume };
    }
    stop() {
      this.effects.setListening(false);
      if (this.suppressed) this.effects.setNativeSuppressed(false);
      this.suppressed = false;
      this.listening = false;
    }
  }
  return { RadioController, STATION };
});
