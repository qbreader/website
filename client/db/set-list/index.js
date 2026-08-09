let sets = [];
let sortKey = null;
let sortAscending = true;

function renderTable () {
  const table = document.getElementById('set-metadata-list');
  table.textContent = '';
  sets.forEach(({ _id, setName, difficulty, standard, packetsCount, tossupsCount, bonusesCount }) => {
    const row = table.insertRow(-1);
    const a = document.createElement('a');
    a.href = `../set/?_id=${_id}`;
    a.textContent = setName;
    row.insertCell(-1).appendChild(a);
    row.insertCell(-1).textContent = difficulty;
    row.insertCell(-1).textContent = standard;
    row.insertCell(-1).textContent = packetsCount ?? '-';
    row.insertCell(-1).textContent = tossupsCount ?? '-';
    row.insertCell(-1).textContent = bonusesCount ?? '-';
  });
}

function updateSortIcons () {
  document.querySelectorAll('th[data-sort-key]').forEach(th => {
    const icon = th.querySelector('i.bi');
    if (th.dataset.sortKey !== sortKey) {
      icon.className = 'bi bi-arrow-down-up text-muted';
    } else {
      icon.className = sortAscending ? 'bi bi-caret-up-fill' : 'bi bi-caret-down-fill';
    }
  });
}

function compareRows (a, b, key) {
  const valueA = a[key];
  const valueB = b[key];
  if (valueA == null && valueB == null) return 0;
  if (valueA == null) return -1;
  if (valueB == null) return 1;
  if (typeof valueA === 'string') return valueA.localeCompare(valueB);
  if (valueA < valueB) return -1;
  if (valueA > valueB) return 1;
  return 0;
}

function sortByKey (key) {
  sortAscending = sortKey === key ? !sortAscending : true;
  sortKey = key;
  sets.sort((a, b) => compareRows(a, b, key) * (sortAscending ? 1 : -1));
  renderTable();
  updateSortIcons();
}

document.querySelectorAll('th[data-sort-key]').forEach(th => {
  th.addEventListener('click', () => sortByKey(th.dataset.sortKey));
});
updateSortIcons();

await fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: false }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    sets = data;
    renderTable();
  });

fetch('/api/db-explorer/set-metadata?' + new URLSearchParams({ includeCounts: true }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const countsById = new Map(data.map(set => [set._id, set]));
    sets.forEach(set => {
      const counts = countsById.get(set._id);
      if (!counts) return;
      set.packetsCount = counts.packetsCount;
      set.tossupsCount = counts.tossupsCount;
      set.bonusesCount = counts.bonusesCount;
    });
    if (['packetsCount', 'tossupsCount', 'bonusesCount'].includes(sortKey)) {
      sets.sort((a, b) => compareRows(a, b, sortKey) * (sortAscending ? 1 : -1));
    }
    renderTable();
  });
