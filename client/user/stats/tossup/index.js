import tossupToHtml from './tossup-to-html.js';
import { downloadAsFile } from '../../../scripts/download.js';
import { attachDropdownChecklist, getDropdownValues } from '../../../scripts/utilities/dropdown-checklist.js';
import sortTable from '../../../scripts/utilities/tables.js';
import insertTokensIntoHTML from '../../../../quizbowl/insert-tokens-into-html.js';

async function fetchTossupStats ({ difficulties = '', setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
  const params = { difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate };
  const data = await fetch('/auth/user-stats/tossup?' + new URLSearchParams(params))
    .then(response => {
      if (response.status === 401) { throw new Error('Unauthenticated'); }
      return response;
    }).then(response => response.json());

  const bestBuzz = data['best-buzz'];
  if (!bestBuzz?.tossup) {
    document.getElementById('best-buzz').textContent = '';
  } else {
    const tossup = bestBuzz.tossup;
    const buzzPoint = Math.floor((1 - bestBuzz.celerity) * tossup.question.length);
    tossup.question = insertTokensIntoHTML(
      tossup.question,
      tossup.question_sanitized,
      { ' <span class="text-highlight">(#)</span> ': [buzzPoint] }
    );
    document.getElementById('best-buzz').innerHTML = `
      <div>Celerity: ${bestBuzz.celerity}</div>
      <div>Date Played: ${new Date(bestBuzz.created).toLocaleString()}</div>
      <div>Multiplayer: ${bestBuzz.multiplayer}</div>
      <p>Points: ${bestBuzz.pointValue}</p>
      ${tossupToHtml(tossup)}
    `;
  }

  for (const type of ['set', 'category', 'subcategory', 'alternate-subcategory']) {
    let innerHTML = '';
    const totalStats = {};
    data[`${type}-stats`].forEach(stat => {
      const averageCelerity = stat.numCorrect > 0 ? (stat.totalCorrectCelerity / stat.numCorrect) : 0;
      innerHTML += `
        <tr>
          <th scope="row">${stat._id}</th>
          <td>${stat.count}</td>
          <td>${stat['15s']}</td>
          <td>${stat['10s']}</td>
          <td>${stat['-5s']}</td>
          <td>${averageCelerity.toFixed(3)}</td>
          <td>${stat.totalPoints}</td>
          <td>${stat.pptu.toFixed(2)}</td>
        </tr>
      `;

      Object.keys(stat).forEach(key => {
        if (['_id', 'pptu'].includes(key)) { return; }

        if (totalStats[key]) {
          totalStats[key] += stat[key];
        } else {
          totalStats[key] = stat[key];
        }
      });
    });
    document.getElementById(`${type}-stats-body`).innerHTML = innerHTML;

    totalStats.pptu = totalStats.count > 0 ? totalStats.totalPoints / totalStats.count : 0;
    totalStats.averageCelerity = totalStats.numCorrect > 0 ? (totalStats.totalCorrectCelerity / totalStats.numCorrect) : 0;
    document.getElementById(`${type}-stats-foot`).innerHTML = `
      <tr>
        <th scope="col">Total</th>
        <th scope="col">${totalStats.count ?? 0}</th>
        <th scope="col">${totalStats['15s'] ?? 0}</th>
        <th scope="col">${totalStats['10s'] ?? 0}</th>
        <th scope="col">${totalStats['-5s'] ?? 0}</th>
        <th scope="col">${totalStats.averageCelerity.toFixed(3)}</th>
        <th scope="col">${totalStats.totalPoints ?? 0}</th>
        <th scope="col">${totalStats.pptu.toFixed(2)}</th>
      </tr>
    `;
  }
}

document.getElementById('form').addEventListener('submit', event => {
  event.preventDefault();
  const setName = document.getElementById('set-name').value;
  const difficulties = getDropdownValues('difficulties');
  const includeMultiplayer = document.getElementById('include-multiplayer').checked;
  const includeSingleplayer = document.getElementById('include-singleplayer').checked;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  fetchTossupStats({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
});

attachDropdownChecklist();
fetchTossupStats();

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
  if (csvData !== '') { return downloadAsFile('tossup-stats.csv', csvData); }

  this.textContent = 'Downloading...';
  this.classList.remove('clickable');

  const stats = await fetch('/auth/user-stats/tossup/all').then(response => response.json());
  const header = ['created', 'tossup._id', 'set._id', 'difficulty', 'category', 'subcategory', 'alternate_subcategory', 'multiplayer', 'celerity', 'pointValue'];

  csvData = header.join(',') + '\n';
  csvData += stats.map(row => row.join(',')).join('\n');
  downloadAsFile('tossup-stats.csv', csvData);

  this.classList.add('clickable');
  this.textContent = 'CSV';
});
