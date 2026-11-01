/* Browser sample copy of the Gaming Credits panels. Not a FiveM authority. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const isGame = typeof GetParentResourceName === 'function';
  const resource = isGame ? GetParentResourceName() : null;
  const isPreview = !isGame && !!window.StaticDemoHost;
  const authenticationActions = new Set(['setupPin', 'unlock', 'changePin', 'transfer', 'cancelTransfer', 'approveConnection', 'approveEntry', 'revokeConnection']);
  const number = value => new Intl.NumberFormat('en-US').format(value);
  let token = null, state = null, account = null, open = false, generation = 0, page = 1, pages = 1;
  let pendingPin = null, pinBusy = false, selectedPin = $('pin'), refreshing = false, refreshPending = false, currentPanel = 'games';
  let pendingTransfer = null, currentHistory = [], currentPending = { connections: [], entries: [], connected: [] };
  let resetClock = null, resetRequestedFor = null;
  const intentKey = () => 'visausd.sample.transfer.' + new URL('../', location.href).pathname + account?.accountId;
  function message(value) { $('message').textContent = value || ''; $('message').hidden = !value; }
  function element(tag, text, cls) { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; }
  async function host(action, payload = {}) {
    if (!window.StaticDemoHost) throw new Error('The sample demo could not open. Reload this page.');
    return window.StaticDemoHost.request(action, payload);
  }
  const rpc = (action, payload = {}) => host('walletRpc', { action, payload: { ...payload, ...(token ? { token } : {}) } });
  function cancelPin(reason = 'PIN entry cancelled.') {
    if (pinBusy) return;
    const previous = pendingPin; pendingPin = null;
    if ($('pin-dialog').open) $('pin-dialog').close();
    $('pin').value = $('confirm-pin').value = '';
    previous?.reject(new Error(typeof reason === 'string' ? reason : 'PIN entry cancelled.'));
  }
  function requestPin(title, description, setup = false, context = null) {
    cancelPin(); $('pin-title').textContent = title; $('pin-description').textContent = description;
    $('pin-error').textContent = ''; $('pin').value = $('confirm-pin').value = '';
    $('confirm-group').hidden = !setup; $('confirm-pin').required = setup;
    selectedPin = $('pin'); $('pin-dialog').showModal(); $('pin').focus();
    return new Promise((resolve, reject) => { pendingPin = { resolve, reject, setup, context }; });
  }
  function locked() {
    token = null; state = null; resetClock = null; resetRequestedFor = null; currentHistory = []; currentPending = { connections: [], entries: [], connected: [] };
    $('account-view').hidden = true; $('locked-view').hidden = false; $('lock').disabled = true;
    $('unlock-title').textContent = 'Welcome back'; $('unlock-copy').textContent = 'Unlock your Gaming Credits with your four-digit PIN.';
    $('retry').textContent = 'Unlock Gaming Credits'; $('retry').hidden = false;
    $('game-requests').replaceChildren(); $('connected-games').replaceChildren(); $('history').replaceChildren();
  }
  async function boot() {
    const serial = ++generation; message(''); $('retry').hidden = true;
    try {
      account = await rpc('provision'); if (serial !== generation || !open) return;
      $('unlock-title').textContent = account.pinConfigured ? 'Welcome back' : 'Your account is ready';
      $('unlock-copy').textContent = account.pinConfigured ? 'Unlock your Gaming Credits.' : 'Set a four-digit PIN to start playing.';
      const pin = await requestPin(account.pinConfigured ? 'Enter your PIN' : 'Set your PIN', account.pinConfigured ? 'Unlock Gaming Credits.' : 'Choose four digits. Keep your PIN to yourself.', !account.pinConfigured);
      if (serial !== generation || !open) return;
      $('unlock-title').textContent = 'Opening Gaming Credits'; $('unlock-copy').textContent = 'Checking your PIN…';
      const result = await rpc(account.pinConfigured ? 'unlock' : 'setupPin', { pin });
      if (serial !== generation || !open) { if (result.token) void host('walletRpc', { action: 'lock', payload: { token: result.token } }); return; }
      token = result.token; account.pinConfigured = true;
      if (typeof token !== 'string') throw new Error('The session could not be opened.');
      try { pendingTransfer = JSON.parse(localStorage.getItem(intentKey()) || 'null'); } catch (_) { pendingTransfer = null; }
      $('locked-view').hidden = true; $('account-view').hidden = false; $('lock').disabled = false;
      await refresh();
      if (pendingTransfer) { $('recipient').value = pendingTransfer.toAccountId; $('amount').value = pendingTransfer.amount; selectPanel('send'); message('A transfer needs confirmation. Review and retry it to check its saved result.'); }
    } catch (e) { if (serial === generation && open) { locked(); message(e.message); } }
  }
  async function refresh() {
    if (!token) return;
    if (refreshing) { refreshPending = true; return; }
    refreshing = true; const serial = generation;
    try {
      const { state: nextState, pending, history } = await rpc('overview', { page });
      if (serial !== generation || !open || !token) return;
      state = nextState; currentPending = pending; currentHistory = history.entries || []; pages = history.pages || 1; page = history.page || 1;
      const pinContext = pendingPin?.context;
      if (pinContext?.type === 'connection' && !(pending.connections || []).some(invite => invite.resource === pinContext.resource && invite.requestId === pinContext.requestId)) {
        cancelPin('This game invitation is no longer pending.');
      }
      resetClock = { serverTime: Number.isFinite(state.observedAt) ? state.observedAt : Date.now(), receivedAt: performance.now() };
      if (resetRequestedFor !== state.nextResetAt) resetRequestedFor = null;
      paint();
    } catch (e) { if (serial === generation && open) { message(e.message); if (['AUTH_REQUIRED', 'INVALID_SESSION', 'SESSION_EXPIRED'].includes(e.code)) locked(); } }
    finally { refreshing = false; if (refreshPending) { refreshPending = false; if (open && token) void refresh(); } }
  }
  function selectPanel(name) {
    currentPanel = name;
    for (const button of document.querySelectorAll('[data-panel]')) button.setAttribute('aria-selected', String(button.dataset.panel === name));
    for (const panel of ['games', 'send', 'receive', 'history']) $('panel-' + panel).hidden = panel !== name;
    if (name === 'history') void refresh();
  }
  function countdown() {
    if (!state) return;
    const serverNow = resetClock ? resetClock.serverTime + performance.now() - resetClock.receivedAt : Date.now();
    const seconds = Math.max(0, Math.ceil((state.nextResetAt - serverNow) / 1000));
    $('countdown').textContent = seconds ? `Resets in ${Math.floor(seconds / 3600)}h ${String(Math.floor(seconds % 3600 / 60)).padStart(2, '0')}m ${String(seconds % 60).padStart(2, '0')}s` : 'Resetting…';
    if (!seconds && resetRequestedFor !== state.nextResetAt) { resetRequestedFor = state.nextResetAt; void refresh(); }
  }
  function requestCard(request, kind) {
    const card = element('article', undefined, 'request-card');
    card.append(element('h3', request.displayName || request.resource));
    card.append(element('p', kind === 'connection' ? 'Allow this game to read your available credits? Each game entry needs your approval.' : `${number(request.amount)} credits will be held for this match. Your entry is returned if the match is cancelled.`));
    if (kind === 'entry') { const players = request.participantCount || request.participants?.length; if (players) card.append(element('p', `${number(players)} players · ${number(request.totalCredits || players * request.amount)} total credits`, 'meta')); }
    if (kind === 'entry') card.append(element('p', request.matchId, 'meta'));
    const button = element('button', kind === 'connection' ? 'Connect game' : `Approve ${number(request.amount)} credits`, 'bgc-primary');
    let invitationCancelled = false;
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        const pin = await requestPin(kind === 'connection' ? 'Connect game' : 'Approve match entry', `${request.displayName || request.resource}${kind === 'entry' ? ' · ' + number(request.amount) + ' credits · ' + number(request.participantCount || request.participants?.length || 0) + ' players' : ''}`, false, kind === 'connection' ? { type: 'connection', resource: request.resource, requestId: request.requestId } : null);
        await rpc(kind === 'connection' ? 'approveConnection' : 'approveEntry', { resource: request.resource, ...(kind === 'connection' ? { requestId: request.requestId } : { matchId: request.matchId }), pin });
        message(kind === 'connection' ? 'Game connected. You can return to play.' : 'Entry approved. Your credits are held for this match.'); await refresh();
      } catch (e) { if (!invitationCancelled) message(e.message); } finally { button.disabled = false; }
    });
    if (kind === 'connection') {
      const actions = element('div', undefined, 'connection-actions'), cancel = element('button', 'Cancel', 'bgc-secondary');
      cancel.type = 'button'; cancel.setAttribute('aria-label', 'Cancel game invitation');
      cancel.addEventListener('click', async () => {
        button.disabled = cancel.disabled = true;
        try {
          await rpc('declineConnection', { resource: request.resource, requestId: request.requestId });
          invitationCancelled = true; card.remove(); message('Game invitation cancelled.'); await refresh();
        } catch (e) { message(e.message); await refresh(); }
        finally { button.disabled = cancel.disabled = false; }
      });
      actions.append(button, cancel); card.append(actions);
    } else card.append(button);
    return card;
  }
  function paint() {
    if (!state) return;
    const balanceText = number(state.balance);
    $('balance').textContent = balanceText; $('held').textContent = number(state.heldCredits || 0);
    $('balance').style.fontSize = balanceText.length > 16 ? '22px' : balanceText.length > 11 ? '30px' : balanceText.length > 8 ? '38px' : '';
    $('balance').closest('.bgc-balance-card').classList.toggle('large-balance', balanceText.length > 8);
    const id = state.accountId || account.accountId; $('account-short').textContent = id; $('account-code').value = id;
    $('send-submit').disabled = !pendingTransfer && (state.canSend === false || state.balance < 1);
    $('cancel-transfer').hidden = !pendingTransfer;
    if (state.exhausted) message('Done for today. Credits reset at 9am New York time.');
    const requests = [...(currentPending.connections || []).map(x => requestCard(x, 'connection')), ...(currentPending.entries || []).map(x => requestCard(x, 'entry'))];
    $('game-requests').replaceChildren(...requests);
    for (const entry of currentPending.activeEntries || []) {
      const card = element('article', undefined, 'request-card'); card.append(element('h3', entry.displayName || entry.resource), element('p', `${number(entry.amount)} credits in play · ${number(entry.participantCount || entry.participants?.length || 0)} players`), element('p', 'Entry held. Waiting for the game result.', 'meta'));
      if (entry.expiresAt) card.append(element('p', 'Entry expires ' + new Date(entry.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }), 'meta'));
      $('game-requests').append(card);
    }
    if (!requests.length && !currentPending.activeEntries?.length) $('game-requests').append(element('p', 'Open a compatible game to connect your credits.', 'bgc-copy empty-state'));
    $('connected-games').replaceChildren();
    for (const game of currentPending.connected || []) {
      const row = element('div', undefined, 'connected-card'), label = element('div'); label.append(element('strong', game.displayName || game.resource), element('small', 'Connected'));
      const revoke = element('button', 'Disconnect', 'quiet'); revoke.onclick = async () => { try { const pin = await requestPin('Disconnect game', 'Stop new game access. Matches approved by everyone stay in play until a result, game cancellation or expiry.'); await rpc('revokeConnection', { resource: game.resource, pin }); await refresh(); } catch (e) { message(e.message); } };
      row.append(label, revoke); $('connected-games').append(row);
    }
    $('history').replaceChildren();
    for (const entry of currentHistory) {
      const names = { sent: 'Sent credits', received: 'Received credits', 'match-won': 'Match won', 'match-lost': 'Match entry' };
      const row = element('div', undefined, 'bgc-history-item'), label = element('div', entry.label || names[entry.kind] || entry.type || entry.kind || entry.status || 'Gaming Credits', 'bgc-history-main');
      label.append(element('small', new Date(entry.at || entry.timestamp || Date.now()).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })));
      const amount = entry.amount ?? entry.delta ?? 0, incoming = ['received', 'match-won'].includes(entry.kind), outgoing = ['sent', 'match-lost'].includes(entry.kind);
      row.append(label, element('strong', `${incoming ? '+' : outgoing ? '−' : ''}${number(Math.abs(amount))}`)); $('history').append(row);
    }
    if (!currentHistory.length) $('history').append(element('p', 'Your transfers and game entries will appear here.', 'bgc-copy empty-state'));
    $('page-number').textContent = `${page} / ${pages}`; $('previous').disabled = page <= 1; $('next').disabled = page >= pages; countdown();
  }
  function operationId() { return crypto.randomUUID ? crypto.randomUUID() : [...crypto.getRandomValues(new Uint8Array(16))].map(x => x.toString(16).padStart(2, '0')).join(''); }
  async function send(event) {
    event.preventDefault(); if (!token || !state) return;
    const toAccountId = $('recipient').value.trim(), raw = $('amount').value.trim(), amount = /^[1-9]\d{0,8}$/.test(raw) ? Number(raw) : NaN;
    if (!toAccountId || !Number.isSafeInteger(amount) || (!pendingTransfer && amount > state.balance)) { message('Enter an account code and whole credits within your available balance.'); return; }
    if (pendingTransfer && (pendingTransfer.toAccountId !== toAccountId || pendingTransfer.amount !== amount)) { message('Retry the pending transfer first to confirm its saved result.'); return; }
    $('send-submit').disabled = true;
    try {
      const pin = await requestPin('Approve transfer', `Send ${number(amount)} credits to ${toAccountId}. No transfer fee.`);
      pendingTransfer ||= { toAccountId, amount, operationId: operationId() };
      localStorage.setItem(intentKey(), JSON.stringify(pendingTransfer));
      await rpc('transfer', { ...pendingTransfer, pin }); pendingTransfer = null; localStorage.removeItem(intentKey());
      $('amount').value = ''; message('Credits sent.'); await refresh();
    } catch (e) {
      message(e.message);
    } finally { $('send-submit').disabled = !pendingTransfer && state?.canSend === false; $('cancel-transfer').hidden = !pendingTransfer; }
  }
  async function close() {
    ++generation; open = false; cancelPin(); $('about-dialog').close(); locked(); $('device').hidden = true;
    try { await host('close'); } catch (_) { /* The host also revokes the session when the resource closes. */ }
  }
  async function show() { if (open) return; open = true; $('device').hidden = false; locked(); await boot(); }
  $('pin-form').addEventListener('submit', e => {
    e.preventDefault(); if (!pendingPin || pinBusy) return;
    const value = $('pin').value;
    if (!/^\d{4}$/.test(value)) { $('pin-error').textContent = 'Enter exactly four digits.'; return; }
    if (pendingPin.setup && value !== $('confirm-pin').value) { $('pin-error').textContent = 'The PINs do not match.'; return; }
    const task = pendingPin; pendingPin = null; $('pin-dialog').close(); $('pin').value = $('confirm-pin').value = ''; task.resolve(value);
  });
  for (const id of ['pin', 'confirm-pin']) { $(id).addEventListener('focus', () => { selectedPin = $(id); }); $(id).addEventListener('input', () => { $(id).value = $(id).value.replace(/\D/g, '').slice(0, 4); $(id).scrollIntoView({ block: 'nearest' }); }); }
  for (const key of document.querySelectorAll('[data-digit]')) key.addEventListener('click', () => {
    const digit = key.dataset.digit;
    selectedPin.value = digit === 'clear' ? '' : digit === 'back' ? selectedPin.value.slice(0, -1) : (selectedPin.value + digit).slice(0, 4);
    if (selectedPin === $('pin') && selectedPin.value.length === 4 && pendingPin?.setup) selectedPin = $('confirm-pin');
    selectedPin.focus();
  });
  $('pin-cancel').onclick = cancelPin; $('pin-dialog').addEventListener('cancel', e => { e.preventDefault(); cancelPin(); });
  $('close-device').onclick = close; $('retry').onclick = boot; $('refresh').onclick = () => { message(''); void refresh(); }; $('send-form').onsubmit = send;
  $('cancel-transfer').onclick = async () => {
    if (!pendingTransfer) return;
    try {
      const pin = await requestPin('Resolve pending transfer', 'If it was already sent, we will confirm it. Otherwise this cancels it safely.');
      const result = await rpc('cancelTransfer', { ...pendingTransfer, pin });
      if (!['COMMITTED', 'CANCELLED'].includes(result.status)) throw new Error('The transfer is still unconfirmed. Keep this request and retry.');
      pendingTransfer = null; localStorage.removeItem(intentKey());
      message(result.status === 'COMMITTED' ? 'The transfer was already sent. It was not charged again.' : 'Pending transfer cancelled.'); await refresh();
    } catch (e) { message(e.message); }
  };
  $('lock').onclick = async () => { ++generation; cancelPin(); const previous = token; locked(); try { await host('walletRpc', { action: 'lock', payload: { token: previous } }); } catch (e) { message(e.message); } };
  for (const button of document.querySelectorAll('[data-panel]')) button.onclick = () => selectPanel(button.dataset.panel);
  $('previous').onclick = () => { if (page > 1) { page--; void refresh(); } }; $('next').onclick = () => { if (page < pages) { page++; void refresh(); } };
  $('copy-account').onclick = async () => { try { await navigator.clipboard.writeText($('account-code').value); message('Account code copied.'); } catch (_) { $('account-code').select(); message('Select and copy your account code.'); } };
  $('about').onclick = () => $('about-dialog').showModal(); $('about-close').onclick = () => $('about-dialog').close();
  $('change-pin').onclick = async () => {
    try { const currentPin = await requestPin('Current PIN', 'Enter your current four-digit PIN.'); const newPin = await requestPin('New PIN', 'Choose and confirm four digits.', true); await rpc('changePin', { currentPin, newPin }); locked(); message('PIN changed. Unlock with your new PIN.'); } catch (e) { message(e.message); }
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('pin-dialog').open && !$('about-dialog').open) void close(); });
  window.addEventListener('message', e => { if (e.origin !== location.origin || (e.source !== window && e.source !== window.parent)) return; if (e.data?.type === 'device:open') void show(); else if (e.data?.type === 'device:close') { ++generation; open = false; cancelPin(); locked(); $('device').hidden = true; } else if (e.data?.type === 'credits:notice' && open && token) { if (e.data.notice?.kind === 'received') message('Gaming Credits received.'); else if (e.data.notice?.kind === 'updated') message('Gaming Credits updated.'); void refresh(); } });
  for (const input of document.querySelectorAll('input')) input.addEventListener('focus', () => input.scrollIntoView({ block: 'nearest' }));
  setInterval(() => { if (open && token && document.visibilityState === 'visible') countdown(); }, 1000);
  setInterval(() => { if (open && token && document.visibilityState === 'visible' && !$('pin-dialog').open) void refresh(); }, 15000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && open && token) { countdown(); void refresh(); } });
  if (isPreview) { document.body.classList.add('preview'); if (window.self !== window.top) document.body.classList.add('embed'); void show(); }
  else if (isGame) host('deviceReady').then(result => { if (result.open) void show(); }).catch(() => {});
})();
