function fetchTossupStats({ difficulties = '', setName = '', includeMultiplayer = true, includeSingleplayer = true } = {}) {
    fetch(`/auth/user-stats/tossup?difficulties=${encodeURIComponent(difficulties)}&setName=${encodeURIComponent(setName)}&includeMultiplayer=${encodeURIComponent(includeMultiplayer)}&includeSingleplayer=${encodeURIComponent(includeSingleplayer)}`)
        .then(response => {
            if (response.status === 401) {
                throw new Error('Unauthorized');
            }
            return response;
        })
        .then(response => response.json())
        .then(data => {
            if (data.bestBuzz && data.bestBuzz.tossup) {
                const tossup = data.bestBuzz.tossup;
                const buzzPoint = Math.floor((1 - data.bestBuzz.celerity) * tossup.question.length);
                tossup.question = `${tossup.question.slice(0, buzzPoint)} <span class="text-highlight">(#)</span> ${tossup.question.slice(buzzPoint)}`;
                document.getElementById('best-buzz').innerHTML = `
                    <p>Celerity: ${data.bestBuzz.celerity}</p>
                    <div class="card mb-2">
                        <div class="card-header">
                            <b>${tossup.setName} | ${tossup.category} | ${tossup.subcategory} ${tossup.alternate_subcategory ? ' (' + tossup.alternate_subcategory + ')' : ''} | ${tossup.difficulty}</b>
                            <b class="float-end">Packet ${tossup.packetNumber} | Question ${tossup.questionNumber}</b>
                        </div>
                        <div class="card-container" id="question-${tossup._id}">
                            <div class="card-body">
                                <span>${tossup.question}</span>&nbsp;
                                <hr></hr>
                                <div><b>ANSWER:</b> ${tossup.formatted_answer ?? tossup.answer}</div>
                            </div>
                            <div class="card-footer">
                                <small class="text-muted">${tossup.packetName ? 'Packet ' + tossup.packetName : '&nbsp;'}</small>
                                <small class="text-muted float-end">
                                    <a href="#" onClick={onClick} id="report-question-${tossup._id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">
                                        Report Question
                                    </a>
                                </small>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                document.getElementById('best-buzz').innerHTML = '';
            }

            if (data.categoryStats) {
                let innerHTML = '';
                data.categoryStats.forEach(categoryStat => {
                    const category = categoryStat._id;
                    const averageCelerity = categoryStat.numCorrect > 0 ? (categoryStat.totalCorrectCelerity / categoryStat.numCorrect).toFixed(3) : 0;
                    innerHTML += `
                    <tr>
                        <th scope="row">${category}</th>
                        <td>${categoryStat.count}</td>
                        <td>${categoryStat['15s']}</td>
                        <td>${categoryStat['10s']}</td>
                        <td>${categoryStat['-5s']}</td>
                        <td>${averageCelerity}</td>
                        <td>${categoryStat.totalPoints}</td>
                        <td>${categoryStat.pptu.toFixed(2)}</td>
                    </tr>
                `;
                });
                document.getElementById('category-stats-body').innerHTML = innerHTML;
            }

            if (data.subcategoryStats) {
                let innerHTML = '';
                data.subcategoryStats.forEach(subcategoryStat => {
                    const subcategory = subcategoryStat._id;
                    const averageCelerity = subcategoryStat.numCorrect > 0 ? (subcategoryStat.totalCorrectCelerity / subcategoryStat.numCorrect).toFixed(3) : 0;
                    innerHTML += `
                    <tr>
                        <th scope="row">${subcategory}</th>
                        <td>${subcategoryStat.count}</td>
                        <td>${subcategoryStat['15s']}</td>
                        <td>${subcategoryStat['10s']}</td>
                        <td>${subcategoryStat['-5s']}</td>
                        <td>${averageCelerity}</td>
                        <td>${subcategoryStat.totalPoints}</td>
                        <td>${subcategoryStat.pptu.toFixed(2)}</td>
                    </tr>
                `;
                });
                document.getElementById('subcategory-stats-body').innerHTML = innerHTML;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

fetchTossupStats();

function onSubmit(event) {
    event.preventDefault();
    const setName = document.getElementById('set-name').value;
    const difficulties = getDifficulties();
    const includeMultiplayer = document.getElementById('include-multiplayer').checked;
    const includeSingleplayer = document.getElementById('include-singleplayer').checked;
    fetchTossupStats({ difficulties, setName, includeMultiplayer, includeSingleplayer });
}
