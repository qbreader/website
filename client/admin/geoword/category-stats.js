import createTabs from '../../scripts/utilities/create-tabs.js';
import { escapeHTML, kebabCase, titleCase } from '../../scripts/utilities/strings.js';
import sortTable from '../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

let leaderboards;

fetch('/api/admin/geoword/category-stats?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    leaderboards = data.leaderboards;

    const divs = createTabs({ tabNames: Object.keys(leaderboards) });

    for (const division of Object.keys(leaderboards)) {
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
      tbody.id = `${kebabed}-leaderboard-body`;
      const foot = table.createTFoot();
      const footRow = foot.insertRow();
      footRow.id = `${kebabed}-leaderboard-foot`;
      divs[division].appendChild(table);
    }

    const firstLeaderboard = leaderboards[Object.keys(leaderboards)[0]];
    for (const index in firstLeaderboard) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = firstLeaderboard[index].category;
      document.getElementById('category').appendChild(option);
    }

    updateLeaderboardDisplay(0);
  }
  );

function updateLeaderboardDisplay (index) {
  for (const division of Object.keys(leaderboards)) {
    const kebabed = kebabCase(division);
    const leaderboard = leaderboards[division];
    const users = leaderboard[index].users;

    let numberSkipped = 0;
    let innerHTML = '';
    for (const index in users) {
      const user = users[index].user;
      const { username, numberCorrect, points, pointsPerTossup, averageCorrectCelerity, active } = user;

      innerHTML += `
        <tr ${!active && 'class="table-info"'}>
            <td>${active ? parseInt(index) + 1 - numberSkipped : ''}</td>
            <th scope="row">${escapeHTML(username)}</th>
            <td>${(averageCorrectCelerity ?? 0.0).toFixed(3)}</td>
            <td>${numberCorrect}</td>
            <td>${points}</td>
            <td>${(pointsPerTossup ?? 0.0).toFixed(2)}</td>
        </tr>
      `;

      if (!active) {
        numberSkipped++;
      }
    }

    document.getElementById(`${kebabed}-leaderboard-body`).innerHTML = innerHTML;

    document.getElementById(`${kebabed}-leaderboard-foot`).innerHTML = `
      <tr>
          <td></td>
          <th scope="row">Average</th>
          <td>${(leaderboard[index].averageCorrectCelerity ?? 0.0).toFixed(3)}</td>
          <td></td>
          <td></td>
          <td>${(leaderboard[index].averagePoints ?? 0.0).toFixed(2)}</td>
      </tr>
    `;
  }
}

document.getElementById('category').addEventListener('change', event => {
  updateLeaderboardDisplay(event.target.value);
});
