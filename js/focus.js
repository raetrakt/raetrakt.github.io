export function setupFocus({ grid, cols, scrollCols, desktopQuery, scrollController }) {
  let focusedCol = null;
  let visiblePointAnimation;
  let visiblePointTimer;

  function getVisibleBottomPoint(col) {
    const colRect = col.getBoundingClientRect();
    const media = Array.prototype.slice.call(col.querySelectorAll('.media'));
    const reachedMedia = media.filter(function (item) {
      return item.getBoundingClientRect().top < colRect.bottom;
    });
    const anchor = reachedMedia.length ? reachedMedia[reachedMedia.length - 1] : media[0];
    if (!anchor) return null;

    return {
      element: anchor,
      pointY: anchor.getBoundingClientRect().bottom,
    };
  }

  function cancelVisiblePointAnchor() {
    if (visiblePointAnimation) {
      cancelAnimationFrame(visiblePointAnimation);
      visiblePointAnimation = null;
    }
    if (visiblePointTimer) {
      clearTimeout(visiblePointTimer);
      visiblePointTimer = null;
    }
  }

  function anchorVisibleBottomPoint(anchor) {
    if (!anchor) return;
    cancelVisiblePointAnchor();

    const col = anchor.element.closest('.col');

    function apply() {
      const currentBottom = anchor.element.getBoundingClientRect().bottom;
      const maxScroll = Math.max(0, col.scrollHeight - col.clientHeight);
      const targetScrollTop = col.scrollTop + (currentBottom - anchor.pointY);
      col.scrollTop = Math.min(maxScroll, Math.max(0, targetScrollTop));
    }

    function update() {
      apply();
      visiblePointAnimation = requestAnimationFrame(update);
    }

    visiblePointAnimation = requestAnimationFrame(update);
    visiblePointTimer = setTimeout(function () {
      cancelVisiblePointAnchor();
      apply();
    }, 620);
  }

  function clearFocusedColumn() {
    focusedCol = null;
    grid.classList.remove('has-focused-column');
    cols.forEach(function (col) {
      col.classList.remove(
        'focus-expanded',
        'focus-expand-left',
        'focus-expand-right',
        'focus-shift-left',
        'focus-shift-right',
      );
      col.setAttribute('aria-expanded', 'false');
    });
  }

  function focusColumn(col) {
    if (!desktopQuery.matches) return;

    const visibleBottomPoint = getVisibleBottomPoint(col);

    if (focusedCol === col) {
      clearFocusedColumn();
      anchorVisibleBottomPoint(visibleBottomPoint);
      return;
    }

    const colNumber = Number(col.dataset.col);
    const expandsRight = colNumber <= 3;
    focusedCol = col;
    grid.classList.add('has-focused-column');

    const scrollTarget = scrollCols.indexOf(col) !== -1 ? col : col.closest('.col-group');
    const scrollIndex = scrollCols.indexOf(scrollTarget);
    if (scrollIndex !== -1) {
      scrollController.setActiveScrollIndex(scrollIndex);
      scrollController.retractOtherColumns(scrollIndex);
    }

    cols.forEach(function (otherCol) {
      const otherNumber = Number(otherCol.dataset.col);
      otherCol.classList.remove(
        'focus-expanded',
        'focus-expand-left',
        'focus-expand-right',
        'focus-shift-left',
        'focus-shift-right',
      );
      otherCol.setAttribute('aria-expanded', String(otherCol === col));

      if (otherCol === col) {
        otherCol.classList.add(
          'focus-expanded',
          expandsRight ? 'focus-expand-right' : 'focus-expand-left',
        );
      } else if (expandsRight && otherNumber > colNumber) {
        otherCol.classList.add('focus-shift-right');
      } else if (!expandsRight && otherNumber < colNumber) {
        otherCol.classList.add('focus-shift-left');
      }
    });

    anchorVisibleBottomPoint(visibleBottomPoint);
    requestAnimationFrame(function () {
      if (focusedCol === col) {
        anchorVisibleBottomPoint(visibleBottomPoint);
      }
    });
  }

  cols.forEach(function (col) {
    col.tabIndex = 0;
    col.setAttribute('aria-expanded', 'false');

    col.addEventListener('click', function (event) {
      if (event.target.closest('a, button, input, textarea, select')) return;
      focusColumn(col);
    });

    col.addEventListener('wheel', cancelVisiblePointAnchor, { passive: true });
    col.addEventListener('touchmove', cancelVisiblePointAnchor, { passive: true });

    col.addEventListener('keydown', function (event) {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].indexOf(event.key) !== -1) {
        cancelVisiblePointAnchor();
      }

      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      focusColumn(col);
    });
  });

  desktopQuery.addEventListener('change', function (event) {
    if (!event.matches) clearFocusedColumn();
  });

  return {
    clearFocusedColumn,
    isFocused: function (col) {
      return focusedCol === col;
    },
  };
}
