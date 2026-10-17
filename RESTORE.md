# Dualscan OS — USB-C restore guide

## Download and prepare the drive

1. Open [sacs2cd-web/dualscan-os](https://github.com/sacs2cd-web/dualscan-os).
2. Select **Code → Download ZIP** and extract the result.
3. Open the extracted `dualscan-os-main` wrapper folder.
4. Copy its **`SmartSwitchBackup2`** folder to the root of a USB-C drive. Preserve every nested file and directory unchanged.
5. The final path must be `USB-C drive/SmartSwitchBackup2/…`, not `USB-C drive/dualscan-os-main/SmartSwitchBackup2/…`.

The supplied demonstration video is in the repository root. You can also play it on the [project page](https://sacs2cd-web.github.io/dualscan-os/#restore).

## Restore on a compatible Galaxy

Connect the drive, then open **Settings → Accounts and backup → Smart Switch**. Select the external-storage/SD-card control. Under **Restore from**, choose **USB storage**, select the backup, choose the available categories and tap **Restore**. Leave the drive attached until Smart Switch completes the operation.

Samsung’s menu labels and restored categories vary by model and software version. Smart Switch is a Samsung Galaxy receiving-device workflow. The backup does not install a new Android kernel or firmware. Set up receiving-device accounts and biometrics normally after restoration.

For Diamond USB bit-perfect operation, use Android 14/API 34+ with a USB DAC and audio HAL that support the requested exact format and `BIT_PERFECT` mixer behavior. The player’s active route indicator describes its current output contract; it is not a blanket guarantee for every Android 14 device.

## Verify the extracted repository

Before copying the restore folder, run `python3 verify-backup.py` from the extracted repository. It checks the original restore files and separate video against `BACKUP_SHA256.json`. The source files are committed directly; no prebuilt restore ZIP is maintained.

Three oversized original files are stored through Git LFS. Repository-generated ZIP downloads must include LFS objects, not LFS pointer text. Git checkouts require `git lfs pull`. The verifier detects missing or substituted payloads.

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
