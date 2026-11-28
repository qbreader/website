import { titleCase } from '../../../../shared/string-utils.js';
import formatCelerity from '../../../scripts/utilities/format-celerity.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const division = search.get('division');
const teamName = search.get('team');
const opponentName = search.get('opponent');

/**
 * @param {string} tag
 * @param {string} className
 * @param {...(string | number | Node)} children - text is never parsed as HTML
 * @returns {HTMLElement}
 */
function createElement (tag, className, ...children) {
  const element = document.createElement(tag);
  element.className = className;
  element.append(...children);
  return element;
}

/**
 * @param {'th' | 'td'} tag
 * @param {Array<string | number>} values - one per cell; text is never parsed as HTML
 * @returns {HTMLTableRowElement} a box score row, with every column but the first aligned right
 */
function createBoxScoreRow (tag, values) {
  return createElement('tr', '', ...values.map((value, index) => createElement(index === 0 ? 'th' : tag, index === 0 ? 'text-break' : 'text-end', value)));
}

/**
 * @param {{ teamName: string, players: object[] }} team
 * @returns {HTMLDivElement} what each of the team's players did in the match, and their total
 */
function createBoxScore ({ teamName, players }) {
  const rows = players.map(({ username, tossupsHeard, numberCorrect, numberNegs, points }) =>
    createBoxScoreRow('td', [username, tossupsHeard, numberCorrect, numberNegs, points]));
  const sum = key => players.reduce((total, player) => total + player[key], 0);

  return createElement('div', 'col-md-6 table-responsive',
    createElement('table', 'table table-sm',
      createElement('thead', '', createBoxScoreRow('th', [teamName, 'TUH', '10', '-5', 'Total'])),
      createElement('tbody', '', ...rows),
      createElement('tfoot', 'table-group-divider', createBoxScoreRow('th', ['Total', '', sum('numberCorrect'), sum('numberNegs'), sum('points')]))
    )
  );
}

/**
 * @param {{ username: string, celerity: number, givenAnswer: string, points: number } | null} buzz
 * @param {string} className
 * @returns {HTMLTableCellElement} a team's counted buzz on a question and what it scored
 */
function createBuzzCell (buzz, className) {
  if (!buzz) { return createElement('td', className, '—'); }

  const { username, celerity, givenAnswer, points } = buzz;
  const color = points > 0 ? 'table-success' : points < 0 ? 'table-danger' : '';
  return createElement('td', `text-break ${color} ${className}`,
    createElement('div', '', givenAnswer),
    createElement('small', 'd-block text-body-secondary', `${username} (${formatCelerity(celerity ?? 0)}) ${points > 0 ? '+' : ''}${points}`)
  );
}

/**
 * Lists each question and its answer, then each team's buzz and running score.
 * @param {object[]} teams
 * @param {object[]} questions
 */
function showQuestions (teams, questions) {
  const [first, second] = teams.map(team => team.teamName);
  // Sets the second team's columns apart from the first's
  const divider = 'border-start';
  const headRow = createElement('tr', '',
    createElement('th', '', '#'),
    createElement('th', '', 'Answer'),
    createElement('th', 'text-break', first),
    createElement('th', 'text-nowrap', 'Score'),
    createElement('th', `text-break ${divider}`, second),
    createElement('th', 'text-nowrap', 'Score')
  );
  document.getElementById('match-table-head').replaceChildren(headRow);

  const totals = [0, 0];
  document.getElementById('match-table-body').replaceChildren(...questions.map(({ questionNumber, answer, sides }) => {
    sides.forEach((buzz, side) => { totals[side] += buzz?.points ?? 0; });
    const answerCell = createElement('td', 'text-break');
    // The answer's formatting is HTML from the packet, as on the Packet page
    answerCell.innerHTML = answer;
    return createElement('tr', '',
      createElement('th', '', questionNumber),
      answerCell,
      createBuzzCell(sides[0], ''),
      createElement('td', '', totals[0]),
      createBuzzCell(sides[1], divider),
      createElement('td', '', totals[1])
    );
  }));
}

document.getElementById('packet-name').textContent = `${titleCase(packetName)} (${division})`;
document.getElementById('back-link').href = './team-leaderboard?' + new URLSearchParams({ packetName });
document.getElementById('packet-link').href = './packet/?' + new URLSearchParams([['packetName', packetName], ['team', teamName], ['team', opponentName]]);

const response = await fetch('/api/geoword/paid/results/match?' + new URLSearchParams({ packetName, division, teamName, opponentName }));

if (!response.ok) {
  const error = document.getElementById('error');
  error.textContent = response.status === 401 ? 'You must log in first.' : await response.text();
  error.classList.remove('d-none');
} else {
  const { teams, questions } = await response.json();
  document.getElementById('final-score').textContent = teams.map(team => `${team.teamName} ${team.points}`).join(', ');
  document.getElementById('box-scores').replaceChildren(...teams.map(createBoxScore));
  showQuestions(teams, questions);
  document.getElementById('match').classList.remove('d-none');
}
