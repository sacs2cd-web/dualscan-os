/* Static, sample-only wrapper. It never calls a game server or wallet RPC. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const phone = $('phone');
  const buttons = [...document.querySelectorAll('[data-action]')];
  const sample = window.SampleGamingDemo;
  const embedded = new URLSearchParams(location.search).get('portal') === '1';
  document.body.classList.toggle('portal', embedded);
  let busy = false, latest = null, polling = false;
  function status(message, error = false) { $('demo-status').textContent = message; $('demo-status').classList.toggle('error', error); }
  function notifyHeight() {
    if (window.parent === window) return;
    window.parent.postMessage({ type: 'visausd-demo:resize', height: Math.ceil(document.body.getBoundingClientRect().height) }, location.origin);
  }
  function refreshPhone() { phone.contentWindow?.postMessage({ type: 'credits:notice', notice: { kind: 'updated' } }, location.origin); }
  function render(info) {
    latest = info;
    $('sample-pin').textContent = String(info.samplePin || '1234').split('').join(' ');
    $('recipient').value = info.recipient;
    $('connection-state').textContent = info.connected ? 'Connected' : info.pendingConnection ? 'Invitation pending' : 'Not connected';
    $('connection-state').classList.toggle('connected', info.connected);
    const match = info.match, active = match && ['PENDING', 'READY'].includes(match.status);
    $('invite').disabled = busy || info.connected || info.pendingConnection;
    $('cancel-invite').disabled = busy || !info.pendingConnection;
    $('entry').disabled = busy || !info.connected || active;
    $('settle').disabled = busy || match?.status !== 'READY';
    $('cancel').disabled = busy || !active;
    $('reset-demo').disabled = busy;
    if (match?.status === 'PENDING') $('match-description').textContent = 'Your opponent is ready. Approve your 25-credit entry in the phone to continue.';
    else if (match?.status === 'READY') $('match-description').textContent = 'Both entries are held. Finish with your sample player as winner, or cancel the entry.';
    else if (match?.status === 'SETTLED') $('match-description').textContent = 'The sample result is saved. Your 25-credit net win appears in the phone’s History.';
    else if (match?.status === 'CANCELLED') $('match-description').textContent = 'This entry was cancelled. Its held credits have been released.';
    else if (match?.status === 'EXPIRED') $('match-description').textContent = 'The sample entry expired. Request another to try again.';
    else $('match-description').textContent = 'Finish with your sample player as winner, or cancel to release the entry.';
    notifyHeight();
  }
  async function request(route, payload = {}) {
    if (!sample) throw new Error('The sample demo could not open. Reload this page.');
    const value = await sample.request(route, payload);
    if (!value.ok) throw new Error(value.error?.message || 'The sample game could not continue.');
    return value.data;
  }
  async function poll() {
    if (polling) return;
    polling = true;
    try { render(await request('info')); }
    catch (error) { status(error.message, true); }
    finally { polling = false; }
  }
  async function act(action) {
    if (busy) return;
    busy = true;
    if (latest) render(latest);
    status('Updating this browser’s sample game…');
    try {
      const payload = { action, ...(action === 'cancelInvite' ? { requestId: latest?.connection?.requestId } : {}) };
      const value = await request('demo', payload);
      status(value.message);
      refreshPhone();
    } catch (error) { status(error.message, true); }
    finally { busy = false; await poll(); if (latest) render(latest); }
  }
  for (const button of buttons) button.addEventListener('click', () => void act(button.dataset.action));
  $('open-phone').addEventListener('click', () => {
    phone.src = 'phone/index.html?embed=1&open=' + Date.now();
    status('Phone opened. Enter the sample PIN shown above.');
  });
  $('reset-demo').addEventListener('click', async () => {
    if (busy) return;
    busy = true;
    if (latest) render(latest);
    try {
      await request('reset');
      const prefix = 'visausd.sample.transfer.' + new URL('./', location.href).pathname;
      for (let i = localStorage.length - 1; i >= 0; i--) { const key = localStorage.key(i); if (key?.startsWith(prefix)) localStorage.removeItem(key); }
      phone.src = 'phone/index.html?embed=1&reset=' + Date.now();
      status('Sample reset. Unlock with PIN 1234 to start again.');
    } catch (error) { status(error.message, true); }
    finally { busy = false; await poll(); }
  });
  $('copy-recipient').addEventListener('click', async () => {
    if (!latest?.recipient) return;
    try { await navigator.clipboard.writeText(latest.recipient); status('Bob’s account copied. Open Send in the phone, paste it, and choose whole credits.'); }
    catch (_) { $('recipient').focus(); $('recipient').select(); status('Select and copy Bob’s account code, then paste it in the phone’s Send panel.'); }
  });
  sample?.subscribe(() => { if (!busy) void poll(); });
  phone.addEventListener('load', () => { void poll(); notifyHeight(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) void poll(); });
  window.addEventListener('load', notifyHeight);
  window.addEventListener('resize', notifyHeight);
  if (typeof ResizeObserver === 'function') new ResizeObserver(notifyHeight).observe(document.body);
  setInterval(() => { if (!document.hidden && !busy) void poll(); }, 3000);
  // Start the iframe after this page has created the shared sample engine.
  if (sample) phone.src = phone.dataset.src;
  void poll();
})();
