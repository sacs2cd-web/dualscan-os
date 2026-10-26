# Dualscan™ OS Core OEM Components

Manifest version 1.4 · October 26, 2026

This document identifies the Core OEM Components referenced by sections 3–5 of the [Dualscan OS Community & Commercial License](LICENSE). The machine-readable inventory is [manifests/core-oem-v1.json](manifests/core-oem-v1.json).

The required dock below reflects the project owner’s October 22 correction and supplied home-screen screenshots. It replaces the earlier tray order. The distribution contains the owner-supplied October 26 Smart Switch image, including the Bishiki DRAW package container. Current standalone OEM package versions and hashes are listed separately in [manifests/oem-apk-release.json](manifests/oem-apk-release.json); retained historical component evidence is identified separately in the core JSON inventory. The base APKs and primary application manifest inside the supplied Smart Switch backup are encrypted. Accordingly, standalone versions and hashes are **reference artifacts, not cryptographically verified versions of the encrypted backup**. The supplied Smart Switch folder is published intact and as-is. Its exact payloads remain the restore source; independent standalone references do not substitute for them.

## Required home-screen tray

Preserve these five visible, accessible positions from left to right. Positions are visual positions from the supplied home-screen screenshots, not decoded Samsung database cell IDs.

**Typelocker Gmail → Dualscan™ Chat → USPS Postal Cash™ Wallet → VisaUSD™ PoS → VisaUSD™ Wallet.**

| Position | Application | Android package | Reference / evidence |
| --- | --- | --- | --- |
| 1 · left | Typelocker Gmail | `com.ustfdatv.typelockergmail` | 1.0 / code 10000 |
| 2 | Dualscan™ Chat | `com.dualscan.concertparty` | Standalone 1.5.17-dualscan.1 / code 10517 |
| 3 · center | USPS Postal Cash™ Wallet | `com.dualscan.usps.postalcash` | Standalone 1.0.3 / code 4; encrypted restore version unverified |
| 4 | VisaUSD™ PoS | `com.dualscan.guard` | Standalone 1.0.2 / code 3 |
| 5 · right | VisaUSD™ Wallet | `com.bishiki.visausd.local` | Standalone 1.0.17 / code 19 |

Evidence: the project owner’s corrected order and supplied `Screenshot_20261022_133757_One UI Home.jpg` and `Screenshot_20261022_154956_One UI Home.jpg`. The screenshots show the same five positions with different wallpapers. The Postal Cash package identity is supported by the supplied `APKFILE/com.dualscan.usps.postalcash.enc` filename; its restored Android manifest and version have not been independently inspected.

Alternative launchers may be added under the License, provided the mandatory tray remains visible and accessible in the delivered distribution. This distribution requirement does not prevent ordinary end-user control after delivery.

## Additional OEM component references

The following entries identify current standalone references and retain explicitly historical launcher evidence. They have no mandatory tray position in the corrected layout. Preserve their supplied functionality when included in a derivative; this table does not require adding historical apps absent from the current restore image. Current restore payloads and companion standalone OEM APKs are inventoried separately.

| Application | Android package | Standalone reference and evidence status |
| --- | --- | --- |
| USPS Money | `com.bishiki.uspsmoney.local` | Current standalone 1.0.8 / code 9; no required tray position |
| USPS Banking | `com.usps.myusps_mobile_app_android` | Current standalone 2.4.5.6 / code 2456; encrypted restore version unverified |
| USPS® Wallet | `io.horizontalsystems.bankwallet` | Current standalone 0.48.27-noqr-walletmode-biometric / code 191; encrypted restore version unverified |
| Typelocker Outlook | `com.ustfd.typelockeroutlook` | Current standalone 1.0 / code 10000; no encrypted base container in the supplied tree |
| Dualscan LDAC Activator | `com.dualscan.ldacactivator` | 1.4 / code 5 |
| Diamond™ Player · launcher label Diamond™ | `com.dualscan.mp` | Current standalone 1.4.3 / code 12; earlier development evidence remains historical |
| Dualscan Share Lite | `com.dualscan.share.lite` | Standalone 1.1.1 supplied in the OEM APK folder; no encrypted Share Lite base APK is present in this supplied restore tree |
| VisaUSD Typelocker Wallet | `com.visausd.typelocker.wallet` | Current standalone 3.0.2 / code 3; no encrypted base container in the supplied tree |

Baseline software references, permissions, activities, services, receivers, and providers are retained in [the core JSON manifest](manifests/core-oem-v1.json). Current restore-file hashes are in [BACKUP_SHA256.json](BACKUP_SHA256.json), and current standalone OEM APK identities and hashes are in [manifests/oem-apk-release.json](manifests/oem-apk-release.json). Historical hashes and launcher records are not evidence of the current backup’s state. An encrypted Smart Switch payload hash identifies that encrypted file; it is not the hash of its restored APK. The encrypted backup was not decrypted to establish a match.

## Protected operational components

Preserve the functionality of the supplied core APKs and their required platform interfaces. The table retains named components from prior standalone APK or readable launcher references, independently of the current encrypted backup. Rows for historical applications apply when those applications are included. This is not a fresh inspection of current APK component declarations:

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

- Keep the five required tray packages installed, launchable, and accessible in the corrected left-to-right order above. Preserve package identities and compatible signed update paths. Preserve additional OEM components when included; historical inventory entries do not create extra required tray positions.
- Preserve USPS Postal Cash™ Wallet access and VisaUSD™ PoS checkout operation, including its separation of customer-facing checkout and configured merchant wallet.
- Preserve local wallet operation, PIN-protected recovery and Android biometric unlock. Preserve fresh biometric authorization before Pay → Send signing or fee/payment submission. Keep PIN fallback available for wallet unlock.
- Keep Typelocker™ Cypher recovery scanning inside the recovery flow, and Typelocker™ Sypher URL recognition in the ordinary in-app scanner. Preserve the existing scanner and mascot behavior.
- Preserve VisaUSD™ Gaming Credits NFC phone-to-phone transfer, the 20,580 daily allocation, and the 9am `America/New_York` reset. Do not reintroduce the removed NFC card UI/recovery feature.
- Preserve wallet RPC defaults and the user's endpoint override controls. Preserve the current fee behavior: the app fee is 0.50 USDC on the transaction network for supported assets other than native ETH and SOL; network fees remain separate.
- Preserve Diamond's authenticated encrypted-media input, non-exported decoder interface, ordinary speaker/headphone/Bluetooth routes, and Android 14+ exact-format USB `BIT_PERFECT` selection checks. Do not label an unsupported or unverified route bit-perfect.
- Preserve Share Lite's selected local file/folder workflow, optional-password handling, encrypted output, destination read-back verification, and unchanged originals. Share Lite does not capture applications, private app data, or a complete OS image.
- Keep Android runtime permission consent, storage grants, biometric enrollment, app sandboxing, and Keystore protection intact. A distribution must not silently grant permissions, export credentials, or weaken these boundaries to make a restore appear complete.

The JSON inventory retains selected readable launcher records from the previous manifest as historical evidence. They have not been revalidated against the October 26 replacement. Value 0 in those Android component records means **default**, not a boolean false or proof of a current runtime grant. No current launcher-alias state or runtime permission grant is claimed from those historical records. Unrelated application/system settings are not declared protected by this inventory.

No additional custom Android system daemon, privileged system partition, bootloader setting, or universal firmware image was verified in this backup. The encrypted home-screen database, wallpaper profiles, permission grants, battery policy, current audio route, and full restore behavior remain unverified.

## Third-party and optional pictured applications

Apple Music, Suno, Amazon Music, UNO, ChatGPT, Gemini, Samsung Phone, Camera, Gallery, One UI Home, and other platform applications shown in screenshots are independently licensed. Their inclusion in a screenshot does not make them Core OEM Components or grant redistribution rights. Install or redistribute them only under their applicable terms. Preserve applicable upstream rights for modified or bundled third-party components as described in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Intact restore package and verification scope

The October 26 supplied Smart Switch backup, timestamp `1792990163950`, contains 258 files totaling **1,501,092,249 bytes**. The complete companion release contains 468 files totaling **2,597,170,175 bytes**, including the separate OEM APK and art folders and restoration video. The OEM folder contains 14 current APKs and four Postal Cash/PoS verification sidecars (18 files, **516,448,078 bytes**); its `Source Backup` directory is excluded. The backup includes encrypted app-associated data, photo/art files and device-specific state. Categories were identified from filenames and generic metadata only; personal/account contents were not opened. Physical byte counts are separate from Smart Switch’s reported logical restore size of **2,002,290,297 bytes**, read from matching generic size fields.

The fresh restore tree includes `APKFILE/com.dualscan.bishiki.draw.enc`, `APKFILE/com.bishiki.visausd.local.enc` and `APKFILE/com.dualscan.mp.enc`. Its source files and folder structure are preserved unchanged. Current companion downloads include [USPS Postal Cash 1.0.3 / code 4](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/USPS-Postal-Cash-1.0.3.apk), [Bishiki DRAW 0.4.10 / code 15](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Bishiki-Draw-0.4.10.apk), [VisaUSD 1.0.17 / code 19](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/VisaUSD-1.0.17.apk), [Diamond Player 1.4.3 / code 12](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Diamond-Player-1.4.3.apk) and [Dualscan Share Lite 1.1.1 / code 4](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Dualscan-Share-Lite-1.1.1.apk). Bishiki DRAW is inventoried as a companion application and does not add a mandatory dock position. Share Lite is supplied separately; no Share Lite base container is present in this Smart Switch tree. The current published Diamond Player 1.4.3 is retained in preference to the older 1.4.0 APK in the reference folder.

The owner requested this entire fresh October 26 export be published with the current standalone OEM versions, preserving the other USPS apps. The new source contains encrypted Postal Cash, USPS Banking and legacy USPS Wallet base containers. The standalone installers and companion artwork/video are retained separately. [manifests/reference-backup-audit.json](manifests/reference-backup-audit.json) records the current category inventory and software-container hashes. No encrypted base APK was decrypted to establish its restored version or a cryptographic match to a standalone APK.

Native export failure markers, where present, are retained exactly and listed in the backup audit. Their presence alone does not establish whether a core app is missing. The export’s encryption selection has not been independently verified; receiving-device restoration remains untested.

Restore testing of the intact supplied backup has not been executed as part of this inventory. Independently verified restored versions, permissions and tray placement are therefore not claimed. A normal Smart Switch backup is not an Android system/boot image, and Android 14 alone does not establish Samsung Smart Switch restore compatibility on every manufacturer’s device.

Keep the published restore folder intact. Deleting category folders is not a validated way to create a derivative restore: the primary backup and app manifests are encrypted, and the remaining metadata cannot be fully checked from the exposed files. Create customized derivatives through a fresh Smart Switch export and preserve the applicable Core OEM Components.
