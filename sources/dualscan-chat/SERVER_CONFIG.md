# Dualscan Chat Network Configuration

Dualscan Chat does not require a Dualscan server, SMP server, mailbox server, or public relay.

## Primary Path

- Internet, cellular, Wi-Fi, and hotspot internet access use Tor transport.
- Transport preference is Tor first, LAN second, Bluetooth third.
- The app uses Tor internally; users do not enter a server address.
- Device-to-device contact setup uses invite links and QR codes.

## Invite Link Format

User-facing invite links use:

```text
dualscan://<base32-handshake-payload>
```

QR codes may encode the same `dualscan://` link. The parser also accepts the bare base32 payload internally, but the branded format is `dualscan://`.

## Local Transport

- LAN/local Wi-Fi is enabled as an automatic transport when both devices are reachable on the same network.
- Bluetooth is enabled as an automatic nearby transport when permissions and hardware allow it.
- Users do not choose SMP/LAN/Tor manually; the transport layer selects what works.

## Firewall/Permission Expectations

- For Tor: allow outbound internet access from the app.
- For LAN: both devices need to be on the same local network, with local-network traffic allowed by the router/client isolation settings.
- For Bluetooth: Android Bluetooth permissions must be granted when prompted.

## Removed Configuration

- No SMP address format is supported in this build.
- No `smp://` QR code format is supported.
- No Mailbox/store-and-forward server behavior is enabled.
- No public SimpleX/SMP server directory or fallback is included.
