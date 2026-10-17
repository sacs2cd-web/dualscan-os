# Dualscan Chat — source snapshot and build

This folder publishes the current Dualscan Chat derivative source, including its uncommitted changes and new artwork/resources. It is separate from the unchanged `SmartSwitchBackup2` restore folder. No production signing key, account data or build cache is included.

## Release provenance

| Item | Recorded value |
| --- | --- |
| Application | Dualscan™ Chat |
| Package | `com.dualscan.concertparty` |
| Version | `1.5.17-dualscan.1` / code `10517` |
| Upstream | [Briar official source](https://code.briarproject.org/briar/briar) |
| Source base commit | `ea7c35afd25b7ca33ae0d51f40fe99bd306c9e6c` |
| Original build-note date | 28 April 2026 |
| Identified final installer bytes | 46,821,490 |
| Identified final installer SHA-256 | `b2689396f5a943282fd10a3bdddadbbff81ff3897889faa53bed5c01d308da6b` |
| Source publication preparation | 16 October 2026 |

The original `BUILD_NOTES.md` and `TEST_RESULTS.md` identify this derivative source, version and installer hash. The final installer hash was independently recalculated before publication. No fresh source rebuild or bit-for-bit APK comparison was performed for this publication, so this is a provenance-linked source snapshot, not a new reproducible-build certification. The old build notes' machine-specific signing-store path has been replaced by a development-key placeholder; application code is unchanged by this publication.

The upstream base alone is not this derivative. Rebranding, transport configuration, invite-scheme changes and the nearby contact error-screen fix were present as uncommitted changes in the working source. Their current content is included here, along with retained upstream license notices and newly added runtime resources. Deleted source resources remain absent.

## Build inputs

Install JDK 21 and Android SDK Platform 35 with Android Build Tools 35.0.0. The source uses Java 17 source/target compatibility, Android Gradle Plugin 8.13.0, Kotlin 1.9.25 and the included Gradle 8.14.3 wrapper. The wrapper's recorded distribution SHA-256 is:

```text
ed1a8d686605fd7c23bdf62c7fc7add1c5b23b2bbc3721e661934ef4a4911d7c
```

Set `JAVA_HOME` to the local JDK21 installation and `ANDROID_HOME` to the local Android SDK. From this folder run:

```sh
./gradlew :briar-android:assembleOfficialRelease
```

The expected unsigned build output is:

```text
briar-android/build/outputs/apk/official/release/briar-android-official-release-unsigned.apk
```

Gradle resolves the exact dependencies declared by the source build files and witness hash records. Preserve those declarations instead of substituting newer dependencies. The release target is SDK35, and its minimum Android API is 21.

Production signing credentials are deliberately absent. Use your own development key for an independently signed test installation. A differently signed APK is not an in-place update of the existing signed application.

## Build metadata

The existing Android Gradle file embeds `git rev-parse --short=7 HEAD` and the latest Git commit time. The recorded source base yielded `ea7c35a` and Unix time `1771352512`. Building this folder in a different Git repository, or outside Git, can change those metadata fields even when the application source is unchanged. Preserving a Git base plus all derivative changes in an isolated build workspace is necessary before attempting an original-metadata reproduction. No source or Gradle code was modified here to conceal that distinction.

## Optional Mailbox test submodule

The ordinary release build has `briar.mailbox_integration_tests=false`. Its only upstream Git submodule was uninitialized and is not needed for that build:

```text
path: briar-mailbox
origin: https://code.briarproject.org/briar/briar-mailbox.git
revision: 64147fd1d09764500c77948204c998aa6cfec347
```

If optional Mailbox integration tests are required, obtain that exact revision in `briar-mailbox` and preserve its licenses, then explicitly enable the integration-test option. Do not use the branch tip as a substitute. The retained `.gitmodules` records the upstream URL; this source-folder publication records the Gitlink revision here because it does not copy the original `.git` database. Mailbox/store-and-forward functionality is disabled in this product's Android configuration.

## Snapshot verification

`SOURCE-MANIFEST.json` lists the byte count, file mode and SHA-256 of every published source/document file except the manifest itself. It also records original working-source hashes where a file was copied, making the sanitized build note identifiable. Source-file membership excludes `.git`, `.gradle`, `.idea`, build outputs, `local.properties`, APK deliverables, signing credentials and machine/user data. The `gradlew` executable permission is retained.

The manifest identifies the files delivered here; it does not replace a source-to-binary reproducibility test. The Smart Switch backup has its own independent inventory and verification script at the repository root.

## Licensing and changes

Retain [LICENSE.txt](LICENSE.txt), source-file copyright headers and nested dependency notices. The root source license is GPLv3-or-later. The custom Dualscan distribution license does not replace GPL rights. See the repository's [third-party notices](../../THIRD_PARTY_NOTICES.md).

The retained build notes describe the derivative's branding, black/magenta interface, `dualscan://` invitations, Tor/LAN/Bluetooth transport order, disabled Mailbox/hotspot/reporting features and nearby contact error-screen fix. Additional source/resource notices remain alongside their original files.
