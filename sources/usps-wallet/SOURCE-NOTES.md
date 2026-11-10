# USPS® Wallet Android source

This archive is the USPS® Wallet project for Android package `io.horizontalsystems.bankwallet`, version `0.48.28-noqr-walletmode-qr-large`, build 192. The manifest registers `https://link.trustwallet.com/send` as a send deeplink.

The [OEM installer](../../USTFD%20USPS%20CRADA%20APPS%20Oct%202026/USPS-Wallet-USTFD-All_Rights_Reserved.apk) in this repository is build 191 (`0.48.27-noqr-walletmode-biometric`). The archived build 192 release output has SHA-256 `d8f8888b48f865f2570d6c050f16367f08fa60166b4f206257aaa2b7943bc2c3`.

## Build the project

Use JDK 17 or later with Android SDK 36. From this directory, run `./gradlew :app:assembleBaseDebug`.

Gradle configured the exported project during verification. The debug build stopped at dependency resolution when JitPack did not supply pinned AARs, including `bitcoin-kit-android:hodler:f565276` and `ethereum-kit-android:erc20kit:25180be3`.

The debug and release builds read the Alchemy provider settings from `USPS_WALLET_ALCHEMY_PROJECT_ID` and `USPS_WALLET_SOLANA_ALCHEMY_API_KEY`. Set these in your local build environment to configure those services. Release signing reads a local `release-signing.properties` with `storeFile`, `storePassword`, `keyAlias`, and `keyPassword`.

The source is derived from [Unstoppable Wallet for Android](https://github.com/horizontalsystems/unstoppable-wallet-android). See [LICENSE](LICENSE) for the retained upstream license.
