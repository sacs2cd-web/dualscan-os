/* Loaded only by the public static sample. No network, FiveM callbacks, or wallet APIs. */
(() => {
  'use strict';
  const engine = window.SampleGamingDemo;
  window.StaticDemoHost = Object.freeze({
    async request(route, payload) {
      if (!engine) throw new Error('The sample demo is unavailable. Reload this page.');
      const result = await engine.request(route, payload);
      if (!result.ok) {
        const error = new Error(result.error?.message || 'The sample request could not finish.');
        error.code = result.error?.code;
        throw error;
      }
      return result.data ?? result;
    }
  });
  const unsubscribe = engine?.subscribe(event => {
    const data = event.type === 'sample:reset' ? { type: 'device:close' } : event;
    window.dispatchEvent(new MessageEvent('message', { data, origin: location.origin, source: window }));
  });
  window.addEventListener('pagehide', () => { unsubscribe?.(); }, { once: true });
})();
