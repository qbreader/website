import createTabs from '../../scripts/utilities/create-tabs.js';
import { titleCase, kebabCase } from '../../scripts/utilities/strings.js';
import sortTable from '../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/admin/geoword/leaderboard?' + new URLSearchParams({ packetName, includeInactive: true }))
  .then(response => response.json())
  .then(data => {
    const { leaderboard } = data;

    const divs = createTabs({ tabNames: Object.keys(leaderboard) });

    for (const division of Object.keys(leaderboard)) {
      const kebabed = kebabCase(division);
      const table = document.createElement('table');
      table.className = 'table table-hover';
      table.id = `${kebabed}-table`;
      const thead = table.createTHead();
      const theadRow = thead.insertRow();
      const labels = ['#', 'Username', 'Celerity', 'Correct', 'Points', 'PPTU'];
      const numeric = [true, false, true, true, true, true];

      for (const index in labels) {
        const label = labels[index];
        const cell = document.createElement('th');
        cell.textContent = label;
        cell.scope = 'col';
        cell.addEventListener('click', () => sortTable(index, numeric[index], table.id, 1, 0));
        theadRow.appendChild(cell);
      }

      const tbody = table.createTBody();
      let numberSkipped = 0;
      for (const index in leaderboard[division]) {
        const { active, username, numberCorrect, points, pointsPerTossup, averageCorrectCelerity } = leaderboard[division][index];

        const row = tbody.insertRow();
        row.insertCell().textContent = parseInt(index) + 1 - numberSkipped;
        row.insertCell().textContent = username;
        row.insertCell().textContent = (averageCorrectCelerity ?? 0.0).toFixed(3);
        row.insertCell().textContent = numberCorrect;
        row.insertCell().textContent = points;
        row.insertCell().textContent = (pointsPerTossup ?? 0.0).toFixed(2);

        if (!active) {
          row.className = 'table-info';
          numberSkipped++;
        }
      }
      divs[division].appendChild(table);
    }
  });
