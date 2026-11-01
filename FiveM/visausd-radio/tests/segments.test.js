const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');

const importer = path.resolve(__dirname, '../scripts/add-segment.py');
const ffmpeg = process.env.VISAUSD_FFMPEG || 'ffmpeg';
const available = /libvorbis/.test(spawnSync(ffmpeg, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout || '');

test('segment importer rejects an unsafe ID before opening source audio', () => {
  const result = spawnSync('python3', ['-B', importer, '--source', '/does-not-exist.wav', '--kind', 'dj', '--id', '../escape', '--title', 'Test'], { encoding: 'utf8' });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /ID must be/);
});

test('segment importer packages every category, preserves songs, and rejects duplicate IDs', { skip: !available }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visausd-segment-test-'));
  try {
    const config = path.join(root, 'config');
    fs.mkdirSync(config);
    const catalogPath = path.join(config, 'playlist.json');
    const song = { id: 'keep-song', type: 'song', file: 'audio/songs/keep.ogg', title: 'Keep this song', durationSeconds: 10 };
    fs.writeFileSync(catalogPath, JSON.stringify({ version: 1, songs: [song], dj: [], ads: [], ids: [] }));
    const source = path.join(root, 'recording.wav');
    const fixture = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=600:duration=0.35', '-metadata', 'artist=Recorded voice', source], { encoding: 'utf8' });
    assert.equal(fixture.status, 0, fixture.stderr);
    const sourceBytes = fs.readFileSync(source);
    for (const [kind, group] of [['dj', 'dj'], ['ad', 'ads'], ['id', 'ids']]) {
      const result = spawnSync('python3', ['-B', importer, '--source', source, '--kind', kind, '--id', `test-${kind}`, '--title', `${kind} announcement`, '--artist', 'VisaUSD™ voice', '--output', root], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const item = JSON.parse(result.stdout);
      assert.equal(item.type, kind);
      assert.equal(item.file, `audio/${group}/test-${kind}.ogg`);
      assert.equal(item.title, `${kind} announcement`);
      assert.equal(item.artist, 'VisaUSD™ voice');
      assert.equal(item.codec, 'vorbis');
      assert.ok(item.durationSeconds > 0.34 && item.durationSeconds < 0.36);
      const bytes = fs.readFileSync(path.join(root, item.file));
      assert.equal(bytes.subarray(0, 4).toString(), 'OggS');
      assert.equal(bytes.length, item.bytes);
      assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), item.sha256);
    }
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    assert.deepEqual(catalog.songs, [song]);
    assert.equal(catalog.dj.length, 1);
    assert.equal(catalog.ads.length, 1);
    assert.equal(catalog.ids.length, 1);
    const beforeDuplicate = fs.readFileSync(catalogPath);
    const duplicate = spawnSync('python3', ['-B', importer, '--source', source, '--kind', 'ad', '--id', 'keep-song', '--title', 'Duplicate', '--output', root], { encoding: 'utf8' });
    assert.equal(duplicate.status, 2);
    assert.match(duplicate.stderr, /ID already exists in songs/);
    assert.deepEqual(fs.readFileSync(catalogPath), beforeDuplicate);
    assert.equal(fs.existsSync(path.join(root, 'audio/ads/keep-song.ogg')), false);
    assert.deepEqual(fs.readFileSync(source), sourceBytes);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
