import sortTable from '../../scripts/utilities/tables.js';

const limit = 20;
fetch('/api/admin/leaderboard?' + new URLSearchParams({ limit }))
  .then(res => res.json())
  .then(data => data.data)
  .then(data => {
    document.getElementById('spinner').classList.add('d-none');
    const table = document.getElementById('leaderboard');
    data.forEach((document, index) => {
      const row = table.insertRow(-1);
      row.insertCell(-1).textContent = index + 1;
      row.insertCell(-1).textContent = document.username;
      row.insertCell(-1).textContent = document.tossupCount;
      row.insertCell(-1).textContent = document.bonusCount;
      row.insertCell(-1).textContent = document.total;
    });
  });

document.querySelectorAll('th').forEach((th, index) => {
  const numeric = [true, false, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'leaderboard', 0, 0));
});
