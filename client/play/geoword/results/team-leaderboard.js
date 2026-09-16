import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { kebabCase, titleCase } from '../../../../shared/string-utils.js';
import sortTable from '../../../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('back-link').href = `./?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/team-leaderboard?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { teamLeaderboard } = data;

    const divs = createTabs({ tabNames: Object.keys(teamLeaderboard) });

    for (const division of Object.keys(teamLeaderboard)) {
      const kebabed = kebabCase(division);
      const table = document.createElement('table');
      table.className = 'table table-hover';
      table.id = `${kebabed}-table`;
      const thead = table.createTHead();
      const theadRow = thead.insertRow();
      const labels = ['#', 'Team', 'Players', 'Celerity', 'Correct', 'TUH', 'Points', 'PPTU'];
      const numeric = [true, false, true, true, true, true, true, true];
      for (const index in labels) {
        const label = labels[index];
        const cell = document.createElement('th');
        cell.textContent = label;
        cell.scope = 'col';
        cell.addEventListener('click', () => sortTable(index, numeric[index], table.id, 1, 0));
        theadRow.appendChild(cell);
      }
      const tbody = table.createTBody();
      for (const index in teamLeaderboard[division]) {
        const { teamName, memberCount, numberCorrect, points, pointsPerTossup, tossupsHeard, averageCorrectCelerity } = teamLeaderboard[division][index];

        const row = tbody.insertRow();
        row.insertCell().textContent = parseInt(index) + 1;
        row.insertCell().textContent = teamName;
        row.insertCell().textContent = memberCount;
        row.insertCell().textContent = (averageCorrectCelerity ?? 0.0).toFixed(3);
        row.insertCell().textContent = numberCorrect;
        row.insertCell().textContent = tossupsHeard;
        row.insertCell().textContent = points;
        row.insertCell().textContent = (pointsPerTossup ?? 0.0).toFixed(2);
      }
      divs[division].appendChild(table);
    }
  });
