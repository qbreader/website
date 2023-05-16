fetch('/auth/get-stats-tossup')
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
                    <p>Celerity: ${data.bestBuzz.celerity}</p>
                `;
        }

        if (data.categoryStats) {
            data.categoryStats.forEach(categoryStat => {
                const category = categoryStat._id;
                const averageCelerity = categoryStat.count > 0 ? 0.001 * Math.round(1000 * categoryStat.totalCelerity / categoryStat.count) : 0;
                const averagePoints = categoryStat.count > 0 ? 0.01 * Math.round(100 * categoryStat.totalPoints / categoryStat.count) : 0;
                document.getElementById('category-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${category}</th>
                        <td>${categoryStat.numCorrect}</td>
                        <td>${categoryStat.count}</td>
                        <td>${averageCelerity}</td>
                        <td>${categoryStat.totalPoints}</td>
                        <td>${averagePoints}</td>
                    </tr>
                `;
            });
        }

        if (data.subcategoryStats) {
            data.subcategoryStats.forEach(subcategoryStat => {
                const subcategory = subcategoryStat._id;
                const averageCelerity = subcategoryStat.count > 0 ? 0.001 * Math.round(1000 * subcategoryStat.totalCelerity / subcategoryStat.count) : 0;
                const averagePoints = subcategoryStat.count > 0 ? 0.01 * Math.round(100 * subcategoryStat.totalPoints / subcategoryStat.count) : 0;
                document.getElementById('subcategory-stats-body').innerHTML += `
                    <tr>
                        <th scope="row">${subcategory}</th>
                        <td>${subcategoryStat.numCorrect}</td>
                        <td>${subcategoryStat.count}</td>
                        <td>${averageCelerity}</td>
                        <td>${subcategoryStat.totalPoints}</td>
                        <td>${averagePoints}</td>
                    </tr>
                `;
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
