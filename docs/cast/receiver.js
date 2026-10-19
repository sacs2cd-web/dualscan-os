/* Public, key-free Cast Connect fallback. Encrypted transfer is native-TV-only.
 * CAF API: developers.google.com/cast/docs/reference/web_receiver/
 */
(() => {
  'use strict';
  const NAMESPACE = 'urn:x-cast:com.dualscan.diamond.transfer';
  const PROTOCOL_VERSION = 1;
  const REQUIRED_PACKAGE = 'com.dualscan.mp.tv';
  const status = document.getElementById('connection-status');
  const nativeRequired = () => {
    status.textContent = 'Diamond Player TV is required for encrypted media.';
  };
  const capabilities = () => ({
    type: 'CAPABILITIES',
    protocolVersion: PROTOCOL_VERSION,
    nativeReceiver: false,
    receiverKind: 'web-fallback',
    packageName: REQUIRED_PACKAGE,
    canReceiveEncryptedFiles: false,
    canPlayDiamond: false,
    error: 'NATIVE_RECEIVER_REQUIRED'
  });
  const requestId = message => {
    const value = message && message.requestId;
    return typeof value === 'string' && value.length <= 128 ? value :
      Number.isSafeInteger(value) ? value : undefined;
  };

  try {
    if (!globalThis.cast?.framework?.CastReceiverContext) {
      nativeRequired();
      return;
    }
    const framework = cast.framework;
    const context = framework.CastReceiverContext.getInstance();
    const send = (senderId, message) => {
      try { context.sendCustomMessage(NAMESPACE, senderId, message); }
      catch (_) { /* A sender may have disconnected; never log message contents. */ }
    };
    const refuse = (senderId, message) => {
      nativeRequired();
      send(senderId, {
        type: 'ERROR',
        protocolVersion: PROTOCOL_VERSION,
        requestId: requestId(message),
        code: 'NATIVE_RECEIVER_REQUIRED',
        nativeReceiver: false,
        packageName: REQUIRED_PACKAGE
      });
    };
    context.addCustomMessageListener(NAMESPACE, event => {
      let message = event.data;
      if (typeof message === 'string') {
        if (message.length > 16_384) return;
        try { message = JSON.parse(message); } catch (_) { return; }
      }
      if (!message || typeof message !== 'object' || Array.isArray(message)) return;
      if (message.protocolVersion !== undefined && message.protocolVersion !== PROTOCOL_VERSION) {
        refuse(event.senderId, message);
        return;
      }
      switch (message.type) {
        case 'HELLO':
        case 'GET_CAPABILITIES':
        case 'CAPABILITIES_REQUEST':
          send(event.senderId, { ...capabilities(), requestId: requestId(message) });
          break;
        case 'TRANSFER_REQUEST':
        case 'MEDIA_LOAD':
        case 'LOAD':
          refuse(event.senderId, message);
          break;
        case 'PING':
          send(event.senderId, { type: 'PONG', protocolVersion: PROTOCOL_VERSION,
            nativeReceiver: false, requestId: requestId(message) });
          break;
        default:
          refuse(event.senderId, message);
      }
    });
    // Cancel the standard media channel before CAF can resolve or fetch a URL.
    const manager = context.getPlayerManager();
    const refuseMedia = message => {
      refuse(message.senderId, message);
      return null;
    };
    manager.setMessageInterceptor(framework.messages.MessageType.LOAD, refuseMedia);
    manager.setMessageInterceptor(framework.messages.MessageType.PRELOAD, refuseMedia);
    manager.setMediaPlaybackInfoHandler(() => null);
    context.addEventListener(framework.system.EventType.READY, () => {
      nativeRequired();
      send(undefined, capabilities());
    });
    context.addEventListener(framework.system.EventType.SENDER_CONNECTED, event => {
      send(event.senderId, capabilities());
    });
    context.start({
      customNamespaces: { [NAMESPACE]: framework.system.MessageType.JSON },
      skipPlayersLoad: true,
      maxInactivity: 60,
      statusText: 'Diamond Player TV required'
    });
  } catch (_) {
    // The public URL also opens in ordinary browsers; no Cast hardware is implied.
    nativeRequired();
  }
})();
