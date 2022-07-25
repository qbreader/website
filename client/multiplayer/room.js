// Do not escape room name as that is how it is stored on the server.
const ROOM_NAME = location.pathname.substring(13);

var socket;
var USER_ID;
var username;
var oldValidCategories = [];
var oldValidSubcategories = [];
var validCategories = [];
var validSubcategories = [];
var changedCategories = false;
var question = {}
var difficulties;
var setName;
var questionNumber = -1; // WARNING: 1-indexed (instead of 0-indexed, like in singleplayer)
var packetNumber = -1;
var timeoutID = -1

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
    socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);


async function loadAndReadTossup() {
    return await fetch(`/api/multiplayer/current-question?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(data => {
            if (data.endOfSet) {
                alert('No questions found.');
                return false;
            }
            // Stop reading the current question:
            clearTimeout(timeoutID);

            currentlyBuzzing = false;
            paused = false;
            question = data.question;
            setName = data.setName;
            packetNumber = data.packetNumber;
            questionNumber = data.questionNumber;
            questionText = question.question;
            questionTextSplit = questionText.split(' ');

            // Update question text:
            document.getElementById('set-name-info').innerHTML = data.setName;
            document.getElementById('packet-number-info').innerHTML = data.packetNumber;
            document.getElementById('question-number-info').innerHTML = data.questionNumber;
            document.getElementById('question').innerHTML = '';
            document.getElementById('answer').innerHTML = '';

            // update buttons:
            document.getElementById('buzz').innerHTML = 'Buzz';
            document.getElementById('buzz').disabled = false;
            document.getElementById('pause').innerHTML = 'Pause';
            document.getElementById('pause').disabled = false;

            // Read the question:
            recursivelyPrintTossup();
            return true;
        });
}


async function processSocketMessage(data) {
    switch (data.type) {
        case 'user-id':
            USER_ID = data.userId;
            break;
        case 'buzz':
            processBuzz(data.userId, data.username);
            break;
        case 'change-username':
            logEvent(data.oldUsername, 'changed their username to ' + data.username);
            document.getElementById('accordion-button-username-' + data.userId).innerHTML = data.username;
            sortPlayerAccordion();
            break;
        case 'chat':
            logEvent(data.username, `says "${data.message}"`);
            break;
        case 'clear-stats':
            clearStats(data.userId);
            sortPlayerAccordion();
            break;
        case 'difficulties':
        case 'packet-number':
            data.value = arrayToRange(data.value);
        case 'set-name':
            if (data.value.length > 0) {
                logEvent(data.username, `changed the ${data.type} to ${data.value}`);
            } else {
                logEvent(data.username, `cleared the ${data.type}`);
            }
            document.getElementById(data.type).value = data.value;
            break;
        case 'give-answer':
            processAnswer(data.userId, data.username, data.givenAnswer, data.score, data.celerity);
            break;
        case 'join':
            logEvent(data.username, `joined the game`);
            createPlayerAccordionItem(data);
            sortPlayerAccordion();
            break;
        case 'leave':
            logEvent(data.username, `left the game`);
            document.getElementById('accordion-' + data.userId).remove();
            break;
        case 'next':
            createTossupCard(question, setName, packetNumber, questionNumber);
            if (await loadAndReadTossup()) {
                if (document.getElementById('next').innerHTML === 'Skip') {
                    logEvent(data.username, `skipped the question`);
                } else {
                    logEvent(data.username, `went to the next question`);
                    document.getElementById('next').innerHTML = 'Skip';
                }
            }
            break;
        case 'pause':
            logEvent(data.username, `${paused ? 'un' : ''}paused the game`);
            pause();
            break;
        case 'reading-speed':
            logEvent(data.username, `changed the reading speed to ${data.value}`);
            document.getElementById('reading-speed').value = data.value;
            document.getElementById('reading-speed-display').innerHTML = data.value;
            break;
        case 'start':
            loadAndReadTossup();
            logEvent(data.username, `started the game`);
            break;
        case 'toggle-multiple-buzzes':
            logEvent(data.username, `${data.allowMultipleBuzzes ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
            document.getElementById('toggle-multiple-buzzes').checked = data.allowMultipleBuzzes;
            break;
        case 'toggle-select-by-difficulty':
            logEvent(data.username, `${data.selectByDifficulty ? 'enabled' : 'disabled'} select by set name`);
            if (data.selectByDifficulty) {
                document.getElementById('difficulty-settings').classList.add('d-none');
                document.getElementById('set-settings').classList.remove('d-none');
            } else {
                document.getElementById('difficulty-settings').classList.remove('d-none');
                document.getElementById('set-settings').classList.add('d-none');
            }
            break;
        case 'toggle-visibility':
            logEvent(data.username, `made the room ${data.isPublic ? 'public' : 'private'}`);
            document.getElementById('toggle-visibility').checked = data.isPublic;
            document.getElementById('chat').disabled = data.isPublic;
            break;
        case 'update-categories':
            logEvent(data.username, `updated the categories`);
            validCategories = data.categories;
            validSubcategories = data.subcategories;
            loadCategoryModal(validCategories, validSubcategories);
            break;
    }
}


/** Check if two arrays have the same elements, in any order.
 * @param {Array<String>} arr1
 * @param {Array<String>} arr2
 */
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    arr1 = arr1.sort();
    arr2 = arr2.sort();
    for (let i = 0; i < arr1.length; i++) {
        if (!arr2.includes(arr1[i])) return false;
        if (!arr1.includes(arr2[i])) return false;
    }
    return true;
}


function clearStats(userId) {
    Array.from(document.getElementsByClassName('stats-' + userId)).forEach(element => {
        element.innerHTML = '0';
    });
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


function createPlayerAccordionItem(player) {
    let { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, celerity = 0 } = player;
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
    celeritySpan.innerHTML = Math.round(1000 * celerity) / 1000;
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


function processAnswer(userId, username, givenAnswer, score, celerity) {
    logEvent(username, `${score > 0 ? '' : 'in'}correctly answered with "${givenAnswer}" for ${score} points`);

    document.getElementById('next').disabled = false;

    // Update question text and show answer:
    if (score > 0) {
        if (document.getElementById('question').innerHTML.indexOf('Question in progress...') === -1) {
            document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        } else {
            document.getElementById('question').innerHTML = question.question;
        }
        document.getElementById('answer').innerHTML = 'ANSWER: ' + question.answer;
        document.getElementById('next').innerHTML = 'Next';
        document.getElementById('buzz').disabled = true;
    } else {
        if (document.getElementById('toggle-multiple-buzzes').checked || userId !== USER_ID) {
            document.getElementById('buzz').disabled = false;
        } else {
            document.getElementById('buzz').disabled = true;
        }
        document.getElementById('pause').disabled = false;
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
    document.getElementById('celerity-' + userId).innerHTML = Math.round(1000 * celerity) / 1000;
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
            recursivelyPrintTossup();
        }, time * 0.9 * (125 - document.getElementById('reading-speed').value));
    } else {
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


document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    let answer = document.getElementById('answer-input').value;
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input-group').classList.add('d-none');

    let characterCount = document.getElementById('question').innerHTML.length;
    let celerity = 1 - characterCount / question.question.length;

    socket.send(JSON.stringify({
        type: 'give-answer',
        userId: USER_ID,
        username: username,
        givenAnswer: answer,
        celerity: celerity,
        inPower: !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)'),
        endOfQuestion: (questionTextSplit.length === 0),
    }));
});


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    socket.send(JSON.stringify({ type: 'buzz', userId: USER_ID, username: username }));
});



document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    if (!arraysEqual(oldValidCategories, validCategories) || !arraysEqual(oldValidSubcategories, validSubcategories)) {
        oldValidCategories = [...validCategories];
        oldValidSubcategories = [...validSubcategories];
        socket.send(JSON.stringify({ type: 'update-categories', username: username, categories: validCategories, subcategories: validSubcategories }));
    }
});


document.getElementById('chat').addEventListener('click', function (event) {
    this.blur();
    document.getElementById('chat-input-group').classList.remove('d-none');
    document.getElementById('chat-input').focus();
});


document.getElementById('chat-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    let message = document.getElementById('chat-input').value;
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');

    if (message.length === 0) return;

    socket.send(JSON.stringify({ type: 'chat', userId: USER_ID, username: username, message: message }));
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'clear-stats', userId: USER_ID, username: username }));
});


document.getElementById('difficulties').addEventListener('change', function () {
    let difficulties = rangeToArray(this.value);
    socket.send(JSON.stringify({ type: 'difficulties', value: difficulties }));
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    if (document.getElementById('set-name').value === '') {
        alert('Please choose a set.');
        return;
    }

    if (document.getElementById('next').innerHTML === 'Start') {
        socket.send(JSON.stringify({ type: 'start', userId: USER_ID, username: username }));
    } else {
        socket.send(JSON.stringify({ type: 'next', userId: USER_ID, username: username }));
    }

    document.getElementById('options').classList.add('d-none');
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').innerHTML = 'Next';
});


document.getElementById('packet-number').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'packet-number', username: username, value: rangeToArray(this.value, maxPacketNumber) }));
});


document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'pause', userId: USER_ID, username: username }));
});


document.getElementById('reading-speed').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'reading-speed', userId: USER_ID, username: username, value: this.value }));
});


document.getElementById('reading-speed').addEventListener('input', function () {
    document.getElementById('reading-speed-display').innerHTML = this.value;
});


document.getElementById('set-name').addEventListener('change', async function () {
    maxPacketNumber = await getNumPackets(this.value);
    if (this.value === '') {
        document.getElementById('packet-number').value = '';
    } else {
        document.getElementById('packet-number').value = `1-${maxPacketNumber}`;
    }

    socket.send(JSON.stringify({ type: 'set-name', username: username, value: this.value }));
});


document.getElementById('toggle-multiple-buzzes').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-multiple-buzzes', userId: USER_ID, username: username, allowMultipleBuzzes: this.checked }));
});


document.getElementById('toggle-select-by-difficulty').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-select-by-difficulty', userId: USER_ID, username: username, setName: document.getElementById('set-name').value, selectByDifficulty: this.checked })); 
});


document.getElementById('toggle-visibility').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-visibility', userId: USER_ID, username: username, isPublic: this.checked }));
});


document.getElementById('username').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'change-username', userId: USER_ID, oldUsername: username, username: this.value }));
    username = this.value;
    localStorage.setItem('username', username);
});


document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
    });
});


window.onload = () => {
    username = localStorage.getItem('username') || '';
    document.getElementById('username').value = username;
    connectToWebSocket();
    fetch(`/api/multiplayer/room?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(room => {
            question = room.question;
            setName = room.setName || '';
            packetNumber = room.packetNumber || 0;
            questionNumber = room.questionNumber || 0;
            difficulties = room.difficulties || [];
            validCategories = room.validCategories || [];
            validSubcategories = room.validSubcategories || [];

            document.getElementById('difficulties').value = arrayToRange(difficulties);
            document.getElementById('set-name').value = setName;
            document.getElementById('packet-number').value = arrayToRange(room.packetNumbers) || '';

            document.getElementById('set-name-info').innerHTML = setName;
            document.getElementById('packet-number-info').innerHTML = packetNumber || '-';
            document.getElementById('question-number-info').innerHTML = questionNumber || '-';

            document.getElementById('reading-speed').value = room.readingSpeed;
            document.getElementById('reading-speed-display').innerHTML = room.readingSpeed;
            document.getElementById('toggle-visibility').checked = room.public;
            document.getElementById('chat').disabled = room.public;
            document.getElementById('toggle-multiple-buzzes').checked = room.allowMultipleBuzzes;
            loadCategoryModal(validCategories, validSubcategories);

            if (room.questionInProgress) {
                document.getElementById('question').innerHTML = 'Question in progress...';
                document.getElementById('next').disabled = true;
            } else if (Object.keys(question).length > 0) {
                document.getElementById('question').innerHTML = room.question.question;
                document.getElementById('answer').innerHTML = 'ANSWER: ' + room.question.answer;
            } else {
                document.getElementById('next').innerHTML = 'Start';
                document.getElementById('next').classList.remove('btn-primary');
                document.getElementById('next').classList.add('btn-success');
            }

            Object.keys(room.players).forEach(player => {
                if (room.players[player].userId === USER_ID) return;
                room.players[player].celerity = room.players[player].celerity.correct.average;
                createPlayerAccordionItem(room.players[player]);
            });
        });
}