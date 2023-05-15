window.onload = () => {
    document.getElementById('username').innerHTML = getWithExpiry('username') ?? '';

    fetch('/auth/my-profile')
        .then(response => response.json())
        .then(data => {
            const recentQueries = document.getElementById('recent-queries');
            data.queries.forEach(query => {
                const li = document.createElement('li');
                li.innerHTML = `${query.query.queryString} (timestamp: ${query.createdAt})`;
                recentQueries.appendChild(li);
            });

            const tossup = data.bestBuzz.tossup;
            const buzzPoint = Math.floor((1 - data.bestBuzz.celerity) * tossup.question.length);
            tossup.question = `${tossup.question.slice(0, buzzPoint)} <span class="text-highlight">(#)</span> ${tossup.question.slice(buzzPoint)}`;
            document.getElementById('best-buzz').innerHTML = `
                <p>Celerity: ${data.bestBuzz.celerity}</p>
                <div class="card my-2">
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
        });
};

document.getElementById('logout').addEventListener('click', () => {
    fetch('/auth/logout', {
        method: 'POST',
    }).then(() => {
        localStorage.removeItem('username');
        window.location.href = '/users/login';
    });
});
