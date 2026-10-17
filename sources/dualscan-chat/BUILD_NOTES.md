# Dualscan Chat Build Notes

Build date: 2026-04-28

## Source

- Source tree: Dualscan Chat Android fork in `/Users/williamgrecia/Documents/New project/dualscan-briar`
- Source commit: `ea7c35afd25b7ca33ae0d51f40fe99bd306c9e6c`
- Package name: `com.dualscan.concertparty`
- App name: `Dualscan™ Chat`
- Version: `1.5.17-dualscan.1`

## Product Transport

- Default internet path: Tor transport.
- Local fallback: LAN TCP transport remains enabled for local Wi-Fi speed/reliability.
- Nearby fallback: Bluetooth transport remains enabled.
- Transport factory order: Tor, LAN, Bluetooth.
- SMP/SimpleX: not used.
- Public servers: no public SimpleX/SMP server list or server fallback.
- Mailbox/store-and-forward: disabled and removed from the Android UI/resources for this product build.

## Key Changes

- Rebranded Android application ID, label, launcher icon, splash image, and in-app icon assets to Dualscan.
- Replaced launcher/adaptive/splash/in-app/QR badge icon assets with `/Users/williamgrecia/Desktop/Grecia Estate & Trust Documents/US FinTech/SonyATV/Logos/Dualscan Chat.png`.
- Replaced the navigation drawer header icon/text with the production Dualscan icon and `Dualscan™ Chat` label.
- Removed the old Briar drawer header vector resources and old Briar-shaped ongoing notification vector.
- Regenerated the ongoing notification fallback PNGs with a white Dualscan mark.
- Updated the Android theme to a `#000000` black base with `#FF00FE` accent controls, links, highlights, and chat styling.
- Replaced user-facing `Briar`/`Brair` string text in Android string resources with `Dualscan`.
- Changed invite scheme generation/parsing from `briar://` to `dualscan://`.
- Manifest now registers `dualscan://` for contact invite links.
- Plugin config now returns no simplex plugin factories, removing Mailbox/removable-drive server-style transports from active configuration.
- Mailbox client support is disabled and mailbox service registration/listening is removed.
- Mailbox and hotspot UI activities/resources/assets are removed from the production package.
- Crash/developer report sending is disabled so reports are not sent to an upstream public endpoint.
- Fixed the Add Contact Nearby failure screen so a normal LAN/Bluetooth key-agreement timeout no longer crashes the app when the white-label feedback text has no hyperlink.
- Set transport startup and connection preference to Tor first, LAN second, Bluetooth third. The nearby QR key-agreement connector uses the same preference list, but original Briar Tor does not advertise local key-agreement descriptors, so nearby QR currently falls through to LAN then Bluetooth.

## Build Commands

```bash
JAVA_HOME="$(/usr/libexec/java_home -v 21)" \
ANDROID_HOME="$HOME/Library/Android/sdk" \
./gradlew :briar-android:assembleOfficialRelease
```

```bash
$HOME/Library/Android/sdk/build-tools/36.0.0/zipalign -p -f 4 \
  briar-android/build/outputs/apk/official/release/briar-android-official-release-unsigned.apk \
  deliverables/Dualscan-Chat-production-release-aligned.apk

$HOME/Library/Android/sdk/build-tools/36.0.0/apksigner sign \
  --ks "/path/to/your-development-signing-key.jks" \
  --ks-key-alias dualscan-concert-party \
  --out deliverables/Dualscan-Chat-production-release-signed.apk \
  deliverables/Dualscan-Chat-production-release-aligned.apk
```

## Build Outputs

- Unsigned APK: `/Users/williamgrecia/Documents/New project/dualscan-briar/briar-android/build/outputs/apk/official/release/briar-android-official-release-unsigned.apk`
- Signed APK: `/Users/williamgrecia/Documents/New project/dualscan-briar/deliverables/Dualscan-Chat-production-release-signed.apk`
- Final signed APK copy: `/Users/williamgrecia/Documents/New project/dualscan-briar/deliverables/Dualscan-Chat-final-production-release-signed.apk`
- USB copy: pending; `/Volumes/Samsung USB` was not mounted during this build pass.
- Signed APK SHA-256: `b2689396f5a943282fd10a3bdddadbbff81ff3897889faa53bed5c01d308da6b`

## Known Limitations

- No default Digitaldruglord contact is baked into this build. This is intentional for the bootstrap build; bake the real `dualscan://` invite after generating/testing it on-device.
- No device install/runtime test was possible from this workstation because `adb devices` reported no attached devices.
- Voice/video calling was not changed in this pass; this build follows the current messaging transport trunk.
