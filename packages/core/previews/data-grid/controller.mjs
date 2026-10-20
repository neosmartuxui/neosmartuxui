export function applyPreviewState({ root, state, helpers }) {
  const grid = root.querySelector('#data-grid-demo');
  if (!grid) throw new TypeError('core.data-grid preview requires #data-grid-demo');

  if (state === 'selected') {
    const cell = grid.querySelector('#data-grid-r2c2');
    if (!cell) throw new TypeError('core.data-grid selected preview target is missing.');
    helpers.setDataGridSelection(grid, cell, true);
    return;
  }
  if (state === 'editing') {
    const cell = grid.querySelector('#data-grid-r1c4');
    if (!cell) throw new TypeError('core.data-grid editing preview target is missing.');
    helpers.enterDataGridEditing(grid, cell);
    return;
  }
  throw new Error(`core.data-grid preview cannot realize controller state ${state}`);
}
