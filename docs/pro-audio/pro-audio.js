(() => {
  'use strict';

  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll('[data-theme-choice]')];
  const themedImages = [...document.querySelectorAll('[data-themed-screen]')];
  const monitorButtons = [...document.querySelectorAll('[data-monitor-choice]')];
  const monitorExpand = document.getElementById('monitorExpand');
  const monitorImage = document.getElementById('monitorImage');
  const monitorCaption = document.getElementById('monitorCaption');
  const dialog = document.getElementById('screenDialog');
  const dialogImage = document.getElementById('dialogImage');
  const dialogCaption = document.getElementById('dialogCaption');
  const closeButton = document.getElementById('closeScreen');
  const assetBase = '../assets/pro-audio/';
  let activeTheme = 'dark';
  let expandedScreen = null;
  let returnFocus = null;

  const sourceFor = (screen) => `${assetBase}${screen}-${activeTheme}.png`;
  const updateModal = () => {
    if (!expandedScreen) return;
    dialogImage.src = sourceFor(expandedScreen.screen);
    dialogImage.alt = `${expandedScreen.caption} in ${activeTheme} mode`;
    dialogCaption.textContent = `${expandedScreen.caption} · ${activeTheme === 'dark' ? 'Dark' : 'Light'}`;
  };

  const setTheme = (theme) => {
    activeTheme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = activeTheme;
    document.querySelector('meta[name="theme-color"]').content = activeTheme === 'dark' ? '#090a0b' : '#faf8fa';
    themeButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === activeTheme)));
    themedImages.forEach((img) => {
      img.src = sourceFor(img.dataset.themedScreen);
      img.alt = img.alt.replace(/in (dark|light) mode$/, `in ${activeTheme} mode`);
    });
    updateModal();
    try { localStorage.setItem('diamond-pro-audio-theme', activeTheme); } catch (_) { /* Theme still works without storage. */ }
  };

  themeButtons.forEach((button) => button.addEventListener('click', () => setTheme(button.dataset.themeChoice)));
  try {
    if (localStorage.getItem('diamond-pro-audio-theme') === 'light') setTheme('light');
  } catch (_) { /* Keep the default dark appearance. */ }

  const monitorStates = {
    analysis: {
      screen: '07-monitor-analysis',
      caption: 'Diamond Player 1.4.0 · Full-screen Audio Input Analysis',
      shortCaption: 'Diamond Player 1.4.0 · Audio Input Analysis',
      alt: 'Diamond Player Pro Audio expanded input analysis on a full-screen Android monitor',
      label: 'Enlarge full-screen audio input analysis'
    },
    recording: {
      screen: '08-monitor-recording',
      caption: 'Diamond Player 1.4.0 · Full-screen Pro Audio Recording',
      shortCaption: 'Diamond Player 1.4.0 · Pro Audio Recording',
      alt: 'Diamond Player Pro Audio recording on a full-screen Android monitor',
      label: 'Enlarge full-screen Pro Audio recording'
    }
  };

  monitorButtons.forEach((button) => button.addEventListener('click', () => {
    const selected = monitorStates[button.dataset.monitorChoice];
    if (!selected) return;
    monitorButtons.forEach((candidate) => candidate.setAttribute('aria-pressed', String(candidate === button)));
    monitorExpand.dataset.screen = selected.screen;
    monitorExpand.dataset.caption = selected.caption;
    monitorExpand.setAttribute('aria-label', selected.label);
    monitorImage.dataset.themedScreen = selected.screen;
    monitorImage.src = sourceFor(selected.screen);
    monitorImage.alt = `${selected.alt} in ${activeTheme} mode`;
    monitorCaption.textContent = selected.shortCaption;
  }));

  const openScreen = (button) => {
    returnFocus = button;
    expandedScreen = { screen: button.dataset.screen, caption: button.dataset.caption };
    updateModal();
    dialog.showModal();
    document.body.classList.add('modal-open');
    closeButton.focus();
  };

  const closeScreen = () => {
    if (dialog.open) dialog.close();
  };

  document.querySelectorAll('[data-screen]').forEach((button) => button.addEventListener('click', () => openScreen(button)));
  closeButton.addEventListener('click', closeScreen);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeScreen();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    expandedScreen = null;
    if (returnFocus?.isConnected) returnFocus.focus();
    returnFocus = null;
  });
})();
