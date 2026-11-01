# Verification and acceptance

Verified on 1 November 2026 in the supplied macOS workspace using Node.js 18.16, Python 3.12, ffprobe, and a locally available full ffmpeg build. No FXServer installation or running GTA V PC client was available, so no live engine result is claimed.

## Completed automated checks

- `npm test`: **42 passed, zero failures, zero skips** with `VISAUSD_FFMPEG` pointing to a build that includes libvorbis. The conversion tests skip only if no such encoder is installed. Runtime playback does not require ffmpeg.
- `python3 -m unittest discover -s tests -p 'test_*.py'`: **2 passed** for atlas patching and preservation.
- `npm run validate`: all **51** packaged assets are OGG containers with Vorbis audio, matching manifest hashes and durations within 50 ms.
- Full audio decode of all 51 files with ffmpeg `-xerror -f null`: **zero failures**.
- Packaged song duration: **10,299.214732 seconds** (171.65 minutes); total audio: **190,035,928 bytes**.

JavaScript coverage includes shuffle without replacement across 20 full 51-song cycles, no immediate boundary repeat, independent DJ/ad/ID frequencies, optional empty categories, exact segment boundaries, delayed ticks, immutable metadata, invalid inputs, synchronized listener snapshots, and late joins. Transport tests cover local-only paths, seek-on-ready, drift correction, pause/resume, volume, cleanup, source/play promise races, and asynchronous buffered asset loading with stale-object-URL cleanup. VM integration tests execute the actual client/server scripts against injected native hosts, testing switching, off/exit/death, commands, pause menu, NUI startup order, clock estimation, request limits, server rollback, and invalid assets. HTTP checks cover byte ranges and source/path isolation.

## Browser checks performed

Using the local server at `http://127.0.0.1:4173/web/`, verified rendering, loaded 51-song metadata, actual OGG playback (`audio.paused === false` and advancing media time), pause, next, mute/unmute, search, and direct song audition. The supplied VisaUSD logo is rendered from a packaged PNG. No external font, media, or streaming service is used. Browser preview timelines are independent per visitor.

Public hosted demo also verified to load the complete catalog and play its same-origin OGG assets after publication.

## Required Windows/FiveM checks — not yet performed

Record GTA build, FXServer artifact, FiveM client channel/build, server resource list, date, tester, and result for each check. Start on a test server or maintenance session using the actual radio/HUD resource combination.

| Check | Procedure and expected result |
| --- | --- |
| Installation isolation | Add only this resource and its `ensure` entry. Existing server settings/resources continue unchanged. |
| Native wheel | Enter a normal vehicle. The existing Worldwide FM slot is named VisaUSD™ Radio. Every other station remains selectable, including radio off. No custom replacement wheel appears. |
| Target audio | Tune to VisaUSD. Hear the current local song with no underlying Worldwide FM audio. F8 has no media decode errors. |
| Other stations | Switch to multiple native stations, radio off, then VisaUSD. Native audio returns immediately on other stations; VisaUSD audio does not bleed through. |
| Vehicle state | Test driver/passenger, vehicle change, engine off/on, exit/re-entry, and death. Leaving or disabling radio silences custom audio. Native vehicle radio state remains controlled by GTA. |
| Pause menu | While tuned, open/close pause menu. Default configuration silences locally, then rejoins current broadcast time. Test `pauseOnPauseMenu: false` if desired. |
| Local pause | `/visausdradio pause` silences locally; resume rejoins the live station. Other players keep hearing uninterrupted music. |
| Volume | Test game Music Volume 0/50/100 and `/visausdradio volume 0/50/100`. Confirm compounded gain and persisted local volume after reconnect. Other stations keep native behavior. |
| Shuffle | Observe segment logs/status or temporarily use a test catalog with short valid OGGs. Each song occurs once per full cycle before a new cycle, including breaks. Restore all 51 production songs afterward. |
| DJ/ads/IDs | Import a short clip in each category. Set frequencies to small values and test their exact between-song order; test zero frequency and empty-array disabling. |
| Multiple players | Two clients in the same and different vehicles tune in. Compare `/visausdradio status` segment IDs and record simultaneous audio with timestamps. Items should match and offsets should converge approximately; record measured skew, rather than assuming sample accuracy. |
| Late join | Join during an existing song and tune in. Same segment, position near the other listener; it should not restart the track at zero. Test slow cache/network and reconnect. |
| Stop/restart | Stop resource while tuned and while on another station. Native mix/label restore, no NUI audio persists. Restart begins a new shared broadcast and resyncs clients. |
| Offline media | After game/resource assets are cached, block third-party streaming domains while keeping the FiveM connection. Songs play from resource assets. A completely disconnected multiplayer client is outside this test. |
| Native logo | Install prepared `stream/hud.ytd` from the correct build, reconnect, inspect target logo and every other icon at multiple resolutions. Verify the unmodified native stations retain their logos. |

Native wheel artwork and target-only mixing depend on the actual game build and existing radio/HUD scripts. The supplied atlas helper verifies PNG pixels; re-encoding its result into a texture dictionary still needs visual inspection.
