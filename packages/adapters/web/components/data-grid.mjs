const controllers = new WeakMap();

const isHTMLElement = (value) => value && value instanceof value.ownerDocument.defaultView.HTMLElement;
const gridCells = (root) => [...root.querySelectorAll('[role="gridcell"][data-grid-cell]')];
const coordinate = (cell) => ({
  row: Number(cell.dataset.rowIndex),
  col: Number(cell.dataset.colIndex)
});
const keyFor = (row, col) => `${row}:${col}`;

const assertDataGrid = (root) => {
  if (!isHTMLElement(root) || root.getAttribute('role') !== 'grid') {
    throw new TypeError('core.data-grid web adapter requires a real HTMLElement role="grid" root.');
  }
  if (!root.getAttribute('aria-label') && !root.getAttribute('aria-labelledby')) {
    throw new TypeError('core.data-grid requires an explicit accessible name.');
  }
  const rows = [...root.querySelectorAll(':scope > [role="row"]')];
  if (rows.length < 2) throw new TypeError('core.data-grid requires one header row and at least one data row.');
  const headers = [...rows[0].querySelectorAll('[role="columnheader"]')];
  if (!headers.length) throw new TypeError('core.data-grid requires role="columnheader" cells.');
  const cells = gridCells(root);
  if (!cells.length) throw new TypeError('core.data-grid requires navigable role="gridcell" data cells.');

  const coordinates = new Map();
  for (const cell of cells) {
    const { row, col } = coordinate(cell);
    if (!Number.isInteger(row) || row < 1 || !Number.isInteger(col) || col < 1) {
      throw new TypeError('core.data-grid cells require positive integer data-row-index/data-col-index coordinates.');
    }
    const key = keyFor(row, col);
    if (coordinates.has(key)) throw new TypeError('core.data-grid cell coordinates must be unique.');
    coordinates.set(key, cell);
    const tabindex = cell.getAttribute('tabindex');
    if (tabindex !== '0' && tabindex !== '-1') throw new TypeError('core.data-grid cells require tabindex="0" or "-1".');
    if (cell.hasAttribute('aria-selected') && !['true','false'].includes(cell.getAttribute('aria-selected'))) {
      throw new TypeError('core.data-grid aria-selected values must be boolean strings.');
    }
    if (cell.dataset.editable === 'true') {
      const editors = cell.querySelectorAll('[data-grid-editor]');
      if (editors.length !== 1 || editors[0].tagName !== 'INPUT') {
        throw new TypeError('core.data-grid editable cells require exactly one native input[data-grid-editor].');
      }
    }
  }

  if (cells.filter((cell) => cell.tabIndex === 0).length !== 1) {
    throw new TypeError('core.data-grid navigation mode requires exactly one roving tabindex="0" cell.');
  }
  if (cells.filter((cell) => cell.getAttribute('aria-selected') === 'true').length > 1) {
    throw new TypeError('core.data-grid first slice allows at most one selected cell.');
  }
  return { root, rows, headers, cells, coordinates };
};

const selectedCell = (parts) => parts.cells.find((cell) => cell.getAttribute('aria-selected') === 'true') ?? null;

const setActiveCell = (parts, cell, { focus = true } = {}) => {
  if (!cell || !parts.cells.includes(cell)) return null;
  for (const candidate of parts.cells) candidate.tabIndex = candidate === cell ? 0 : -1;
  parts.root.dataset.activeCell = cell.id || keyFor(coordinate(cell).row, coordinate(cell).col);
  if (focus) cell.focus({ preventScroll: true });
  return cell;
};

const cellAt = (parts, row, col) => parts.coordinates.get(keyFor(row, col)) ?? null;
const rowCells = (parts, row) => parts.cells.filter((cell) => coordinate(cell).row === row).sort((a,b) => coordinate(a).col - coordinate(b).col);

const setSelectedCell = (parts, cell) => {
  if (parts.root.dataset.selectionEnabled !== 'true' || cell?.dataset.selectable === 'false') return false;
  const wasSelected = cell.getAttribute('aria-selected') === 'true';
  for (const candidate of parts.cells) {
    if (candidate.hasAttribute('aria-selected')) candidate.setAttribute('aria-selected', 'false');
  }
  if (!wasSelected) cell.setAttribute('aria-selected', 'true');
  parts.root.dataset.selectedCell = !wasSelected ? (cell.id || keyFor(coordinate(cell).row, coordinate(cell).col)) : '';
  parts.root.dataset.state = !wasSelected ? 'selected' : 'rest';
  return !wasSelected;
};

const editorFor = (cell) => cell?.querySelector('[data-grid-editor]') ?? null;

const exitEditing = (parts, cell, { reason = 'cancel', restoreFocus = true } = {}) => {
  const editor = editorFor(cell);
  if (!editor || cell.dataset.editing !== 'true') return;
  cell.dataset.editing = 'false';
  cell.dataset.state = cell.getAttribute('aria-selected') === 'true' ? 'selected' : 'rest';
  editor.tabIndex = -1;
  editor.hidden = true;
  setActiveCell(parts, cell, { focus: restoreFocus });
  parts.root.dataset.editingCell = '';
  parts.root.dataset.state = selectedCell(parts) ? 'selected' : 'rest';
  cell.dispatchEvent(new cell.ownerDocument.defaultView.CustomEvent('neosmartui:data-grid-edit-exit', {
    bubbles: true,
    detail: { reason, cellId: cell.id || null, value: editor.value }
  }));
};

const enterEditing = (parts, cell) => {
  if (!cell || cell.dataset.editable !== 'true') return false;
  const editor = editorFor(cell);
  if (!editor) return false;
  for (const candidate of parts.cells) {
    const candidateEditor = editorFor(candidate);
    if (candidate !== cell && candidate.dataset.editing === 'true') exitEditing(parts, candidate, { reason: 'switch', restoreFocus: false });
    candidate.tabIndex = -1;
    if (candidateEditor && candidate !== cell) {
      candidateEditor.tabIndex = -1;
      candidateEditor.hidden = true;
    }
  }
  cell.dataset.editing = 'true';
  cell.dataset.state = 'editing';
  editor.hidden = false;
  editor.tabIndex = 0;
  parts.root.dataset.editingCell = cell.id || keyFor(coordinate(cell).row, coordinate(cell).col);
  parts.root.dataset.state = 'editing';
  editor.focus({ preventScroll: true });
  editor.select?.();
  return true;
};

export function setDataGridSelection(root, cell, selected = true) {
  const parts = assertDataGrid(root);
  if (!cell || !parts.cells.includes(cell)) throw new TypeError('core.data-grid selection helper requires an owned gridcell.');
  const isSelected = cell.getAttribute('aria-selected') === 'true';
  if (Boolean(selected) === isSelected) return isSelected;
  return setSelectedCell(parts, cell);
}

export function enterDataGridEditing(root, cell) {
  const parts = assertDataGrid(root);
  if (!cell || !parts.cells.includes(cell)) throw new TypeError('core.data-grid edit helper requires an owned gridcell.');
  return enterEditing(parts, cell);
}

export function syncDataGridState(root) {
  const parts = assertDataGrid(root);
  const active = parts.cells.find((cell) => cell.tabIndex === 0) ?? parts.cells[0];
  setActiveCell(parts, active, { focus: false });
  const selected = selectedCell(parts);
  parts.root.dataset.selectedCell = selected ? (selected.id || keyFor(coordinate(selected).row, coordinate(selected).col)) : '';
  const editing = parts.cells.find((cell) => cell.dataset.editing === 'true') ?? null;
  parts.root.dataset.editingCell = editing ? (editing.id || keyFor(coordinate(editing).row, coordinate(editing).col)) : '';
  parts.root.dataset.state = editing ? 'editing' : selected ? 'selected' : 'rest';
  for (const cell of parts.cells) {
    const editor = editorFor(cell);
    if (!editor) continue;
    const isEditing = cell === editing;
    editor.hidden = !isEditing;
    editor.tabIndex = isEditing ? 0 : -1;
  }
  return {
    activeCell: parts.root.dataset.activeCell,
    selectedCell: parts.root.dataset.selectedCell,
    editingCell: parts.root.dataset.editingCell
  };
}

export function bindDataGrid(root) {
  const parts = assertDataGrid(root);
  controllers.get(root)?.();
  syncDataGridState(root);

  const moveActive = (cell, key, ctrlKey) => {
    const { row, col } = coordinate(cell);
    if (ctrlKey && key === 'Home') return parts.cells[0] ?? cell;
    if (ctrlKey && key === 'End') return parts.cells.at(-1) ?? cell;
    if (key === 'Home') return rowCells(parts, row)[0] ?? cell;
    if (key === 'End') return rowCells(parts, row).at(-1) ?? cell;
    if (key === 'ArrowUp') return cellAt(parts, row - 1, col) ?? cell;
    if (key === 'ArrowDown') return cellAt(parts, row + 1, col) ?? cell;
    const rtl = getComputedStyle(root).direction === 'rtl';
    if (key === 'ArrowRight') return cellAt(parts, row, col + (rtl ? -1 : 1)) ?? cell;
    if (key === 'ArrowLeft') return cellAt(parts, row, col + (rtl ? 1 : -1)) ?? cell;
    return cell;
  };

  const onKeyDown = (event) => {
    if (event.target.closest?.('[data-grid-editor]')) return;
    const cell = event.target.closest?.('[role="gridcell"][data-grid-cell]');
    if (!cell || !root.contains(cell) || cell.dataset.editing === 'true') return;

    if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown','Home','End'].includes(event.key)) {
      event.preventDefault();
      setActiveCell(parts, moveActive(cell, event.key, event.ctrlKey || event.metaKey));
      return;
    }
    if (event.key === ' ' && root.dataset.selectionEnabled === 'true' && cell.dataset.selectable !== 'false') {
      event.preventDefault();
      setSelectedCell(parts, cell);
      return;
    }
    if ((event.key === 'Enter' || event.key === 'F2') && cell.dataset.editable === 'true') {
      event.preventDefault();
      enterEditing(parts, cell);
    }
  };

  const onClick = (event) => {
    const cell = event.target.closest?.('[role="gridcell"][data-grid-cell]');
    if (!cell || !root.contains(cell) || event.target.closest('[data-grid-editor]')) return;
    setActiveCell(parts, cell);
  };

  const onEditorKeyDown = (event) => {
    const editor = event.target.closest?.('[data-grid-editor]');
    if (!editor || !root.contains(editor)) return;
    const cell = editor.closest('[role="gridcell"][data-grid-cell]');
    if (!cell || cell.dataset.editing !== 'true') return;
    if (event.key === 'Escape') {
      event.preventDefault();
      exitEditing(parts, cell, { reason: 'cancel', restoreFocus: true });
      return;
    }
    if (event.key === 'Enter' && !event.isComposing) {
      event.preventDefault();
      exitEditing(parts, cell, { reason: 'commit', restoreFocus: true });
      return;
    }
    if (event.key === 'Tab') {
      setTimeout(() => exitEditing(parts, cell, { reason: 'tab', restoreFocus: false }), 0);
    }
  };

  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('click', onClick);
  root.addEventListener('keydown', onEditorKeyDown, true);

  const dispose = () => {
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('click', onClick);
    root.removeEventListener('keydown', onEditorKeyDown, true);
    if (controllers.get(root) === dispose) controllers.delete(root);
  };
  controllers.set(root, dispose);
  return dispose;
}
