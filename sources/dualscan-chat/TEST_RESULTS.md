# Dualscan Chat Test Results

Test date: 2026-04-28

## Build Verification

- `./gradlew :briar-android:assembleOfficialRelease`: passed.
- APK signing with `apksigner`: passed.
- Signature verification: v1, v2, and v3 schemes passed.
- `aapt dump badging`: package is `com.dualscan.concertparty`; app label is `Dualscan™ Chat`.
- Launcher manifest registers adaptive icon resources for all densities.
- Add Contact Nearby QR layout uses `@drawable/dualscan_chat_icon` for the center badge.
- Navigation drawer header now uses `@drawable/dualscan_chat_icon`; the old `navigation_drawer_header` vector resources are removed.
- Ongoing notification small-icon resources now resolve to regenerated Dualscan PNGs; the old Briar-shaped vector is removed.
- Add Contact Nearby failure screen was patched to tolerate plain recovery text instead of assuming a feedback hyperlink exists.
- Transport ordering was rebuilt as Tor first, LAN second, Bluetooth third for normal connections and preferences. Nearby QR key agreement lists the same order, with LAN/Bluetooth used in practice because upstream Briar Tor does not support key-agreement listeners.

## Transport/Config Verification

- Manifest registers `dualscan://` invite links.
- Static archive scan found no packaged `simplex`, `mailbox`, `hotspot`, `smp`, `libsimplex`, or removable-drive package entries.
- Source scan confirms branded invite generation/parsing uses `dualscan://`; `briar://` is no longer used for invite links.
- Readable string/archive scans found no public SimpleX/SMP endpoints or Mailbox/hotspot/removable-drive package entries.
- Tor dependencies are present through the included Tor transport dependencies.
- Signed APK SHA-256: `b2689396f5a943282fd10a3bdddadbbff81ff3897889faa53bed5c01d308da6b`.

## Device Testing

- `adb devices -l` returned no connected Android devices.
- USB copy was skipped because `/Volumes/Samsung USB` was not mounted.
- Fresh install, account creation, QR/contact exchange success, Tor connectivity, LAN fallback, and Bluetooth fallback still need on-device validation.
- The pasted QR failure log was reproduced logically through code inspection: after `KeyAgreementFailedEvent`, the app opens the nearby-contact error screen. The patched screen should now display retry guidance instead of crashing when key agreement times out.

## Next Validation Pass

1. Install `/Users/williamgrecia/Documents/New project/dualscan-briar/deliverables/Dualscan-Chat-production-release-signed.apk`.
2. Create the first Dualscan profile.
3. Generate a real `dualscan://` invite for Digitaldruglord.
4. Confirm two devices can add each other by QR/link.
5. Test messaging over cellular/Wi-Fi internet via Tor.
6. Test same-LAN messaging for local fallback.
7. Test nearby Bluetooth messaging if Android permissions/hardware allow it.
