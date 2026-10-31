import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { kebabCase, titleCase } from '../../../../shared/string-utils.js';
import sortTable from '../../../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

/**
 * A grid of every match in a division, each score linking to the match on the Packet page.
 * @param {object[]} standings - one division's standings, best first
 * @returns {HTMLDivElement}
 */
function getMatchGrid (standings) {
  const table = document.createElement('table');
  table.className = 'table table-sm table-bordered text-center align-middle';
  const caption = table.createCaption();
  caption.className = 'small';
  caption.textContent = 'Each score lists the row team first. Choose one to see the match question by question.';

  const headRow = table.createTHead().insertRow();
  headRow.appendChild(document.createElement('td'));
  standings.forEach(({ teamName }, index) => {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.title = teamName;
    cell.textContent = index + 1;
    const name = document.createElement('span');
    name.className = 'visually-hidden';
    name.textContent = ` ${teamName}`;
    cell.appendChild(name);
    headRow.appendChild(cell);
  });

  const tbody = table.createTBody();
  standings.forEach(({ teamName, matches }, index) => {
    const row = tbody.insertRow();
    const label = document.createElement('th');
    label.scope = 'row';
    label.className = 'text-start text-nowrap';
    label.textContent = `${index + 1}. ${teamName}`;
    row.appendChild(label);

    for (const { teamName: opponent } of standings) {
      const cell = row.insertCell();
      cell.className = 'text-nowrap';
      if (opponent === teamName) {
        cell.className += ' table-secondary';
        continue;
      }
      const match = matches.find(match => match.opponent === opponent);
      if (!match) { continue; }

      const [own, other] = match.points;
      const result = own > other ? 'W' : own < other ? 'L' : 'T';
      const link = document.createElement('a');
      link.href = './packet/?' + new URLSearchParams([['packetName', packetName], ['team', teamName], ['team', opponent], ['match', '1']]);
      link.className = result === 'W' ? 'text-success' : result === 'L' ? 'text-danger' : 'text-body-secondary';
      link.textContent = `${result} ${own}–${other}`;
      link.title = `${teamName} ${own}, ${opponent} ${other}`;
      cell.appendChild(link);
    }
  });

  const wrapper = document.createElement('div');
  // Positioned so that the visually hidden team names scroll with the table instead of
  // widening the page
  wrapper.className = 'table-responsive position-relative';
  wrapper.appendChild(table);
  return wrapper;
}

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
        const { teamName, memberCount, wins, losses, ties, winPercentage, numberCorrect, points, pointsPerTossup, tossupsHeard, averageCorrectCelerity } = teamLeaderboard[division][index];

        const row = tbody.insertRow();
        row.insertCell().textContent = parseInt(index) + 1;
        row.insertCell().textContent = teamName;
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
        const heading = document.createElement('h2');
        heading.className = 'h6 mt-4';
        heading.textContent = 'Matches';
        divs[division].append(heading, getMatchGrid(teamLeaderboard[division]));
      }
    }
  });
