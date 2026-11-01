/* SPDX-License-Identifier: MIT — Local media transport, independent of FiveM. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.VisaUSDPlayer = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function localAssetUrl(file, baseUrl) {
    if (typeof file !== 'string' || !/^audio\/(songs|dj|ads|ids)\/[a-zA-Z0-9_-]+\.ogg$/.test(file)) {
      throw new TypeError('Audio must be a packaged audio/{songs,dj,ads,ids}/name.ogg asset');
    }
    return new URL(file, baseUrl).href;
  }
  const clamp = (value) => Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
  class LocalAudioPlayer {
    constructor({ audio, baseUrl, now = () => Date.now(), onError = () => {}, onState = () => {}, assetLoader = null, driftToleranceSeconds = 0.75 }) {
      if (!audio || typeof audio.play !== 'function') throw new TypeError('An audio element is required');
      this.audio = audio;
      this.baseUrl = baseUrl;
      this.now = now;
      this.onError = onError;
      this.onState = onState;
      this.assetLoader = assetLoader;
      this.assetLoadId = 0;
      this.assetLoading = false;
      this.assetFailed = false;
      this.releaseAsset = null;
      this.driftToleranceSeconds = driftToleranceSeconds;
      this.listening = false;
      this.listeningRevision = 0;
      this.snapshot = null;
      this.key = null;
      this.playPending = false;
      this.destroyed = false;
      this.handlers = {
        loadedmetadata: () => { this.sync(true); this.play(); },
        canplay: () => { this.sync(); this.play(); },
        error: () => this.fail(new Error(`Cannot decode packaged audio: ${this.snapshot?.item?.file || 'unknown'} (media error ${audio.error?.code || '?'})`)),
        ended: () => { this.onState({ type: 'ended', item: this.snapshot?.item }); },
      };
      for (const [event, fn] of Object.entries(this.handlers)) audio.addEventListener(event, fn);
      audio.preload = 'auto';
      audio.loop = false;
    }
    fail(error) { if (!this.destroyed) this.onError(error); }
    apply(snapshot) {
      if (this.destroyed) return;
      if (!snapshot || !snapshot.item || !Number.isFinite(snapshot.startedAtMs) || !Number.isFinite(snapshot.endsAtMs) || snapshot.endsAtMs <= snapshot.startedAtMs) {
        throw new TypeError('Invalid broadcast snapshot');
      }
      const url = localAssetUrl(snapshot.item.file, this.baseUrl);
      const key = `${snapshot.sequence}:${snapshot.startedAtMs}:${snapshot.item.file}`;
      this.snapshot = snapshot;
      if (key !== this.key) {
        this.key = key;
        this.audio.pause();
        this.loadAsset(url);
      }
      this.sync();
      this.play();
    }
    loadAsset(url) {
      const loadId = ++this.assetLoadId;
      this.assetFailed = false;
      if (this.releaseAsset) { this.releaseAsset(); this.releaseAsset = null; }
      if (!this.assetLoader) {
        this.audio.src = url;
        this.audio.load();
        return;
      }
      this.assetLoading = true;
      this.audio.removeAttribute('src');
      this.audio.load();
      Promise.resolve().then(() => this.assetLoader(url)).then((asset) => {
        if (!asset || typeof asset.url !== 'string') throw new TypeError('assetLoader must return {url, release?}');
        if (this.destroyed || loadId !== this.assetLoadId) { asset.release?.(); return; }
        this.releaseAsset = asset.release || null;
        this.assetLoading = false;
        this.audio.src = asset.url;
        this.audio.load();
        this.sync(true);
        this.play();
      }).catch((error) => {
        if (!this.destroyed && loadId === this.assetLoadId) {
          this.assetLoading = false;
          this.assetFailed = true;
          this.fail(error);
        }
      });
    }
    sync(force = false) {
      if (!this.snapshot || this.audio.readyState < 1 || this.destroyed || this.assetLoading || this.assetFailed) return;
      const duration = this.snapshot.item.durationSeconds;
      const end = Number.isFinite(this.audio.duration) ? Math.min(duration, this.audio.duration) : duration;
      const wanted = Math.max(0, Math.min(Math.max(0, end - 0.01), (this.now() - this.snapshot.startedAtMs) / 1000));
      if (force || Math.abs(this.audio.currentTime - wanted) > this.driftToleranceSeconds) {
        try { this.audio.currentTime = wanted; } catch (error) { this.fail(error); }
      }
    }
    play() {
      if (!this.listening || !this.snapshot || this.destroyed || this.assetLoading || this.assetFailed || this.playPending || !this.audio.paused || this.now() >= this.snapshot.endsAtMs) return;
      this.playPending = true;
      const playingKey = this.key;
      const playingRevision = this.listeningRevision;
      try {
        Promise.resolve(this.audio.play()).catch((error) => {
          // Changing a source or tuning away legitimately interrupts play().
          if (error.name !== 'AbortError' && this.listening) this.fail(error);
        }).finally(() => {
          this.playPending = false;
          // A tune-away may have happened while the play promise was pending.
          if (!this.listening || this.destroyed) this.audio.pause();
          else if (this.key !== playingKey || this.listeningRevision !== playingRevision) this.play();
        });
      } catch (error) { this.playPending = false; this.fail(error); }
    }
    setListening(value) {
      if (this.listening !== Boolean(value)) this.listeningRevision += 1;
      this.listening = Boolean(value);
      if (!this.listening) this.audio.pause();
      else { this.sync(true); this.play(); }
      this.onState({ type: this.listening ? 'listening' : 'paused', item: this.snapshot?.item });
    }
    setVolume(value) { this.audio.volume = clamp(value); }
    destroy() {
      this.destroyed = true;
      this.assetLoadId += 1;
      if (this.releaseAsset) { this.releaseAsset(); this.releaseAsset = null; }
      this.listening = false;
      this.audio.pause();
      for (const [event, fn] of Object.entries(this.handlers)) this.audio.removeEventListener(event, fn);
      this.audio.removeAttribute('src');
      this.audio.load();
    }
  }
  return { LocalAudioPlayer, localAssetUrl, clamp };
});
