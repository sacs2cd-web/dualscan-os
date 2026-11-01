# Foundation and FiveM integration evidence

Inspected upstream: [Hellslicer/fivem-radio](https://github.com/Hellslicer/fivem-radio), revision `969855dfc2525582f8acc52bd7d748e905f055a8` (resource version 2.1.0). The MIT notice identifies **Copyright (c) 2017 Kevin Poirot**. Preserve the full notice and permission text with derived source and distributions; VisaUSD™ branding and supplied recordings have separate provenance.

The [upstream station table](https://github.com/Hellslicer/fivem-radio/blob/969855dfc2525582f8acc52bd7d748e905f055a8/radio/data.js) maps Worldwide FM to **`RADIO_13_JAZZ`**. The [official station reference](https://docs.fivem.net/docs/game-references/radiostations/) independently agrees. Use this string, not a numeric wheel position: the official table is explicitly build-specific.

The [upstream client](https://github.com/Hellslicer/fivem-radio/blob/969855dfc2525582f8acc52bd7d748e905f055a8/radio/client.js) provides the foundation for replacing the display name with `AddTextEntry`, detecting the selected station, following profile music volume, and suppressing native radio while custom audio is active. Its decorator-based spatial playback and remote-stream configuration are outside this resource's in-vehicle local broadcast design.

## Native boundary

- [`GetPlayerRadioStationName`](https://github.com/citizenfx/natives/blob/master/AUDIO/GetPlayerRadioStationName.md) returns the selected station's label identifier.
- [`IsPlayerVehRadioEnable`](https://github.com/citizenfx/natives/blob/master/AUDIO/IsPlayerVehRadioEnable.md), hash `0x5F43D83FD6738741`, is the current native name. Older resources use the alias `IsPlayerVehicleRadioEnabled`.
- [`AddTextEntry`](https://github.com/citizenfx/fivem/blob/master/ext/native-decls/AddTextEntry.md) replaces a label. Cache the original localized `GetLabelText` value before overriding it, and restore it when the resource stops.
- [`SetFrontendRadioActive`](https://github.com/citizenfx/natives/blob/master/AUDIO/SetFrontendRadioActive.md) controls frontend radio; [`SetPositionedPlayerVehicleRadioEmitterEnabled`](https://github.com/citizenfx/natives/blob/master/AUDIO/SetPositionedPlayerVehicleRadioEmitterEnabled.md) controls the player vehicle's positioned emitter.
- Upstream brackets custom playback with the named audio scene `DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE`. [`StartAudioScene`](https://github.com/citizenfx/natives/blob/master/AUDIO/StartAudioScene.md) changes the mix; [`StopAudioScene`](https://github.com/citizenfx/natives/blob/master/AUDIO/StopAudioScene.md) stops the named scene started by this script. The scene's precise mix is not documented by these declarations. This is upstream implementation evidence, not a new live-game verification.
- [Profile setting 306](https://docs.fivem.net/docs/game-references/profile-settings/) is music volume. Upstream normalizes it by dividing by 10.

Apply suppression only while the player is tuned to the replacement station; restore it on switch, exit, and resource stop. Do not hide or lock the station, rebuild the wheel, or force another station during ordinary polling. Native audio mix state can be shared with other resources, so validate alongside the server's actual radio/HUD scripts.

## Verification limits

Node tests can verify decision logic, messages, and cleanup calls against native mocks. They cannot establish how a particular GTA V/FiveM build renders its wheel, interprets a named audio scene, or mixes NUI audio. Complete the in-game acceptance procedure on the target Windows client and record game build, FiveM artifact, and results. Do not describe those checks as passed solely because unit tests pass.
