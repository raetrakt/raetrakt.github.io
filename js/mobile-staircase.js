function getOrderedColumns(cols) {
  return cols
    .map(function (col, sourceIndex) {
      return {
        col,
        sourceIndex,
        order: Number.parseInt(getComputedStyle(col).order, 10) || 0,
      };
    })
    .sort(function (a, b) {
      return a.order - b.order || a.sourceIndex - b.sourceIndex;
    })
    .map(function (item) {
      return item.col;
    });
}

function getStates(cols) {
  return getOrderedColumns(cols).map(function (col) {
    const media = col.querySelectorAll('.media');
    return {
      col,
      heading: col.querySelector('h1'),
      firstMedia: media[0] || null,
      lastMedia: media[media.length - 1] || null,
    };
  });
}

function createStaticController({ stage, grid, states }) {
  let destroyed = false;

  function resetScrollPositions() {
    if (destroyed) return;
    stage.scrollTop = 0;
    window.scrollTo(0, 0);
    grid.style.removeProperty('--mobile-grid-x');
    states.forEach(function (state) {
      state.col.style.removeProperty('--mobile-column-offset');
      state.col.classList.remove('is-scrolling');
    });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    grid.style.removeProperty('--mobile-grid-x');
    states.forEach(function (state) {
      state.col.style.removeProperty('--mobile-column-offset');
      state.col.classList.remove('is-scrolling');
    });
  }

  return {
    getActiveScrollIndex: function () {
      return 0;
    },
    setActiveScrollIndex: function () {},
    resetScrollPositions,
    retractOtherColumns: function () {},
    destroy,
  };
}

export function setupMobileScrollRail({ grid, cols, enabled = true }) {
  const stage = grid.closest('.stage');
  const states = getStates(cols);

  if (!stage || !enabled || !states.length) {
    return createStaticController({
      stage: stage || document.documentElement,
      grid,
      states,
    });
  }

  const handoffDownStarts = states.map(function () {
    return 0;
  });
  const scrollTimeouts = states.map(function () {
    return null;
  });
  let activeIndex = 0;
  let lastStageScrollTop = stage.scrollTop;
  let refreshFrame;
  let scrollFrame;
  let resizeObserver;
  let destroyed = false;

  function getColumnStep() {
    const firstColumn = states[0].col;
    const width = firstColumn.getBoundingClientRect().width || grid.clientWidth;
    const gridStyle = getComputedStyle(grid);
    const gap = Number.parseFloat(gridStyle.columnGap || gridStyle.gap) || 0;
    return width + gap;
  }

  function setGridPosition(index) {
    grid.style.setProperty('--mobile-grid-x', `${-index * getColumnStep()}px`);
  }

  function updateMediaReferences() {
    states.forEach(function (state) {
      const media = state.col.querySelectorAll('.media');
      state.heading = state.col.querySelector('h1');
      state.firstMedia = media[0] || null;
      state.lastMedia = media[media.length - 1] || null;
    });
  }

  function getColumnMetrics() {
    return states.map(function (state) {
      const colRect = state.col.getBoundingClientRect();
      const headingRect = state.heading ? state.heading.getBoundingClientRect() : null;
      const firstRect = state.firstMedia ? state.firstMedia.getBoundingClientRect() : null;
      const lastRect = state.lastMedia ? state.lastMedia.getBoundingClientRect() : null;

      return {
        headingTop: headingRect ? headingRect.top - colRect.top : 0,
        lastBottom: lastRect ? lastRect.bottom - colRect.top : colRect.height,
      };
    });
  }

  function getDocumentTop(element) {
    const stageRect = stage.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const transform = getComputedStyle(element).transform;
    let transformY = 0;

    if (transform !== 'none') {
      const matrix = transform.match(/^matrix(?:3d)?\(([^)]+)\)$/);
      if (matrix) {
        const values = matrix[1].split(',').map(Number);
        transformY = values.length === 16 ? values[13] : values[5];
      }
    }

    return elementRect.top - stageRect.top + stage.scrollTop - transformY;
  }

  function getLineHeight(element) {
    const style = getComputedStyle(element);
    const lineHeight = Number.parseFloat(style.lineHeight);
    if (Number.isFinite(lineHeight)) return lineHeight;

    return Number.parseFloat(style.fontSize) * 1.2;
  }

  function getVisibleStageHeight() {
    const stageRect = stage.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport ? viewport.offsetTop : 0;
    const viewportBottom = viewportTop + (viewport ? viewport.height : window.innerHeight);

    return Math.max(0, Math.min(stageRect.bottom, viewportBottom) - stageRect.top);
  }

  function recalculateGeometry() {
    const preservedScrollTop = stage.scrollTop;

    const metrics = getColumnMetrics();
    const offsets = states.map(function () {
      return 0;
    });

    for (let index = 1; index < states.length; index += 1) {
      offsets[index] = Math.max(
        offsets[index - 1] + 1,
        offsets[index - 1] +
          metrics[index - 1].lastBottom +
          getLineHeight(states[index].col) * 12 -
          metrics[index].headingTop,
      );
    }

    offsets.forEach(function (offset, index) {
      states[index].col.style.setProperty('--mobile-column-offset', `${offset}px`);
    });

    // Updating offsets can change the scrollable height while media loads.
    // Restore the rail position before calculating thresholds so browser
    // scroll anchoring cannot turn a resize into an apparent upward scroll.
    stage.scrollTop = preservedScrollTop;

    handoffDownStarts[0] = 0;
    for (let index = 1; index < states.length; index += 1) {
      // Downward: do not move sideways until the preceding project has fully
      // left the stage. The incoming heading remains below it by the configured
      // line-height spacing.
      const previousBottom =
        getDocumentTop(states[index - 1].col) +
        states[index - 1].col.getBoundingClientRect().height;
      handoffDownStarts[index] = Math.max(handoffDownStarts[index - 1] + 1, previousBottom);
    }
  }

  function getIndexForScrollTop(scrollTop) {
    let index = activeIndex;

    if (scrollTop > lastStageScrollTop) {
      while (index < states.length - 1 && scrollTop >= handoffDownStarts[index + 1]) {
        index += 1;
      }
    } else if (scrollTop < lastStageScrollTop) {
      while (
        index > 0 &&
        scrollTop <= getDocumentTop(states[index].col) - getVisibleStageHeight()
      ) {
        index -= 1;
      }
    }

    return index;
  }

  function markScrolling() {
    const state = states[activeIndex];
    if (!state) return;

    state.col.classList.add('is-scrolling');
    clearTimeout(scrollTimeouts[activeIndex]);
    scrollTimeouts[activeIndex] = setTimeout(function () {
      state.col.classList.remove('is-scrolling');
    }, 250);
  }

  function syncFromScroll() {
    if (destroyed) return;

    const currentScrollTop = stage.scrollTop;
    const nextIndex = getIndexForScrollTop(currentScrollTop);
    lastStageScrollTop = currentScrollTop;
    markScrolling();
    if (nextIndex !== activeIndex) {
      activeIndex = nextIndex;
      setGridPosition(activeIndex);
    }
  }

  function scheduleScrollSync() {
    if (destroyed || scrollFrame) return;

    scrollFrame = requestAnimationFrame(function () {
      scrollFrame = null;
      syncFromScroll();
    });
  }

  function refreshLayout() {
    if (destroyed) return;

    refreshFrame = null;
    updateMediaReferences();
    recalculateGeometry();
    activeIndex = getIndexForScrollTop(stage.scrollTop);
    setGridPosition(activeIndex);
  }

  function scheduleRefresh() {
    if (destroyed || refreshFrame) return;
    refreshFrame = requestAnimationFrame(refreshLayout);
  }

  function onScroll() {
    scheduleScrollSync();
  }

  stage.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', scheduleRefresh);
  window.visualViewport?.addEventListener('resize', scheduleRefresh);

  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(scheduleRefresh);
    resizeObserver.observe(stage);
    resizeObserver.observe(grid);
    states.forEach(function (state) {
      resizeObserver.observe(state.col);
      if (state.firstMedia) resizeObserver.observe(state.firstMedia);
      if (state.lastMedia && state.lastMedia !== state.firstMedia) {
        resizeObserver.observe(state.lastMedia);
      }
    });
  }

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(scheduleRefresh);
  }

  updateMediaReferences();
  recalculateGeometry();
  setGridPosition(0);

  function resetScrollPositions() {
    if (destroyed) return;
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = null;

    activeIndex = 0;
    lastStageScrollTop = 0;
    stage.scrollTop = 0;
    grid.style.setProperty('--mobile-grid-x', '0px');
    updateMediaReferences();
    recalculateGeometry();

    states.forEach(function (state, index) {
      state.col.classList.remove('is-scrolling');
      clearTimeout(scrollTimeouts[index]);
    });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;

    if (refreshFrame) cancelAnimationFrame(refreshFrame);
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    resizeObserver?.disconnect();
    window.removeEventListener('resize', scheduleRefresh);
    window.visualViewport?.removeEventListener('resize', scheduleRefresh);
    stage.removeEventListener('scroll', onScroll);

    scrollTimeouts.forEach(function (timeout) {
      clearTimeout(timeout);
    });
    grid.style.removeProperty('--mobile-grid-x');
    states.forEach(function (state) {
      state.col.style.removeProperty('--mobile-column-offset');
      state.col.classList.remove('is-scrolling');
    });
  }

  return {
    getActiveScrollIndex: function () {
      return activeIndex;
    },
    setActiveScrollIndex: function (index) {
      if (index < 0 || index >= states.length) return;
      activeIndex = index;
      setGridPosition(index);
    },
    resetScrollPositions,
    retractOtherColumns: function () {},
    destroy,
  };
}
