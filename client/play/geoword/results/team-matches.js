const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';

/**
 * @param {object[]} standings - one division's standings, best first
 * @param {number} index - the chosen team's place in the standings
 * @param {HTMLTableSectionElement} tbody - where to list the team's matches, best opponent first
 * @param {string} packetName - the packet the standings are for, for the links to its matches
 */
function showMatches (standings, index, tbody, packetName) {
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
 * @param {string} packetName - the packet the standings are for, for the links to its matches
 * @returns {HTMLDivElement}
 */
export default function getMatchList (standings, id, standingsTable, packetName) {
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
    showMatches(standings, index, tbody, packetName);
    for (const row of standingsTable.tBodies[0].rows) {
      const selected = Number(row.dataset.team) === index;
      row.classList.toggle('table-primary', selected);
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
