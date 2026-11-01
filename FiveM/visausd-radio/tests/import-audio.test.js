const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const importer = path.resolve(__dirname, '../scripts/import-audio.py');
const ffmpeg = process.env.VISAUSD_FFMPEG || 'ffmpeg';
const ffprobe = process.env.VISAUSD_FFPROBE || 'ffprobe';
const available = [ffmpeg, ffprobe, 'python3'].every(command => spawnSync(command, ['-version']).error === undefined) && /libvorbis/.test(spawnSync(ffmpeg, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout || '');

test('metadata parses explicit library filenames and does not guess other artists', () => {
  const code = `import importlib.util, json, pathlib\nspec=importlib.util.spec_from_file_location('importer', ${JSON.stringify(importer)})\nm=importlib.util.module_from_spec(spec)\nspec.loader.exec_module(m)\nprint(json.dumps([m.metadata(pathlib.Path('Artist - Album - 01-03 Song.flac'), {}), m.metadata(pathlib.Path('Just a song.wav'), {})]))`;
  const result = spawnSync('python3', ['-B', '-c', code], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const [structured, unstructured] = JSON.parse(result.stdout);
  assert.equal(structured.artist, 'Artist');
  assert.equal(structured.album, 'Album');
  assert.equal(structured.title, 'Song');
  assert.equal(unstructured.title, 'Just a song');
  assert.equal(unstructured.artist, 'Unknown artist');
});

test('audio importer rejects a wrong count, preserves source, and produces tagged OGG Vorbis', { skip: !available }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'visausd-import-test-'));
  try {
    const source = path.join(root, 'source');
    const output = path.join(root, 'resource');
    fs.mkdirSync(source);
    const original = path.join(source, 'A demo.wav');
    const generated = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.3', '-metadata', 'title=Tagged title', '-metadata', 'artist=Test Artist', original], { encoding: 'utf8' });
    assert.equal(generated.status, 0, generated.stderr);
    const before = fs.readFileSync(original);
    const rejected = spawnSync('python3', [importer, '--source', source, '--output', output], { encoding: 'utf8' });
    assert.equal(rejected.status, 2);
    assert.match(rejected.stderr, /Expected 51 source audio files, found 1/);
    assert.equal(fs.existsSync(output), false);
    const imported = spawnSync('python3', [importer, '--source', source, '--output', output, '--expected-count', '1', '--workers', '1'], { encoding: 'utf8' });
    assert.equal(imported.status, 0, imported.stderr);
    const catalog = JSON.parse(fs.readFileSync(path.join(output, 'config/playlist.json'), 'utf8'));
    assert.equal(catalog.songs.length, 1);
    assert.deepEqual(catalog.dj, []);
    assert.equal(catalog.songs[0].title, 'Tagged title');
    assert.equal(catalog.songs[0].artist, 'Test Artist');
    assert.equal(catalog.songs[0].file, 'audio/songs/track-001.ogg');
    assert.equal(catalog.songs[0].codec, 'vorbis');
    assert.ok(catalog.songs[0].durationSeconds > 0.29 && catalog.songs[0].durationSeconds < 0.31);
    assert.match(catalog.songs[0].sha256, /^[a-f0-9]{64}$/);
    assert.deepEqual(fs.readFileSync(original), before);
    const inspected = spawnSync(ffprobe, ['-v', 'error', '-show_streams', '-of', 'json', path.join(output, catalog.songs[0].file)], { encoding: 'utf8' });
    assert.equal(inspected.status, 0, inspected.stderr);
    const stream = JSON.parse(inspected.stdout).streams[0];
    assert.equal(stream.codec_name, 'vorbis');
    assert.equal(stream.sample_rate, '48000');
    assert.equal(stream.channels, 2);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
