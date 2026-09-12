import { initializeLayout } from './layout.js';
import { setupFocus } from './focus.js';
import { initializeMedia } from './media.js';
import { setupScrolling } from './scrolling.js';

const layout = initializeLayout();

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

  initializeMedia(layout.cols);
}
