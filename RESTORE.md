# Dualscan OS — USB-C restore guide

## Download and prepare the drive

1. Open [sacs2cd-web/dualscan-os](https://github.com/sacs2cd-web/dualscan-os).
2. Select **Code → Download ZIP** and extract the complete result on your computer. GitHub generates this repository archive; no prebuilt restore ZIP is supplied.
3. Open the extracted `dualscan-os-main` wrapper folder and run `python3 verify-backup.py` before copying the restore material.
4. Copy **only its intact `SmartSwitchBackup2` restore folder** out of that wrapper to the root of a USB-C drive. Preserve every nested file and directory unchanged. Do not insert companion APKs, art or the video into the supplied backup.
5. The final path must be `USB-C drive/SmartSwitchBackup2/…`, not `USB-C drive/dualscan-os-main/SmartSwitchBackup2/…`.

The supplied demonstration video is in the repository root. You can also play it on the [project page](https://dualscan.cloud/#restore).

## Current SSS image and earlier-image APK updates

The current `SmartSwitchBackup2` is the owner's October 24 Galaxy export with the Bishiki DRAW update. It replaces the previous restore folder; the backup timestamp is `1792858096703`. Readable metadata identifies Bishiki DRAW and VisaUSD packages. Encrypted restored APK versions have not been independently decoded or verified by a receiving-device restore.

**Already restored an earlier SSS image?** Install [**VisaUSD 1.0.17 — build 19**](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/VisaUSD-1.0.17.apk) from the separate OEM folder and choose **Update**. Install it over the existing VisaUSD app; **do not uninstall it or clear its data**. This preserves the wallet, PIN and settings and includes caller-verified Gaming Credits approval, recoverable signed match receipts, and full From/To addresses in Gaming Credits activity.

For Bishiki DRAW, install [**Bishiki Draw! 0.4.10 — build 15**](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Bishiki-Draw-0.4.10.apk) on each player phone. Competitive Play requires the Gaming Credits-enabled VisaUSD app on the same device. Classic Mode remains wallet-free. These standalone versions are independently inventoried and do not establish the versions restored from encrypted backup files.

## Release contents

| Material | Files | Exact bytes |
| --- | ---: | ---: |
| `SmartSwitchBackup2/` | 256 | 1,342,923,820 |
| `USTFD USPS CRADA APPS Oct 2026/` | 15 | 372,447,514 |
| `Dualscan Art Collection/` | 191 | 560,264,205 |
| Original restoration demo video | 1 | 19,365,643 |
| **Complete release** | **463** | **2,295,001,182** |

The Smart Switch backup timestamp is `1792858096703`. This October 24 refresh replaces the previous export and is preserved exactly as supplied. The separate OEM folder contains 13 APK installers plus PoS release metadata and checksum; the `Source Backup` folder is excluded. Companion installers are separate from the encrypted Smart Switch restore payload. Do not infer the versions inside that payload from their filenames.

**Diamond Player remains available:** install [Diamond Player 1.4.3](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Diamond-Player-1.4.3.apk) from the separate OEM folder. Its standalone version does not establish a version inside the encrypted backup.

**Share Lite installer:** [Dualscan Share Lite 1.1.1](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/USTFD%20USPS%20CRADA%20APPS%20Oct%202026/Dualscan-Share-Lite-1.1.1.apk) is available from the separate OEM app folder. Companion artwork can be copied to an accessible device image folder after restoration; it does not need to be inserted into `SmartSwitchBackup2`.

## Restore on a compatible Galaxy

Connect the drive, then open **Settings → Accounts and backup → Smart Switch**. Select the external-storage/SD-card control. Under **Restore from**, choose **USB storage**, select the backup, choose the available categories and tap **Restore**. Leave the drive attached until Smart Switch completes the operation.

Samsung’s menu labels and restored categories vary by model and software version. Smart Switch is a Samsung Galaxy receiving-device workflow. The backup does not install a new Android kernel or firmware. Set up receiving-device accounts and biometrics normally after restoration.

For Diamond USB bit-perfect operation, use Android 14/API 34+ with a USB DAC and audio HAL that support the requested exact format and `BIT_PERFECT` mixer behavior. The player’s active route indicator describes its current output contract; it is not a blanket guarantee for every Android 14 device.

## Verify the extracted repository

Before copying the restore folder, run this from the extracted repository:

```sh
python3 verify-backup.py
```

Or specify a different extracted repository root:

```sh
python3 verify-backup.py --root "/path/to/dualscan-os-main"
```

The verifier selects `RELEASE_SHA256.json` when present. It checks the exact inventories of all three supplied folders, each listed file including the restoration video, file counts, byte totals and SHA-256 hashes. Missing, unexpected or altered payloads fail verification. The backup-only `BACKUP_SHA256.json` remains available, and older extractions without the full-release manifest use that legacy restore-folder and video verification mode.

Large original files are stored through Git LFS. Repository-generated ZIP downloads must include LFS objects, not LFS pointer text. Git checkouts require `git lfs pull`. A pointer is reported by filename with the instruction to download an archive containing LFS objects or fetch them in the clone. Complete this integrity check before attempting restoration.

Integrity verification confirms the distributed bytes; a successful restore on the receiving Galaxy remains a separate device test.

## Encryption for derivative distributions

Set Smart Switch’s external-storage backup encryption **before exporting** your derivative:

- **Public distribution:** disable Samsung Account encryption and select **No encryption**.
- **Private distribution:** select **Password**; deliver the password separately to intended recipients.
- **Samsung Account encryption:** reserve it for private derivatives intended for restoration with that Samsung Account.

Do not try to change an existing encrypted backup by renaming or deleting its encrypted files. Re-export with the intended option. Keep the [core apps and tray positions](CORE_OEM_COMPONENTS.md) and required license notices in any derivative.

## Official references

- [Samsung Smart Switch external-storage restore](https://www.samsung.com/sg/support/apps-services/how-to-use-the-smart-switch-app-to-transfer-data-between-galaxy-devices/).
- [Android preferred mixer attributes for USB audio](https://source.android.com/docs/core/audio/preferred-mixer-attr).
- [GitHub: include Git LFS objects in repository archives](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/managing-git-lfs-objects-in-archives-of-your-repository).
