import { initializeLayout } from './layout.js';
import { setupFocus } from './focus.js';
import { initializeMedia } from './media.js';
import { setupScrolling } from './scrolling.js';

const layout = initializeLayout();

function setupAbout() {
  const stage = document.querySelector('.stage');
  const aboutPage = document.querySelector('.about-page');
  const aboutLink = document.querySelector('.about-link');
  const homeLink = document.querySelector('.home-link');

  if (!stage || !aboutPage || !aboutLink || !homeLink) return;

  function setAboutVisible(visible) {
    const wasVisible = stage.classList.contains('show-about');

    if (!visible && wasVisible) {
      stage.classList.add('is-returning');
      window.setTimeout(function () {
        stage.classList.remove('is-returning');
      }, 1100);
    }

    stage.classList.toggle('show-about', visible);
    aboutPage.setAttribute('aria-hidden', String(!visible));
    aboutLink.textContent = visible ? 'PROJECTS' : 'ABOUT';
  }

  aboutLink.addEventListener('click', function (event) {
    event.preventDefault();
    const visible = !stage.classList.contains('show-about');
    setAboutVisible(visible);
    history.replaceState(null, '', visible ? '#about' : '/');
  });

  homeLink.addEventListener('click', function (event) {
    if (!stage.classList.contains('show-about')) return;
    event.preventDefault();
    setAboutVisible(false);
    history.replaceState(null, '', '/');
  });

  if (window.location.hash === '#about') setAboutVisible(true);
}

setupAbout();

if (layout) {
  const desktopQuery = window.matchMedia('(min-width: 901px)');
  let focusController;

  const scrollController = setupScrolling(layout.scrollCols, function (col) {
    if (focusController && focusController.isFocused(col) === false) {
      focusController.clearFocusedColumn();
    }
  });

  focusController = setupFocus({
    ...layout,
    desktopQuery,
    scrollController,
  });

  initializeMedia(layout.cols);
}
