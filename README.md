# Dualscan™ OS

**Your ecosystem. Anywhere.** A Samsung Smart Switch USB-C distribution from **Dualscan LLC**, with wallets, Typelocker tools, Diamond Player, Dualscan Share Lite, and a library of **191+ wallpapers**.

![Dualscan OS USB-C edition](docs/assets/dualscan-usb-c.png)

## Restore from USB-C

1. On this repository, choose **Code → Download ZIP**. GitHub creates the archive; the restore folder is committed directly, not supplied as a prebuilt ZIP.
2. Extract the downloaded repository folder on your computer.
3. Inside it, find **`SmartSwitchBackup2`**. Copy that entire folder to the **root of a USB-C drive**. Do not rename it, change its contents, or leave it nested inside the extracted repository wrapper.
4. Connect the USB drive to a compatible Samsung Galaxy device. Open **Settings → Accounts and backup → Smart Switch**, then its external-storage / SD-card control.
5. Under **Restore from**, choose **USB storage**, select the supplied backup and available categories, and tap **Restore**. Keep the drive connected until completion.
6. Return to the home screen, open the restored apps, and complete any account, storage or biometric setup they request on the receiving device.

```text
USB-C drive/
└── SmartSwitchBackup2/
    └── [original device and backup folders, unchanged]
```

The receiving-device path is Samsung Smart Switch on **compatible Galaxy devices**. This is an application/settings restore distribution; it does not flash a replacement Android firmware image. Diamond’s exact USB bit-perfect path requires **Android 14/API 34 or later**, a compatible audio HAL and USB DAC, and a supported source format. Android 14 on an arbitrary device does not by itself establish either Smart Switch restore support or bit-perfect support.

See [RESTORE.md](RESTORE.md) and [Samsung’s external-storage instructions](https://www.samsung.com/sg/support/apps-services/how-to-use-the-smart-switch-app-to-transfer-data-between-galaxy-devices/).

The original demonstration video is included alongside the restore folder in the repository. The [project page](https://sacs2cd-web.github.io/dualscan-os/) also has a video player and a guided screenshot tour. It is published with GitHub Pages from `main` → `/docs`; the page is static HTML, CSS and JavaScript.

## Inside the OS

The page tour follows **Desktop → App library → USPS® Wallet → Biometric unlock → USPS Money → Retail Code → Scan & Pay → VisaUSD Gaming Credits → Community Manual → Wallpaper Library → Personalized desktop**. Select a step or use the previous/next controls; screenshots can be enlarged.

| App or feature | What it provides |
| --- | --- |
| USPS Money | Local wallet UI, PIN and optional Android biometric unlock, Retail Code, Typelocker scanning and background customization. |
| VisaUSD™ | Local wallet, fresh biometric confirmation before Pay → Send, Gaming Credits NFC tap transfer, and the built-in 59-page U.S. Gamer Community Manual. |
| USPS® Wallet | The separate wallet application shown in the supplied screenshots, with its own wallet overview and scan/receive/send UI. |
| USPS Banking | The separately identified banking launcher; its services and accounts retain their own requirements. |
| Typelocker | Gmail/Outlook entries and ecosystem code handling. **Cypher** is the recovery format; **Sypher** is the ordinary in-app URL format. |
| Dualscan™ Chat | The supplied Briar-based messaging application, with its separate GPL source and license requirements. |
| Dualscan LDAC Activator | A guide/settings shortcut for compatible Bluetooth audio; separate from Diamond’s USB DAC output. |
| Diamond™ Player | Offline playback of supported encrypted music, video and photos directly from selected phone or USB folders. |
| Dualscan Share Lite | Creation and offline exchange of encrypted media/document files, preserving folder structure and validating completed copies. |
| Dualscan Wallpaper Library | **191+ wallpapers** for a personal home or lock screen. Browse Gallery, open an image and choose **Set as wallpaper**. |

Apple Music, Suno, Amazon Music, ChatGPT, Gemini, UNO, Samsung and other third-party applications shown in the reference setup retain their own licenses, accounts, subscriptions and terms.

### Diamond Player and USB audio

The current standalone Diamond Player uses an independent native PCM engine. When a supported USB DAC is selected on Android 14+, it requests the exact PCM encoding, sample rate, channel mask and Android `BIT_PERFECT` mixer behavior. The app only shows the bit-perfect indicator while its route and format checks are active. Ordinary internal-device audio routes remain available.

The standalone offline player is separate from the earlier Tidal WebView/Decent experiment. The app’s route checks do not constitute an independent physical DAC digital-output measurement. See [Android’s preferred mixer specification](https://source.android.com/docs/core/audio/preferred-mixer-attr).

### Share Lite: private and commercial exchange

Create encrypted `.diamond` files from accessible local music, video, photos and documents. Each original is preserved as a separate encrypted container, keeping the collection’s folder structure. Only encrypted files are copied to the destination; completed copies are read back and verified by size and SHA-256.

Use an optional password for private recipient access. Password-free mode supports offline interchange among compatible Dualscan apps through their shared application key; it is not user-exclusive access control. Supported media plays in Diamond without public loose-file extraction. Documents can be carried encrypted even when the player cannot render their format.

Personal collections, private handoffs, artwork, albums, educational material and authorized commercial content packages can be exchanged. Encryption does not itself grant content rights or implement payment, revocation or DRM enforcement.

**Upcoming OEM device:** integrated app and PWA sharing is planned for the forthcoming OEM device. The current **Lite** release excludes APK/application packages, installed-app inventories and private app data.

## Community and commercial redistribution

Dualscan LLC’s [Dualscan OS Community & Commercial License v1.0](LICENSE) grants worldwide, non-exclusive, royalty-free use, customization and distribution of the intellectual property within its licensed scope. Personal, educational, nonprofit and commercial editions are permitted. **No separate commercial license or royalty is required for compliant use.**

Redistributed derivatives must preserve the protected components, operational behavior and five designated dock positions in [CORE_OEM_COMPONENTS.md](CORE_OEM_COMPONENTS.md). Retain the copyright/license notices, identify the derivative and disclose modifications. Additional trademark permissions are separate. Third-party rights and open-source permissions are preserved under Section 8; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

### Encryption when exporting a derivative

| Intended distribution | Smart Switch export choice |
| --- | --- |
| Public derivative | Disable Samsung Account encryption; choose **No encryption**. |
| Private handoff | Choose **Password** and share that password separately with intended recipients. |
| Private derivative for a particular Samsung Account | Use **Samsung Account encryption** only when restore is intended for that account. |

Menu labels vary by Smart Switch version. Select the option before creating the derivative backup. Changing a download’s name does not convert existing encryption.

## Distribution integrity

The supplied `SmartSwitchBackup2` is preserved **as is**: **261 files, 1,986,178,575 bytes**, plus the separate original demo video. [BACKUP_SHA256.json](BACKUP_SHA256.json) records each file’s exact byte count and SHA-256. Run:

```sh
python3 verify-backup.py
```

Three original files exceed GitHub’s ordinary 100 MiB limit and use Git LFS. This repository must include LFS objects in generated archives so **Code → Download ZIP** contains the actual files. For a Git checkout, install Git LFS and run `git lfs pull`. A download containing text LFS pointers fails the verifier and is not a complete restore.

The original encrypted backup metadata is retained without conversion. Standalone APK identities are documented separately from encrypted backup-version claims. A receiving-device restore and physical USB DAC qualification have not been performed as part of this publication. See [manifests/reference-backup-audit.json](manifests/reference-backup-audit.json).

## Project files

- [LICENSE](LICENSE) — supplied community/commercial terms, Dualscan LLC.
- [CORE_OEM_COMPONENTS.md](CORE_OEM_COMPONENTS.md) — protected packages, services, settings contracts and dock positions.
- [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [legal/](legal/) — component-specific rights and retained notices.
- [RESTORE.md](RESTORE.md) — USB-C restore and derivative encryption guide.
- [docs/](docs/) — portable static project page and screenshot tour.
- `SmartSwitchBackup2/` — intact source restore folder; no prebuilt restore ZIP.

Copyright © 2026 Dualscan LLC. All rights reserved, subject to the applicable component licenses.
