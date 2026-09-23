function getOrderedColumns(cols) {
  return cols.slice().sort(function (a, b) {
    const orderA = Number.parseInt(getComputedStyle(a).order, 10) || 0;
    const orderB = Number.parseInt(getComputedStyle(b).order, 10) || 0;
    return orderA - orderB;
  });
}

function getFirstMediaElement(col) {
  const media = col.querySelector('.media');
  return media ? media.querySelector('img, video') : null;
}

function waitForMedia(element) {
  if (element.tagName === 'IMG' && element.complete) return Promise.resolve();
  if (element.tagName === 'VIDEO' && element.readyState >= 2) {
    return Promise.resolve();
  }

  return new Promise(function (resolve) {
    let settled = false;
    const finish = function () {
      if (settled) return;
      settled = true;
      element.removeEventListener('load', finish);
      element.removeEventListener('loadeddata', finish);
      element.removeEventListener('error', finish);
      resolve();
    };

    element.addEventListener('load', finish, { once: true });
    element.addEventListener('loadeddata', finish, { once: true });
    element.addEventListener('error', finish, { once: true });
  });
}

function loadMedia(element) {
  if (!element) return Promise.resolve();

  if (element.tagName === 'IMG') {
    const revealImage = function () {
      if (element.naturalWidth > 0) {
        element.classList.add('is-loaded');
      }
    };

    element.addEventListener('load', revealImage, { once: true });
    if (!element.getAttribute('src') && element.dataset.src) {
      element.src = element.dataset.src;
    }
    if (element.complete) revealImage();
  } else {
    if (!element.getAttribute('poster') && element.dataset.poster) {
      element.poster = element.dataset.poster;
    }
    if (!element.getAttribute('src') && element.dataset.src) {
      element.src = element.dataset.src;
      element.load();
    }
    element.setAttribute('autoplay', '');
    const playPromise = element.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        /* Autoplay blocked — fail silently. */
      });
    }
  }

  return waitForMedia(element);
}

export function initializeMedia(cols) {
  const orderedCols = getOrderedColumns(cols);
  const firstMedia = orderedCols.map(getFirstMediaElement).filter(Boolean);
  const isMobile = window.matchMedia('(max-width: 520px)').matches;
  let initialMediaReady = Promise.resolve();

  if (isMobile) {
    // The mobile layout is a vertical staircase, so load media in the same
    // order in which the projects are encountered while scrolling down.
    initialMediaReady = (async function () {
      for (const element of firstMedia) {
        await loadMedia(element);
      }
    })();
  } else {
    // Desktop presents one column from each project, so start all first media
    // before allowing secondary media to compete for bandwidth.
    firstMedia.forEach(function (element) {
      loadMedia(element);
    });
  }

  /* Lazy-load deferred videos and images within each column's scroll root. */
  cols.forEach(function (col) {
    const firstMediaElement = getFirstMediaElement(col);
    const lazyEls = Array.prototype.filter.call(
      col.querySelectorAll('.secondary-video, img[data-src]'),
      function (element) {
        return element !== firstMediaElement;
      },
    );
    if (!lazyEls.length) return;

    const stage = col.closest('.stage');
    const observer = new IntersectionObserver(
      function (entries, obs) {
        initialMediaReady.then(function () {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            loadMedia(el);
            obs.unobserve(el);
          });
        });
      },
      {
        root: (function () {
          const group = col.closest('.col-group');
          if (group && getComputedStyle(group).display !== 'contents') return group;
          return getComputedStyle(col).overflowY === 'auto' ? col : stage;
        })(),
        rootMargin: '200px 0px',
        threshold: 0.1,
      },
    );

    lazyEls.forEach(function (el) {
      observer.observe(el);
    });
  });
}
