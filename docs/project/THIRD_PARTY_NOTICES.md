# Third-party notices

Dualscan™ OS community distribution documentation — October 2026.

The [Dualscan OS Community & Commercial License](LICENSE) covers only material its Licensor owns or is authorized to license. Android, Samsung software, independently licensed applications, libraries, artwork and online services retain their own terms. The Core OEM Component Manifest identifies the composition of the original distribution; it does not relicense upstream software or restrict rights granted directly by its upstream license.

This repository publishes project documentation and selected presentation images. It does not publish the personal Smart Switch backup, firmware, APK binaries, account records, private messages, wallet secrets, ecosystem keys or signing keys. Package and version records are in [CORE_OEM_COMPONENTS.md](CORE_OEM_COMPONENTS.md); standalone installer metadata is not a cryptographic verification of encrypted Smart Switch payloads.

## Android and Samsung

Android Open Source Project software uses several licenses. Most Android userspace software is Apache-2.0; the Linux kernel and other components have their own terms, including GPL-2.0. Preserve the license, copyright and attribution files of the actual device build. Apache-2.0 redistribution includes the license, relevant attribution/NOTICE material and notices of modified files. GPL-covered binary distribution requires the corresponding source and other applicable GPL conditions. A Samsung restore backup does not contain the corresponding source for an entire device firmware build. [AOSP licensing](https://source.android.com/docs/setup/contribute/licenses), [Apache-2.0 text](https://www.apache.org/licenses/LICENSE-2.0), [GNU GPL-2.0 text](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).

Samsung One UI, One UI Home, Smart Switch, Samsung Gallery, Camera, Phone, device services and proprietary firmware are separately licensed Samsung components. Restoring settings or data does not transfer copyright or grant a license to redistribute Samsung programs under the Dualscan license. Smart Switch itself is obtained from Samsung and used under the applicable regional agreement. [Samsung Smart Switch](https://www.samsung.com/us/apps/smart-switch/), [Samsung-published Smart Switch terms](https://www.samsung.com/ae/support/apps-services/samsung-smart-switch-tcs/), [Samsung Open Source Release Center](https://opensource.samsung.com/).

Google Play, Google Play services and Google applications are separate from AOSP. Store acquisition and the provider's terms govern their use. The Dualscan license does not supply a separate redistribution grant for store binaries. [Google Play terms](https://play.google.com/intl/en_en/about/play-terms/?hl=en).

## Dualscan™ Chat — Briar derivative

| Item | Identification |
| --- | --- |
| Distribution label | Dualscan™ Chat |
| Package | `com.dualscan.concertparty` |
| Identified APK version | `1.5.17-dualscan.1` |
| Upstream | [Briar](https://briarproject.org/), [official source](https://code.briarproject.org/briar/briar) |
| Source base recorded locally | `ea7c35afd25b7ca33ae0d51f40fe99bd306c9e6c` |
| Dualscan derivative source | [sources/dualscan-chat](https://github.com/sacs2cd-web/dualscan-os/tree/main/sources/dualscan-chat) |
| Source license | GPL-3.0-or-later, as stated in the retained source license header |
| Retained copyright header | Copyright © 2011–2014 Sublime Software Ltd; retain additional individual source-file notices |
| Full retained license | [Briar license and GPL text](legal/briar-GPL-3.0-or-later.txt) |

The Dualscan branding, application ID and derivative changes do not replace Briar's GPL. A distributor of this modified APK must provide the corresponding source for that exact binary, including modifications and required build scripts, by a GPL-compliant method; retain notices and the GPL; identify modified files and dates; and provide Installation Information where GPLv3 section 6 requires it. The upstream source URL alone is not the source for unprovided derivative changes. The GPL permits commercial redistribution and preserves recipients' modification and redistribution rights. The custom Dualscan preservation terms impose no additional restrictions on those independent GPL rights. See the retained license, particularly sections 4–6 and 10.

The repository's [Dualscan Chat source folder](https://github.com/sacs2cd-web/dualscan-os/tree/main/sources/dualscan-chat) includes the derivative changes, new runtime resources, retained source licenses, build scripts, source-file SHA-256 manifest and `SOURCE-RESTORE.md` instructions. Original build notes link this snapshot to the installer identified in the component inventory; a fresh bit-for-bit source rebuild comparison has not been performed.

Briar's own bundled third-party code keeps its notices and licenses. A future binary release must retain the dependency notices from its exact build rather than treating the top-level GPL as a license for every separately licensed dependency. No Briar endorsement or certification is implied by the derivative name.

## USPS® Wallet — Unstoppable Wallet derivative

| Item | Identification |
| --- | --- |
| Package | `io.horizontalsystems.bankwallet` |
| Identified installer version | `0.48.27-noqr-walletmode-biometric` |
| Upstream | [Horizontal Systems / Unstoppable Wallet for Android](https://github.com/horizontalsystems/unstoppable-wallet-android) |
| Upstream source license | MIT |
| Retained license | [Unstoppable Wallet MIT text](legal/unstoppable-wallet-MIT.txt) |

The upstream repository's license file literally retains the copyright placeholders `[year] [fullname]`; this notice preserves that text without inventing a rights holder. Its README identifies MIT licensing. Preserve the MIT copyright and permission notice with copies or substantial portions, together with the actual source-file and dependency notices. The local source reference reviewed was based on commit `7ac0cb9ffb1e9760523b745948372fb46dce2abf`; this reference is not a claim that its unmodified checkout reproduces the identified customized installer. [Upstream license](https://github.com/horizontalsystems/unstoppable-wallet-android/blob/master/LICENSE).

The label and artwork do not change upstream licensing, and this project page does not assert that it is an official product of the upstream authors.

## Diamond™ Player and Dualscan Share Lite

| Product | Package | Source release reviewed |
| --- | --- | --- |
| Diamond™ Player | `com.dualscan.mp` | 1.2.1 |
| Dualscan Share Lite | `com.dualscan.share.lite` | 1.1.1 |
| Dualscan Share OEM edition | `com.dualscan.share` | 1.1.1; separate OEM edition |

These projects reuse Tella's `MainKey` and `Wiper` utilities, adapted from [Horizontal-org/Tella-Android](https://github.com/Horizontal-org/Tella-Android) at commit `b1a2a8afc25fb2d920c2ba5e210a738f4d32dacc`, under MIT, copyright 2025 Horizontal. Preserve the following files from the source distribution and the equivalent in-app legal assets:

- [Tella MIT license](legal/TELLA-MIT.txt).
- [Retained upstream Tella NOTICE](legal/TELLA-NOTICE.txt).
- [Provenance and adaptation notes](legal/TELLA-PROVENANCE.md).

The compiled adaptation removes logging/dependencies from the key utilities, adds synchronized ownership/cleanup and preserves the upstream package names. The separately retained legacy `CipherStreamUtils` is provenance material and is not compiled. The DSMP0002 authenticated encrypted format and Diamond's native PCM engine are independent project implementations. No Tella audit, endorsement or vault-format compatibility is asserted.

The upstream NOTICE includes historical whole-application dependency entries such as SQLCipher, CacheWord and Glide. The retained provenance explicitly states that those dependencies were not introduced by the minimal `MainKey`/`Wiper` module. Preserving that upstream notice does not establish that those packages are present in these APKs.

Direct source-declared runtime dependency families include:

| Component | Source-declared use | License reference |
| --- | --- | --- |
| AndroidX Core, Lifecycle, Activity, Compose, Material3 and DocumentFile | Both projects | Apache-2.0; [AndroidX source license](https://android.googlesource.com/platform/frameworks/support/+/androidx-main/LICENSE.txt) |
| AndroidX Media3 ExoPlayer, UI and DataSource 1.11.1 | Diamond Player | Apache-2.0; [Media3 license](https://github.com/androidx/media/blob/release/LICENSE) |
| Kotlin standard library | Both projects | Apache-2.0; [Kotlin license](https://github.com/JetBrains/kotlin/blob/master/license/LICENSE.txt) |
| Kotlin coroutines Android 1.9.0 | Both projects | Apache-2.0; [Coroutines license](https://github.com/Kotlin/kotlinx.coroutines/blob/master/LICENSE.txt) |

Exact versions and dependency selection are recorded in each source release's `app/build.gradle.kts` and `gradle/libs.versions.toml`. Retain the full relevant license and NOTICE material from the resolved AAR/JARs when distributing a binary; this list identifies source-declared families and is not a transitive software bill of materials.

## USPS Money and VisaUSD™ local wallets

The documented local APKs are `com.bishiki.uspsmoney.local` and `com.bishiki.visausd.local`, version 1.0.5. They are separate applications from the Unstoppable-derived USPS® Wallet above. Their bundled Capacitor runtime is MIT-licensed, with AndroidX, Kotlin and other independently licensed runtime and wallet libraries. Preserve the exact release's runtime/dependency notices, including existing bundled vendor license files, when redistributing those APKs. [Capacitor MIT license](https://github.com/ionic-team/capacitor/blob/main/LICENSE).

The native local biometric bridge and Android Keystore use do not relicense the underlying Android libraries. Typelocker™ Cypher™ recovery and Typelocker™ Sypher™ link handling remain distinct project features; ownership of project branding does not replace third-party runtime notices.

## Other applications, service names and presentation assets

USPS Banking (`com.usps.myusps_mobile_app_android`), Typelocker Gmail (`com.ustfdatv.typelockergmail`), Typelocker Outlook, Dualscan LDAC Activator (`com.dualscan.ldacactivator`) and the other entries in the component manifest retain the rights and dependency notices applicable to their individual releases. Their presence in a tray or a screenshot supplies no new license for an underlying service, brand or proprietary dependency.

Apple Music, Amazon Music, Suno, ChatGPT, Gemini, UNO, Gmail and Outlook are identified as applications or services shown in the supplied setup. They are not relicensed by this repository. Installation, accounts, subscriptions, media catalogs and commercial use remain subject to the relevant publisher's app/store/service terms. Samsung and Google system applications remain under their platform terms. Download those applications through their authorized publishers unless a separate distribution permission applies.

Screenshots, USB-drive artwork, logos, trademarks, the community manual and creative media retain their own authorship and applicable rights. The custom software grant does not itself license third-party trademarks or the music, artwork, photographs or other content shown inside an application. Presentation of an application does not imply its publisher endorses Dualscan OS.

## Distribution record

For each public binary or OEM image, retain its exact package/version/hash inventory, upstream notices, modifications and the corresponding-source location required by its licenses. The public documentation repository does not substitute an upstream source link for unpublished GPL derivative source or grant rights to proprietary store APKs. Separately licensed rights continue even if rights under the custom Dualscan license terminate.
