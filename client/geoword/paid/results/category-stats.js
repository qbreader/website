import { escapeHTML, titleCase } from '../../../scripts/utilities/strings.js';
import sortTable from '../../../scripts/utilities/tables.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

let leaderboard;
let myUsername;

fetch('/api/geoword/paid/results/category-stats?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    document.getElementById('division').textContent = data.division;
    leaderboard = data.leaderboard;
    myUsername = data.username;

    for (const index in leaderboard) {
      const option = document.createElement('option');
      option.value = index;
      option.textContent = leaderboard[index].category;
      document.getElementById('category').appendChild(option);
    }

    updateLeaderboardDisplay(0);
  });

function updateLeaderboardDisplay (index) {
  const users = leaderboard[index].users;

  let innerHTML = '';
  for (const index in users) {
    const user = users[index].user;
    const { username, numberCorrect, points, pointsPerTossup, averageCorrectCelerity } = user;

    innerHTML += `
            <tr ${username === myUsername && 'class="table-info"'}>
                <td>${parseInt(index) + 1}</td>
                <th scope="row">${escapeHTML(username)}</th>
                <td>${(averageCorrectCelerity ?? 0.0).toFixed(3)}</td>
                <td>${numberCorrect}</td>
                <td>${points}</td>
                <td>${(pointsPerTossup ?? 0.0).toFixed(2)}</td>
            </tr>
        `;
  }

  document.getElementById('leaderboard-body').innerHTML = innerHTML;

  document.getElementById('leaderboard-foot').innerHTML = `
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

document.getElementById('category').addEventListener('change', event => {
  updateLeaderboardDisplay(event.target.value);
});

document.querySelectorAll('th').forEach((th, index) => {
  const numeric = [true, false, true, true, true, true];
  th.addEventListener('click', () => sortTable(index, numeric[index], 'leaderboard-body', 0, 0));
});
