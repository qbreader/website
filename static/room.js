if (location.pathname.endsWith('/')) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

var socket;
const ROOM_NAME = location.pathname.substring(13);
var userId;
var username;
var validCategories = [];
var validSubcategories = [];
var currentQuestion = {}

function connectToWebSocket() {
    socket = new WebSocket(location.href.replace('http', 'ws'), ROOM_NAME);
    socket.onopen = function () {
        socket.send(JSON.stringify({ type: 'join', username: username }));
        console.log('Connected to websocket');
    }

    socket.onmessage = async function (event) {
        let data = JSON.parse(event.data);
        console.log(data);
        switch (data.type) {
            case 'user-id':
                userId = data.userId;
                break;
            case 'join':
                logEvent(data.username, `joined the game`);
                createPlayerAccordion(data.userId, data.username);
                break;
            case 'change-username':
                logEvent(data.oldUsername, 'changed their username to ' + data.username);
                document.getElementById('accordion-username-' + data.userId).innerHTML = data.username;
                break;
            case 'set-title':
            case 'packet-number':
                if (data.value.length > 0) {
                    logEvent(data.username, `changed the ${data.type} to ${data.value}`);
                } else {
                    logEvent(data.username, `cleared the ${data.type}`);
                }
                document.getElementById(data.type).value = data.value;
                break;
            case 'reading-speed':
                logEvent(data.username, `changed the reading speed to ${data.value}`);
                document.getElementById('reading-speed').value = data.value;
                document.getElementById('reading-speed-display').innerHTML = data.value;
                break;
            case 'update-subcategories':
                validSubcategories = data.value;
                loadCategoryModal(validCategories, validSubcategories);
                break;
            case 'update-categories':
                validCategories = data.value;
                loadCategoryModal(validCategories, validSubcategories);
                break;
            case 'start':
            case 'next':
                await loadAndReadQuestion();
                break;
            case 'buzz':
                processBuzz(data.userId, data.username);
                break;
            case 'answer':
                processAnswer(data.userId, data.username, data.givenAnswer, data.score);
                break;
            case 'pause':
                logEvent(data.username, `${paused ? 'un' : ''}paused the game`);
                pause();
                break;
            case 'leave':
                logEvent(data.username, `left the game`);
                document.getElementById('accordion-' + data.userId).remove();
                break;
        }
    }

    socket.onclose = function () {
        console.log('Disconnected from websocket');
    }
}

function createPlayerAccordion(userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0) {
    let button = document.createElement('button');
    button.className = 'accordion-button collapsed';
    button.type = 'button';
    button.setAttribute('data-bs-target', '#accordion-body-' + userId);
    button.setAttribute('data-bs-toggle', 'collapse');

    let buttonUsername = document.createElement('span');
    buttonUsername.id = 'accordion-username-' + userId;
    buttonUsername.innerHTML = username;

    button.appendChild(buttonUsername);
    button.innerHTML += '&nbsp;(';

    let buttonPoints = document.createElement('span');
    buttonPoints.id = 'accordion-username-points-' + userId;
    buttonPoints.innerHTML = points;
    button.appendChild(buttonPoints);
    button.innerHTML += '&nbsp;pts)';

    let h2 = document.createElement('h2');
    h2.className = 'accordion-header';
    h2.id = 'heading-' + userId;
    h2.appendChild(button);

    let accordionBody = document.createElement('div');
    accordionBody.className = 'accordion-body';
    // 0/0/0 with 0 tossups seen (0 pts, celerity: 0)

    let powersSpan = document.createElement('span');
    powersSpan.innerHTML = powers;
    powersSpan.id = 'powers-' + userId;
    accordionBody.appendChild(powersSpan);
    accordionBody.innerHTML += '/';

    let tensSpan = document.createElement('span');
    tensSpan.innerHTML = tens;
    tensSpan.id = 'tens-' + userId;
    accordionBody.appendChild(tensSpan);
    accordionBody.innerHTML += '/';

    let negsSpan = document.createElement('span');
    negsSpan.innerHTML = negs;
    negsSpan.id = 'negs-' + userId;
    accordionBody.appendChild(negsSpan);

    accordionBody.innerHTML += ' with '

    let tuhSpan = document.createElement('span');
    tuhSpan.innerHTML = tuh;
    tuhSpan.id = 'tuh-' + userId;
    accordionBody.appendChild(tuhSpan);

    accordionBody.innerHTML += ' tossups seen (';

    let pointsSpan = document.createElement('span');
    pointsSpan.innerHTML = points;
    pointsSpan.id = 'points-' + userId;
    accordionBody.appendChild(pointsSpan);

    accordionBody.innerHTML += ' pts, celerity: 0)';

    let div = document.createElement('div');
    div.className = 'accordion-collapse collapse';
    div.id = 'accordion-body-' + userId;
    div.appendChild(accordionBody);

    let accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.id = 'accordion-' + userId;
    accordionItem.appendChild(h2);
    accordionItem.appendChild(div);
    document.getElementById('player-accordion').appendChild(accordionItem);
}

function logEvent(username, message) {
    let i = document.createElement('i');
    i.innerHTML = `<b>${username}</b> ${message}`;
    let li = document.createElement('li');
    li.appendChild(i);
    document.getElementById('event-log').prepend(li);
}

async function loadAndReadQuestion() {
    fetch(`/api/get-current-question?roomName=${ROOM_NAME}`)
        .then(response => response.json())
        .then(data => {
            currentQuestion = data.question;
            questionText = currentQuestion.question;
            questionTextSplit = questionText.split(' ');
            document.getElementById('set-title-info').innerHTML = data.setTitle;
            document.getElementById('packet-number-info').innerHTML = data.packetNumber;
            document.getElementById('question-number-info').innerHTML = data.questionNumber + 1;
            readQuestion();
        });
}

function processBuzz(userId, username) {
    logEvent(username, `buzzed`);

    clearTimeout(timeoutID);

    document.getElementById('question').innerHTML += '(#) '; // Include buzzpoint

    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('next').disabled = true;
}

function processAnswer(userId, username, givenAnswer, score) {
    logEvent(username, `${score > 0 ? '' : 'in'}correctly answered with "${givenAnswer}" for ${score} points`);

    // Update question text and show answer:
    if (score > 0) {
        document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        document.getElementById('answer').innerHTML = 'ANSWER: ' + currentQuestion.answer;
        document.getElementById('next').innerHTML = 'Next';
        document.getElementById('next').disabled = false;
    } else {
        document.getElementById('buzz').disabled = false;
        printWord();
    }

    if (score > 10) {
        document.getElementById('powers-' + userId).innerHTML = parseInt(document.getElementById('powers-' + userId).innerHTML) + 1;
    } else if (score === 10) {
        document.getElementById('tens-' + userId).innerHTML = parseInt(document.getElementById('tens-' + userId).innerHTML) + 1;
    } else if (score < 0) {
        document.getElementById('negs-' + userId).innerHTML = parseInt(document.getElementById('negs-' + userId).innerHTML) + 1;
    }

    document.getElementById('tuh-' + userId).innerHTML = parseInt(document.getElementById('tuh-' + userId).innerHTML) + 1;
    document.getElementById('points-' + userId).innerHTML = parseInt(document.getElementById('points-' + userId).innerHTML) + score;
    document.getElementById('accordion-username-points-' + userId).innerHTML = parseInt(document.getElementById('accordion-username-points-' + userId).innerHTML) + score;
}

// Game logic
document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'start', userId: userId, username: username }));
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    socket.send(JSON.stringify({ type: 'buzz', userId: userId, username: username }));
});

document.getElementById('form').addEventListener('submit', function (event) {
    event.preventDefault();

    let answer = document.getElementById('answer-input').value;
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input-group').classList.add('d-none');

    let characterCount = document.getElementById('question').innerHTML.length;
    let celerity = 1 - characterCount / document.getElementById('question').innerHTML.length;

    fetch('/api/give-answer', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            roomName: ROOM_NAME,
            userId: userId,
            answer: answer,
            celerity: celerity,
            inPower: !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)'),
            endOfQuestion: (questionTextSplit.length === 0)
        })
    }).then((response) => {
        return response.json();
    }).then((data) => {
        socket.send(JSON.stringify({ 'type': 'answer', userId: userId, username: username, givenAnswer: answer, score: data.score }));
    });
});

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    if (document.getElementById('set-title').value === '') {
        alert('Please choose a set.');
        return;
    }
    socket.send(JSON.stringify({ type: 'next', userId: userId, username: username }));
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'pause', userId: userId, username: username }));
});

// Other event listeners
document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        socket.send(JSON.stringify({ type: 'update-categories', username: username, value: validCategories }));
        socket.send(JSON.stringify({ type: 'update-subcategories', username: username, value: validSubcategories }));
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        socket.send(JSON.stringify({ type: 'update-subcategories', username: username, value: validSubcategories }))
    });
});

document.getElementById('set-title').addEventListener('change', async function () {
    let [year, name] = parseSetTitle(this.value);
    maxPacketNumber = await getNumPackets(year, name);
    document.getElementById('packet-number').value = parsePacketNumbers('', maxPacketNumber);
    socket.send(JSON.stringify({ type: 'set-title', username: username, value: this.value }));
});

document.getElementById('packet-number').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'packet-number', username: username, value: parsePacketNumbers(this.value, maxPacketNumber) }));
});

document.getElementById('question-select').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'question-number', username: username, value: this.value }));
});

document.getElementById('username').addEventListener('change', function () {
    socket.send(JSON.stringify({ 'type': 'change-username', userId: userId, oldUsername: username, username: this.value }));
    username = this.value;
    localStorage.setItem('username', username);
});

document.getElementById('reading-speed').addEventListener('change', function () {
    socket.send(JSON.stringify({ 'type': 'reading-speed', userId: userId, username: username, value: this.value }));
});

window.onload = () => {
    username = localStorage.getItem('username') || '';
    document.getElementById('username').value = username;
    connectToWebSocket();
    fetch(`/api/get-room?roomName=${encodeURI(ROOM_NAME)}`)
        .then(response => response.json())
        .then(data => {
            if (data.setTitle) {
                document.getElementById('start').disabled = true;
                document.getElementById('next').disabled = false;
            }
            document.getElementById('set-title').value = data.setTitle;
            document.getElementById('packet-number').value = data.packetNumbers;

            document.getElementById('set-title-info').innerHTML = data.setTitle;
            document.getElementById('packet-number-info').innerHTML = data.packetNumber;
            document.getElementById('question-number-info').innerHTML = data.currentQuestionNumber + 1;
            validCategories = data.validCategories;
            validSubcategories = data.validSubcategories;
            loadCategoryModal(validCategories, validSubcategories);
            Object.keys(data.players).forEach(player => {
                if (data.players[player].userId === userId) return;
                createPlayerAccordion(data.players[player].userId, data.players[player].username, data.players[player].powers, data.players[player].tens, data.players[player].negs, data.players[player].tuh, data.players[player].points);
            });
        });
}