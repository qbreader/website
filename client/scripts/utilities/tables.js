/**
 * collator.compare('Set 9', 'Set 10'); // -1
 * collator.compare('science', 'Science'); // 0
 */
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const originalRows = new WeakMap();

/**
 * Sorts a table by the values in a specified column.
 *
 * The first click on a column sorts it ascending; clicking the same column
 * again reverses it. The active column and direction are recorded on the sorted
 * element as `data-sort-column` and `data-sort-ascending`, so callers can render
 * their own header indicators without tracking the state themselves.
 *
 * Cells with nothing to sort by - blank text, or text that isn't a number in a
 * numeric column - always sort to the bottom, in both directions.
 *
 * @param {number} n - a zero-indexed column number to sort
 * @param {boolean} numeric - whether the column values represent numeric values
 * @param {string} tableId - the id of the table or table section to sort
 * @param {number} headers - the number of headers of the table to skip (default 1)
 * @param {number} footers - the number of footers of the table to skip (default 0)
 */
export default function sortTable (n, numeric = false, tableId = 'table', headers = 1, footers = 0) {
  const table = document.getElementById(tableId);
  if (table === null) { return; }

  const rows = Array.from(table.rows);
  const body = rows.slice(headers, rows.length - footers);
  if (body.length < 2) { return; }

  const previousColumn = table.dataset.sortColumn;
  const previousAscending = table.dataset.sortAscending === 'true';
  const savedRows = originalRows.get(table);
  if (!savedRows || savedRows.length !== body.length || savedRows.some(row => !body.includes(row))) {
    originalRows.set(table, body.slice());
    delete table.dataset.sortColumn;
    delete table.dataset.sortAscending;
  }

  // clicking on a column sorted in descending order restores the table to its original
  if (previousColumn === String(n) && !previousAscending) {
    const parent = body[0].parentNode;
    const fragment = document.createDocumentFragment();
    for (const row of originalRows.get(table)) { fragment.appendChild(row); }
    const footer = rows[rows.length - footers];
    parent.insertBefore(fragment, footer && footer.parentNode === parent ? footer : null);
    delete table.dataset.sortColumn;
    delete table.dataset.sortAscending;
    return;
  }

  const ascending = !(previousColumn === String(n) && previousAscending);
  const keyed = body.map(row => ({ row, key: sortKey(row.cells[n], numeric) }));
  keyed.sort((a, b) => compareKeys(a.key, b.key, ascending));

  // Insert into fragment to avoid multiple reflows
  const parent = body[0].parentNode;
  const footer = rows[rows.length - footers];
  const fragment = document.createDocumentFragment();
  for (const { row } of keyed) { fragment.appendChild(row); }
  // If the table has a footer, insert before it; otherwise, append to the end of the parent.
  parent.insertBefore(fragment, footer && footer.parentNode === parent ? footer : null);

  table.dataset.sortColumn = n;
  table.dataset.sortAscending = ascending;
}

/**
 * Reads the value a row should be sorted by.
 * @param {HTMLTableCellElement} [cell] - the cell to read, if the row has one
 * @param {boolean} numeric - whether the column values represent numeric values
 * @returns {number | string | null} null if the cell has nothing to sort by
 */
function sortKey (cell, numeric) {
  const text = cell ? cell.textContent.trim() : '';
  if (text === '') { return null; }
  if (!numeric) { return text; }
  const value = parseFloat(text);
  return isNaN(value) ? null : value;
}

/**
 * @param {number | string | null} a
 * @param {number | string | null} b
 * @param {boolean} ascending
 * @returns {number}
 */
function compareKeys (a, b, ascending) {
  // Rows with nothing to sort by sink to the bottom either way, so that
  // placeholders and blanks never interleave with real data.
  if (a === null && b === null) { return 0; }
  if (a === null) { return 1; }
  if (b === null) { return -1; }

  const order = typeof a === 'number' ? a - b : collator.compare(a, b);
  return ascending ? order : -order;
}

export function attachTableEventListeners ({ tableId, isNumericColumn, headers, footers, isSortable = () => true }) {
  const table = document.getElementById(tableId);
  const headerCells = Array.from(table.closest('table').querySelectorAll('thead th'));

  function updateSortIndicators () {
    const sortedColumn = table.dataset.sortColumn;
    const ascending = table.dataset.sortAscending === 'true';
    headerCells.forEach((th, index) => {
      const indicator = th.querySelector('.sort-indicator');
      if (String(index) === sortedColumn) {
        th.setAttribute('aria-sort', ascending ? 'ascending' : 'descending');
        indicator.className = `sort-indicator bi bi-caret-${ascending ? 'up' : 'down'}-fill`;
      } else {
        th.setAttribute('aria-sort', 'none');
        indicator.className = 'sort-indicator';
      }
    });
  }

  headerCells.forEach((th, index) => {
    th.addEventListener('click', () => {
      if (!isSortable(index)) { return; }
      sortTable(index, isNumericColumn[index], tableId, headers, footers);
      updateSortIndicators();
    });
  });
}
