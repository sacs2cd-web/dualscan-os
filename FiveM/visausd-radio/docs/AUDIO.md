# Local audio and prerecorded broadcasts

The resource includes all **51 songs** from the supplied ATV Radio folder, converted to OGG Vorbis at quality 5, stereo, 48 kHz. Total playback time is approximately **171.65 minutes** and the song payload is **190,035,928 bytes**. FiveM serves these packaged assets; playback does not contact an external music service. The conversion tools are needed only when changing the library.

`config/playlist.json` is the editable catalog. It contains `songs`, `dj`, `ads`, and `ids` arrays. Each item supplies its unique `id`, `type`, local `file`, `title`, `artist`, `album`, `durationSeconds`, `mimeType`, `codec`, `bytes`, and `sha256`. Optional `isrc` values are retained where the input provides them. `config/source-audio.json` records the source filenames and encoding settings.

Titles and artist credits come from embedded metadata. Where metadata is absent, filenames explicitly structured as `Artist - Album - 01-03 Title` provide those fields. Other filenames supply the title; The user assigned **`Digitaldruglord & Spynx`** to the 32 songs whose source files did not identify an artist. Other supplied artist credits are retained. Edit `title`, `artist`, `album`, or `isrc` directly in the JSON to correct display metadata. This does not require reencoding audio and does not change the audio's duration, byte count, or SHA-256. Leave file integrity fields unchanged unless replacing the audio itself. Restart the resource and reload the browser player after catalog edits.

## Reimport the song library

Install Python 3, ffprobe, and an ffmpeg build with the **libvorbis** encoder. The importer checks encoder availability and does not silently substitute another codec.

From the resource directory:

```sh
python3 scripts/import-audio.py \
  --source '/path/to/the/51-song-folder' \
  --output '/path/to/visausd-radio' \
  --workers 3
```

The source folder is read only. Input audio is autodetected by ffmpeg; supported filename extensions are WAV, FLAC, OGG, MP3, M4A, AAC, AIFF, and AIF. The importer expects exactly 51 input files by default and writes `audio/songs/track-001.ogg` through `track-051.ogg`. IDs follow a case-insensitive filename sort; changing the source set or filenames can change IDs. Existing DJ, ad, and station ID arrays are preserved. Reimporting rebuilds song metadata, so retain a copy of any manual catalog corrections.

Use `--expected-count N` only when intentionally changing the library size, and update `expectedSongCount` in `config/station.json` to match. Conversion workers are bounded from one to four. Run imports one at a time while the resource is stopped, then run `npm run validate` before restarting.

If the default ffmpeg lacks libvorbis, select a complete build explicitly:

```sh
python3 scripts/import-audio.py \
  --source '/path/to/music' \
  --ffmpeg '/path/to/full/ffmpeg' \
  --ffprobe '/path/to/ffprobe'
```

`VISAUSD_FFMPEG` and `VISAUSD_FFPROBE` provide the same defaults through environment variables. These overrides apply to both import helpers and their integration tests.

## Add a DJ announcement, advertisement, or station ID

No spoken clips were supplied, so the optional segment arrays start empty. Empty categories are skipped even when a frequency is configured. To add a recording:

```sh
python3 scripts/add-segment.py \
  --source '/path/to/dj-intro.wav' \
  --kind dj \
  --id dj-intro-01 \
  --title 'Welcome to VisaUSD™ Radio' \
  --artist 'VisaUSD™ DJ'
```

`--kind dj`, `--kind ad`, and `--kind id` write to `audio/dj/`, `audio/ads/`, and `audio/ids/`, respectively, and append to the corresponding catalog array. `--output` selects another resource root; otherwise the script uses its own resource directory. `--artist` is optional and falls back to the source credit. `--ffmpeg`, `--ffprobe`, and their environment variables work as above.

IDs must be unique across the entire catalog and use lowercase letters, digits, hyphens, or underscores. The helper refuses duplicate IDs and existing destination files. Use a new ID to add a replacement, then remove the old item and its unused file deliberately. It converts and verifies the clip before atomically updating the JSON; all songs and other segment arrays are retained.

Configure insertion frequency under `schedule` in `config/station.json`:

```json
{
  "songsBetweenAds": 4,
  "songsBetweenDj": 2,
  "songsBetweenIds": 1,
  "adsPerBreak": 1
}
```

Each frequency counts completed songs; `0` disables that category. When multiple categories are due, the order is DJ announcements, advertisements, then station IDs. Segments play between songs. Songs and each segment category use separate shuffle bags, so adding speech does not consume or reset the song playlist.

## Validation

`npm run validate` checks catalog structure, local paths, the expected song count, file sizes, hashes, and OGG headers. `npm test` includes tiny synthetic audio imports when ffmpeg with libvorbis is available; encoding tests otherwise report a skip. The supplied 51-song library was also fully decoded with ffmpeg using error-on-decode-failure, with no failures.
