export function initializeLayout() {
  const grid = document.getElementById('grid');

  if (!grid) return null;

  // Group adjacent columns at runtime so the smaller-screen layout can
  // stack each pair without adding layout-only wrappers to the HTML.
  const columns = Array.prototype.filter.call(grid.children, function (child) {
    return child.classList.contains('col');
  });

  for (let i = 0; i < columns.length; i += 2) {
    const group = document.createElement('div');
    group.className = 'col-group';
    grid.insertBefore(group, columns[i]);
    group.appendChild(columns[i]);
    if (columns[i + 1]) group.appendChild(columns[i + 1]);
  }

  const cols = Array.prototype.slice.call(document.querySelectorAll('.col'));
  const groups = Array.prototype.slice.call(document.querySelectorAll('.col-group'));
  const activeGroups = groups.filter(function (group) {
    return getComputedStyle(group).display !== 'contents';
  });

  return {
    grid,
    cols,
    groups,
    scrollCols: activeGroups.length ? activeGroups : cols,
  };
}
