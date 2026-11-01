/* SPDX-License-Identifier: MIT */
(() => {
  let player;
  let clockOffsetMs = 0;
  let initialized = false;
  const queue = [];
  const callback = (name, data) => fetch(`https://${GetParentResourceName()}/${name}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((response) => response.json());
  const receive = (data) => {
    if (!initialized) { queue.push(data); return; }
    if (data.type === 'snapshot') {
      clockOffsetMs = data.clockOffsetMs;
      player.apply(data.snapshot);
    } else if (data.type === 'listening') player.setListening(data.listening);
    else if (data.type === 'volume') player.setVolume(data.volume);
    else if (data.type === 'shutdown') player.destroy();
  };
  window.addEventListener('message', (event) => receive(event.data));
  async function start() {
    try {
      const data = await callback('ready', {});
      clockOffsetMs = data.clockOffsetMs;
      player = new VisaUSDPlayer.LocalAudioPlayer({
        audio: document.getElementById('radio'), baseUrl: new URL('../', location.href).href,
        now: () => Date.now() + clockOffsetMs,
        driftToleranceSeconds: data.config.driftToleranceSeconds,
        onError: (error) => callback('audioError', { message: error.message }).catch(() => {}),
      });
      player.setVolume(data.volume);
      if (data.snapshot) player.apply(data.snapshot);
      player.setListening(data.listening);
      initialized = true;
      queue.splice(0).forEach(receive);
    } catch (error) { console.error('[VisaUSD™ Radio] NUI init failed', error); setTimeout(start, 1000); }
  }
  start();
})();
