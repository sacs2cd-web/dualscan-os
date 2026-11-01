/* SAMPLE ONLY. Browser-local, visitor-owned demonstration points and public sample PINs.
 * This is not the FiveM server authority, a secure credential store, a wallet, or a
 * capacity/security demonstration. No blockchain code, private keys or network calls.
 */
(function (root, factory) {
  'use strict';
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SampleGamingEngine = api.SampleGamingEngine;
  if (root && root.document) {
    try {
      if (root.parent !== root && root.parent.SampleGamingDemo) { root.SampleGamingDemo = root.parent.SampleGamingDemo; return; }
    } catch (_) { /* A standalone sample uses its own browser-local authority. */ }
    const script = root.document.currentScript;
    let base = root.location ? root.location.pathname.replace(/[^/]*$/, '') : '/';
    try { if (script && script.src) base = new URL('.', script.src).pathname; } catch (_) {}
    let storage;
    try { storage = root.localStorage; } catch (_) {}
    const options = { storage, key: 'visausd.gaming.sample.v1:' + base };
    try { root.SampleGamingDemo = new api.SampleGamingEngine(options); }
    catch (_) {
      // Keep Reset usable if this visitor's sample record is damaged. Only this sample's
      // known storage key is cleared after the visitor explicitly presses Reset.
      let recovered = null;
      const listeners = new Set();
      root.SampleGamingDemo = {
        key: options.key,
        subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
        request(route, payload) {
          if (recovered) return recovered.request(route, payload);
          if (route !== 'reset') return Promise.resolve({ ok: false, error: { code: 'SAMPLE_STORAGE', message: 'This saved sample could not open. Press Reset sample to start again.' } });
          try {
            if (storage) storage.removeItem(options.key);
            recovered = new api.SampleGamingEngine(options);
            recovered.subscribe(event => { for (const listener of listeners) { try { listener(event); } catch (_) {} } });
            return recovered.request('reset', payload);
          } catch (_) { return Promise.resolve({ ok: false, error: { code: 'SAMPLE_STORAGE', message: 'Browser sample storage is unavailable. Allow browser storage, then press Reset sample.' } }); }
        }
      };
    }
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const DAILY = 20580, RESOURCE = 'sample_bishiki', GAME = 'Bishiki Credit Demo', SESSION_MS = 15 * 60 * 1000;
  const clock = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  const clone = value => JSON.parse(JSON.stringify(value));
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  function error(code, message) { const value = new Error(message); value.code = code; throw value; }
  function parts(ms) { const out = {}; for (const part of clock.formatToParts(new Date(ms))) if (part.type !== 'literal') out[part.type] = Number(part.value); return out; }
  function shift(day, offset) { const date = new Date(Date.UTC(day.year, day.month - 1, day.day + offset)); return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() }; }
  function nine(day) {
    const target = Date.UTC(day.year, day.month - 1, day.day, 9); let result = target;
    for (let i = 0; i < 3; i++) { const local = parts(result), delta = target - Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second); result += delta; if (!delta) return result; }
    error('SAMPLE_CLOCK', 'The sample daily reset is unavailable.');
  }
  function getEpoch(ms) {
    if (!Number.isSafeInteger(ms) || ms < 0 || ms > 8640000000000000) error('SAMPLE_CLOCK', 'A valid sample clock is required.');
    let day = parts(ms); if (day.hour < 9) day = shift(day, -1);
    return { epoch: `${day.year}-${String(day.month).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`, nextResetAt: nine(shift(day, 1)) };
  }
  function randomUUID() {
    if (root.crypto && typeof root.crypto.randomUUID === 'function') return root.crypto.randomUUID();
    if (!root.crypto || typeof root.crypto.getRandomValues !== 'function') error('SAMPLE_UNAVAILABLE', 'Secure browser randomness is unavailable.');
    const bytes = root.crypto.getRandomValues(new Uint8Array(16)); bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }
  function pin(value) { if (typeof value !== 'string' || !/^\d{4}$/.test(value)) error('INVALID_PIN', 'Enter exactly four digits.'); return value; }
  function identifier(value, label = 'request') { if (typeof value !== 'string' || !/^[A-Za-z0-9_.:-]{1,128}$/.test(value)) error('INVALID_REQUEST', `Invalid sample ${label}.`); return value; }
  function amount(value) { if (!Number.isSafeInteger(value) || value < 1) error('INVALID_AMOUNT', 'Enter positive whole Gaming Credits.'); return value; }
  function memoryStorage() { const records = new Map(); return { getItem: key => records.has(key) ? records.get(key) : null, setItem: (key, value) => records.set(key, value), removeItem: key => records.delete(key) }; }

  class SampleGamingEngine {
    constructor(options = {}) {
      this.storage = options.storage || memoryStorage(); this.now = options.now || Date.now;
      this.key = options.key || 'visausd.gaming.sample.v1:/'; this.uuid = options.randomUUID || randomUUID;
      this.sessions = new Map(); this.listeners = new Set(); this.queue = Promise.resolve();
      this.data = null;
      try { const raw = this.storage.getItem(this.key); if (raw) this.data = JSON.parse(raw); }
      catch (_) { error('SAMPLE_STORAGE', 'Sample storage could not be opened. Reset this sample to start again.'); }
      if (this.data && (this.data.version !== 1 || !this.data.sampleOnly || !this.data.accounts?.alice || !this.data.accounts?.bob || !this.data.matches || !this.data.transfers || !Array.isArray(this.data.invitations))) error('SAMPLE_STORAGE', 'Saved sample data is invalid. Reset this sample to start again.');
      if (!this.data) {
        this.data = this.fresh(Number(this.now()));
        try { this.storage.setItem(this.key, JSON.stringify(this.data)); }
        catch (_) { error('SAMPLE_STORAGE', 'Sample storage could not be saved. Allow browser storage to use this sample.'); }
      }
    }
    fresh(timestamp) {
      const epoch = getEpoch(timestamp), accounts = {};
      for (const [actor, samplePin] of [['alice', '1234'], ['bob', '9876']]) accounts[actor] = { actor, accountId: 'GC_' + this.uuid().replace(/-/g, ''), samplePin, balance: DAILY, exhausted: false, epoch: epoch.epoch, nextResetAt: epoch.nextResetAt, holds: {}, history: [], pinFailures: 0, retryAt: 0, link: null };
      return { version: 1, sampleOnly: true, accounts, invitations: [], matches: {}, transfers: {}, currentInvite: null, currentMatch: null, lastNow: timestamp };
    }
    subscribe(listener) { if (typeof listener !== 'function') throw new TypeError('A listener is required.'); this.listeners.add(listener); return () => this.listeners.delete(listener); }
    notify(value) { for (const listener of this.listeners) { try { listener(clone(value)); } catch (_) { /* One display cannot block the other sample view. */ } } }
    actor(value) { if (value === undefined || value === null) return 'alice'; if (!['alice', 'bob'].includes(value)) error('INVALID_PLAYER', 'Choose a sample player.'); return value; }
    authenticate(work, actor, token, timestamp) { const session = this.sessions.get(token); if (!session || session.actor !== actor || session.expiresAt <= timestamp) error('AUTH_REQUIRED', 'Unlock Gaming Credits with your sample PIN.'); return work.accounts[actor]; }
    checkPin(account, value, timestamp) {
      pin(value); if (timestamp < account.retryAt) error('PIN_THROTTLED', 'Too many sample PIN attempts. Wait 30 seconds or reset the sample.');
      if (value !== account.samplePin) { account.pinFailures++; if (account.pinFailures >= 5) account.retryAt = timestamp + 30000; const problem = new Error('PIN not recognized.'); problem.code = 'BAD_PIN'; problem.persist = true; throw problem; }
      account.pinFailures = 0; account.retryAt = 0;
    }
    revoke(actor) { for (const [token, session] of this.sessions) if (session.actor === actor) this.sessions.delete(token); }
    session(account, timestamp, afterCommit) { const token = this.uuid(), expiresAt = timestamp + SESSION_MS; afterCommit.push(() => { this.revoke(account.actor); this.sessions.set(token, { actor: account.actor, expiresAt }); }); const state = this.view(account, timestamp); return { token, expiresAt, state, account: state }; }
    held(account) { return Object.values(account.holds).reduce((sum, hold) => sum + hold.amount, 0); }
    view(account, timestamp) { const heldCredits = this.held(account), balance = account.balance - heldCredits; return { accountId: account.accountId, balance, availableCredits: balance, bookBalance: account.balance, heldCredits, dailyCredits: DAILY, epoch: account.epoch, nextResetAt: account.nextResetAt, observedAt: timestamp, timeZone: 'America/New_York', exhausted: account.exhausted, canSend: !account.exhausted && balance > 0, canReceive: !account.exhausted, pinConfigured: true, pinSet: true, connections: account.link ? [account.link] : [], sampleOnly: true }; }
    matchView(match, actor) { return { resource: RESOURCE, displayName: GAME, matchId: match.matchId, amount: 25, totalCredits: 50, participantCount: 2, approvedCount: match.approved.length, approvedByYou: match.approved.includes(actor), status: match.status, epoch: match.epoch, expiresAt: match.expiresAt }; }
    pending(work, actor) { const account = work.accounts[actor]; const matches = Object.values(work.matches).filter(match => ['PENDING', 'READY'].includes(match.status)); return { connections: work.invitations.filter(invite => invite.actor === actor && invite.status === 'PENDING'), entries: matches.filter(match => !match.approved.includes(actor)).map(match => ({ ...this.matchView(match, actor), requestId: match.matchId })), activeEntries: matches.filter(match => match.approved.includes(actor)).map(match => this.matchView(match, actor)), connected: account.link ? [account.link] : [] }; }
    history(account, page = 1) { if (!Number.isSafeInteger(page) || page < 1) error('INVALID_PAGE', 'Choose a valid history page.'); const total = account.history.length, pages = Math.max(1, Math.ceil(total / 10)); page = Math.min(page, pages); const entries = account.history.slice((page - 1) * 10, page * 10); return { page, pages, total, pageSize: 10, entries, items: entries }; }
    log(account, row) { account.history = [row, ...account.history].slice(0, 300); }
    maintain(work, timestamp) {
      const epoch = getEpoch(timestamp);
      for (const account of Object.values(work.accounts)) {
        if (epoch.epoch > account.epoch) { account.epoch = epoch.epoch; account.nextResetAt = epoch.nextResetAt; account.balance = DAILY; account.exhausted = false; account.holds = {}; }
        if (account.link && account.link.expiresAt <= timestamp) account.link = null;
      }
      for (const invite of work.invitations) if (invite.status === 'PENDING' && invite.expiresAt <= timestamp) invite.status = 'EXPIRED';
      for (const match of Object.values(work.matches)) if (['PENDING', 'READY'].includes(match.status) && (match.epoch !== epoch.epoch || match.expiresAt <= timestamp)) { match.status = 'EXPIRED'; for (const account of Object.values(work.accounts)) delete account.holds[match.matchId]; }
    }
    invitation(work, actor, resource, requestId) { if (resource !== RESOURCE) error('INVITE_NOT_FOUND', 'Sample game invitation not found.'); const invite = work.invitations.find(value => value.actor === actor && value.requestId === requestId); if (!invite) error('INVITE_NOT_FOUND', 'Sample game invitation not found.'); return invite; }
    cancelInvitation(invite, timestamp) { if (invite.status === 'APPROVED') error('INVITE_ALREADY_APPROVED', 'The game is already connected. Use Disconnect in the phone.'); if (invite.status === 'CANCELLED') return invite; if (invite.status !== 'PENDING' || invite.expiresAt <= timestamp) error('INVITE_NOT_FOUND', 'The sample invitation expired.'); invite.status = 'CANCELLED'; invite.cancelledAt = timestamp; return invite; }
    sampleReceipt(kind, payload) { return { sampleOnly: true, payload: { kind, ...payload } }; }
    wallet(work, input, timestamp, afterCommit) {
      const action = input.action, payload = input.payload || {}, actor = this.actor(input.actor ?? payload.actor), account = work.accounts[actor];
      if (action === 'provision') return { accountId: account.accountId, pinConfigured: true, pinSet: true, sampleOnly: true };
      if (action === 'setupPin') error('PIN_ALREADY_CONFIGURED', 'This sample already has a PIN. Use the sample PIN shown beside the phone.');
      if (action === 'unlock') { this.checkPin(account, payload.pin, timestamp); return this.session(account, timestamp, afterCommit); }
      if (action === 'lock') { this.revoke(actor); return { locked: true }; }
      this.authenticate(work, actor, payload.token, timestamp);
      if (action === 'state') return this.view(account, timestamp);
      if (action === 'history') return this.history(account, payload.page);
      if (action === 'pending') return this.pending(work, actor);
      if (action === 'overview') return { state: this.view(account, timestamp), pending: this.pending(work, actor), history: this.history(account, payload.page) };
      if (action === 'changePin') { this.checkPin(account, payload.currentPin, timestamp); account.samplePin = pin(payload.newPin); return this.session(account, timestamp, afterCommit); }
      if (action === 'transfer' || action === 'cancelTransfer') {
        const value = amount(payload.amount), operationId = identifier(payload.operationId, 'transfer'), to = typeof payload.toAccountId === 'string' ? payload.toAccountId.trim() : '';
        if (!to || to.length > 128) error('INVALID_REQUEST', 'Enter a sample account code.');
        const key = account.accountId + ':' + operationId, intent = { fromAccountId: account.accountId, toAccountId: to, amount: value }, prior = work.transfers[key];
        if (prior) { if (JSON.stringify(prior.intent) !== JSON.stringify(intent)) error('OPERATION_CONFLICT', 'This sample transfer already has different details.'); if (action === 'cancelTransfer') return { status: prior.status, receipt: prior.receipt }; if (prior.status === 'CANCELLED') error('TRANSFER_CANCELLED', 'This sample transfer was cancelled.'); return prior.receipt; }
        this.checkPin(account, payload.pin, timestamp);
        if (action === 'cancelTransfer') { const receipt = this.sampleReceipt('sample-transfer-cancelled', { operationId, ...intent, timestamp }); work.transfers[key] = { intent, status: 'CANCELLED', receipt }; return { status: 'CANCELLED', receipt }; }
        const target = Object.values(work.accounts).find(other => other.accountId === to); if (!target) error('ACCOUNT_NOT_FOUND', 'Use the sample recipient account shown beside the phone.'); if (target === account) error('SELF_TRANSFER', 'Choose the other sample player.');
        if (account.exhausted || target.exhausted) error('DAILY_LOCKED', 'These sample credits unlock at the next daily reset.');
        if (account.balance - this.held(account) < value) error('INSUFFICIENT_CREDITS', 'Not enough available sample credits.');
        if (!Number.isSafeInteger(target.balance + value)) error('BALANCE_OVERFLOW', 'The sample credit balance is too large.');
        account.balance -= value; target.balance += value; if (!account.balance) account.exhausted = true;
        const receipt = this.sampleReceipt('sample-credit-transfer', { operationId, ...intent, epoch: account.epoch, timestamp }); work.transfers[key] = { intent, status: 'COMMITTED', receipt };
        this.log(account, { id: operationId, kind: 'sent', ...intent, epoch: account.epoch, timestamp }); this.log(target, { id: operationId, kind: 'received', ...intent, epoch: target.epoch, timestamp }); return receipt;
      }
      if (action === 'approveConnection' || action === 'declineConnection') {
        const invite = this.invitation(work, actor, payload.resource, payload.requestId);
        if (action === 'declineConnection') return this.cancelInvitation(invite, timestamp);
        this.checkPin(account, payload.pin, timestamp);
        if (invite.status === 'CANCELLED') error('INVITE_CANCELLED', 'This sample invitation was cancelled. Request a new one.');
        if (invite.status === 'REVOKED') error('INVITE_REVOKED', 'This sample invitation was revoked.');
        if (invite.expiresAt <= timestamp || invite.status === 'EXPIRED') error('INVITE_NOT_FOUND', 'The sample invitation expired.');
        if (invite.status === 'APPROVED') { if (!account.link) error('INVITE_REVOKED', 'This sample connection is no longer active.'); return account.link; }
        if (invite.status !== 'PENDING') error('INVITE_NOT_FOUND', 'The sample invitation is no longer pending.');
        invite.status = 'APPROVED'; account.link = { resource: RESOURCE, displayName: GAME, approvedAt: timestamp, expiresAt: timestamp + SESSION_MS }; return account.link;
      }
      if (action === 'approveEntry') {
        this.checkPin(account, payload.pin, timestamp); const match = work.matches[payload.matchId];
        if (payload.resource !== RESOURCE || !match || !['PENDING', 'READY'].includes(match.status)) error('MATCH_EXPIRED', 'This sample entry is no longer pending.');
        if (!account.link) error('GAME_NOT_CONNECTED', 'Connect the sample game first.');
        this.approveMatch(work, actor, match); return this.matchView(match, actor);
      }
      if (action === 'revokeConnection') {
        this.checkPin(account, payload.pin, timestamp); if (payload.resource !== RESOURCE) error('INVALID_RESOURCE', 'Choose the sample game.'); account.link = null;
        for (const invite of work.invitations) if (invite.actor === actor && invite.status === 'PENDING') invite.status = 'REVOKED';
        for (const match of Object.values(work.matches)) if (match.status === 'PENDING' && match.approved.includes(actor)) this.cancelMatch(work, match);
        return { disconnected: true, resource: RESOURCE };
      }
      error('ACTION_DENIED', 'This action is not part of the sample.');
    }
    approveMatch(work, actor, match) { const account = work.accounts[actor]; if (!match.approved.includes(actor)) { if (account.exhausted || account.balance - this.held(account) < 25) error('INSUFFICIENT_CREDITS', 'Not enough sample credits for the entry.'); account.holds[match.matchId] = { amount: 25 }; match.approved.push(actor); if (match.approved.length === 2) match.status = 'READY'; } }
    cancelMatch(work, match) { if (match.status === 'SETTLED') error('MATCH_CONFLICT', 'The sample match is already settled.'); if (['CANCELLED', 'EXPIRED'].includes(match.status)) return; match.status = 'CANCELLED'; for (const account of Object.values(work.accounts)) delete account.holds[match.matchId]; }
    info(work) {
      const alice = work.accounts.alice, bob = work.accounts.bob;
      const invite = work.currentInvite ? work.invitations.find(value => value.requestId === work.currentInvite) : null;
      const match = work.currentMatch ? work.matches[work.currentMatch] : null;
      return { sampleOnly: true, recipient: bob.accountId, accountId: alice.accountId, connected: !!alice.link, pendingConnection: invite?.status === 'PENDING', connection: invite ? { requestId: invite.requestId, status: invite.status, expiresAt: invite.expiresAt } : null, match: match ? this.matchView(match, 'alice') : null, samplePin: alice.samplePin };
    }
    demo(work, input, timestamp) {
      const alice = work.accounts.alice, bob = work.accounts.bob, current = this.info(work);
      if (input.action === 'invite') {
        if (alice.link) error('INVITE_ALREADY_APPROVED', 'The sample game is already connected.'); if (current.pendingConnection) error('INVITE_PENDING', 'Approve or cancel the current invitation first.');
        const requestId = this.uuid(); work.invitations.push({ actor: 'alice', accountId: alice.accountId, requestId, resource: RESOURCE, displayName: GAME, status: 'PENDING', expiresAt: timestamp + 5 * 60 * 1000 }); work.currentInvite = requestId;
        bob.link = { resource: RESOURCE, displayName: GAME, approvedAt: timestamp, expiresAt: timestamp + SESSION_MS };
        return { message: `Sample invitation sent. Approve it in the phone with PIN ${alice.samplePin}.`, requestId, sampleOnly: true };
      }
      if (input.action === 'cancelInvite') {
        const invite = work.currentInvite ? work.invitations.find(value => value.requestId === work.currentInvite) : null;
        if (!invite) error('INVITE_NOT_FOUND', 'There is no current sample invitation.'); if (input.requestId !== invite.requestId) error('INVITE_CHANGED', 'The sample invitation changed. Refresh first.');
        this.cancelInvitation(invite, timestamp); return { message: 'Sample invitation cancelled. Existing connections and entries were not changed.', sampleOnly: true };
      }
      if (input.action === 'entry') {
        if (!alice.link || !bob.link) error('GAME_NOT_CONNECTED', 'Connect the sample game in the phone first.');
        const previous = work.currentMatch ? work.matches[work.currentMatch] : null; if (previous && ['PENDING', 'READY'].includes(previous.status)) error('ENTRY_PENDING', 'Finish or cancel the current sample entry.');
        if (alice.nextResetAt - timestamp <= 120000) error('MATCH_EXPIRED', 'Wait for the daily sample reset before starting an entry.');
        const matchId = 'sample-' + this.uuid(), match = { matchId, amount: 25, epoch: alice.epoch, expiresAt: Math.min(timestamp + 5 * 60 * 1000, alice.nextResetAt), status: 'PENDING', approved: [] };
        this.approveMatch(work, 'bob', match); work.matches[matchId] = match; work.currentMatch = matchId;
        return { message: `Bob approved 25 sample credits. Approve your entry in the phone with PIN ${alice.samplePin}.`, matchId, sampleOnly: true };
      }
      const match = work.currentMatch ? work.matches[work.currentMatch] : null; if (!match) error('NO_ENTRY', 'Request a sample entry first.');
      if (input.action === 'cancel') { this.cancelMatch(work, match); return { message: 'Sample match cancelled. Held credits are available again.', sampleOnly: true }; }
      if (input.action === 'settle') {
        if (match.status === 'SETTLED') return { message: 'This sample result was already recorded.', sampleOnly: true };
        if (match.status !== 'READY') error('MATCH_NOT_READY', 'Both sample players must approve before settlement.');
        for (const actor of ['alice', 'bob']) { const account = work.accounts[actor]; if (account.holds[match.matchId]?.amount !== 25 || account.balance < 25) error('SAMPLE_CONFLICT', 'The sample holds no longer match. Reset the sample.'); }
        for (const account of Object.values(work.accounts)) { account.balance -= 25; delete account.holds[match.matchId]; }
        alice.balance += 50; match.status = 'SETTLED'; match.winner = 'alice';
        for (const account of Object.values(work.accounts)) { account.exhausted = account.balance === 0; this.log(account, { id: match.matchId, kind: account === alice ? 'match-won' : 'match-lost', matchId: match.matchId, resource: RESOURCE, amount: 25, epoch: account.epoch, timestamp }); }
        return { message: 'Sample result: Alice won the 50-credit pool, a net gain of 25 credits.', sampleOnly: true };
      }
      error('INVALID_REQUEST', 'Choose a sample demo control.');
    }
    request(route, input = {}) {
      const operation = this.queue.then(() => {
        try {
          if (!input || typeof input !== 'object' || Array.isArray(input)) error('INVALID_REQUEST', 'A sample request is required.');
          route = String(route).replace(/^\/api\//, '').replace(/^\//, '');
          if (route === 'preview-info') route = 'info';
          if (route === 'reset') {
            const next = this.fresh(Number(this.now())); this.storage.setItem(this.key, JSON.stringify(next)); this.data = next; this.sessions.clear(); this.notify({ type: 'sample:reset' }); return { ok: true, data: { message: 'Your local sample has been reset.', ...this.info(next) } };
          }
          if (route === 'deviceReady') return { ok: true, data: { open: true } };
          if (route === 'close') { this.revoke(this.actor(input.actor)); return { ok: true, data: { closed: true } }; }
          const work = clone(this.data), afterCommit = [], timestamp = Math.max(Number(this.now()), work.lastNow); getEpoch(timestamp); work.lastNow = timestamp; this.maintain(work, timestamp);
          let result, problem;
          try { if (route === 'walletRpc') result = this.wallet(work, input, timestamp, afterCommit); else if (route === 'info') result = this.info(work); else if (route === 'demo') result = this.demo(work, input, timestamp); else error('ACTION_DENIED', 'This route is not part of the static sample.'); }
          catch (issue) { if (!issue.persist) throw issue; problem = issue; }
          const changed = JSON.stringify(work) !== JSON.stringify(this.data);
          if (changed) this.storage.setItem(this.key, JSON.stringify(work)); this.data = work;
          for (const callback of afterCommit) callback();
          const quietRead = route === 'info' || (route === 'walletRpc' && ['provision', 'state', 'history', 'pending', 'overview'].includes(input.action));
          if (changed && !quietRead) this.notify({ type: 'credits:notice', notice: { kind: 'updated' } });
          if (problem) throw problem;
          return { ok: true, data: clone(result) };
        } catch (issue) { return { ok: false, error: { code: issue.code || 'SAMPLE_STORAGE', message: issue.code ? issue.message : 'Sample storage could not save. Reset this sample or allow browser storage.' } }; }
      });
      this.queue = operation.then(() => undefined, () => undefined); return operation;
    }
  }
  return { SampleGamingEngine, getEpoch, DAILY_CREDITS: DAILY, SAMPLE_RESOURCE: RESOURCE };
});
