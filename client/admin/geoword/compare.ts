function removeParentheses(answer) {
    return answer.replace(/[([].*/g, '');
}

function updateDivisionList(packetName) {
    document.getElementById('spinner').classList.remove('d-none');
    document.getElementById('division').innerHTML = '';
    fetch('/api/geoword/get-divisions?' + new URLSearchParams({ packetName }))
        .then(response => response.json())
        .then(data => {
            const { divisions } = data;
            for (const division of divisions) {
                const option = document.createElement('option');
                option.value = division;
                option.textContent = division;
                document.getElementById('division').appendChild(option);
            }
            updatePlayerLists(packetName, divisions[0]);
            document.getElementById('spinner').classList.add('d-none');
        });
}

function updatePlayerLists(packetName, division) {
    document.getElementById('spinner').classList.remove('d-none');
    document.getElementById('player-list-1').innerHTML = '';
    document.getElementById('player-list-2').innerHTML = '';
    fetch('/api/admin/geoword/player-list?' + new URLSearchParams({ packetName, division  }))
        .then(response => response.json())
        .then(data => {
            const { players } = data;
            for (const player of players) {
                const option = document.createElement('option');
                option.value = player.username;
                option.textContent = player.username;
                document.getElementById('player-list-1').appendChild(option);
                document.getElementById('player-list-2').appendChild(option.cloneNode(true));
            }
            document.getElementById('spinner').classList.add('d-none');
        });
}

fetch('/api/geoword/packet-list')
    .then(response => response.json())
    .then(data => {
        const { packetList } = data;
        for (const packet of packetList) {
            const option = document.createElement('option');
            option.value = packet.name;
            option.textContent = packet.name;
            document.getElementById('packet').appendChild(option);
        }
        document.getElementById('packet').value = packetList[packetList.length - 1].name;
        updateDivisionList(packetList[packetList.length - 1].name);
    });




document.getElementById('form').addEventListener('submit', event => {
    event.preventDefault();

    const packetName = document.getElementById('packet').value;
    const division = document.getElementById('division').value;
    const player1 = document.getElementById('player-1').value;
    const player2 = document.getElementById('player-2').value;

    fetch('/api/admin/geoword/compare?' + new URLSearchParams({ packetName, division, player1, player2 }))
        .then(response => response.json())
        .then(data => {
            const { player1Buzzes, player2Buzzes } = data;

            if (player1Buzzes.length === 0) {
                document.getElementById('root').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    No stats found for ${escapeHTML(player1)}.
                </div>`;
                return;
            }

            if (player2Buzzes.length === 0) {
                document.getElementById('root').innerHTML = `
                <div class="alert alert-danger" role="alert">
                    No stats found for ${escapeHTML(player2)}.
                </div>`;
                return;
            }

            let player1Points = 0;
            let player1TossupCount = 0;
            let player2Points = 0;
            let player2TossupCount = 0;

            let innerHTML = '';

            for (let i = 0; i < Math.min(player1Buzzes.length, player2Buzzes.length); i++) {
                const myBuzz = player1Buzzes[i];
                const opponentBuzz = player2Buzzes[i];

                if (myBuzz.points > 0 && opponentBuzz.points === 0) {
                    player1Points += myBuzz.points;
                    player1TossupCount++;
                } else if (myBuzz.points === 0 && opponentBuzz.points > 0) {
                    player2Points += opponentBuzz.points;
                    player2TossupCount++;
                } else if (myBuzz.points > 0 && opponentBuzz.points > 0) {
                    if (myBuzz.celerity > opponentBuzz.celerity) {
                        player1Points += myBuzz.points;
                        player1TossupCount++;
                    } else if (myBuzz.celerity < opponentBuzz.celerity) {
                        player2Points += opponentBuzz.points;
                        player2TossupCount++;
                    } else {
                        player1Points += myBuzz.points / 2;
                        player1TossupCount += 0.5;
                        player2Points += opponentBuzz.points / 2;
                        player2TossupCount += 0.5;
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
                        <div><b>Answer:</b> ${removeParentheses(myBuzz.formatted_answer ?? myBuzz.answer)}</div>
                        <div><b>Celerity:</b> ${(opponentBuzz.celerity ?? 0.0).toFixed(3)}</div>
                        <div><b>Points:</b> ${opponentBuzz.points}</div>
                        <div><b>Given answer:</b> ${escapeHTML(opponentBuzz.givenAnswer)}</div>
                    </div>
                </div>`;
            }

            innerHTML = `
                <div class="row mb-3">
                    <div class="text-center col-6">
                        <div class="lead">${escapeHTML(player1)}'s stats:</div>
                        ${player1Points} points (${player1TossupCount} tossups)
                    </div>
                    <div class="text-center col-6">
                        <div class="lead">${escapeHTML(player2)}'s stats:</div>
                        ${player2Points} points (${player2TossupCount} tossups)
                    </div>
                </div>
            ` + innerHTML;



            document.getElementById('root').innerHTML = innerHTML;
        });
});


document.getElementById('division').addEventListener('change', event => {
    const division = event.target.value;
    updatePlayerLists(packetName, division);
});

document.getElementById('packet').addEventListener('change', event => {
    const packetName = event.target.value;
    updateDivisionList(packetName);
});
