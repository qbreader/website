import { escapeHTML, titleCase } from '../../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);

document.getElementById('compare-link').href = `./compare?packetName=${packetName}`;
document.getElementById('category-stats-link').href = `./category-stats?packetName=${packetName}`;
document.getElementById('packet-name').textContent = packetTitle;

fetch('/api/geoword/paid/results/stats?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { buzzArray, division, leaderboard } = data;
    document.getElementById('division').textContent = division;

    const numberCorrect = buzzArray.filter(buzz => buzz.points > 0).length;
    const points = buzzArray.reduce((total, buzz) => total + buzz.points, 0);
    const tossupsHeard = buzzArray.length;
    const totalCorrectCelerity = buzzArray.filter(buzz => buzz.points > 0).reduce((total, buzz) => total + buzz.celerity, 0);
    const averageCorrectCelerity = (numberCorrect === 0 ? 0 : totalCorrectCelerity / numberCorrect).toFixed(3);
    const pointsPerTossup = (tossupsHeard === 0 ? 0 : points / tossupsHeard).toFixed(2);
    document.getElementById('statline').textContent = `${pointsPerTossup} points per question (${points} points / ${tossupsHeard} TUH), celerity: ${averageCorrectCelerity}`;

    let innerHTML = '<hr>';

    for (const i in buzzArray) {
      let pendingString = '';

      if (buzzArray[i].pendingProtest === true) {
        pendingString = '(pending review)';
      } else if (buzzArray[i].pendingProtest === false) {
        pendingString = `(protest resolution: ${buzzArray[i].decision}) ${getProtestReasonString(buzzArray[i])}`;
      }

      innerHTML += `
            <div class="row mb-3">
                <div class="col-6">
                    <div><b>#${buzzArray[i].questionNumber}</b> ${pendingString}</div>
                    <div><b>Your rank:</b> ${leaderboard[i].rank}</div>
                    <div><b>Celerity:</b> ${(buzzArray[i].celerity ?? 0.0).toFixed(3)}</div>
                    <div><b>Points:</b> ${buzzArray[i].points}</div>
                    <div><b>Given answer:</b> ${escapeHTML(buzzArray[i].givenAnswer)} ${getPromptString(buzzArray[i])}</div>
                </div>
                <div class="col-6">
                    <div><b>Best buzz:</b> ${leaderboard[i].bestUsername}</div>
                    <div><b>Best celerity:</b> ${(leaderboard[i].bestCelerity ?? 0.0).toFixed(3)}</div>
                    <div><b>Average correct celerity:</b> ${(leaderboard[i].averageCorrectCelerity ?? 0).toFixed(3)}</div>
                    <div><b>Average points:</b> ${(leaderboard[i].averagePoints ?? 0.0).toFixed(2)}</div>
                    <div><b>Answer:</b> ${buzzArray[i].answer}</div>
                </div>
            </div>
            <hr>
            `;
    }
    document.getElementById('stats').innerHTML = innerHTML;
  });

fetch('/api/geoword/get-divisions?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    const { divisions } = data;
    const leaderboardLinks = document.getElementById('leaderboard-links');
    const packetLinks = document.getElementById('packet-links');
    for (const index in divisions) {
      const division = divisions[index];
      const a1 = document.createElement('a');
      a1.href = `./leaderboard?packetName=${packetName}&division=${encodeURIComponent(division)}`;
      a1.textContent = division;

      const a2 = document.createElement('a');
      a2.href = `./packet?packetName=${packetName}&division=${encodeURIComponent(division)}`;
      a2.textContent = division;

      if (index > 0) {
        leaderboardLinks.appendChild(document.createTextNode(' | '));
        packetLinks.appendChild(document.createTextNode(' | '));
      }

      leaderboardLinks.appendChild(a1);
      packetLinks.appendChild(a2);
    }
  });

function getPromptString (buzz) {
  if (!buzz?.prompts) {
    return '';
  }

  let string = '(prompted on: ';
  for (const answer of buzz.prompts) {
    string += answer + ', ';
  }
  string = string.slice(0, -2);
  string = string + ')';
  return string;
}

function getProtestReasonString (buzz) {
  if (!buzz?.reason || buzz.reason === '') {
    return '';
  }

  return `(reason: ${buzz.reason})`;
}
