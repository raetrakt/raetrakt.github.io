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

function getColumnMedia(col) {
  return Array.from(col.querySelectorAll('.media > img, .media > video'));
}

function getDeferredMedia(col) {
  return Array.prototype.filter.call(
    col.querySelectorAll('.secondary-video, img[data-src]'),
    function (element) {
      return element !== getFirstMediaElement(col);
    },
  );
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

function getMobileOnboardingHeight(element) {
  const media = element.closest('.media');
  if (!media) return null;

  const width = media.clientWidth || element.getBoundingClientRect().width;
  const naturalWidth = element.naturalWidth || element.videoWidth || Number(element.width);
  const naturalHeight = element.naturalHeight || element.videoHeight || Number(element.height);
  const inlineRatio = media.style.aspectRatio.match(/([\d.]+)\s*\/\s*([\d.]+)/);
  const aspectRatio =
    naturalWidth > 0 && naturalHeight > 0
      ? naturalHeight / naturalWidth
      : inlineRatio
        ? Number(inlineRatio[2]) / Number(inlineRatio[1])
        : 4 / 3;

  return {
    media,
    height: width * aspectRatio,
  };
}

function revealRemainingMobileMedia(onboardingMedia) {
  const firstMedia = onboardingMedia.values().next().value;
  onboardingMedia.forEach(function (element) {
    if (element === firstMedia) return;

    const child = element.querySelector('img, video');
    const dimensions = child ? getMobileOnboardingHeight(child) : null;
    if (!dimensions) return;

    dimensions.media.style.setProperty(
      '--mobile-onboarding-media-height',
      `${dimensions.height}px`,
    );
    dimensions.media.classList.add('waiting-ready');
  });
}

function revealMobileOnboardingMedia(element, onboardingMedia) {
  const dimensions = getMobileOnboardingHeight(element);
  if (!dimensions) return;

  const firstMedia = onboardingMedia.values().next().value;
  if (dimensions.media !== firstMedia || dimensions.media.classList.contains('reveal-ready')) {
    return;
  }

  dimensions.media.style.setProperty(
    '--mobile-onboarding-media-height',
    `${dimensions.height}px`,
  );
  dimensions.media.classList.add('reveal-ready');

  let completed = false;
  const completeOnboarding = function () {
    if (completed) return;
    completed = true;
    dimensions.media.removeEventListener('transitionend', handleTransitionEnd);
    revealRemainingMobileMedia(onboardingMedia);
  };
  const handleTransitionEnd = function (event) {
    if (event.target === dimensions.media && event.propertyName === 'height') {
      completeOnboarding();
    }
  };

  dimensions.media.addEventListener('transitionend', handleTransitionEnd);
  const duration = Number.parseFloat(getComputedStyle(dimensions.media).transitionDuration);
  window.setTimeout(
    completeOnboarding,
    Number.isFinite(duration) ? duration * 1000 + 50 : 750,
  );
}

function loadMedia(element, mobileOnboardingMedia) {
  if (!element) return Promise.resolve();
  const media = element.closest('.media');
  const isOnboardingMedia = Boolean(media) && mobileOnboardingMedia?.has(media);

  if (element.tagName === 'IMG') {
    const revealImage = function () {
      if (element.naturalWidth > 0) {
        element.classList.add('is-loaded');
        if (isOnboardingMedia) {
          revealMobileOnboardingMedia(element, mobileOnboardingMedia);
        }
      }
    };
    const handleImageError = function () {
      if (isOnboardingMedia) {
        revealMobileOnboardingMedia(element, mobileOnboardingMedia);
      }
    };

    element.addEventListener('load', revealImage, { once: true });
    element.addEventListener('error', handleImageError, { once: true });
    if (!element.getAttribute('src') && element.dataset.src) {
      element.src = element.dataset.src;
    }
    if (element.complete) revealImage();
  } else {
    const revealVideo = function () {
      if (element.readyState >= 2 || element.videoWidth > 0) {
        element.classList.add('is-loaded');
        if (isOnboardingMedia) {
          revealMobileOnboardingMedia(element, mobileOnboardingMedia);
        }
      }
    };
    const handleVideoError = function () {
      if (isOnboardingMedia) {
        revealMobileOnboardingMedia(element, mobileOnboardingMedia);
      }
    };

    element.addEventListener('loadeddata', revealVideo, { once: true });
    element.addEventListener('error', handleVideoError, { once: true });
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
    if (element.readyState >= 2) revealVideo();
  }

  return waitForMedia(element);
}

export function initializeMedia(cols) {
  const orderedCols = getOrderedColumns(cols);
  const firstMedia = orderedCols.map(getFirstMediaElement).filter(Boolean);
  const isMobile = window.matchMedia('(max-width: 520px)').matches;
  const isDesktop = window.matchMedia('(min-width: 901px)').matches;
  const mobileOnboardingMedia =
    isMobile && orderedCols[0] ? new Set(orderedCols[0].querySelectorAll('.media')) : null;
  const mediaPromises = new WeakMap();
  const loadOnce = function (element, onboardingMedia) {
    if (!mediaPromises.has(element)) {
      mediaPromises.set(element, loadMedia(element, onboardingMedia));
    }
    return mediaPromises.get(element);
  };
  let initialMediaReady = Promise.resolve();

  if (isMobile) {
    // Mobile presents one continuous visual sequence, so load every media
    // element in project order, including secondary videos and images.
    initialMediaReady = (async function () {
      for (const col of orderedCols) {
        for (const element of getColumnMedia(col)) {
          await loadOnce(element, mobileOnboardingMedia);
        }
      }
    })();
  } else {
    // Desktop shows the top media of every project immediately.
    initialMediaReady = Promise.all(
      firstMedia.map(function (element) {
        return loadOnce(element, null);
      }),
    );

    if (isDesktop) {
      // Also load deferred media that is already visible, including a teaser
      // that only partially intersects the browser viewport.
      const visibleMediaObserver = new IntersectionObserver(
        function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            loadOnce(entry.target, null);
          });
        },
        { threshold: 0 },
      );

      // After the initial row, give bandwidth to the first column the user
      // actively scrolls instead of loading all columns' secondary media.
      cols.forEach(function (col) {
        const remainingMedia = getDeferredMedia(col);
        if (!remainingMedia.length) return;

        remainingMedia.forEach(function (element) {
          visibleMediaObserver.observe(element);
        });

        let lastScrollTop = col.scrollTop;
        let activated = false;
        const onScroll = function () {
          const currentScrollTop = col.scrollTop;
          const movedDown = currentScrollTop > lastScrollTop;
          lastScrollTop = currentScrollTop;
          if (!movedDown || activated) return;

          activated = true;
          (async function () {
            for (const element of remainingMedia) {
              await loadOnce(element, null);
            }
          })();
        };

        col.addEventListener('scroll', onScroll, { passive: true });
      });
    }
  }

  /* Mobile and desktop use explicit queues plus desktop viewport loading. */
  if (isMobile || isDesktop) return;

  /* Tablet keeps intersection-based loading inside its grouped scroll roots. */
  cols.forEach(function (col) {
    const lazyEls = getDeferredMedia(col);
    if (!lazyEls.length) return;

    const stage = col.closest('.stage');
    const observer = new IntersectionObserver(
      function (entries, obs) {
        initialMediaReady.then(function () {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            loadOnce(el, null);
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
