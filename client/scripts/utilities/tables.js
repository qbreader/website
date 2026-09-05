// Set names contain years and edition numbers, so compare them naturally
// ("Set 9" before "Set 10") and case-insensitively.
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

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

  const ascending = !(table.dataset.sortColumn === String(n) && table.dataset.sortAscending === 'true');
  const keyed = body.map(row => ({ row, key: sortKey(row.cells[n], numeric) }));
  keyed.sort((a, b) => compareKeys(a.key, b.key, ascending));

  // Moving the rows through a fragment detaches and reinserts each row once,
  // instead of reflowing the table on every individual swap. Insert relative to
  // the rows' own parent: when `tableId` names a <table>, its rows actually live
  // in a <tbody>, so the table itself is the wrong node to insert into.
  const parent = body[0].parentNode;
  const footer = rows[rows.length - footers];
  const fragment = document.createDocumentFragment();
  for (const { row } of keyed) { fragment.appendChild(row); }
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
