# Tina Snow® Social Diary™ Chrome Plugin

**The Official Chrome Plugin of the Tina Snow® Social Diary™ Service.**

Author: **Dualscan.cloud Dualscan LLC**

This Desktop Chrome companion installs as **Typelocker™ Chat 1.1.1**. It composes, encodes, and decodes BSK1 messages on YouTube, X/Twitter, Gmail, and Outlook web. All features are free, including the original default key, custom keys, key management, and unlimited use subject to normal browser resources. No account, payment, subscription, or license activation is required.

## Download

[Download Typelocker-Chat-1.1.1.zip](https://github.com/sacs2cd-web/dualscan-os/raw/refs/heads/main/Tina%20Snow%C2%AE%20Social%20Diary%E2%84%A2%20Chrome%20Plugin/Typelocker-Chat-1.1.1.zip)

This folder is a Desktop Chrome companion distribution. Keep it separate from the `SmartSwitchBackup2` Galaxy restore folder.

## Install into Desktop Chrome

1. Download **Typelocker-Chat-1.1.1.zip** using the link above or open that file in GitHub and choose **Download raw file**.
2. Extract the ZIP to a permanent folder on your Windows, macOS, or Linux computer. The extracted folder must directly contain `manifest.json`, `popup.html`, the JavaScript files, and `icons/`. Keep this folder: Chrome loads the unpacked extension from it.
3. In Desktop Google Chrome, enter `chrome://extensions` in the address bar.
4. Turn on **Developer mode** at the upper right.
5. Choose **Load unpacked** and select the extracted folder containing `manifest.json`. Select the folder rather than the ZIP file.
6. Confirm **Typelocker™ Chat 1.1.1** appears in the extensions list. Open Chrome's Extensions menu (puzzle-piece icon) and pin Typelocker™ Chat if desired.
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

## Privacy and BSK1 limitations

Encoding and decoding run locally in the browser. The extension does not transmit plaintext messages or secret keys to an external server. Saved keys and preferences use local Chrome extension storage. If you submit encoded text on a website, that website receives it under its own policies; decoded text displayed in the page DOM may also be visible to that website.

**BSK1 is reversible text obfuscation, not secure encryption.** Its checksum does not authenticate the key or sender. Some incorrect keys can produce readable text. Do not use BSK1 to protect sensitive information or reuse account passwords as keys.

- [Privacy policy](https://typelocker-chat-support.alleong.chatgpt.site/privacy)
- [Support and instructions](https://typelocker-chat-support.alleong.chatgpt.site/support)

## Troubleshooting and updates

Refresh supported pages after installing or updating the extension. Click inside the target editor before opening the popup. If a site editor does not accept insertion, use **Copy Encoded Message** and paste it manually. Password, disabled, and read-only fields are excluded. Images, canvas, closed shadow roots, unmatched cross-origin frames, and tokens split across multiple DOM text nodes are not supported.

For a later ZIP update, replace the files in the same permanent extension folder, choose the extension's **Reload** control at `chrome://extensions`, and refresh supported website tabs.

## Package integrity

Version: **1.1.1**  
ZIP size: **33342 bytes**  
SHA-256:

```text
a730250fa164db3267b596eba64ebd0a293698da84bbe91be60c5ff10ec71188
```

The adjacent checksum file records the same hash for the ZIP. This GitHub download is the unpacked Desktop Chrome distribution; Chrome Web Store review and publication status are separate.
