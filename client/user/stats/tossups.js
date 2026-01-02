import { attachDropdownChecklist, getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import sortTable from '../../scripts/utilities/tables.js';

function fetchTossupStats ({ difficulties = '', setName = '', includeMultiplayer = true, includeSingleplayer = true, startDate = '', endDate = '' } = {}) {
  fetch('/auth/user-stats/tossup?' + new URLSearchParams({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate }))
    .then(response => {
      if (response.status === 401) {
        throw new Error('Unauthenticated');
      }
      return response;
    })
    .then(response => response.json())
    .then(data => {
      const bestBuzz = data['best-buzz'];
      if (bestBuzz && bestBuzz.tossup) {
        const tossup = bestBuzz.tossup;
        const buzzPoint = Math.floor((1 - bestBuzz.celerity) * tossup.question.length);
        tossup.question = `${tossup.question.slice(0, buzzPoint)} <span class="text-highlight">(#)</span> ${tossup.question.slice(buzzPoint)}`;
        document.getElementById('best-buzz').innerHTML = `
                    <p>Celerity: ${bestBuzz.celerity}</p>
                    <div class="card mb-2">
                        <div class="card-header">
                            <b>${tossup.set.name} | ${tossup.category} | ${tossup.subcategory} ${tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | ${tossup.difficulty}</b>
                            <b class="float-end">Packet ${tossup.packet.number} | Question ${tossup.number}</b>
                        </div>
                        <div class="card-container" id="question-${tossup._id}">
                            <div class="card-body">
                                <span>${tossup.question}</span>&nbsp;
                                <hr></hr>
                                <div><b>ANSWER:</b> ${tossup.answer}</div>
                            </div>
                            <div class="card-footer">
                                <small class="text-muted">${tossup.packet.name ? 'Packet ' + tossup.packet.name : '&nbsp;'}</small>
                                <small class="text-muted float-end">
                                    <a href="#" onClick={onClick} id="report-question-${tossup._id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">
                                        Report Question
                                    </a>
                                </small>
                            </div>
                        </div>
                    </div>
                `;
      } else {
        document.getElementById('best-buzz').textContent = '';
      }

      for (const type of ['set', 'category', 'subcategory', 'alternate-subcategory']) {
        if (!data[`${type}-stats`]) {
          continue;
        }

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
            if (['_id', 'pptu'].includes(key)) {
              return;
            }

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
    })
    .catch(error => {
      console.error('Error:', error);
    });
}

function onSubmit (event) {
  event.preventDefault();
  const setName = document.getElementById('set-name').value;
  const difficulties = getDropdownValues('difficulties');
  const includeMultiplayer = document.getElementById('include-multiplayer').checked;
  const includeSingleplayer = document.getElementById('include-singleplayer').checked;
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  fetchTossupStats({ difficulties, setName, includeMultiplayer, includeSingleplayer, startDate, endDate });
}

function downloadCSVData (data, filename) {
  const hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/csv;charset=utf-8,' + encodeURIComponent(data);
  hiddenElement.target = '_blank';
  hiddenElement.download = filename;
  hiddenElement.click();
}

document.getElementById('form').addEventListener('submit', onSubmit);

attachDropdownChecklist();
fetchTossupStats();

document.getElementById('set-stats').querySelectorAll('th').forEach((th, index) => {
  const numeric = [false, true, true, true, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'set-stats-body', 0, 0));
});

document.getElementById('category-stats').querySelectorAll('th').forEach((th, index) => {
  const numeric = [false, true, true, true, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'category-stats-body', 0, 0));
});

document.getElementById('subcategory-stats').querySelectorAll('th').forEach((th, index) => {
  const numeric = [false, true, true, true, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'subcategory-stats-body', 0, 0));
});

document.getElementById('alternate-subcategory-stats').querySelectorAll('th').forEach((th, index) => {
  const numeric = [false, true, true, true, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'alternate-subcategory-stats-body', 0, 0));
});

let csvData = '';
document.getElementById('download-stats-csv').addEventListener('click', async function () {
  if (csvData !== '') {
    downloadCSVData(csvData, 'tossup-stats.csv');
    return;
  }

  this.textContent = 'Downloading...';
  this.classList.remove('clickable');

  const stats = await fetch('/auth/user-stats/tossup/all').then(response => response.json());
  const header = [
    'created',
    'tossup._id',
    'set._id',
    'difficulty',
    'category',
    'subcategory',
    'alternate_subcategory',
    'multiplayer',
    'ceierity',
    'pointValue'
  ];

  csvData = header.join(',') + '\n';
  for (const row of stats) {
    csvData += row.join(',');
    csvData += '\n';
  }

  downloadCSVData(csvData, 'tossup-stats.csv');

  this.classList.add('clickable');
  this.textContent = 'CSV';
});
