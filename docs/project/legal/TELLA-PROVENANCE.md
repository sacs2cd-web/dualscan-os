# Tella source provenance

Dualscan MP reuses the key ownership and memory-wiping portion of Tella's engine.

- Official repository: <https://github.com/Horizontal-org/Tella-Android>
- Pinned commit: `b1a2a8afc25fb2d920c2ba5e210a738f4d32dacc`
- Retrieval: 2026-10-16 using HTTPS certificate verification
- Upstream files and SHA-256 checksums: `upstream-files.json`
- Exact downloaded source: `upstream/`
- Compiled adaptation: `../../tella-keys-core/src/main/java/`

The actual `LICENSE` at this commit is the MIT License, copyright 2025 Horizontal.
F-Droid's package metadata displays Apache 2.0; the source license is retained
verbatim here, together with upstream `NOTICE.txt`. Its third-party dependency
list is preserved for provenance. Those dependencies are not introduced by this
minimal Java-only module.

Changes to `MainKey`: removed Timber dependency and logging, synchronized access
to owned bytes, accepted only valid AES key sizes and algorithm, cleared temporary
encoded copies where possible, and added `AutoCloseable`. Changes to `Wiper`:
removed the Android annotation dependency, prevented construction, and added
`char[]` clearing. All these adaptations retain the upstream package names and
the upstream `generate`, `getKey`, `setKey`, and `wipe` API.

The audited legacy `CipherStreamUtils` is retained only as source evidence under
`upstream/`; it is not compiled into the app. It uses unauthenticated AES-CTR,
filename-derived PBKDF2-HMAC-SHA1 (1,000 iterations), and sequential seeking.
Dualscan's portable media format instead uses independently implemented
authenticated chunks. It is not file-format compatible with Tella's private
vault and does not claim a Tella security audit or endorsement.

No Tella server, cloud integration, nearby-network sharing, telemetry, branding,
camouflage, destructive deletion feature, or whole application has been copied.
