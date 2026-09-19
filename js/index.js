import { initializeLayout } from './layout.js';
import { setupFocus } from './focus.js';
import { initializeMedia } from './media.js';
import { setupScrolling } from './scrolling.js';

const layout = initializeLayout();

function setupLinkAnimations() {
  document.querySelectorAll('a').forEach(function (link) {
    if (link.dataset.lettersInitialized === 'true') return;

    const text = link.textContent;
    let letterIndex = 0;
    link.replaceChildren(
      ...(text.match(/\s+|\S+/g) || []).map(function (part) {
        if (/^\s+$/.test(part)) return document.createTextNode(part);

        const word = document.createElement('span');
        word.className = 'link-word';
        let wordLetterIndex = 0;
        word.append(
          ...Array.from(part).map(function (character) {
            const letter = document.createElement('span');
            letter.className = 'link-letter';
            letter.style.setProperty('--letter-index', letterIndex++);
            letter.style.setProperty('--word-letter-index', wordLetterIndex++);
            letter.textContent = character;
            return letter;
          }),
        );
        return word;
      }),
    );
    link.dataset.lettersInitialized = 'true';
    link.addEventListener('mouseenter', function () {
      const lineRight = link.parentElement.getBoundingClientRect().right;
      link.querySelectorAll('.link-word').forEach(function (word) {
        const expansion = Array.from(word.textContent).length;
        const wordRight = word.getBoundingClientRect().right;
        word.classList.toggle('no-expand', wordRight + expansion > lineRight);
      });
    });
    link.addEventListener('mouseleave', function () {
      link.querySelectorAll('.link-word.no-expand').forEach(function (word) {
        word.classList.remove('no-expand');
      });
    });
  });
}

setupLinkAnimations();

function setupAbout({ scrollCols, scrollController, focusController }) {
  const stage = document.querySelector('.stage');
  const aboutPage = document.querySelector('.about-page');
  const aboutLink = document.querySelector('.about-link');
  const homeLink = document.querySelector('.home-link');
  const projectGrid = stage && stage.querySelector('.grid');
  let aboutSwapTimer;

  if (!stage || !aboutPage || !aboutLink || !homeLink) return;

  function scrollProjectsToTop() {
    scrollController.resetScrollPositions();
    if (window.innerWidth > 520) window.scrollTo(0, 0);
  }

  function setAboutVisible(visible) {
    const wasVisible = stage.classList.contains('show-about');

    clearTimeout(aboutSwapTimer);
    if (visible && window.innerWidth <= 520 && projectGrid) {
      const gridTop = projectGrid.getBoundingClientRect().top;
      projectGrid.style.setProperty(
        '--projects-hide-offset',
        `${window.innerHeight - gridTop + 1}px`,
      );
    }
    stage.classList.add('is-about-swapping');

    if (!visible && wasVisible) {
      stage.classList.add('is-returning');
      window.setTimeout(function () {
        stage.classList.remove('is-returning');
      }, 1100);
    }

    stage.classList.toggle('show-about', visible);
    document.body.classList.toggle('about-is-open', visible);
    aboutPage.setAttribute('aria-hidden', String(!visible));
    aboutLink.textContent = visible ? 'PROJECTS' : 'ABOUT';
    aboutLink.removeAttribute('data-letters-initialized');
    setupLinkAnimations();

    aboutSwapTimer = window.setTimeout(function () {
      stage.classList.remove('is-about-swapping');
    }, 400);
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

    // Reset the projects before moving them out of view.
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
