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
 * @param {{ teamName: string, points: number }} team
 * @param {number} otherPoints - the opponent's points
 * @returns {HTMLDivElement} the team's name and final score
 */
function createScore (team, otherPoints) {
  const column = createElement('div', 'col-6',
    createElement('h2', 'h5 text-break', team.teamName),
    createElement('div', `display-4 ${team.points > otherPoints ? 'fw-bold text-success' : ''}`, team.points)
  );
  if (team.points >= otherPoints) {
    column.append(createElement('span', 'badge bg-secondary text-white', team.points === otherPoints ? 'Tie' : 'Winner'));
  }
  return column;
}

/**
 * @param {{ username: string, celerity: number, givenAnswer: string, points: number } | null} buzz
 * @returns {HTMLTableCellElement} a team's counted buzz on a question and what it scored
 */
function createBuzzCell (buzz) {
  if (!buzz) { return createElement('td', '', '—'); }

  const { username, celerity, givenAnswer, points } = buzz;
  const color = points > 0 ? 'table-success' : points < 0 ? 'table-danger' : '';
  return createElement('td', `text-break ${color}`,
    createElement('div', 'fw-semibold', `${points > 0 ? '+' : ''}${points}`),
    createElement('div', '', `${username} (${formatCelerity(celerity ?? 0)})`),
    createElement('small', 'd-block text-body-secondary', givenAnswer)
  );
}

/**
 * Lists each question with both teams' buzzes on either side and the running score between them.
 * @param {object[]} teams
 * @param {object[]} questions
 */
function showQuestions (teams, questions) {
  const [first, second] = teams.map(team => team.teamName);
  const headings = [first, 'Score', 'Question', 'Score', second];
  const headRow = createElement('tr', '', ...headings.map(heading => createElement('th', 'text-break', heading)));
  document.getElementById('match-table-head').replaceChildren(headRow);

  const totals = [0, 0];
  document.getElementById('match-table-body').replaceChildren(...questions.map(({ questionNumber, answer, sides }) => {
    sides.forEach((buzz, side) => { totals[side] += buzz?.points ?? 0; });
    return createElement('tr', '',
      createBuzzCell(sides[0]),
      createElement('td', 'fs-5', totals[0]),
      createElement('th', '', `${questionNumber}`, createElement('small', 'd-block fw-normal text-body-secondary', answer)),
      createElement('td', 'fs-5', totals[1]),
      createBuzzCell(sides[1])
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
  document.getElementById('scoreboard').replaceChildren(
    createScore(teams[0], teams[1].points),
    createScore(teams[1], teams[0].points)
  );
  showQuestions(teams, questions);
  document.getElementById('match').classList.remove('d-none');
}
