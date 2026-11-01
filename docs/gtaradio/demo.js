/* SPDX-License-Identifier: MIT — Standalone browser preview adapter. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const audio = $('radio-audio');
  const playButton = $('play-button');
  const nextButton = $('next-button');
  const volumeInput = $('volume');
  const list = $('track-list');
  const search = $('search');
  const resourceUrl = new URL('./', location.href).href;
  const audioBaseUrl = 'https://raw.githubusercontent.com/sacs2cd-web/dualscan-os/main/FiveM/visausd-radio/';
  let catalog;
  let scheduler;
  let player;
  let current;
  let audition;
  let listening = false;
  let volume = 0.65;
  let stationGain = 1;
  let previousVolume = volume;
  let revision = 0;
  let timer;
  let visibleRows = [];
  let currentRowId = null;

  const formatTime = value => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  };
  function report(error) {
    $('error-message').hidden = false;
    $('error-message').textContent = error.name === 'NotAllowedError'
      ? 'Your browser paused the audio. Press Tune in to start listening.'
      : `Playback needs attention: ${error.message || error}`;
    if (error.name === 'NotAllowedError' && player) {
      listening = false;
      player.setListening(false);
      updateControls();
    }
  }
  function updateControls() {
    $('play-label').textContent = listening ? 'Pause' : 'Tune in';
    $('play-icon').textContent = listening ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', listening ? 'Pause VisaUSD™ Radio' : 'Tune in to VisaUSD™ Radio');
    $('broadcast-status').textContent = listening ? 'YOU’RE ON VisaUSD™ Radio' : 'READY WHEN YOU ARE';
    $('sound-bars').classList.toggle('playing', listening);
    $('player-note').textContent = audition
      ? 'Track preview. The station returns when this track ends.'
      : listening ? 'All good music. All good company.' : 'Press tune in. Make yourself at home.';
    for (const row of visibleRows) {
      const active = current && row.dataset.trackId === current.item.id;
      const marker = row.querySelector('.row-play');
      marker.textContent = active && listening ? 'Ⅱ' : '▶';
    }
  }
  function updateVolume() {
    player?.setVolume(volume * stationGain);
    const percent = Math.round(volume * 100);
    volumeInput.value = String(percent);
    volumeInput.style.background = `linear-gradient(to right,#a8b7cb ${percent}%,#34445b ${percent}%)`;
    $('volume-label').textContent = `${percent}%`;
    $('mute-button').setAttribute('aria-label', volume > 0 ? 'Mute audio' : 'Unmute audio');
    $('mute-button').style.opacity = volume > 0 ? '1' : '.45';
  }
  function updateTrack(snapshot) {
    current = snapshot;
    $('track-title').textContent = snapshot.item.title || snapshot.item.id;
    $('track-artist').textContent = snapshot.item.artist || 'VisaUSD™ Radio';
    $('track-type').textContent = ({ song: 'MUSIC', dj: 'ON THE MIC', ad: 'STATION BREAK', id: 'VisaUSD™ Radio ID' })[snapshot.item.type] || 'ON AIR';
    const index = catalog.songs.findIndex(track => track.id === snapshot.item.id);
    $('track-position').textContent = index < 0 ? 'BETWEEN THE TRACKS' : `${String(index + 1).padStart(2, '0')} / ${catalog.songs.length}`;
    $('duration').textContent = formatTime(snapshot.item.durationSeconds);
    if (currentRowId !== snapshot.item.id) {
      currentRowId = snapshot.item.id;
      for (const row of visibleRows) {
        const active = row.dataset.trackId === currentRowId;
        row.classList.toggle('is-current', active);
        if (active) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
      }
      $('error-message').hidden = true;
    }
    updateControls();
  }
  function tick() {
    if (!scheduler || !player) return;
    try {
      const now = Date.now();
      const broadcast = scheduler.current(now);
      if (audition && now >= audition.endsAtMs) audition = null;
      const snapshot = audition || broadcast;
      updateTrack(snapshot);
      player.apply(snapshot);
      const offset = Math.max(0, Math.min(snapshot.item.durationSeconds, (now - snapshot.startedAtMs) / 1000));
      $('elapsed').textContent = formatTime(offset);
      $('progress-fill').style.width = `${Math.min(100, offset / snapshot.item.durationSeconds * 100)}%`;
    } catch (error) { report(error); }
  }
  function auditionTrack(track) {
    const now = Date.now();
    audition = { sequence: `preview-${++revision}`, item: track,
      startedAtMs: now, endsAtMs: now + track.durationSeconds * 1000, offsetSeconds: 0 };
    listening = true;
    tick();
    player.setListening(true);
    updateControls();
  }
  function renderLibrary() {
    const query = search.value.trim().toLocaleLowerCase();
    const tracks = catalog.songs.filter(track => `${track.title || ''} ${track.artist || ''} ${track.album || ''}`.toLocaleLowerCase().includes(query));
    const fragment = document.createDocumentFragment();
    visibleRows = [];
    for (const track of tracks) {
      const index = catalog.songs.indexOf(track);
      const row = document.createElement('button');
      row.className = 'track-row';
      row.type = 'button';
      row.dataset.trackId = track.id;
      row.setAttribute('aria-label', `Preview ${track.title || track.id} by ${track.artist || 'VisaUSD™ Radio'}`);
      const number = document.createElement('span');
      number.className = 'track-number'; number.textContent = String(index + 1).padStart(2, '0');
      const titleCell = document.createElement('span'); titleCell.className = 'track-title-cell';
      const cover = document.createElement('span'); cover.className = 'track-cover'; cover.setAttribute('aria-hidden', 'true');
      const img = document.createElement('img'); img.src = 'assets/visausd-logomark.png'; img.alt = ''; img.loading = 'lazy';
      cover.append(img);
      const copy = document.createElement('span'); copy.className = 'track-copy';
      const title = document.createElement('strong'); title.textContent = track.title || track.id;
      const artist = document.createElement('small'); artist.textContent = track.artist || 'VisaUSD™ Radio';
      copy.append(title, artist); titleCell.append(cover, copy);
      const format = document.createElement('span'); format.className = 'format-tag'; format.textContent = 'OGG · STREAM';
      const duration = document.createElement('span'); duration.className = 'track-time'; duration.textContent = formatTime(track.durationSeconds);
      const play = document.createElement('span'); play.className = 'row-play'; play.textContent = '▶'; play.setAttribute('aria-hidden', 'true');
      row.append(number, titleCell, format, duration, play);
      row.addEventListener('click', () => auditionTrack(track));
      fragment.append(row); visibleRows.push(row);
    }
    if (!tracks.length) {
      const empty = document.createElement('p'); empty.className = 'empty-state'; empty.textContent = 'No tracks found. Try another title or artist.'; fragment.append(empty);
    }
    list.replaceChildren(fragment);
    $('song-count').textContent = String(tracks.length);
    $('library-caption').textContent = query ? `${tracks.length} MATCHING ${tracks.length === 1 ? 'TRACK' : 'TRACKS'}` : 'THE COMPLETE COLLECTION';
    currentRowId = null;
    if (current) updateTrack(current);
  }

  playButton.addEventListener('click', () => {
    listening = !listening;
    $('error-message').hidden = true;
    tick();
    player.setListening(listening);
    updateControls();
  });
  nextButton.addEventListener('click', () => {
    audition = null;
    scheduler.next(Date.now());
    tick();
  });
  volumeInput.addEventListener('input', () => {
    volume = Number(volumeInput.value) / 100;
    if (volume > 0) previousVolume = volume;
    updateVolume();
  });
  $('mute-button').addEventListener('click', () => {
    if (volume > 0) { previousVolume = volume; volume = 0; } else volume = previousVolume || 0.65;
    updateVolume();
  });
  search.addEventListener('input', () => { if (catalog) renderLibrary(); });
  window.addEventListener('pagehide', () => { clearInterval(timer); player?.destroy(); });

  async function loadJson(relative) {
    const response = await fetch(new URL(relative, resourceUrl));
    if (!response.ok) throw new Error(`Cannot load ${relative} (${response.status})`);
    return response.json();
  }
  async function initialize() {
    try {
      const [library, station] = await Promise.all([loadJson('config/playlist.json'), loadJson('config/station.json')]);
      catalog = library;
      scheduler = new VisaUSDCore.BroadcastScheduler({ catalog, config: station.schedule || station.scheduler || station.broadcast || {}, nowMs: Date.now() });
      player = new VisaUSDPlayer.LocalAudioPlayer({ audio, baseUrl: audioBaseUrl, preload: 'metadata', now: () => Date.now(),
        driftToleranceSeconds: station.driftToleranceSeconds || 0.75, onError: report });
      stationGain = Number.isFinite(station.stationGain) ? Math.min(1, Math.max(0, station.stationGain)) : 1;
      const defaultVolume = station.defaultUserVolume ?? station.defaultVolume;
      volume = Number.isFinite(defaultVolume) ? Math.min(1, Math.max(0, defaultVolume)) : volume;
      previousVolume = volume || 0.65;
      updateVolume();
      renderLibrary();
      tick();
      playButton.disabled = false;
      nextButton.disabled = false;
      if (library.demo === true || library.demoLibrary === true || library.metadata?.demo === true || library.kind === 'generated-demo') {
        $('library-footnote').textContent = 'Includes generated demo music. Replace it with your 51 songs before production. This preview shuffles per listener; FiveM uses one shared server broadcast.';
      }
      timer = setInterval(tick, 250);
    } catch (error) {
      $('track-title').textContent = 'The station is getting ready';
      $('player-note').textContent = 'Refresh the page and try tuning in again.';
      report(error);
    }
  }
  initialize();
})();
