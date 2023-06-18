const packetName = window.location.pathname.split('/').pop();
const packetTitle = titleCase(packetName);

document.getElementById('packet-name').textContent = packetTitle;

fetch('/geoword/api/stats?' + new URLSearchParams({ packetName }))
    .then(response => response.json())
    .then(data => {
        const { buzzArray, division, leaderboard } = data;
        document.getElementById('division').textContent = division;

        const numberCorrect = buzzArray.filter(buzz => buzz.points > 0).length;
        const points = buzzArray.reduce((total, buzz) => total + buzz.points, 0);
        const tossupsHeard = buzzArray.length;
        const totalCorrectCelerity = buzzArray.reduce((total, buzz) => total + buzz.celerity, 0);
        const averageCelerity = (numberCorrect === 0 ? 0 : totalCorrectCelerity / numberCorrect).toFixed(3);
        const pointsPerTossup = (tossupsHeard === 0 ? 0 : points / tossupsHeard).toFixed(2);
        document.getElementById('statline').textContent = `${pointsPerTossup} points per question (${points} points / ${tossupsHeard} TUH), celerity: ${averageCelerity}`;

        let innerHTML = '<hr>';

        for (const i in buzzArray) {
            const pendingString = buzzArray[i].pendingProtest ? ' (pending review)' : '';

            innerHTML += `
            <div class="row mb-3">
                <div class="col-6">
                    <div><b>#${buzzArray[i].questionNumber}</b> ${pendingString}</div>
                    <div><b>Your rank:</b> ${leaderboard[i].rank}</div>
                    <div><b>Celerity:</b> ${(buzzArray[i].celerity ?? 0.0).toFixed(3)}</div>
                    <div><b>Points:</b> ${buzzArray[i].points}</div>
                    <div><b>Given answer:</b> ${escapeHTML(buzzArray[i].givenAnswer)}</div>
                </div>
                <div class="col-6">
                    <div><b>Best buzz:</b> ${leaderboard[i].bestUsername}</div>
                    <div><b>Best celerity:</b> ${(leaderboard[i].bestCelerity ?? 0.0).toFixed(3)}</div>
                    <div><b>Average correct celerity:</b> ${(leaderboard[i].averageCorrectCelerity ?? 0).toFixed(3)}</div>
                    <div><b>Average points:</b> ${(leaderboard[i].averagePoints ?? 0.0).toFixed(2)}</div>
                    <div><b>Answer:</b> ${buzzArray[i].formatted_answer}</div>
                </div>
            </div>
            <hr>
            `;
        }
        document.getElementById('stats').innerHTML = innerHTML;
    });


function escapeHTML(unsafe) {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll('\'', '&#039;');
}
