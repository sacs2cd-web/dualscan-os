(() => {
  'use strict';

  const menuButton = document.querySelector('.menu-button');
  const navigation = document.querySelector('#siteNav');
  const closeMenu = () => {
    menuButton.setAttribute('aria-expanded', 'false');
    navigation.classList.remove('is-open');
  };
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('is-open', open);
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      menuButton.focus();
    }
  });

  document.querySelector('a[href="#native-return-details"]').addEventListener('click', () => {
    document.querySelector('#native-return-details').open = true;
  });

  const demo = document.querySelector('#posDemo');
  const motionButton = document.querySelector('#motionToggle');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = false;
  const setPlaying = play => {
    playing = play;
    demo.src = play ? demo.dataset.animation : demo.dataset.poster;
    motionButton.setAttribute('aria-pressed', String(play));
    motionButton.setAttribute('aria-label', play ? 'Pause interface animation' : 'Play interface animation');
    motionButton.querySelector('.motion-icon').textContent = play ? 'Ⅱ' : '▶';
    motionButton.querySelector('.motion-label').textContent = play ? 'Pause demo' : 'Play demo';
  };
  motionButton.addEventListener('click', () => setPlaying(!playing));
  motionPreference.addEventListener('change', event => {
    if (event.matches) setPlaying(false);
  });
  if (!motionPreference.matches) setPlaying(true);

  const networkCopy = {
    solana: {
      name: 'USDC on Solana.',
      description: 'VisaUSD mode uses USDC on Solana. Its main Data Matrix code is designed for the Dualscan VisaUSD Wallet.',
      gas: 'SOL', code: 'VisaUSD Data Matrix', external: 'Use the small footer QR',
      label: 'DEFAULT AT FIRST STARTUP'
    },
    polygon: {
      name: 'USDC on Polygon.',
      description: 'A second payment side for USDC on Polygon. A standard address QR lets compatible wallets pay the Polygon Gate.',
      gas: 'POL', code: 'Standard address QR', external: 'Confirm USDC + Polygon',
      label: 'SECOND PAYMENT OPTION'
    }
  };
  const tabs = [...document.querySelectorAll('[data-network]')];
  const panel = document.querySelector('#networkPanel');
  const selectNetwork = mode => {
    const copy = networkCopy[mode];
    if (!copy) return;
    tabs.forEach(tab => {
      const selected = tab.dataset.network === mode;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) panel.setAttribute('aria-labelledby', tab.id);
    });
    document.querySelector('#networkName').textContent = copy.name;
    document.querySelector('#networkDescription').textContent = copy.description;
    document.querySelector('#networkGas').textContent = copy.gas;
    document.querySelector('#networkCode').textContent = copy.code;
    document.querySelector('#networkExternal').textContent = copy.external;
    document.querySelector('#networkDefault').textContent = copy.label;
    const mark = document.querySelector('#networkMark');
    mark.src = `../assets/visausd-pos/wallets/${mode}.svg`;
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectNetwork(tab.dataset.network));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') next = (index + 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      selectNetwork(tabs[next].dataset.network);
      tabs[next].focus();
    });
  });

  const examples = [...document.querySelectorAll('[data-amount]')];
  examples.forEach(button => button.addEventListener('click', () => {
    const cents = Number(button.dataset.amount);
    const fee = cents >= 300 ? 50 : 0;
    examples.forEach(choice => choice.setAttribute('aria-pressed', String(choice === button)));
    document.querySelector('#exampleIncoming').textContent = (cents / 100).toFixed(2);
    document.querySelector('#exampleFee').textContent = `${fee ? '−' : ''}${(fee / 100).toFixed(2)}`;
    document.querySelector('#exampleVault').textContent = ((cents - fee) / 100).toFixed(2);
  }));
})();
