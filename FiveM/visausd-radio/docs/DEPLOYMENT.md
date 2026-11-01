# Deployment

Published on **1 November 2026** as **VisaUSD™ Radio**.

Public browser demo: **https://visausd-radio.alleong.chatgpt.site**

Anyone with the URL can visit and listen. The browser fetches each complete same-origin OGG into a typed audio Blob before playing, avoiding the host's lack of media byte-range support. The publication uses the supplied Vice City sunset image as a fixed cover background with readability overlays. It includes all 51 packaged OGG assets, the supplied VisaUSD logomark, Vice City headline, both requested badge removals, and the user-requested `Digitaldruglord & Spynx` credits for the 32 songs formerly labeled Unknown artist. Existing non-Unknown credits are retained.

## Browser source and hosting

The sibling `visausd-radio-demo-site` checkout contains `.openai/hosting.json`, the Site project identity, and a standalone static `dist/` output. The source was pushed before the archive was saved and deployed. Source commit:

```text
fd43206c2c56c1731ad6669c5fd1710f9957fb77
```

Saved version: `appgprj_6ae72c056bc481918625887559b5576c~appgver_b114054023b88191b113be8b0a3151a2`

Deployment: `appgdep_6ae72ffe13c88191b7474538d43c48c1` — succeeded.

Future resource changes do not automatically update the public demo. Regenerate the static export, synchronize the Site source checkout, and publish a new saved version using the existing project identity. The source host limits each Git push to 64 MiB, so large audio changes must be pushed in smaller commits/batches. Do not create another Site to update this one.

For another static host, run `node scripts/export-demo.js /absolute/empty/output`. The exported player works at a domain root or beneath a URL prefix, with all audio on the same origin. No API keys, FiveM server, external streaming provider, or npm dependencies are needed for the browser demo.

## FiveM deployment

No server installation, running server configuration, or FXServer binary was changed by this work. Deploy the `visausd-radio` resource separately using the included README (`ensure visausd-radio`). The website is independent of the in-game audio path.

The resource supports one approximately synchronized server broadcast; each browser visitor has an independent preview timeline. Live Windows/FiveM verification and preparation of the native wheel's build-specific `stream/hud.ytd` remain pending. See `TESTING.md` and `LOGO.md` for the exact procedures.


## GitHub Pages player — November 1, 2026

The player is now available at https://dualscan.cloud/gtaradio/ and linked from https://dualscan.cloud/gtavi/. Its static HTML, CSS, scripts and playlist live in `docs/gtaradio/`. The 51 OGG files are streamed directly from the public repository folder `FiveM/visausd-radio/audio/songs/` through `raw.githubusercontent.com`, using browser-native audio playback and metadata preload. They are not duplicated in the Pages docs tree.

Each web visitor still has an independent shuffle. The downloadable FiveM resource retains its local packaged assets and shared server broadcast; its runtime code is unchanged by this hosting migration.
