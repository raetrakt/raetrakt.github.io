import { initializeLayout } from './layout.js';
import { setupFocus } from './focus.js';
import { initializeMedia } from './media.js';
import { setupScrolling } from './scrolling.js';

const layout = initializeLayout();

function setupAbout({ scrollCols, scrollController, focusController }) {
  const stage = document.querySelector('.stage');
  const aboutPage = document.querySelector('.about-page');
  const aboutLink = document.querySelector('.about-link');
  const homeLink = document.querySelector('.home-link');

  if (!stage || !aboutPage || !aboutLink || !homeLink) return;

  function scrollActiveColumnToTop(done) {
    const activeIndex = scrollController.getActiveScrollIndex();
    const activeCol =
      activeIndex >= 0
        ? scrollCols[activeIndex]
        : scrollCols.find(function (col) {
            return col.scrollTop > 0;
          });

    if (!activeCol) {
      done();
      return;
    }

    const target = 0;
    if (activeCol.scrollTop <= 1) {
      done();
      return;
    }

    // Reset before the next paint. This prevents the column's overflow clip
    // from carrying a cut-off image into the downward transition.
    activeCol.scrollTop = target;
    done();
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

    // Start both movements together so the active column resets while all
    // columns translate out of view.
    setAboutVisible(true);
    history.replaceState(null, '', '#about');
    scrollActiveColumnToTop(function () {});
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
