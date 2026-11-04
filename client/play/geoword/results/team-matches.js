const scrollBehavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const RESULT_LABELS = { W: 'Win', L: 'Loss', T: 'Tie' };

/**
 * @param {number} own - the team's points
 * @param {number} other - the opponent's points
 * @returns {'W' | 'L' | 'T'}
 */
function getResult (own, other) {
  if (own === other) { return 'T'; }
  return own > other ? 'W' : 'L';
}

/**
 * @param {HTMLTableRowElement} row
 * @param {Array<string | number | Node>} values - one per cell; text is never parsed as HTML
 */
function appendCells (row, values) {
  for (const value of values) {
    row.insertCell().append(value);
  }
}

/**
 * @param {string} packetName
 * @param {string} teamName
 * @param {string} opponent
 * @param {'W' | 'L' | 'T'} result
 * @returns {HTMLAnchorElement} the result, linking to both teams' buzzes on the Packet page
 */
function createResultLink (packetName, teamName, opponent, result) {
  const link = document.createElement('a');
  link.href = './packet/?' + new URLSearchParams([['packetName', packetName], ['team', teamName], ['team', opponent]]);
  link.textContent = result;
  link.setAttribute('aria-label', `${RESULT_LABELS[result]}: see both teams' buzzes`);
  return link;
}

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
    const link = createResultLink(packetName, teamName, opponent, getResult(own, other));
    appendCells(tbody.insertRow(), [rank + 1, opponent, link, own, other]);
  });
}

/**
 * @param {string} id - the id of the dropdown; must not come from user input
 * @returns {HTMLDivElement} the dropdown and the empty matches table
 */
function createMatchList (id) {
  const container = document.createElement('div');
  container.className = 'mt-4';
  // Only fixed markup goes in here. Team names are user input, so they are added with
  // `Option` and `textContent` instead.
  container.innerHTML = `
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <h2 class="h6 mb-0"><label for="${id}">Matches for</label></h2>
      <select id="${id}" class="form-select w-auto mw-100"></select>
    </div>
    <div class="table-responsive">
      <table class="table table-hover">
        <thead>
          <tr>
            <th scope="col">#</th>
            <th scope="col">Opponent</th>
            <th scope="col">Result</th>
            <th scope="col">Points For</th>
            <th scope="col">Points Against</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </div>`;
  return container;
}

/**
 * Lists the teams as options, each labelled with its place and record, and chooses the
 * viewer's team if it is there.
 * @param {HTMLSelectElement} select
 * @param {object[]} standings - one division's standings, best first
 */
function fillTeamSelect (select, standings) {
  standings.forEach(({ teamName, wins, losses, ties, isYourTeam }, index) => {
    const suffix = isYourTeam ? ' - your team' : '';
    select.add(new window.Option(`${index + 1}. ${teamName} (${wins}-${losses}-${ties})${suffix}`, index));
  });
  select.value = Math.max(0, standings.findIndex(({ isYourTeam }) => isYourTeam));
}

/**
 * @param {HTMLTableSectionElement} standingsBody - its rows' `data-team` is their place in the standings
 * @param {number} index - the place of the team to highlight
 */
function markSelectedRow (standingsBody, index) {
  for (const row of standingsBody.rows) {
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
 * Makes each row of the standings focusable and calls `onChoose` when one is clicked, or
 * chosen with Enter or Space.
 * @param {HTMLTableSectionElement} standingsBody
 * @param {(row: HTMLTableRowElement) => void} onChoose
 */
function makeRowsChoosable (standingsBody, onChoose) {
  for (const row of standingsBody.rows) {
    row.tabIndex = 0;
  }
  standingsBody.addEventListener('click', event => {
    const row = event.target.closest('tr');
    if (row) { onChoose(row); }
  });
  standingsBody.addEventListener('keydown', event => {
    const row = event.target.closest('tr');
    if (!row || (event.key !== 'Enter' && event.key !== ' ')) { return; }
    event.preventDefault();
    onChoose(row);
  });
}

/**
 * A dropdown of a division's teams and a list of the chosen team's matches, each result
 * linking to the match on the Packet page. The viewer's team is chosen to begin with, and
 * choosing a row of the standings chooses its team.
 * @param {object[]} standings - one division's standings, best first
 * @param {string} id - a unique id for the dropdown
 * @param {HTMLTableSectionElement} standingsBody - its rows' `data-team` is their place in `standings`
 * @param {string} packetName - the packet the standings are for, for the links to its matches
 * @returns {HTMLDivElement}
 */
export default function getMatchList (standings, id, standingsBody, packetName) {
  const container = createMatchList(id);
  const select = container.querySelector('select');
  const matchesBody = container.querySelector('tbody');
  fillTeamSelect(select, standings);

  function chooseTeam (index) {
    select.value = index;
    showMatches(standings, index, matchesBody, packetName);
    markSelectedRow(standingsBody, index);
  }

  makeRowsChoosable(standingsBody, row => {
    chooseTeam(Number(row.dataset.team));
    // With many teams the matches can be far below the row
    const { top, bottom } = select.getBoundingClientRect();
    if (top < 0 || bottom > window.innerHeight) {
      container.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  });
  select.addEventListener('change', () => chooseTeam(Number(select.value)));
  chooseTeam(Number(select.value));

  return container;
}
