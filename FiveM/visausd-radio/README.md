# VisaUSD™ Radio

A standalone FiveM GTA V PC resource and browser player, built from the MIT-licensed [Hellslicer/fivem-radio](https://github.com/Hellslicer/fivem-radio) foundation. Only **Worldwide FM (`RADIO_13_JAZZ`)** is replaced and renamed. Other native station slots remain available. No FXServer changes, framework dependency, Spotify, web radio, or external audio service is required.

The package contains **51 supplied songs**, converted to local OGG Vorbis at 48 kHz stereo: **171.65 minutes**, approximately **181.2 MiB** of audio. The VisaUSD™ logo is used in the browser player. The native wheel artwork requires a build-specific atlas patch described below.

## Browser player

A hosted demo is prepared separately from the FiveM runtime. See `docs/DEPLOYMENT.md` for its URL and publication status.

To run the same player locally, install Node.js 18 or newer, open a terminal in this folder, and run:

```bash
npm start
```

Open **http://127.0.0.1:4173/web/**. Press **Tune in**, select a song in the searchable library to audition it, or use Next, Pause, Volume, and Mute. This requires an HTTP server; opening the HTML directly as `file://` cannot reliably fetch the playlist.

The browser buffers each packaged OGG file before playback, so the first tune-in or a new song may take a moment to load. Each browser visitor has an independent shuffle. The browser player does not connect to FXServer and does not claim to demonstrate vehicle/native-wheel behavior. Pause silences the listener; resume rejoins the progressing preview timeline. A song audition returns to the shuffle when the song ends. Next and direct song audition are preview controls only.

To demo on a trusted LAN, explicitly bind the preview server to the LAN interface:

```bash
HOST=0.0.0.0 PORT=4173 npm start
```

Other devices use the host's LAN IP and port. For a public static host, run `node scripts/export-demo.js /absolute/output/path` and deploy the generated folder. Audio is served as packaged files from the same host. The FiveM resource continues to use its own local assets independently of the demo website.

## Install the FiveM resource

1. Copy the **entire `visausd-radio` folder** into your server's resource directory, for example `resources/[local]/visausd-radio`. Keep this folder name. Do not nest it inside another `visausd-radio` directory.
2. Add just this resource entry to the existing `server.cfg`:

   ```cfg
   ensure visausd-radio
   ```

   Do not replace the existing configuration. If the server is already running, use its console: `refresh`, then `ensure visausd-radio`.
3. Connect using GTA V PC/FiveM. Allow the resource's audio assets to download/cache, enter a vehicle, open the **native radio wheel**, and select Worldwide FM's existing slot, now named **VisaUSD™ Radio**. The slot's icon remains Worldwide FM until the optional atlas is installed.
4. Perform the Windows/FiveM acceptance checks in `docs/TESTING.md` before production use. Automated tests here cover logic and mocked native calls; GTA V and FXServer were not available in this workspace.

The resource never edits the FXServer binary, game installation, other resources, station lists, or server configuration. The one `ensure` line is an installation instruction for the server operator. Do not run two resources that both replace Worldwide FM. Existing scripts that globally mute radio or replace `hud.ytd` may need coordination.

## Playback and synchronization

The server owns **one broadcast schedule**. Fisher–Yates shuffle bags play every song exactly once before reshuffling, and avoid the same song straddling two cycle boundaries. DJ clips, advertisements, and station IDs have independent shuffle bags and are inserted only between songs. Empty optional categories are skipped.

All clients receive the same current item and server start time. They estimate server clock offset from ping round trips, seek into the broadcast on tune-in/late join, and correct drift greater than `driftToleranceSeconds`. The server sends new segments promptly and refreshes snapshots every five seconds by default. This is **approximate synchronization**, not sample-accurate audio: decoding, cache download, latency, and background browser throttling affect what a player hears. A resource restart starts a fresh shuffle.

Tuning away, turning radio off, exiting/dying, local Pause, or opening the pause menu silences VisaUSD™ Radio locally. The shared station keeps moving; resume rejoins the current live position. Switching to another station restores native playback. No outside-vehicle spatial audio is implemented. GTA handles the vehicle's native station selection; this resource distributes broadcast timing, not a separate vehicle station state.

Player commands (chat or F8 without the slash):

| Command | Effect |
| --- | --- |
| `/visausdradio tune` | Explicitly select VisaUSD™ Radio in the current vehicle |
| `/visausdradio pause` | Silence VisaUSD™ Radio locally |
| `/visausdradio resume` | Rejoin the live station when tuned in |
| `/visausdradio volume 0–100` | Set local volume; persisted as a resource KVP |
| `/visausdradio status` | Show segment, listening state, gain, and clock offset |

Effective volume is game Music Volume × local volume × `stationGain`, each clamped to 0–1. Other stations retain native volume behavior. The browser has its own volume control.

## Configure songs and broadcast breaks

Edit `config/playlist.json` for metadata and `config/station.json` for station behavior. All paths are relative to the resource root and must match `audio/{songs,dj,ads,ids}/safe-name.ogg`; URLs and traversal paths are rejected. Each entry needs a unique `id`, correct `type`, `file`, `title`, `artist`, accurate `durationSeconds`, and the encoded file size in `bytes`. Importers also record `sha256`, which validation checks when present. See `docs/AUDIO.md` for import tools and metadata rules.

Default schedule:

```json
{
  "songsBetweenAds": 4,
  "songsBetweenDj": 2,
  "songsBetweenIds": 1,
  "adsPerBreak": 1
}
```

Set a frequency to `0` to disable it. When categories are due at the same boundary, their order is DJ → advertisements → station ID → next song. Counts advance when songs finish, never when clips finish. No DJ/commercial recordings were supplied, so their arrays start empty and no breaks play until you import clips. Their OGG folders and manifest globs are ready.

Use `npm run validate` after asset edits (requires ffprobe on the preparation workstation), then restart this resource. Runtime FiveM does not require Node/npm installations, Python, ffmpeg, or ffprobe outside its normal bundled runtimes.

## Custom wheel logo

Follow **`docs/LOGO.md`** and use `scripts/patch-wheel-atlas.py` with an exported copy of your supported game build's atlas and measured Worldwide FM tile rectangle. It changes only that tile and verifies all other PNG pixels remain identical. Reimport into a copy of `hud.ytd` and place it in `stream/hud.ytd`.

A finished Rockstar texture dictionary is not included; the supplied PNG alone cannot replace one tile of GTA's shared native atlas. The custom native-wheel-logo requirement remains a deployment step until your build's patched dictionary is supplied and checked. The browser artwork is complete.

## Source layout and future adapters

- `core/scheduler.js`: playlist/broadcast scheduling; no FiveM, DOM, filesystem, or implicit clock API.
- `core/player.js`: injectable local-media transport and drift correction; no FiveM calls.
- `core/radio-controller.js`: pure selection/volume/pause decisions with injected effects.
- `server/fivem.js`: server clock, scheduler, snapshots and request rate limiting.
- `client/fivem.js`: native wheel selection/name/audio mixing, commands, NUI bridge.
- `web/nui.*`: invisible FiveM audio client; never requests NUI focus.
- `web/index.html`, `demo.js`, `style.css`: browser demo using the same core.
- `vendor/fivem-radio/`: unmodified upstream reference at the recorded revision.

For a future GTA VI platform, reuse the scheduler/catalog and replace the platform adapters once actual APIs exist. No GTA VI API or FiveM support is assumed. `docs/UPSTREAM.md` records the inspected revision, station/native references, and changes from upstream.

## Tests and removal

```bash
npm test
npm run validate
python3 -m unittest discover -s tests -p 'test_*.py'
```

`docs/TESTING.md` describes results and engine-level checks still pending. No npm dependencies are needed. The importer conversion test requires an ffmpeg build with libvorbis, and skips if unavailable.

To uninstall, `stop visausd-radio`, remove/comment its `ensure` line, then remove this resource folder. The stop handler pauses local media, restores the prior localized station label, and restores the native mix if the resource had suppressed it. Reconnect if a streamed HUD dictionary remains cached. No original game files were modified.

## License and assets

Code is MIT; preserve `LICENSE`, the upstream Kevin Poirot notice, and `docs/UPSTREAM.md`. Supplied music and VisaUSD™ artwork remain separate assets under their existing ownership; see `ASSET-NOTICE.md`. The code license does not relicense those assets.
