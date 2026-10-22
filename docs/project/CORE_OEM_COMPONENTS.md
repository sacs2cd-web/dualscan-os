# Dualscan™ OS Core OEM Components

Manifest version 1.0 · October 2026

This document identifies the Core OEM Components referenced by sections 3–5 of the [Dualscan OS Community & Commercial License](LICENSE). The machine-readable inventory is [manifests/core-oem-v1.json](manifests/core-oem-v1.json).

The protected dock and component definitions retain the supplied October 16 reference screenshots and independently inspected baseline APK manifests. The distribution payload was updated from the owner-supplied October 20 release. Current standalone OEM package versions and hashes are listed separately in [manifests/oem-apk-release.json](manifests/oem-apk-release.json). The base APKs and primary application manifest inside the supplied Smart Switch backup are encrypted. Accordingly, standalone versions and hashes below are **reference artifacts, not cryptographically verified versions of the encrypted backup**. At the owner’s direction, the supplied Smart Switch folder is being published intact and as-is. Its exact payloads remain the restore source; the independent standalone references do not substitute for them.

## Required home-screen tray

Preserve these five visible, accessible positions from left to right. Positions are visual positions from the supplied home-screen screenshots, not decoded Samsung database cell IDs.

| Position | Application | Android package | October 16 standalone reference |
| --- | --- | --- | --- |
| 1 · left | Typelocker Gmail | `com.ustfdatv.typelockergmail` | 1.0 / code 10000 |
| 2 | USPS Money · Baby Bishiki icon | `com.bishiki.uspsmoney.local` | 1.0.5 / code 6 |
| 3 · center | USPS Banking | `com.usps.myusps_mobile_app_android` | 2.4.5.6 / code 2456 |
| 4 | USPS® Wallet · multicolor code icon | `io.horizontalsystems.bankwallet` | 0.48.27-noqr-walletmode-biometric / code 191 |
| 5 · right | VisaUSD™ | `com.bishiki.visausd.local` | 1.0.5 / code 6 |

Evidence: `Screenshot_20261016_201221_One UI Home.jpg` and `Screenshot_20261016_203145_One UI Home.jpg`, supplied by the project owner. The second screenshot retains the same five positions with a different wallpaper.

Alternative launchers may be added under the License, provided the mandatory tray remains visible and accessible in the delivered distribution. This distribution requirement does not prevent ordinary end-user control after delivery.

## Additional protected OEM applications

These protected components are identified by the baseline package and launcher references. They remain part of the component policy; no mandatory tray position is assigned to them by the supplied screenshots. The October 20 restore payload and companion standalone OEM APKs are inventoried separately.

| Application | Android package | Standalone reference and evidence status |
| --- | --- | --- |
| Typelocker Outlook | `com.ustfd.typelockeroutlook` | Encrypted payload and launcher record; version unverified |
| Dualscan™ Chat | `com.dualscan.concertparty` | 1.5.17-dualscan.1 / code 10517 |
| Dualscan LDAC Activator | `com.dualscan.ldacactivator` | 1.4 / code 5 |
| Diamond™ Player · launcher label Diamond™ | `com.dualscan.mp` | 1.2.1 / code 6; inspected candidate is a development APK |
| Dualscan Share Lite | `com.dualscan.share.lite` | October 20: standalone 1.1.1 supplied in the OEM APK folder; no encrypted Share Lite base APK is present in this supplied restore tree |
| VisaUSD Typelocker Wallet | `com.visausd.typelocker.wallet` | Encrypted payload and launcher record; version unverified |

Baseline software references, permissions, activities, services, receivers, and providers are recorded in [the core JSON manifest](manifests/core-oem-v1.json). Current restore-file hashes are in [BACKUP_SHA256.json](BACKUP_SHA256.json), and the October 20 standalone OEM APK identities and hashes are in [manifests/oem-apk-release.json](manifests/oem-apk-release.json). An encrypted Smart Switch payload hash identifies that encrypted file; it is not the hash of its restored APK. The encrypted backup was not decrypted to establish a match.

## Protected operational components

Preserve the functionality of the supplied core APKs and their required platform interfaces. These named components are confirmed in standalone APK manifests, independently of the encrypted backup:

| Core application | Application components essential to its function |
| --- | --- |
| USPS Money and VisaUSD™ | `com.bishiki.wallet.local.MainActivity`; local bundled wallet assets and native biometric bridge |
| VisaUSD™ Gaming Credits | `com.bishiki.wallet.local.nfc.GamingCreditsHceService`, bound by `android.permission.BIND_NFC_SERVICE`; separate from the retired NFC card feature |
| VisaUSD™ community manual | `com.bishiki.wallet.local.manual.ManualActivity`; bundled U.S. Gamer rulebook |
| Diamond™ Player | `com.dualscan.mp.TransferService`, `com.dualscan.mp.Media3PlaybackService`, `com.dualscan.mp.audio.NativePlaybackService`, and non-exported `com.dualscan.mp.audio.EncryptedMediaProvider` |
| Dualscan Share Lite | `com.dualscan.share.TransferService` |
| Dualscan™ Chat | `org.briarproject.briar.android.BriarService` and `org.briarproject.briar.android.NotificationCleanupService` |
| USPS® Wallet | `io.horizontalsystems.bankwallet.modules.wallpaper.WalletModeWallpaperService`, `org.torproject.jni.TorService`, and its packaged AndroidX job/widget/database components |
| Typelocker Gmail | `com.ustfdatv.typelockergmail.MainActivity`; packaged non-exported file provider |
| Typelocker Outlook | `com.ustfd.typelockeroutlook.MainActivity`, confirmed in the readable backup launcher record; internal services unverified |
| USPS Banking | `com.optimo.myusps_mobile_app_android.activity.CPHomeScreenActivity`, confirmed in the readable backup launcher record; packaged Google analytics/measurement and Firebase service declarations are inventoried in JSON |
| Dualscan LDAC Activator | `com.dualscan.ldacactivator.MainActivity`; no app service declared in the inspected APK |
| VisaUSD Typelocker Wallet | `com.visausd.wallet.MainActivity`, confirmed in the readable backup launcher record; internal services unverified |

AndroidX, Tor, Google, Firebase, Samsung, and other third-party components retain their own licenses and terms. Listing a dependency here does not relicense it or create ownership over it. The full supporting component names and declared permissions are available in the JSON inventory.

## Required settings and behavior

These are functional preservation requirements for a delivered derivative. They are not claims that a particular live device setting, permission grant, USB DAC, or restore has been tested.

- Keep all 11 core packages installed, launchable, and accessible. Preserve the five tray positions above. Preserve package identities and compatible signed update paths.
- Preserve local wallet operation, PIN-protected recovery and Android biometric unlock. Preserve fresh biometric authorization before Pay → Send signing or fee/payment submission. Keep PIN fallback available for wallet unlock.
- Keep Typelocker™ Cypher recovery scanning inside the recovery flow, and Typelocker™ Sypher URL recognition in the ordinary in-app scanner. Preserve the existing scanner and mascot behavior.
- Preserve VisaUSD™ Gaming Credits NFC phone-to-phone transfer, the 20,580 daily allocation, and the 9am `America/New_York` reset. Do not reintroduce the removed NFC card UI/recovery feature.
- Preserve wallet RPC defaults and the user's endpoint override controls. Preserve the current fee behavior: the app fee is 0.50 USDC on the transaction network for supported assets other than native ETH and SOL; network fees remain separate.
- Preserve Diamond's authenticated encrypted-media input, non-exported decoder interface, ordinary speaker/headphone/Bluetooth routes, and Android 14+ exact-format USB `BIT_PERFECT` selection checks. Do not label an unsupported or unverified route bit-perfect.
- Preserve Share Lite's selected local file/folder workflow, optional-password handling, encrypted output, destination read-back verification, and unchanged originals. Share Lite does not capture applications, private app data, or a complete OS image.
- Keep Android runtime permission consent, storage grants, biometric enrollment, app sandboxing, and Keystore protection intact. A distribution must not silently grant permissions, export credentials, or weaken these boundaries to make a restore appear complete.

The replacement backup’s readable `DISABLEDAPPS.json` records 10 reference core packages with `componentState: 0`; Share Lite’s record is absent. Nine packages list their main activity with `enabled: 0`; USPS® Wallet instead records `MainLauncherAlias` as `enabled: 1` and 16 alternate launcher aliases as `enabled: 2`. Value 0 means Android component **default**, not a boolean false or proof of a current runtime grant. The selected records are retained exactly in JSON. Unrelated application/system settings are not declared protected by this inventory.

No additional custom Android system daemon, privileged system partition, bootloader setting, or universal firmware image was verified in this backup. The encrypted home-screen database, wallpaper profiles, permission grants, battery policy, current audio route, and full restore behavior remain unverified.

## Third-party and optional pictured applications

Apple Music, Suno, Amazon Music, UNO, ChatGPT, Gemini, Samsung Phone, Camera, Gallery, One UI Home, and other platform applications shown in screenshots are independently licensed. Their inclusion in a screenshot does not make them Core OEM Components or grant redistribution rights. Install or redistribute them only under their applicable terms. Preserve applicable upstream rights for modified or bundled third-party components as described in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Intact restore package and verification scope

The October 20 supplied Smart Switch backup contains 268 files totaling **3,023,487,498 bytes**; its own metadata reports a logical total of **3,607,791,280 bytes**. The complete companion release contains 480 files totaling **4,005,390,703 bytes**, including the separate OEM APK and art folders and restoration video. It includes encrypted app-associated data, photo/art files, music, and device-specific state. Those categories were identified from filenames and metadata only; personal/account contents were not opened.

The replacement backup contains `APKFILE/com.dualscan.mp.enc`. The standalone `Diamond-Player-1.4.3.apk` remains in the OEM folder, where `VisaUSD-1.0.14.apk` replaces VisaUSD 1.0.13. No encrypted base APK was decrypted to establish its restored version.

The source backup remains unchanged. The owner has requested publication of the complete folder as-is, preserving its files and restore structure. [manifests/reference-backup-audit.json](manifests/reference-backup-audit.json) contains a metadata-only category audit and software-payload hashes; no personal/account payload contents are reproduced in these documentation files.

Restore testing of the intact supplied backup has not been executed as part of this inventory. Independently verified restored versions, hashes, permissions, and tray placement are therefore not claimed. A normal Smart Switch backup is not an Android system/boot image, and Android 14 alone does not establish Samsung Smart Switch restore compatibility on every manufacturer's device.

Keep the published restore folder intact. Deleting category folders is not a validated way to create a derivative restore: the primary backup and app manifests are encrypted, and the remaining metadata cannot be fully checked from the exposed files. Create customized derivatives through a fresh Smart Switch export and preserve the applicable Core OEM Components.
