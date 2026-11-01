/*
 * VisaUSD™ Radio broadcast core. No FiveM, browser, filesystem, or clock APIs.
 * SPDX-License-Identifier: MIT
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VisaUSDCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const DEFAULT_CONFIG = Object.freeze({
    songsBetweenAds: 4,
    songsBetweenDj: 2,
    songsBetweenIds: 1,
    adsPerBreak: 1,
  });
  const CATEGORIES = Object.freeze({ songs: 'song', dj: 'dj', ads: 'ad', ids: 'id' });

  function time(value, name) {
    if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
      throw new TypeError(`${name} must be a finite, nonnegative millisecond timestamp`);
    }
    return value;
  }

  class ShuffleBag {
    constructor(items, rng = Math.random) {
      if (!Array.isArray(items) || items.length === 0) {
        throw new TypeError('ShuffleBag requires a nonempty item array');
      }
      if (typeof rng !== 'function') throw new TypeError('rng must be a function');
      this.items = items.slice();
      this.rng = rng;
      this.remaining = [];
      this.previous = undefined;
    }

    draw() {
      if (this.remaining.length === 0) {
        this.remaining = this.items.slice();
        for (let i = this.remaining.length - 1; i > 0; i -= 1) {
          const random = this.rng();
          if (!Number.isFinite(random) || random < 0 || random >= 1) {
            throw new TypeError('rng must return a finite number in [0, 1)');
          }
          const j = Math.floor(random * (i + 1));
          [this.remaining[i], this.remaining[j]] = [this.remaining[j], this.remaining[i]];
        }
        // draw() pops from the end. Preserve the full shuffled cycle while
        // preventing the last song of one cycle from opening the next cycle.
        const last = this.remaining.length - 1;
        if (last > 0 && this.remaining[last] === this.previous) {
          [this.remaining[0], this.remaining[last]] = [this.remaining[last], this.remaining[0]];
        }
      }
      this.previous = this.remaining.pop();
      return this.previous;
    }
  }

  function validateCatalog(catalog) {
    if (!catalog || typeof catalog !== 'object' || Array.isArray(catalog)) {
      throw new TypeError('catalog must be an object');
    }
    const normalized = {};
    const ids = new Set();
    for (const [category, type] of Object.entries(CATEGORIES)) {
      const items = catalog[category] === undefined ? [] : catalog[category];
      if (!Array.isArray(items)) throw new TypeError(`catalog.${category} must be an array`);
      normalized[category] = items.map((item, index) => {
        const path = `catalog.${category}[${index}]`;
        if (!item || typeof item !== 'object' || Array.isArray(item)) {
          throw new TypeError(`${path} must be an object`);
        }
        if (typeof item.id !== 'string' || !item.id.trim() || ids.has(item.id)) {
          throw new TypeError(`${path}.id must be a unique, nonempty string`);
        }
        ids.add(item.id);
        if (item.type !== type) throw new TypeError(`${path}.type must be ${type}`);
        if (!Number.isFinite(item.durationSeconds) || item.durationSeconds < 0.001 ||
            item.durationSeconds * 1000 > Number.MAX_SAFE_INTEGER) {
          throw new TypeError(`${path}.durationSeconds must be finite and at least 0.001`);
        }
        if (typeof item.file !== 'string' || !item.file.trim()) {
          throw new TypeError(`${path}.file must be a nonempty string`);
        }
        return Object.freeze({ ...item });
      });
      Object.freeze(normalized[category]);
    }
    if (normalized.songs.length === 0) throw new TypeError('catalog.songs must contain at least one song');
    return Object.freeze(normalized);
  }

  function validateConfig(config) {
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      throw new TypeError('config must be an object');
    }
    const result = { ...DEFAULT_CONFIG, ...config };
    for (const key of Object.keys(DEFAULT_CONFIG)) {
      if (!Number.isSafeInteger(result[key]) || result[key] < 0) {
        throw new TypeError(`config.${key} must be a nonnegative safe integer (0 disables)`);
      }
    }
    // Breaks are intentionally small, bounded queues, even with bad admin input.
    if (result.adsPerBreak > 100) throw new TypeError('config.adsPerBreak must be at most 100');
    return Object.freeze(result);
  }

  class BroadcastScheduler {
    constructor({ catalog, config = {}, rng = Math.random, nowMs = 0 } = {}) {
      this.catalog = validateCatalog(catalog);
      this.config = validateConfig(config);
      if (typeof rng !== 'function') throw new TypeError('rng must be a function');
      this.bags = {};
      for (const [category, items] of Object.entries(this.catalog)) {
        if (items.length) this.bags[category] = new ShuffleBag(items, rng);
      }
      this.completedSongs = 0;
      this.sequence = 1;
      this.pending = [];
      this.item = this.bags.songs.draw();
      this.startedAtMs = time(nowMs, 'nowMs');
      this.endsAtMs = this.startedAtMs + this.item.durationSeconds * 1000;
    }

    _transition(atMs) {
      if (this.item.type === 'song') {
        this.completedSongs += 1;
        const due = (every) => every > 0 && this.completedSongs % every === 0;
        if (this.bags.dj && due(this.config.songsBetweenDj)) this.pending.push(this.bags.dj.draw());
        if (this.bags.ads && due(this.config.songsBetweenAds)) {
          for (let i = 0; i < this.config.adsPerBreak; i += 1) this.pending.push(this.bags.ads.draw());
        }
        if (this.bags.ids && due(this.config.songsBetweenIds)) this.pending.push(this.bags.ids.draw());
      }
      this.item = this.pending.length ? this.pending.shift() : this.bags.songs.draw();
      this.sequence += 1;
      this.startedAtMs = atMs;
      this.endsAtMs = atMs + this.item.durationSeconds * 1000;
    }

    current(nowMs) {
      time(nowMs, 'nowMs');
      if (nowMs < this.startedAtMs) throw new RangeError('BroadcastScheduler cannot rewind its timeline');
      // Work is proportional to elapsed audio items, never elapsed milliseconds.
      // Start each missed item at the preceding exact boundary, avoiding drift
      // when a server tick is delayed or there have been no listeners.
      while (nowMs >= this.endsAtMs) this._transition(this.endsAtMs);
      return Object.freeze({
        sequence: this.sequence,
        item: this.item,
        startedAtMs: this.startedAtMs,
        endsAtMs: this.endsAtMs,
        offsetSeconds: (nowMs - this.startedAtMs) / 1000,
      });
    }

    next(nowMs = this.endsAtMs) {
      time(nowMs, 'nowMs');
      if (nowMs < this.startedAtMs) throw new RangeError('BroadcastScheduler cannot rewind its timeline');
      // Explicitly skip the current item, anchoring the next one to nowMs.
      // Unlike current(), this operation deliberately changes the timeline.
      this._transition(nowMs);
      return this.current(nowMs);
    }
  }

  return Object.freeze({ BroadcastScheduler, ShuffleBag, DEFAULT_CONFIG });
});
