const searchInput = document.getElementById('set-name-search');
const initialSearchQuery = new URLSearchParams(window.location.search).get('q') || '';
searchInput.value = initialSearchQuery;

function getSearchQueryTokens (searchQuery) {
  return searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
}

function rowMatchesSearchQuery (row, searchQuery) {
  const setName = row.dataset.setName.toLowerCase();
  const searchTokens = getSearchQueryTokens(searchQuery);
  return searchTokens.every(token => setName.includes(token));
}

function applySetNameFilter (searchQuery) {
  const tableRows = document.getElementById('set-metadata-list').rows;
  for (const row of tableRows) {
    row.classList.toggle('d-none', !rowMatchesSearchQuery(row, searchQuery));
  }
}

function updateSearchQueryInUrl (searchQuery) {
  const url = new URL(window.location.href);
  const normalizedSearchQuery = searchQuery.trim().replace(/\s+/g, ' ');
  if (normalizedSearchQuery === '') {
    url.searchParams.delete('q');
  } else {
    url.searchParams.set('q', normalizedSearchQuery);
  }
  window.history.replaceState({}, '', url);
}

searchInput.addEventListener('input', event => {
  const searchQuery = event.target.value;
  applySetNameFilter(searchQuery);
  updateSearchQueryInUrl(searchQuery);
});

await fetch('/api/set-list?' + new URLSearchParams({ expand: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    setList.forEach(({ _id, setName, difficulty, standard }) => {
      const row = table.insertRow(-1);
      row.dataset.setName = setName;
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
    applySetNameFilter(searchInput.value);
  });

fetch('/api/set-list?' + new URLSearchParams({ expand: true, includeCounts: true }))
  .then(res => res.json())
  .then(({ setList }) => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('set-metadata-list');
    const rows = table.rows;
    for (let i = 0; i < setList.length; i++) {
      rows[i].cells[3].textContent = setList[i].packetsCount;
      rows[i].cells[4].textContent = setList[i].tossupsCount;
      rows[i].cells[5].textContent = setList[i].bonusesCount;
    }
  });
