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
    grid.style.removeProperty('--mobile-grid-y');
    grid.style.removeProperty('--mobile-scroll-padding');
    states.forEach(function (state) {
      state.col.style.removeProperty('--mobile-column-offset');
      state.col.classList.remove('is-scrolling');
    });
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    grid.style.removeProperty('--mobile-grid-x');
    grid.style.removeProperty('--mobile-grid-y');
    grid.style.removeProperty('--mobile-scroll-padding');
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

  const scrollTimeouts = states.map(function () {
    return null;
  });
  const handoffPositions = states.map(function () {
    return 0;
  });
  let activeIndex = 0;
  let verticalOffset = 0;
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

  function getHandoffDistance() {
    return Math.max(1, stage.clientHeight || window.innerHeight);
  }

  function setGridState({ progress, vertical }) {
    verticalOffset = vertical;
    grid.style.setProperty('--mobile-grid-x', `${-progress * getColumnStep()}px`);
    grid.style.setProperty('--mobile-grid-y', `${vertical}px`);
  }

  function updateMediaReferences() {
    states.forEach(function (state) {
      const media = state.col.querySelectorAll('.media');
      state.firstMedia = media[0] || null;
      state.lastMedia = media[media.length - 1] || null;
    });
  }

  function getColumnMetrics() {
    return states.map(function (state) {
      const colRect = state.col.getBoundingClientRect();
      const firstRect = state.firstMedia ? state.firstMedia.getBoundingClientRect() : null;
      const lastRect = state.lastMedia ? state.lastMedia.getBoundingClientRect() : null;

      return {
        firstTop: firstRect ? firstRect.top - colRect.top : 0,
        lastTop: lastRect ? lastRect.top - colRect.top : 0,
        lastBottom: lastRect ? lastRect.bottom - colRect.top : colRect.height,
        lastCenter: lastRect
          ? (lastRect.top + lastRect.bottom) / 2 - colRect.top
          : colRect.height / 2,
      };
    });
  }

  function getDocumentTop(element) {
    const stageRect = stage.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    return elementRect.top - stageRect.top + stage.scrollTop - verticalOffset;
  }

  function recalculateGeometry() {
    states.forEach(function (state) {
      state.col.style.removeProperty('--mobile-column-offset');
    });

    const metrics = getColumnMetrics();
    const offsets = states.map(function () {
      return 0;
    });

    for (let index = 1; index < states.length; index += 1) {
      const previous = metrics[index - 1];
      const current = metrics[index];
      offsets[index] = Math.max(
        offsets[index - 1] + 1,
        offsets[index - 1] + previous.lastTop - current.firstTop,
      );
    }

    offsets.forEach(function (offset, index) {
      states[index].col.style.setProperty('--mobile-column-offset', `${offset}px`);
    });

    const updatedMetrics = getColumnMetrics();
    const stageHeight = stage.clientHeight;
    const handoffDistance = getHandoffDistance();
    let completedHandoffDistance = 0;
    handoffPositions[0] = 0;
    for (let index = 1; index < states.length; index += 1) {
      const previousColumnTop = getDocumentTop(states[index - 1].col);
      const previousHandoff =
        previousColumnTop +
        updatedMetrics[index - 1].lastCenter +
        completedHandoffDistance -
        stageHeight / 2;
      handoffPositions[index] = Math.max(
        handoffPositions[index - 1] + handoffDistance,
        previousHandoff,
      );
      completedHandoffDistance += handoffDistance;
    }
    grid.style.setProperty('--mobile-scroll-padding', `${completedHandoffDistance}px`);
  }

  function getScrollState(scrollTop) {
    const handoffDistance = getHandoffDistance();
    let progress = 0;
    let vertical = 0;

    for (let index = 1; index < states.length; index += 1) {
      const transitionStart = handoffPositions[index];
      const transitionEnd = transitionStart + handoffDistance;
      if (scrollTop < transitionStart) {
        return { progress, vertical };
      }
      if (scrollTop < transitionEnd) {
        const transitionProgress = (scrollTop - transitionStart) / handoffDistance;
        return {
          progress: index - 1 + transitionProgress,
          vertical: vertical + scrollTop - transitionStart,
        };
      }

      vertical += handoffDistance;
      progress = index;
    }

    return {
      progress,
      vertical,
    };
  }

  function getActiveIndex(progress) {
    return Math.min(states.length - 1, Math.floor(progress));
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

    const scrollState = getScrollState(stage.scrollTop);
    activeIndex = getActiveIndex(scrollState.progress);
    markScrolling();
    setGridState(scrollState);
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
    const scrollState = getScrollState(stage.scrollTop);
    activeIndex = getActiveIndex(scrollState.progress);
    setGridState(scrollState);
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
  setGridState({ progress: 0, vertical: 0 });

  function resetScrollPositions() {
    if (destroyed) return;
    if (scrollFrame) cancelAnimationFrame(scrollFrame);
    scrollFrame = null;

    activeIndex = 0;
    stage.scrollTop = 0;
    updateMediaReferences();
    recalculateGeometry();
    setGridState({ progress: 0, vertical: 0 });

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
    stage.removeEventListener('scroll', onScroll);

    scrollTimeouts.forEach(function (timeout) {
      clearTimeout(timeout);
    });
    grid.style.removeProperty('--mobile-grid-x');
    grid.style.removeProperty('--mobile-grid-y');
    grid.style.removeProperty('--mobile-scroll-padding');
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
      setGridState({
        progress: activeIndex,
        vertical: activeIndex * getHandoffDistance(),
      });
    },
    resetScrollPositions,
    retractOtherColumns: function () {},
    destroy,
  };
}
