/* Derived from Hellslicer/fivem-radio, MIT Copyright (c) 2017 Kevin Poirot.
 * Retains station-name override and target-selected native audio mixing. */
(() => {
  'use strict';
  const resource = GetCurrentResourceName();
  const TARGET = 'RADIO_13_JAZZ';
  const SCENE = 'DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE';
  const config = JSON.parse(LoadResourceFile(resource, 'config/station.json'));
  const priorLabel = GetLabelText(TARGET);
  let ready = false;
  let latestPacket = null;
  let clockOffsetMs = 0;
  let clockSamples = [];
  let epoch = null;
  let userPaused = false;
  const storedVolume = Number(GetResourceKvpString('visausd-radio:volume'));
  let userVolume = GetResourceKvpString('visausd-radio:volume') === null ? config.defaultUserVolume : Math.min(1, Math.max(0, Number.isFinite(storedVolume) ? storedVolume : config.defaultUserVolume));
  const pendingPings = new Map();
  const nui = (data) => { if (ready) SendNuiMessage(JSON.stringify(data)); };
  const notify = (message) => {
    console.log(`[VisaUSD™ Radio] ${message}`);
    if (GetResourceState('chat') === 'started') emit('chat:addMessage', { args: ['VisaUSD™ Radio', message] });
  };
  AddTextEntry(TARGET, config.stationName);
  const controller = new VisaUSDRadioController.RadioController({
    setNativeSuppressed(active) {
      SetFrontendRadioActive(!active);
      if (active) StartAudioScene(SCENE); else StopAudioScene(SCENE);
      SetPositionedPlayerVehicleRadioEmitterEnabled(!active);
    },
    setListening: (listening) => nui({ type: 'listening', listening }),
    setVolume: (volume) => nui({ type: 'volume', volume }),
  });
  const sendSnapshot = () => {
    if (latestPacket) nui({ type: 'snapshot', snapshot: latestPacket.snapshot, clockOffsetMs });
  };
  const requestState = () => {
    const sent = Date.now();
    const nonce = `${sent}-${Math.random().toString(36).slice(2, 8)}`;
    for (const [key, at] of pendingPings) if (sent - at > 30000) pendingPings.delete(key);
    pendingPings.set(nonce, sent);
    emitNet('visausd-radio:requestState', nonce);
  };
  onNet('visausd-radio:state', (packet) => {
    if (!packet?.snapshot || !Number.isFinite(packet.serverTimeMs)) return;
    if (packet.epoch !== epoch) { epoch = packet.epoch; clockSamples = []; latestPacket = null; }
    const received = Date.now();
    if (pendingPings.has(packet.nonce)) {
      const sent = pendingPings.get(packet.nonce);
      pendingPings.delete(packet.nonce);
      const rtt = received - sent;
      if (rtt >= 0 && rtt < 10000) {
        clockSamples.push({ rtt, offset: packet.serverTimeMs + rtt / 2 - received });
        clockSamples = clockSamples.slice(-8);
        clockOffsetMs = clockSamples.reduce((a, b) => a.rtt <= b.rtt ? a : b).offset;
      }
    } else if (!clockSamples.length) clockOffsetMs = packet.serverTimeMs - received;
    if (latestPacket && packet.serverTimeMs < latestPacket.serverTimeMs) return;
    latestPacket = packet;
    sendSnapshot();
  });
  RegisterNuiCallbackType('ready');
  on('__cfx_nui:ready', (_data, cb) => {
    ready = true;
    cb({ config, clockOffsetMs, snapshot: latestPacket?.snapshot || null, listening: controller.listening, volume: Math.max(0, controller.volume) });
    requestState();
  });
  RegisterNuiCallbackType('audioError');
  let lastAudioErrorAt = 0;
  on('__cfx_nui:audioError', (data, cb) => {
    cb({ ok: true });
    if (Date.now() - lastAudioErrorAt > 10000) {
      lastAudioErrorAt = Date.now();
      console.error(`[VisaUSD™ Radio] NUI audio: ${String(data?.message || 'unknown error').slice(0, 300)}`);
    }
  });
  const poll = () => {
    const ped = PlayerPedId();
    const state = controller.update({
      inVehicle: ready && Boolean(latestPacket) && IsPedInAnyVehicle(ped, false) && !IsEntityDead(ped),
      radioEnabled: IsPlayerVehRadioEnable(),
      station: GetPlayerRadioStationName(),
      paused: config.pauseOnPauseMenu && IsPauseMenuActive(),
      userPaused,
      musicVolume: config.followGameMusicVolume ? GetProfileSetting(306) / 10 : 1,
      userVolume,
      stationGain: config.stationGain,
    });
    return state;
  };
  const pollTimer = setInterval(poll, 100);
  const syncTimer = setInterval(requestState, Math.max(1000, config.clockSyncIntervalMs));
  RegisterCommand('visausdradio', (_source, args) => {
    const action = (args[0] || 'help').toLowerCase();
    if (action === 'pause' || action === 'resume') {
      userPaused = action === 'pause';
      poll();
      notify(userPaused ? 'Paused locally. Resume rejoins the live broadcast.' : 'Resumed the live broadcast.');
    } else if (action === 'volume') {
      const value = Number(args[1]);
      if (args[1] === undefined || !Number.isFinite(value) || value < 0 || value > 100) return notify('Usage: /visausdradio volume 0–100');
      userVolume = value / 100;
      SetResourceKvp('visausd-radio:volume', String(userVolume));
      poll();
      notify(`Volume ${value}%.`);
    } else if (action === 'tune') {
      const vehicle = GetVehiclePedIsIn(PlayerPedId(), false);
      if (!vehicle) return notify('Enter a vehicle to tune in.');
      SetVehRadioStation(vehicle, TARGET);
      requestState();
    } else if (action === 'status') {
      const snapshot = latestPacket?.snapshot;
      notify(`${snapshot ? `${snapshot.item.title} — ${snapshot.item.artist || 'VisaUSD™ Radio'} (segment ${snapshot.sequence})` : 'Waiting for broadcast'}; listening=${controller.listening}; gain=${controller.volume.toFixed(2)}; clock offset=${Math.round(clockOffsetMs)}ms.`);
    } else notify('/visausdradio tune | pause | resume | volume 0–100 | status');
  }, false);
  on('onClientResourceStop', (name) => {
    if (name !== resource) return;
    clearInterval(pollTimer);
    clearInterval(syncTimer);
    controller.stop();
    nui({ type: 'shutdown' });
    AddTextEntry(TARGET, priorLabel && priorLabel !== 'NULL' ? priorLabel : 'Worldwide FM');
  });
  requestState();
})();
