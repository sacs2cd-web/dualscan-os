'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createPreviewServer } = require('../scripts/preview-server.js');
const root = path.resolve(__dirname, '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'config/playlist.json'), 'utf8'));
const song = catalog.songs[0];
test('preview HTTP server contract', async t => {
  const server = createPreviewServer(root);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
await t.test('preview serves its UI and exact local station catalog', async () => {
  const redirect = await fetch(base + '/', { redirect: 'manual' });
  assert.equal(redirect.status, 302);
  assert.equal(redirect.headers.get('location'), '/web/');
  const page = await fetch(base + '/web/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.match(await page.text(), /VisaUSD™ Radio/);
  const playlist = await fetch(base + '/config/playlist.json');
  assert.equal(playlist.status, 200);
  assert.deepEqual(await playlist.json(), catalog);
  const config = await fetch(base + '/config/station.json');
  assert.equal(config.status, 200);
  assert.equal((await config.json()).stationName, 'VisaUSD™ Radio');
});

await t.test('OGG byte ranges start with OggS and advertise correct local length', async () => {
  const response = await fetch(`${base}/${song.file}`, { headers: { Range: 'bytes=0-3' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-type'), 'audio/ogg');
  assert.equal(response.headers.get('accept-ranges'), 'bytes');
  assert.equal(response.headers.get('content-length'), '4');
  const size = fs.statSync(path.join(root, song.file)).size;
  assert.equal(response.headers.get('content-range'), `bytes 0-3/${size}`);
  assert.equal(await response.text(), 'OggS');
});

await t.test('suffix byte ranges match the actual packaged audio tail', async () => {
  const bytes = fs.readFileSync(path.join(root, song.file));
  const response = await fetch(`${base}/${song.file}`, { headers: { Range: 'bytes=-128' } });
  assert.equal(response.status, 206);
  assert.equal(response.headers.get('content-range'), `bytes ${bytes.length - 128}-${bytes.length - 1}/${bytes.length}`);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(-128));
});

await t.test('unavailable, inverted, multiple, and empty ranges fail with HTTP 416', async () => {
  const size = fs.statSync(path.join(root, song.file)).size;
  for (const range of [`bytes=${size}-`, 'bytes=20-10', 'bytes=0-1,5-7', 'bytes=-', 'bytes=-0']) {
    const response = await fetch(`${base}/${song.file}`, { headers: { Range: range } });
    assert.equal(response.status, 416, range);
    assert.equal(response.headers.get('content-range'), `bytes */${size}`);
    await response.arrayBuffer();
  }
});

await t.test('HEAD provides file metadata without sending media bytes', async () => {
  const response = await fetch(`${base}/${song.file}`, { method: 'HEAD' });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-length'), String(fs.statSync(path.join(root, song.file)).size));
  assert.equal((await response.arrayBuffer()).byteLength, 0);
});

await t.test('preview rejects mutation methods, private server source, and traversal', async () => {
  const method = await fetch(base + '/config/station.json', { method: 'POST' });
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, HEAD');
  for (const pathname of ['/fxmanifest.lua', '/server/index.js', '/server/main.js', '/.git/config',
    '/scripts/preview-server.js', '/web/%2e%2e%2fserver/index.js', '/web/%2e%2e%2f%2e%2e%2fsecrets', '/web/%00']) {
    const response = await fetch(base + pathname);
    assert.ok([403, 404].includes(response.status), `${pathname}: ${response.status}`);
    await response.arrayBuffer();
  }
});

await t.test('resolved symlinks cannot expose source files from private resource folders', async () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'visausd-preview-test-'));
  fs.mkdirSync(path.join(fixture, 'web'));
  fs.mkdirSync(path.join(fixture, 'server'));
  fs.writeFileSync(path.join(fixture, 'server/private.js'), 'private source');
  fs.symlinkSync(path.join(fixture, 'server/private.js'), path.join(fixture, 'web/escape.js'));
  const isolated = createPreviewServer(fixture);
  await new Promise(resolve => isolated.listen(0, '127.0.0.1', resolve));
  try {
    const response = await fetch(`http://127.0.0.1:${isolated.address().port}/web/escape.js`);
    assert.equal(response.status, 404);
  } finally {
    isolated.closeAllConnections();
    await new Promise(resolve => isolated.close(resolve));
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
