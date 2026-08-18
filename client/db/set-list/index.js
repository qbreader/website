import sortTable from '../../scripts/utilities/tables.js';

const isNumericColumn = [false, true, false, true, true, true];

document.querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, isNumericColumn[index], 'set-metadata-list', 0, 0));
});

await fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: false }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    data.forEach(({ _id, setName, difficulty, standard }) => {
      const row = table.insertRow(-1);
      row.dataset.setId = _id;
      const a = document.createElement('a');
      a.href = `../set/?_id=${_id}`;
      a.textContent = setName;
      row.insertCell(-1).appendChild(a);
      row.insertCell(-1).textContent = difficulty;
      row.insertCell(-1).textContent = standard;
      row.insertCell(-1).textContent = '-';
      row.insertCell(-1).textContent = '-';
      row.insertCell(-1).textContent = '-';
    });
  });

fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: true }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    // Look rows up by set id instead of index: the user may have sorted the
    // table while this request was in flight, which reorders the rows.
    const rowsBySetId = new Map(Array.from(table.rows).map(row => [row.dataset.setId, row]));
    for (const { _id, packetsCount, tossupsCount, bonusesCount } of data) {
      const row = rowsBySetId.get(_id);
      if (!row) { continue; }
      row.cells[3].textContent = packetsCount;
      row.cells[4].textContent = tossupsCount;
      row.cells[5].textContent = bonusesCount;
    }
  });
