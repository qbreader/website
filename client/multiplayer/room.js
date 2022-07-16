// Do not escape room name as that is how it is stored on the server.
const ROOM_NAME = location.pathname.substring(13);

var socket;
var USER_ID;
var username;
var validCategories = [];
var validSubcategories = [];
var currentQuestion = {}
var timeoutID = -1;

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
    socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);

async function processSocketMessage(data) {
    switch (data.type) {
        case 'user-id':
            USER_ID = data.userId;
            break;
        case 'join':
            logEvent(data.username, `joined the game`);
            createPlayerAccordionItem(data.userId, data.username);
            sortPlayerAccordion();
            break;
        case 'change-username':
            logEvent(data.oldUsername, 'changed their username to ' + data.username);
            document.getElementById('accordion-button-username-' + data.userId).innerHTML = data.username;
            sortPlayerAccordion();
            break;
        case 'clear-stats':
            clearStats(data.userId);
            sortPlayerAccordion();
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
        case 'next':
            createQuestionCard(currentQuestion);
            if (await loadAndReadTossup()) {
                if (document.getElementById('next').innerHTML === 'Skip') {
                    logEvent(data.username, `skipped the question`);
                } else {
                    logEvent(data.username, `went to the next question`);
                }
            }
            break;
        case 'start':
            loadAndReadTossup();
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
        case 'toggle-visibility':
            logEvent(data.username, `made the room ${data.isPublic ? 'public' : 'private'}`);
            document.getElementById('toggle-visibility').checked = data.isPublic;
            document.getElementById('chat').disabled = data.isPublic;
            break;
        case 'chat':
            logEvent(data.username, `says "${data.message}"`);
            break;
        case 'toggle-multiple-buzzes':
            logEvent(data.username, `${data.allowMultipleBuzzes ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
            document.getElementById('toggle-multiple-buzzes').checked = data.allowMultipleBuzzes;
            break;
    }
}

function connectToWebSocket() {
    socket = new WebSocket(location.href.replace('http', 'ws'), ROOM_NAME);
    socket.onopen = function () {
        socket.send(JSON.stringify({ type: 'join', username: username }));
        console.log('Connected to websocket');
    }

    socket.onmessage = function (event) {
        let data = JSON.parse(event.data);
        console.log(data);
        processSocketMessage(data);
    }

    socket.onclose = function () {
        console.log('Disconnected from websocket');
        clearInterval(PING_INTERVAL_ID);
    }
}

function clearStats(userId) {
    Array.from(document.getElementsByClassName('stats-' + userId)).forEach(element => {
        element.innerHTML = '0';
    });
}

function createPlayerAccordionItem(userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0) {
    let button = document.createElement('button');
    button.className = 'accordion-button collapsed';
    button.type = 'button';
    button.setAttribute('data-bs-target', '#accordion-body-' + userId);
    button.setAttribute('data-bs-toggle', 'collapse');

    let buttonUsername = document.createElement('span');
    buttonUsername.id = 'accordion-button-username-' + userId;
    buttonUsername.innerHTML = username;

    button.appendChild(buttonUsername);
    button.innerHTML += '&nbsp;(';

    let buttonPoints = document.createElement('span');
    buttonPoints.id = 'accordion-button-points-' + userId;
    buttonPoints.innerHTML = points;
    buttonPoints.classList.add('stats-' + userId);
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
    powersSpan.classList.add('stats');
    powersSpan.classList.add('stats-' + userId);
    accordionBody.appendChild(powersSpan);
    accordionBody.innerHTML += '/';

    let tensSpan = document.createElement('span');
    tensSpan.innerHTML = tens;
    tensSpan.id = 'tens-' + userId;
    tensSpan.classList.add('stats');
    tensSpan.classList.add('stats-' + userId);
    accordionBody.appendChild(tensSpan);
    accordionBody.innerHTML += '/';

    let negsSpan = document.createElement('span');
    negsSpan.innerHTML = negs;
    negsSpan.id = 'negs-' + userId;
    negsSpan.classList.add('stats');
    negsSpan.classList.add('stats-' + userId);
    accordionBody.appendChild(negsSpan);

    accordionBody.innerHTML += ' with '

    let tuhSpan = document.createElement('span');
    tuhSpan.innerHTML = tuh;
    tuhSpan.id = 'tuh-' + userId;
    tuhSpan.classList.add('tuh');
    tuhSpan.classList.add('stats');
    tuhSpan.classList.add('stats-' + userId);
    accordionBody.appendChild(tuhSpan);

    accordionBody.innerHTML += ' tossups seen (';

    let pointsSpan = document.createElement('span');
    pointsSpan.innerHTML = points;
    pointsSpan.id = 'points-' + userId;
    pointsSpan.classList.add('points');
    pointsSpan.classList.add('stats-' + userId);
    accordionBody.appendChild(pointsSpan);

    accordionBody.innerHTML += ' pts, celerity: ';

    let celeritySpan = document.createElement('span');
    celeritySpan.innerHTML = 0;
    celeritySpan.id = 'celerity-' + userId;
    celeritySpan.classList.add('stats');
    celeritySpan.classList.add('stats-' + userId);
    accordionBody.appendChild(celeritySpan);

    accordionBody.innerHTML += ')';

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
    let div = document.createElement('li');
    div.appendChild(i);
    document.getElementById('room-history').prepend(div);
}

async function loadAndReadTossup() {
    return await fetch(`/api/get-current-question?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(data => {
            if (data.isEndOfSet) {
                alert('You have reached the end of the set.');
                return false;
            }
            // Stop reading the current question:
            clearTimeout(timeoutID);

            currentlyBuzzing = false;
            paused = false;
            currentQuestion = data.question;
            questionText = currentQuestion.question;
            questionTextSplit = questionText.split(' ');

            // Update question text:
            document.getElementById('set-title-info').innerHTML = data.setTitle;
            document.getElementById('packet-number-info').innerHTML = data.packetNumber;
            document.getElementById('question-number-info').innerHTML = data.questionNumber + 1;
            document.getElementById('question').innerHTML = '';
            document.getElementById('answer').innerHTML = '';

            // update buttons:
            document.getElementById('buzz').innerHTML = 'Buzz';
            document.getElementById('buzz').disabled = false;
            document.getElementById('pause').innerHTML = 'Pause';
            document.getElementById('pause').disabled = false;
            document.getElementById('next').innerHTML = 'Skip';

            // Read the question:
            recursivelyPrintTossup();
            return true;
        });
}

/**
 * Toggles pausing or resuming the tossup.
 */
function pause() {
    if (paused) {
        document.getElementById('buzz').removeAttribute('disabled');
        document.getElementById('pause').innerHTML = 'Pause';
        recursivelyPrintTossup();
    }
    else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').innerHTML = 'Resume';
        clearTimeout(timeoutID);
    }
    paused = !paused;
}

function processAnswer(userId, username, givenAnswer, score) {
    logEvent(username, `${score > 0 ? '' : 'in'}correctly answered with "${givenAnswer}" for ${score} points`);

    document.getElementById('next').disabled = false;

    // Update question text and show answer:
    if (score > 0) {
        if (document.getElementById('question').innerHTML.indexOf('Question in progress...') === -1) {
            document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        } else {
            document.getElementById('question').innerHTML = currentQuestion.question;
        }
        document.getElementById('answer').innerHTML = 'ANSWER: ' + currentQuestion.answer;
        document.getElementById('next').innerHTML = 'Next';
        document.getElementById('buzz').disabled = true;
    } else {
        if (document.getElementById('toggle-multiple-buzzes').checked || userId !== USER_ID) {
            document.getElementById('buzz').disabled = false;
        } else {
            document.getElementById('buzz').disabled = true;
        }
        recursivelyPrintTossup();
    }

    if (score > 0) {
        Array.from(document.getElementsByClassName('tuh')).forEach(element => {
            element.innerHTML = parseInt(element.innerHTML) + 1;
        });
    }

    if (score > 10) {
        document.getElementById('powers-' + userId).innerHTML = parseInt(document.getElementById('powers-' + userId).innerHTML) + 1;
    } else if (score === 10) {
        document.getElementById('tens-' + userId).innerHTML = parseInt(document.getElementById('tens-' + userId).innerHTML) + 1;
    } else if (score < 0) {
        document.getElementById('negs-' + userId).innerHTML = parseInt(document.getElementById('negs-' + userId).innerHTML) + 1;
    }

    document.getElementById('points-' + userId).innerHTML = parseInt(document.getElementById('points-' + userId).innerHTML) + score;
    document.getElementById('accordion-button-points-' + userId).innerHTML = parseInt(document.getElementById('accordion-button-points-' + userId).innerHTML) + score;

    sortPlayerAccordion();
}

function processBuzz(userId, username) {
    logEvent(username, `buzzed`);

    clearTimeout(timeoutID);

    document.getElementById('question').innerHTML += '(#) '; // Include buzzpoint

    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('next').disabled = true;
}

/**
 * Recursively reads the question based on the reading speed.
 */
function recursivelyPrintTossup() {
    if (!currentlyBuzzing && questionTextSplit.length > 0) {
        let word = questionTextSplit.shift();
        document.getElementById('question').innerHTML += word + ' ';

        //calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === "(*)")
            time = 0;

        timeoutID = window.setTimeout(() => {
            recursivelyPrintTossup(); ``
        }, time * 0.75 * (150 - document.getElementById('reading-speed').value));
    }
    else {
        document.getElementById('pause').disabled = true;
    }
}

function sortPlayerAccordion(descending = true) {
    let accordion = document.getElementById('player-accordion');
    let items = Array.from(accordion.children);
    items.sort((a, b) => {
        let aPoints = parseInt(document.getElementById('points-' + a.id.substring(10)).innerHTML);
        let bPoints = parseInt(document.getElementById('points-' + b.id.substring(10)).innerHTML);
        // if points are equal, sort alphabetically by username
        if (aPoints === bPoints) {
            let aUsername = document.getElementById('accordion-button-username-' + a.id.substring(10)).innerHTML;
            let bUsername = document.getElementById('accordion-button-username-' + b.id.substring(10)).innerHTML;
            return descending ? aUsername.localeCompare(bUsername) : bUsername.localeCompare(aUsername);
        }
        return descending ? bPoints - aPoints : aPoints - bPoints;
    }).forEach(item => {
        accordion.appendChild(item);
    });
}

// Game logic
document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    if (document.getElementById('set-title').value === '') {
        alert('Please choose a set.');
        return;
    }
    socket.send(JSON.stringify({ type: 'start', userId: USER_ID, username: username }));
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    socket.send(JSON.stringify({ type: 'buzz', userId: USER_ID, username: username }));
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'pause', userId: USER_ID, username: username }));
});

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    if (document.getElementById('set-title').value === '') {
        alert('Please choose a set.');
        return;
    }
    socket.send(JSON.stringify({ type: 'next', userId: USER_ID, username: username }));
});

document.getElementById('chat').addEventListener('click', function (event) {
    this.blur();
    document.getElementById('chat-input-group').classList.remove('d-none');
    document.getElementById('chat-input').focus();
});

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'clear-stats', userId: USER_ID, username: username }));
});

document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

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
            userId: USER_ID,
            answer: answer,
            celerity: celerity,
            inPower: !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)'),
            endOfQuestion: (questionTextSplit.length === 0)
        })
    }).then((response) => {
        return response.json();
    }).then((data) => {
        socket.send(JSON.stringify({ 'type': 'answer', userId: USER_ID, username: username, givenAnswer: answer, score: data.score }));
    });
});

document.getElementById('chat-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    let message = document.getElementById('chat-input').value;
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');

    if (message.length === 0) return;

    socket.send(JSON.stringify({ 'type': 'chat', userId: USER_ID, username: username, message: message }));
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

document.getElementById('username').addEventListener('change', function () {
    socket.send(JSON.stringify({ 'type': 'change-username', userId: USER_ID, oldUsername: username, username: this.value }));
    username = this.value;
    localStorage.setItem('username', username);
});

document.getElementById('set-title').addEventListener('change', async function () {
    let [year, name] = parseSetTitle(this.value);
    maxPacketNumber = await getNumPackets(year, name);
    document.getElementById('packet-number').value = packetNumberStringToArray('', maxPacketNumber);
    socket.send(JSON.stringify({ type: 'set-title', username: username, value: this.value }));
});

document.getElementById('packet-number').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'packet-number', username: username, value: packetNumberStringToArray(this.value, maxPacketNumber) }));
});

document.getElementById('question-number').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'question-number', username: username, value: this.value }));
});

document.getElementById('reading-speed').addEventListener('change', function () {
    socket.send(JSON.stringify({ 'type': 'reading-speed', userId: USER_ID, username: username, value: this.value }));
});

document.getElementById('toggle-visibility').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ 'type': 'toggle-visibility', userId: USER_ID, username: username, isPublic: this.checked }));
});

document.getElementById('toggle-multiple-buzzes').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ 'type': 'toggle-multiple-buzzes', userId: USER_ID, username: username, allowMultipleBuzzes: this.checked }));
});

window.onload = () => {
    username = localStorage.getItem('username') || '';
    document.getElementById('username').value = username;
    connectToWebSocket();
    fetch(`/api/get-room?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(data => {
            if (data.setTitle) {
                document.getElementById('start').disabled = true;
                document.getElementById('next').disabled = false;
            }
            document.getElementById('set-title').value = data.setTitle || '';
            document.getElementById('packet-number').value = data.packetNumbers || [];

            document.getElementById('set-title-info').innerHTML = data.setTitle || '';
            document.getElementById('packet-number-info').innerHTML = data.packetNumber || 0;
            document.getElementById('question-number-info').innerHTML = (data.currentQuestionNumber || 0) + 1;

            document.getElementById('toggle-visibility').checked = data.isPublic;
            document.getElementById('chat').disabled = data.isPublic;
            document.getElementById('toggle-multiple-buzzes').checked = data.allowMultipleBuzzes;

            validCategories = data.validCategories || [];
            validSubcategories = data.validSubcategories || [];
            loadCategoryModal(validCategories, validSubcategories);

            currentQuestion = data.currentQuestion;
            if (data.isQuestionInProgress) {
                document.getElementById('question').innerHTML = 'Question in progress...';
                document.getElementById('next').disabled = true;
            } else {
                document.getElementById('question').innerHTML = data.currentQuestion.question || '';
                document.getElementById('answer').innerHTML = 'ANSWER: ' + data.currentQuestion.answer || '';
            }

            Object.keys(data.players).forEach(player => {
                if (data.players[player].userId === USER_ID) return;
                createPlayerAccordionItem(data.players[player].userId, data.players[player].username, data.players[player].powers, data.players[player].tens, data.players[player].negs, data.players[player].tuh, data.players[player].points);
            });
        });
}