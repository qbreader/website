import { escapeHTML, titleCase } from '../../scripts/utilities/strings.js';

const search = new URLSearchParams(window.location.search);
const packetName = search.get('packetName');
const packetTitle = titleCase(packetName);
document.getElementById('packet-name').textContent = packetTitle;

let division;

fetch('/api/geoword/division-choice?' + new URLSearchParams({ packetName }))
  .then(response => response.json())
  .then(data => {
    division = data.division;
    document.getElementById('division').textContent = division;
  });

document.getElementById('form').addEventListener('submit', event => {
  event.preventDefault();

  const opponent = document.getElementById('opponent').value;

  fetch('/api/geoword/compare?' + new URLSearchParams({ packetName, division, opponent }))
    .then(response => response.json())
    .then(data => {
      const { myBuzzes, opponentBuzzes } = data;

      if (myBuzzes.length === 0) {
        document.getElementById('root').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    No stats found for you.
                </div>`;
        return;
      }

      if (opponentBuzzes.length === 0) {
        document.getElementById('root').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    No stats found for ${escapeHTML(opponent)}.
                </div>`;
        return;
      }

      let myPoints = 0;
      let myTossupCount = 0;
      let opponentPoints = 0;
      let opponentTossupCount = 0;

      let innerHTML = '';

      for (let i = 0; i < Math.min(myBuzzes.length, opponentBuzzes.length); i++) {
        const myBuzz = myBuzzes[i];
        const opponentBuzz = opponentBuzzes[i];

        if (myBuzz.points > 0 && opponentBuzz.points === 0) {
          myPoints += myBuzz.points;
          myTossupCount++;
        } else if (myBuzz.points === 0 && opponentBuzz.points > 0) {
          opponentPoints += opponentBuzz.points;
          opponentTossupCount++;
        } else if (myBuzz.points > 0 && opponentBuzz.points > 0) {
          if (myBuzz.celerity > opponentBuzz.celerity) {
            myPoints += myBuzz.points;
            myTossupCount++;
          } else if (myBuzz.celerity < opponentBuzz.celerity) {
            opponentPoints += opponentBuzz.points;
            opponentTossupCount++;
          } else {
            myPoints += myBuzz.points / 2;
            myTossupCount += 0.5;
            opponentPoints += opponentBuzz.points / 2;
            opponentTossupCount += 0.5;
          }
        }

        innerHTML += `
                <hr>
                <div class="row mb-3">
                    <div class="col-6">
                        <div><b>#${myBuzz.questionNumber}</b></div>
                        <div><b>Celerity:</b> ${(myBuzz.celerity ?? 0.0).toFixed(3)}</div>
                        <div><b>Points:</b> ${myBuzz.points}</div>
                        <div><b>Given answer:</b> ${escapeHTML(myBuzz.givenAnswer)}</div>
                    </div>
                    <div class="col-6">
                        <div><b>Answer:</b> ${removeParentheses(myBuzz.answer)}</div>
                        <div><b>Celerity:</b> ${(opponentBuzz.celerity ?? 0.0).toFixed(3)}</div>
                        <div><b>Points:</b> ${opponentBuzz.points}</div>
                        <div><b>Given answer:</b> ${escapeHTML(opponentBuzz.givenAnswer)}</div>
                    </div>
                </div>`;
      }

      innerHTML = `
                <div class="row mb-3">
                    <div class="text-center col-6">
                        <div class="lead">Your stats:</div>
                        ${myPoints} points (${myTossupCount} tossups)
                    </div>
                    <div class="text-center col-6">
                        <div class="lead">${escapeHTML(opponent)}'s stats:</div>
                        ${opponentPoints} points (${opponentTossupCount} tossups)
                    </div>
                </div>
            ` + innerHTML;

      document.getElementById('root').innerHTML = innerHTML;
    });
});

function removeParentheses (answer) {
  return answer.replace(/[([].*/g, '');
}
