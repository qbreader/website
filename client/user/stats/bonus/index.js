import { downloadAsFile } from '../../../scripts/download.js';
import { attachDropdownChecklist, getDropdownValues } from '../../../scripts/utilities/dropdown-checklist.js';
import sortTable from '../../../scripts/utilities/tables.js';

async function fetchBonusStats ({ difficulties = '', setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
  const data = await fetch('/auth/user-stats/bonus?' + new URLSearchParams({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }))
    .then(response => {
      if (response.status === 401) { throw new Error('Unauthenticated'); }
      return response;
    }).then(response => response.json());

  for (const type of ['set', 'category', 'subcategory', 'alternate-subcategory']) {
    let innerHTML = '';
    const totalStats = {};
    data[`${type}-stats`].forEach(stat => {
      innerHTML += `
        <tr>
            <th scope="row">${stat._id}</th>
            <td>${stat.count}</td>
            <td>${stat['30s']}</td>
            <td>${stat['20s']}</td>
            <td>${stat['10s']}</td>
            <td>${stat['0s']}</td>
            <td>${stat.totalPoints}</td>
            <td>${stat.ppb.toFixed(2)}</td>
        </tr>
      `;

      Object.keys(stat).forEach(key => {
        if (['_id', 'ppb'].includes(key)) { return; }

        if (totalStats[key]) {
          totalStats[key] += stat[key];
        } else {
          totalStats[key] = stat[key];
        }
      });
    });
    document.getElementById(`${type}-stats-body`).innerHTML = innerHTML;

    totalStats.ppb = totalStats.count > 0 ? totalStats.totalPoints / totalStats.count : 0;
    document.getElementById(`${type}-stats-foot`).innerHTML = `
      <tr>
          <th scope="col">Total</th>
          <th scope="col">${totalStats.count ?? 0}</th>
          <th scope="col">${totalStats['30s'] ?? 0}</th>
          <th scope="col">${totalStats['20s'] ?? 0}</th>
          <th scope="col">${totalStats['10s'] ?? 0}</th>
          <th scope="col">${totalStats['0s'] ?? 0}</th>
          <th scope="col">${totalStats.totalPoints ?? 0}</th>
          <th scope="col">${totalStats.ppb.toFixed(2)}</th>
      </tr>
    `;
  }
}

document.getElementById('form').addEventListener('submit', event => {
  event.preventDefault();
  const setName = document.getElementById('set-name').value;
  const difficulties = getDropdownValues('difficulties');
  // const includeMultiplayer = document.getElementById('include-multiplayer').checked;
  // const includeSingleplayer = document.getElementById('include-singleplayer').checked;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  fetchBonusStats({ difficulties, setName, startDate, endDate });
});

attachDropdownChecklist();
fetchBonusStats();

const isNumericColumn = [false, true, true, true, true, true, true, true];

document.getElementById('set-stats').querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, isNumericColumn[index], 'set-stats-body', 0, 0));
});

document.getElementById('category-stats').querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, isNumericColumn[index], 'category-stats-body', 0, 0));
});

document.getElementById('subcategory-stats').querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, isNumericColumn[index], 'subcategory-stats-body', 0, 0));
});

document.getElementById('alternate-subcategory-stats').querySelectorAll('th').forEach((th, index) => {
  th.addEventListener('click', () => sortTable(index, isNumericColumn[index], 'alternate-subcategory-stats-body', 0, 0));
});

let csvData = '';
document.getElementById('download-stats-csv').addEventListener('click', async function () {
  if (csvData !== '') { return downloadAsFile('bonus-stats.csv', csvData); }

  this.textContent = 'Downloading...';
  this.classList.remove('clickable');

  const stats = await fetch('/auth/user-stats/bonus/all').then(response => response.json());
  const header = ['created', 'bonus._id', 'set._id', 'difficulty', 'category', 'subcategory', 'alternate_subcategory', 'multiplayer', 'part1', 'part2', 'part3'];

  csvData = header.join(',') + '\n';
  csvData += stats.map(row => row.join(',')).join('\n');
  downloadAsFile('bonus-stats.csv', csvData);

  this.classList.add('clickable');
  this.textContent = 'CSV';
});
