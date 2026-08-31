import sortTable from '../../scripts/utilities/tables.js';

const isNumericColumn = [false, true, false, true, true, true];
const COUNT_COLUMNS = [3, 4, 5];
const COUNT_PLACEHOLDER = '-';

const table = document.getElementById('set-metadata-list');
const headerCells = Array.from(table.closest('table').querySelectorAll('thead th'));

// The counts arrive from a second, much slower request. Until they do, their
// cells hold placeholders, so sorting by them would silently do nothing.
let countsLoaded = false;

function isSortable (index) {
  return countsLoaded || !COUNT_COLUMNS.includes(index);
}

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

function enableCountSorting () {
  countsLoaded = true;
  for (const index of COUNT_COLUMNS) {
    headerCells[index].classList.replace('text-body-tertiary', 'clickable');
  }
}

headerCells.forEach((th, index) => {
  th.addEventListener('click', () => {
    if (!isSortable(index)) { return; }
    sortTable(index, isNumericColumn[index], 'set-metadata-list', 0, 0);
    updateSortIndicators();
  });
});

await fetch('/api/set-list?' + new URLSearchParams({ expand: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    setList.forEach(({ _id, setName, difficulty, standard }) => {
      const row = table.insertRow(-1);
      row.dataset.setId = _id;
      const a = document.createElement('a');
      a.href = `../set/?_id=${_id}`;
      a.textContent = setName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = difficulty;
      row.insertCell(-1).textContent = standard;
      row.insertCell(-1).textContent = COUNT_PLACEHOLDER;
      row.insertCell(-1).textContent = COUNT_PLACEHOLDER;
      row.insertCell(-1).textContent = COUNT_PLACEHOLDER;
    });
  });

fetch('/api/set-list?' + new URLSearchParams({ expand: true, includeCounts: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    // Look rows up by set id instead of index: the user may have sorted the
    // table while this request was in flight, which reorders the rows.
    const rowsBySetId = new Map(Array.from(table.rows).map(row => [row.dataset.setId, row]));
    for (const { _id, packetsCount, tossupsCount, bonusesCount } of setList) {
      const row = rowsBySetId.get(_id);
      if (!row) { continue; }
      row.cells[3].textContent = packetsCount;
      row.cells[4].textContent = tossupsCount;
      row.cells[5].textContent = bonusesCount;
    }
    enableCountSorting();
  })
  .catch(error => {
    // Leave the placeholders and the columns unsortable rather than offering a
    // sort over data that never arrived.
    console.error('Could not load set counts:', error);
  });
