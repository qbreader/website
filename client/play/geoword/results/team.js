import { titleCase } from '../../../../shared/string-utils.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const teamName = search.get('teamName');
const division = search.get('division');

document.getElementById('packet-name').textContent = titleCase(packetName);
document.getElementById('back-link').href = `./?packetName=${packetName}`;

/**
 * @param {string} text
 * @param {'th' | 'td'} tag
 * @returns {HTMLTableCellElement}
 */
function createCell (text, tag = 'td') {
  const cell = document.createElement(tag);
  cell.textContent = text;
  return cell;
}

/**
 * @param {object} buzz
 * @returns {HTMLTableCellElement}
 */
function createBuzzCell (buzz) {
  if (!buzz) { return createCell('—'); }

  const cell = createCell(`${buzz.givenAnswer} (${buzz.points > 0 ? '+' : ''}${buzz.points})`);
  cell.className = buzz.points > 0 ? 'table-success' : buzz.points < 0 ? 'table-danger' : '';
  return cell;
}

const response = await fetch('/api/geoword/paid/results/team?' + new URLSearchParams(teamName ? { packetName, teamName, division: division ?? '' } : { packetName }));

if (!response.ok) {
  const error = document.getElementById('error');
  error.textContent = response.status === 401 ? 'You must log in first.' : await response.text();
  error.classList.remove('d-none');
} else {
  const { teamName: viewedTeamName, division: viewedDivision, members, questions } = await response.json();

  document.getElementById('team-name').textContent = viewedTeamName;
  document.getElementById('packet-name').textContent += ` (${viewedDivision})`;

  const headRow = document.createElement('tr');
  headRow.append(createCell('#', 'th'), createCell('Answer', 'th'));
  for (const member of members) {
    const header = createCell(member.isYou ? `${member.username} (you)` : member.username, 'th');
    if (!member.finished) {
      const note = document.createElement('i');
      note.className = 'fw-normal d-block';
      note.textContent = 'not finished';
      header.appendChild(note);
    }
    headRow.appendChild(header);
  }
  document.getElementById('team-table-head').replaceChildren(headRow);

  document.getElementById('team-table-body').replaceChildren(...questions.map(question => {
    const row = document.createElement('tr');
    row.append(createCell(question.questionNumber), createCell(question.answer));
    for (const member of members) {
      row.appendChild(createBuzzCell(question.buzzes.find(buzz => buzz.username === member.username)));
    }
    return row;
  }));

  document.getElementById('unfinished-note').classList.toggle('d-none', members.every(member => member.finished));
  document.getElementById('team-table').classList.remove('d-none');
}
