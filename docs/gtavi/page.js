(() => {
  'use strict';
  const demo = document.getElementById('deviceDemo');
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || event.source !== demo.contentWindow || event.data?.type !== 'visausd-demo:resize') return;
    const height = Number(event.data.height);
    if (Number.isFinite(height) && height > 0) demo.style.height = Math.ceil(Math.min(4000, Math.max(600, height))) + 'px';
  });
})();
