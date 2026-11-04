import getMatchList from './team-matches.js';
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
      table.className = 'table table-hover team-standings';
      table.id = `${kebabed}-table`;
      const thead = table.createTHead();
      const theadRow = thead.insertRow();
      const labels = ['#', 'Team', 'Players', 'W-L-T', 'Pct', 'Celerity', 'Correct', 'TUH', 'Points', 'PPTU'];
      const numeric = [true, false, true, false, true, true, true, true, true, true];
      for (const index in labels) {
        const label = labels[index];
        const cell = document.createElement('th');
        cell.textContent = label;
        cell.scope = 'col';
        cell.className = 'text-nowrap';
        cell.addEventListener('click', () => sortTable(index, numeric[index], table.id, 1, 0));
        theadRow.appendChild(cell);
      }
      const tbody = table.createTBody();
      for (const index in teamLeaderboard[division]) {
        const { teamName, memberCount, wins, losses, ties, winPercentage, numberCorrect, points, pointsPerTossup, tossupsHeard, averageCorrectCelerity, isYourTeam } = teamLeaderboard[division][index];

        const row = tbody.insertRow();
        row.dataset.team = index;
        if (isYourTeam) { row.classList.add('team-standings-you'); }
        row.insertCell().textContent = parseInt(index) + 1;
        const name = row.insertCell();
        name.textContent = teamName;
        if (isYourTeam) {
          const label = document.createElement('span');
          label.className = 'visually-hidden';
          label.textContent = ' (your team)';
          name.appendChild(label);
        }
        row.insertCell().textContent = memberCount;
        const record = row.insertCell();
        record.className = 'text-nowrap';
        record.textContent = `${wins}-${losses}-${ties}`;
        // Quizbowl writes win percentages like .750
        row.insertCell().textContent = winPercentage === null ? '–' : winPercentage.toFixed(3).replace(/^0/, '');
        row.insertCell().textContent = (averageCorrectCelerity ?? 0.0).toFixed(3);
        row.insertCell().textContent = numberCorrect;
        row.insertCell().textContent = tossupsHeard;
        row.insertCell().textContent = points;
        row.insertCell().textContent = (pointsPerTossup ?? 0.0).toFixed(2);
      }
      const wrapper = document.createElement('div');
      wrapper.className = 'table-responsive';
      wrapper.appendChild(table);
      divs[division].appendChild(wrapper);

      if (teamLeaderboard[division].some(({ matches }) => matches.length > 0)) {
        divs[division].appendChild(getMatchList(teamLeaderboard[division], `${kebabed}-match-team`, table.tBodies[0], packetName));
      }
    }
  });
