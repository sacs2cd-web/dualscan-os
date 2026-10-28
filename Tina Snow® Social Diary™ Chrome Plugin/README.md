# Tina Snow® Social Diary™ Chrome Plugin

**The Official Chrome Plugin of the Tina Snow® Social Diary™ Service.**

Author: **Dualscan.cloud Dualscan LLC**

Current GitHub package: **Typelocker™ Chat 1.3.1**. Chrome Web Store **1.1.1 is published**; **1.3.1 has been submitted and is pending Google review** as of October 28, 2026. The published Store version remains available while Google reviews the update.

This Desktop Chrome companion installs as **Typelocker™ Chat 1.3.1**. It composes, encodes, and decodes BSK1 messages on YouTube, X/Twitter, Gmail, and Outlook web. All features are free, including the original default key, custom keys, key management, and unlimited use subject to normal browser resources. No account, payment, subscription, or license activation is required.

## Download

[Download Typelocker-Chat-1.3.1.zip](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.3.1.zip)

Archived extension packages remain available: [1.1.1](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.1.1.zip), [1.2.0](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.2.0.zip), and [1.3.0](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.3.0.zip). The [agency SDK 1.3.0](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Agency-Client-SDK-1.3.0.zip) is unchanged and remains compatible with the invitation and diary protocols.

This folder is a Desktop Chrome companion distribution. Keep it separate from the `SmartSwitchBackup2` Galaxy restore folder.

## Install into Desktop Chrome

1. Download **Typelocker-Chat-1.3.1.zip** using the link above or open that file in GitHub and choose **Download raw file**.
2. Extract the ZIP to a permanent folder on your Windows, macOS, or Linux computer. The extracted folder must directly contain `manifest.json`, `popup.html`, the JavaScript files, and `icons/`. Keep this folder: Chrome loads the unpacked extension from it.
3. In Desktop Google Chrome, enter `chrome://extensions` in the address bar.
4. Turn on **Developer mode** at the upper right.
5. Choose **Load unpacked** and select the extracted folder containing `manifest.json`. Select the folder rather than the ZIP file.
6. Confirm **Typelocker™ Chat 1.3.1** appears in the extensions list. Open Chrome's Extensions menu (puzzle-piece icon) and pin Typelocker™ Chat if desired.
7. Refresh any already-open YouTube, X/Twitter, Gmail, or Outlook web tabs.

## Compose, encode, and insert

1. On a supported website, click inside the writable text field where you want the encoded message.
2. Open **Typelocker™ Chat** from Chrome's toolbar.
3. Select **Original default key** or a saved custom key. Write your message.
4. Choose **Encode** to view BSK1 output, **Copy Encoded Message** to copy it, or **Send to Field** to insert it into the selected website editor.
5. Review the inserted text on the website. **Send to Field inserts text only; it never publishes a post, submits a reply, or sends an email.** Use the website's own controls when you are ready to send.

To decode manually, paste the complete BSK1 token into the popup's Message field, choose the matching key, and select **Decode**. Automatic decoding detects newly loaded BSK1 page text using your selected saved key. Successfully decoded content ends with **(Decoded with Typelocker™)**; unreadable tokens display **Typelocker™ Private Content**.

## Default and custom keys

The original default key is available immediately. Use **Manage** or **Settings** to add, save, select, or delete named custom keys. A message override applies to the current popup operations; save and select it to use it for automatic page decoding. People exchanging custom-key messages must use the same key.

Settings also provides the automatic-decoding toggle and optional JSON key import/export. Exports contain readable key values, so keep them private. Import replaces the current configuration after review.

## Permanent manual keys and seven-day invitations

A named key you add manually in Manage or Settings, or save from a popup override, is **permanent**. It has no automatic expiry and remains until you delete it or replace the configuration. Permanent keys do not consume temporary invitation-key slots.

An agency email invitation saves its chosen name as a **temporary key** only after you explicitly accept in the bundled Chrome review page. Its seven days begin at the first acceptance in that Chrome profile. Opening a link or reviewing it does not start the local key clock. First acceptance must occur within seven days of invitation creation. Reopening, deleting and reaccepting, or importing the same accepted invitation cannot renew its original local deadline.

Up to **100 active invitation keys** can be saved and manually selected beside permanent keys. Expired invitation keys stop being usable at the deadline and are automatically removed when Chrome can run expiry or resume checks. Browser sleep can delay physical cleanup. Receipt metadata prevents accidental renewal; exports, forwarded links and copies saved elsewhere cannot be erased by local expiry. A manually saved copy remains permanent.

For a provider-hosted diary, the server's seven days begin with its own first acceptance. Chrome's local key clock starts at the later explicit reader acceptance. The reader follows the earlier server or local-key deadline. Choose **Download and Decode** and approve the displayed server before any encoded diary download. The optional reader verifies a maximum 64 MiB encoded payload, byte count and SHA-256 before local decoding. Its digest/outcome acknowledgement is client-reported decode metadata, not proof of human reading.

## Verification

**174 automated Chrome tests passed**, including saved custom-profile selection, Gmail-style split/soft-wrapped tokens, first-acceptance expiry, fixed reopening/import receipts, alarm/resume cleanup, permanent manual keys, and actual WordPress-produced invitation/diary fixtures. The original BSK1 codec remains compatible. Automated fixtures do not establish every site's native editor behavior or live email delivery. Real SMTP and cloud deployment are outside this public package.

## Privacy and BSK1 limitations

Encoding and decoding run locally in the browser. The extension does not transmit plaintext messages or secret keys to an external server. Saved keys and preferences use local Chrome extension storage. If you submit encoded text on a website, that website receives it under its own policies; decoded text displayed in the page DOM may also be visible to that website.

**BSK1 is reversible text obfuscation, not secure encryption.** Its checksum does not authenticate the key or sender. Some incorrect keys can produce readable text. Do not use BSK1 to protect sensitive information or reuse account passwords as keys.

- [Privacy policy](https://typelocker-chat-support.alleong.chatgpt.site/privacy.html)
- [Support and instructions](https://typelocker-chat-support.alleong.chatgpt.site/support.html)

## Troubleshooting and updates

Refresh supported pages after installing or updating the extension. Click inside the target editor before opening the popup. If a site editor does not accept insertion, use **Copy Encoded Message** and paste it manually. Password, disabled, and read-only fields are excluded. Images, canvas, closed shadow roots and unmatched cross-origin frames are not supported. Complete BSK1 tokens split across inline text nodes, word-break elements and ordinary soft wraps within one read-only block are supported. Independent message blocks and editable drafts are not combined.

For a later ZIP update, replace the files in the same permanent extension folder, choose the extension's **Reload** control at `chrome://extensions`, and refresh supported website tabs.

## Package integrity

Version: **1.3.1**  
ZIP size: **57,784 bytes**  
SHA-256:

```text
a90e0aa0052a298f51f2e966713f8280aa3bc2b5677d0193d20a033137206e0d
```

The adjacent checksum file records the same hash for the ZIP. This GitHub download is the unpacked Desktop Chrome distribution; Chrome Web Store review and publication status are separate.


## Historical preview notes

The following version-specific verification notes describe their original publication and are retained with the older artifacts.

## Optional agency integration preview — 1.2.0

The existing 1.1.1 download and installation instructions above remain available. These are retained historical preview artifacts. Current Chrome Web Store status is recorded above.

- [Download Typelocker™ Chat 1.2.0 agency preview](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.2.0.zip) — 46,370 bytes
- [Download agency Client SDK 1.2.0](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Agency-Client-SDK-1.2.0.zip) — 6,426 bytes

To try the extension preview, extract the 1.2.0 ZIP into a permanent folder and use the same Desktop Chrome **Developer mode → Load unpacked** steps above, selecting the folder containing `manifest.json`. If updating an existing unpacked installation in place, replace its files, choose **Reload** at `chrome://extensions`, and refresh supported sites. Chrome Web Store installation of 1.1.1 does not supply this preview feature.

### Seven-day client keys

The default invitation product name is **Tina Snow® Social Diary™ - Beyonce**. In the preview's Settings, **Seven-day key invitations** lets an agency use a selected shared key or generate a new key, create an invitation link, and copy it or open an **unsent email draft**. The agency reviews and sends any email itself. No client email was sent as part of this release; the extension and SDK do not deliver email.

A client with Typelocker™ Chat 1.2.0 or later opens the invitation link and reviews the name in the extension's bundled invitation page. **Accept and select key** saves the key locally for exactly seven days from that Chrome profile's first acceptance. The invitation must first be accepted within seven days of creation. Reopening, deleting/reaccepting, or importing an older backup does not renew an earlier local acceptance.

Up to **100 active temporary invitation keys** can be saved and manually selected alongside permanent custom keys and the original default. The extension uses the selected key; it does not cycle through all saved keys. Expired keys become unavailable and are removed when Chrome can run local cleanup. Local clock/storage changes and copies kept elsewhere are outside this mechanism.

### Agency Client SDK

Extract the SDK ZIP while preserving its folder structure: `invitations.js` beside `sdk/` and `docs/`. The SDK runs locally in a secure browser context or **Node.js 20+**:

```js
import { createClientAccess } from './sdk/client-sdk.mjs';

const access = createClientAccess({
  productName: 'Tina Snow® Social Diary™ - Beyonce'
});

const invitationUrl = access.invitationUrl;
// Encode the client's BSK1 content using access.invitation.value.
// Place invitationUrl into your own agency email workflow.
```

The SDK generates a fresh 32-byte random key and a versioned invitation URL. Pass an optional `key` to reuse an existing shared content key. Distinct client keys require content encoded for each corresponding key. The archive includes the SDK README and invitation protocol documentation.

Sales CSV processing, buyer databases, payments, email delivery, bulk marketing, and a future macOS agency app are outside this preview.

### Preview verification and privacy

**102 automated tests passed.** The installed native handoff from the hosted invitation page to the extension was **not executed**, because native Chrome controls timed out. Automated and browser-fixture checks do not establish that installed handoff. This is an agency integration preview; that native acceptance check remains outstanding.

Invitation URLs contain a **readable shared key**. Anyone holding the full link can recover the key. Email, clipboard copies, and retained exports cannot be revoked by this local seven-day setting. It does not verify buyer identity or enforce a subscription. BSK1 remains reversible text obfuscation, not secure encryption.

1.2.0 checksums:

```text
4da1e7f46259c1310271a33917788a6a77a61730c713a650d19b87356ef41aab  Typelocker-Chat-1.2.0.zip
ca4f6b04b73798d1fe8efb0760f524c4ca7e27de37547cbb4d2785f90f3e1a62  Typelocker-Agency-Client-SDK-1.2.0.zip
```

## Optional Social Diary integration preview — 1.3.0

**Typelocker™ Chat 1.3.0** supplies the optional diary reader for the locally built **Social Diary™ Manager** and its Docker Gateway integration. The existing 1.1.1 and 1.2.0 files, installation instructions and historical preview notes above remain available. These are retained historical preview artifacts. Current Chrome Web Store status is recorded above.

- [Download Typelocker™ Chat 1.3.0 preview](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.3.0.zip) — 54,508 bytes
- [Download agency Client SDK 1.3.0](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Agency-Client-SDK-1.3.0.zip) — 16,785 bytes

Extract the extension ZIP into a permanent folder, then use Desktop Chrome **Developer mode → Load unpacked** and select the folder containing `manifest.json`. For an unpacked update, replace its files, choose **Reload** at `chrome://extensions`, and refresh supported sites. Version 1.3.0 is needed for the new Gateway diary reader; the published 1.1.1 Store release does not include it.

### Optional server-backed diary reader

After reviewing an access invitation and explicitly accepting it, the client can open the bundled diary reader. Downloading a diary requires the user's optional permission for that server origin. The reader accepts encoded BSK1 payloads up to **64 MiB**, checks their byte length and SHA-256, and decodes locally using the matching key. It sends no plaintext diary or shared key to the server. Existing message composition and insertion remain available without enabling the reader.

A configured Gateway checks client policy, revocation and grant expiry before serving content. Server access lasts seven days from first Gateway acceptance, and reopening does not renew that grant. Local invitation-key cleanup follows the Chrome profile's first acceptance and does not revoke plaintext, keys or downloads retained elsewhere. BSK1 remains reversible obfuscation; a bearer link is not proof of a buyer's identity.

The server can record link requests, payload transfer and a **client-reported decode acknowledgment** containing integrity metadata. An acknowledgment is not verified human reading. The extension does not publish posts, send email, charge buyers or authenticate purchases. Any store adapter must verify its provider's paid event on a trusted backend before authorizing fulfillment.

### SDK and integration status

The SDK ZIP contains local invitation and diary-access helpers, plus the reader protocol and Mac/server integration documentation. Preserve its folder structure when extracting. The locally built Social Diary™ Manager and Docker image archives are outside this public-folder update; no native app, image archive, full source archive, credentials or reference fixtures are included here. Real cloud infrastructure, payment-provider adapters and SMTP delivery require separate operator configuration.

**132 automated extension tests passed, 47 Gateway tests passed, and standalone Swift checks passed.** Local HTTP/SQLite integration tests exercised a signed paid-order fixture through the actual Chrome metadata validator and BSK1 decoder. These tests used local fixtures and mocked delivery calls. **The installed native Chrome invitation/reader handoff was not executed. Real cloud deployment and SMTP delivery were not configured or tested, and no actual email was sent.** This remains an integration preview.

1.3.0 checksums:

```text
e3afd823368ffde3e4c5947dbcecaece0328ac0c60d56dca382968d0a41520af  Typelocker-Chat-1.3.0.zip
edc55d8a831f3c9edb6ba5b14d4fe310dde37537eb79ff1f2cd45ffd6bbc543d  Typelocker-Agency-Client-SDK-1.3.0.zip
```
