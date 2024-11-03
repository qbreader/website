import { escapeHTML, titleCase } from '../../scripts/utilities/strings.js';
import sortTable from '../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const division = search.get('division');
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;
document.getElementById('division').textContent = division;

fetch('/api/admin/geoword/leaderboard?' + new URLSearchParams({ packetName, division, includeInactive: true }))
  .then(response => response.json())
  .then(data => {
    const { leaderboard } = data;

    let numberSkipped = 0;
    let innerHTML = '';
    for (const index in leaderboard) {
      const { username, numberCorrect, points, pointsPerTossup, averageCorrectCelerity, active } = leaderboard[index];

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
    document.getElementById('leaderboard-body').innerHTML = innerHTML;
  });

document.querySelectorAll('th').forEach((th, index) => {
  const numeric = [true, false, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'leaderboard-body', 0, 0));
});
