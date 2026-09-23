export function initializeMedia(cols) {
  /* Load the primary videos immediately. */
  const primaries = cols
    .map(function (col) {
      return col.querySelector('.primary-video');
    })
    .filter(Boolean);

  primaries.forEach(function (video) {
    if (!video.getAttribute('src') && video.dataset.src) {
      video.src = video.dataset.src;
    }
    video.setAttribute('autoplay', '');
    const playPromise = video.play();
    if (playPromise && playPromise.catch) {
      playPromise.catch(function () {
        /* Autoplay blocked — fail silently. */
      });
    }
  });

  /* Lazy-load deferred videos and images within each column's scroll root. */
  cols.forEach(function (col) {
    const lazyEls = col.querySelectorAll('.secondary-video, img[data-src]');
    if (!lazyEls.length) return;

    const group = col.closest('.col-group');
    const stage = col.closest('.stage');
    const columnStyle = getComputedStyle(col);
    const columnScrolls = ['auto', 'scroll'].indexOf(columnStyle.overflowY) !== -1;

    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const el = entry.target;

          if (el.tagName === 'IMG') {
            el.src = el.dataset.src;
          } else {
            el.src = el.dataset.src;
            el.load();
            el.play().catch(function () {});
          }
          obs.unobserve(el);
        });
      },
      {
        root:
          group && getComputedStyle(group).display !== 'contents'
            ? group
            : columnScrolls
              ? col
              : stage,
        rootMargin: '200px 0px',
        threshold: 0.1,
      },
    );

    lazyEls.forEach(function (el) {
      observer.observe(el);
    });
  });
}
