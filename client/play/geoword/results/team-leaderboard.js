import createTabs from '../../../../scripts/utilities/create-tabs.js';
import { kebabCase, titleCase } from '../../../../shared/string-utils.js';
import sortTable from '../../../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);
const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/**
 * @param {object[]} standings - one division's standings, best first
 * @param {number} index - the chosen team's place in the standings
 * @param {HTMLTableSectionElement} tbody - where to list the team's matches, best opponent first
 */
function showMatches (standings, index, tbody) {
  const { teamName, matches } = standings[index];
  tbody.replaceChildren();

  if (matches.length === 0) {
    const cell = tbody.insertRow().insertCell();
    cell.colSpan = 5;
    cell.textContent = 'No matches yet: a team plays once one of its members finishes the packet.';
    return;
  }

  standings.forEach(({ teamName: opponent }, rank) => {
    const match = matches.find(match => match.opponent === opponent);
    if (!match) { return; }

    const [own, other] = match.points;
    const result = own > other ? 'W' : own < other ? 'L' : 'T';
    const row = tbody.insertRow();
    row.insertCell().textContent = rank + 1;
    row.insertCell().textContent = opponent;
    const link = document.createElement('a');
    link.href = './packet/?' + new URLSearchParams([['packetName', packetName], ['team', teamName], ['team', opponent]]);
    link.textContent = result;
    link.setAttribute('aria-label', `${{ W: 'Win', L: 'Loss', T: 'Tie' }[result]}: see both teams' buzzes`);
    row.insertCell().appendChild(link);
    row.insertCell().textContent = own;
    row.insertCell().textContent = other;
  });
}

/**
 * A dropdown of a division's teams and a list of the chosen team's matches, each result
 * linking to the match on the Packet page. The viewer's team is chosen to begin with, and
 * choosing a row of the standings chooses its team.
 * @param {object[]} standings - one division's standings, best first
 * @param {string} id - a unique id for the dropdown
 * @param {HTMLTableElement} standingsTable - its rows' `data-team` is their place in `standings`
 * @returns {HTMLDivElement}
 */
function getMatchList (standings, id, standingsTable) {
  const container = document.createElement('div');
  container.className = 'mt-4';

  const picker = document.createElement('div');
  picker.className = 'd-flex flex-wrap align-items-center gap-2 mb-3';
  const heading = document.createElement('h2');
  heading.className = 'h6 mb-0';
  const label = document.createElement('label');
  label.htmlFor = id;
  label.textContent = 'Matches for';
  heading.appendChild(label);
  const select = document.createElement('select');
  select.id = id;
  select.className = 'form-select w-auto mw-100';
  standings.forEach(({ teamName, wins, losses, ties, isYourTeam }, index) => {
    select.add(new window.Option(`${index + 1}. ${teamName} (${wins}-${losses}-${ties})${isYourTeam ? ' - your team' : ''}`, index));
  });
  select.value = Math.max(0, standings.findIndex(({ isYourTeam }) => isYourTeam));
  picker.append(heading, select);

  const table = document.createElement('table');
  table.className = 'table table-hover';
  const headRow = table.createTHead().insertRow();
  for (const text of ['#', 'Opponent', 'Result', 'Points For', 'Points Against']) {
    const cell = document.createElement('th');
    cell.scope = 'col';
    cell.textContent = text;
    headRow.appendChild(cell);
  }
  const tbody = table.createTBody();

  /**
   * @param {number} index - the team's place in the standings
   */
  function chooseTeam (index) {
    select.value = index;
    showMatches(standings, index, tbody);
    for (const row of standingsTable.tBodies[0].rows) {
      const selected = Number(row.dataset.team) === index;
      row.classList.toggle('team-standings-selected', selected);
      if (selected) {
        row.setAttribute('aria-current', 'true');
      } else {
        row.removeAttribute('aria-current');
      }
    }
  }

  /**
   * @param {HTMLTableRowElement} row - a row of the standings
   */
  function chooseRow (row) {
    chooseTeam(Number(row.dataset.team));
    // With many teams the matches can be far below the row
    const { top, bottom } = picker.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      container.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  }

  for (const row of standingsTable.tBodies[0].rows) {
    row.tabIndex = 0;
  }
  standingsTable.tBodies[0].addEventListener('click', event => {
    const row = event.target.closest('tr');
    if (row) { chooseRow(row); }
  });
  standingsTable.tBodies[0].addEventListener('keydown', event => {
    const row = event.target.closest('tr');
    if (!row || (event.key !== 'Enter' && event.key !== ' ')) { return; }
    event.preventDefault();
    chooseRow(row);
  });
  select.addEventListener('change', () => chooseTeam(Number(select.value)));
  chooseTeam(Number(select.value));

  const wrapper = document.createElement('div');
  wrapper.className = 'table-responsive';
  wrapper.appendChild(table);
  container.append(picker, wrapper);
  return container;
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
        divs[division].appendChild(getMatchList(teamLeaderboard[division], `${kebabed}-match-team`, table));
      }
    }
  });
