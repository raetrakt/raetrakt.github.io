import { initializeLayout } from './layout.js';
import { setupFocus } from './focus.js';
import { initializeMedia } from './media.js';
import { setupScrolling } from './scrolling.js';

const layout = initializeLayout();

function setupLinkAnimations() {
  document.querySelectorAll('a').forEach(function (link) {
    if (link.dataset.lettersInitialized === 'true') return;

    const text = link.textContent;
    link.replaceChildren(
      ...Array.from(text).map(function (character, index) {
        const letter = document.createElement('span');
        letter.className = 'link-letter';
        letter.style.setProperty('--letter-index', index);
        letter.textContent = character;
        return letter;
      }),
    );
    link.dataset.lettersInitialized = 'true';
    link.addEventListener('mouseenter', function () {
      link.classList.remove('is-link-leaving');
    });
    link.addEventListener('mouseleave', function () {
      link.classList.add('is-link-leaving');
    });
  });
}

setupLinkAnimations();

function setupAbout({ scrollCols, scrollController, focusController }) {
  const stage = document.querySelector('.stage');
  const aboutPage = document.querySelector('.about-page');
  const aboutLink = document.querySelector('.about-link');
  const homeLink = document.querySelector('.home-link');

  if (!stage || !aboutPage || !aboutLink || !homeLink) return;

  function scrollProjectsToTop() {
    scrollController.resetScrollPositions();
    window.scrollTo(0, 0);
  }

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
    aboutLink.removeAttribute('data-letters-initialized');
    setupLinkAnimations();
  }

  aboutLink.addEventListener('click', function (event) {
    event.preventDefault();
    const visible = !stage.classList.contains('show-about');
    if (!visible) {
      focusController.clearFocusedColumn();
      setAboutVisible(false);
      history.replaceState(null, '', '/');
      return;
    }

    // Start both movements together so the projects reset while all columns
    // translate out of view.
    scrollProjectsToTop();
    setAboutVisible(true);
    history.replaceState(null, '', '#about');
  });

  homeLink.addEventListener('click', function (event) {
    if (!stage.classList.contains('show-about')) return;
    event.preventDefault();
    focusController.clearFocusedColumn();
    setAboutVisible(false);
    history.replaceState(null, '', '/');
  });

  if (window.location.hash === '#about') setAboutVisible(true);
}

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

  setupAbout({
    scrollCols: layout.scrollCols,
    scrollController,
    focusController,
  });

  initializeMedia(layout.cols);
}
