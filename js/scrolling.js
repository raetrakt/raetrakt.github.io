export function setupScrolling(scrollCols, onSwitchColumn) {
  const lastScrollTops = scrollCols.map(function (col) {
    return col.scrollTop;
  });
  let activeScrollIndex = -1;
  let retractAnimation;

  function retractOtherColumns(activeIndex) {
    if (retractAnimation) cancelAnimationFrame(retractAnimation);

    let startTime = null;
    const starts = scrollCols.map(function (otherCol) {
      return otherCol.scrollTop;
    });
    const longestRetraction = Math.max.apply(null, starts);
    const duration = Math.min(900, Math.max(350, longestRetraction * 0.6));

    function animate(timestamp) {
      if (!startTime) startTime = timestamp;
      const progress = Math.min(1, (timestamp - startTime) / duration);
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      scrollCols.forEach(function (otherCol, otherIndex) {
        if (otherIndex === activeIndex) return;
        otherCol.scrollTop = starts[otherIndex] * (1 - easedProgress);
        lastScrollTops[otherIndex] = otherCol.scrollTop;
      });

      if (progress < 1) {
        retractAnimation = requestAnimationFrame(animate);
      } else {
        scrollCols.forEach(function (otherCol, otherIndex) {
          if (otherIndex === activeIndex) return;
          otherCol.scrollTop = 0;
          lastScrollTops[otherIndex] = 0;
        });
        retractAnimation = null;
      }
    }

    retractAnimation = requestAnimationFrame(animate);
  }

  function setActiveScrollIndex(index) {
    activeScrollIndex = index;
  }

  scrollCols.forEach(function (col) {
    const index = scrollCols.indexOf(col);
    let timeout;

    col.addEventListener(
      'scroll',
      function () {
        const currentScrollTop = col.scrollTop;
        const delta = currentScrollTop - lastScrollTops[index];
        lastScrollTops[index] = currentScrollTop;

        if (delta > 0 && index !== activeScrollIndex) {
          onSwitchColumn(col);
          activeScrollIndex = index;
          retractOtherColumns(index);
        }

        col.classList.add('is-scrolling');
        clearTimeout(timeout);
        timeout = setTimeout(function () {
          col.classList.remove('is-scrolling');
        }, 250);
      },
      { passive: true },
    );
  });

  return {
    getActiveScrollIndex: function () {
      return activeScrollIndex;
    },
    setActiveScrollIndex,
    retractOtherColumns,
  };
}
