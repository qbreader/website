// Do not escape room name as that is how it is stored on the server.
const ROOM_NAME = location.pathname.substring(13);

var socket;
var USER_ID;
var username;
var validCategories = [];
var validSubcategories = [];
var changedCategories = false;
var tossup = {};
var difficulties;

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
    socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);


function next() {
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').disabled = false;

    fetch(`/api/multiplayer/current-question?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(data => {
            if (data.endOfSet) {
                alert('No questions found.');
                return false;
            }

            // Update question text:
            document.getElementById('set-name-info').innerHTML = data.setName;
            document.getElementById('packet-number-info').innerHTML = data.packetNumber;
            document.getElementById('question-number-info').innerHTML = data.questionNumber;

            tossup = data.question;

            return true;
        });
}


async function processSocketMessage(data) {
    switch (data.type) {
        case 'user-id':
            USER_ID = data.userId;
            socket.send(JSON.stringify({ type: 'join', userId: USER_ID, username: username }));
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
            logEvent(data.username, `went to the next question`);
            tossup.question = document.getElementById('question').innerHTML;
            createTossupCard(tossup, document.getElementById('set-name-info').innerHTML);
            next();
            break;
        case 'pause':
            logEvent(data.username, `${data.paused ? 'un' : ''}paused the game`);
            break;
        case 'reading-speed':
            logEvent(data.username, `changed the reading speed to ${data.value}`);
            document.getElementById('reading-speed').value = data.value;
            document.getElementById('reading-speed-display').innerHTML = data.value;
            break;
        case 'skip':
            logEvent(data.username, `skipped the question`);
            tossup.question = document.getElementById('question').innerHTML;
            createTossupCard(tossup, document.getElementById('set-name-info').innerHTML);
            next();
            break;
        case 'start':
            logEvent(data.username, `started the game`);
            next();
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
            logEvent(data.username, `made the room ${data.public ? 'public' : 'private'}`);
            document.getElementById('toggle-visibility').checked = data.public;
            document.getElementById('chat').disabled = data.public;
            break;
        case 'update-categories':
            logEvent(data.username, `updated the categories`);
            validCategories = data.categories;
            validSubcategories = data.subcategories;
            loadCategoryModal(validCategories, validSubcategories);
            break;
        case 'update-answer':
            document.getElementById('answer').innerHTML = 'ANSWER: ' + data.answer;
            break;
        case 'update-question':
            document.getElementById('question').innerHTML += data.word + ' ';
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
        console.log('Connected to websocket');
    }

    socket.onmessage = function (event) {
        let data = JSON.parse(event.data);
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

    accordionBody.innerHTML += ', '

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
        document.getElementById('next').innerHTML = 'Next';
        document.getElementById('buzz').disabled = true;
    } else {
        if (document.getElementById('toggle-multiple-buzzes').checked || userId !== USER_ID) {
            document.getElementById('buzz').disabled = false;
        } else {
            document.getElementById('buzz').disabled = true;
        }
        document.getElementById('pause').disabled = false;
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

    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('next').disabled = true;
}


/**
 * Generate a random adjective-noun pair.
 */
function randomUsername() {
    const ADJECTIVES = ['adaptable', 'adept', 'affectionate', 'agreeable', 'alluring', 'amazing', 'ambitious', 'amiable', 'ample', 'approachable', 'awesome', 'blithesome', 'bountiful', 'brave', 'breathtaking', 'bright', 'brilliant', 'capable', 'captivating', 'charming', 'competitive', 'confident', 'considerate', 'courageous', 'creative', 'dazzling', 'determined', 'devoted', 'diligent', 'diplomatic', 'dynamic', 'educated', 'efficient', 'elegant', 'enchanting', 'energetic', 'engaging', 'excellent', 'fabulous', 'faithful', 'fantastic', 'favorable', 'fearless', 'flexible', 'focused', 'fortuitous', 'frank', 'friendly', 'funny', 'generous', 'giving', 'gleaming', 'glimmering', 'glistening', 'glittering', 'glowing', 'gorgeous', 'gregarious', 'gripping', 'hardworking', 'helpful', 'hilarious', 'honest', 'humorous', 'imaginative', 'incredible', 'independent', 'inquisitive', 'insightful', 'kind', 'knowledgeable', 'likable', 'lovely', 'loving', 'loyal', 'lustrous', 'magnificent', 'marvelous', 'mirthful', 'moving', 'nice', 'optimistic', 'organized', 'outstanding', 'passionate', 'patient', 'perfect', 'persistent', 'personable', 'philosophical', 'plucky', 'polite', 'powerful', 'productive', 'proficient', 'propitious', 'qualified', 'ravishing', 'relaxed', 'remarkable', 'resourceful', 'responsible', 'romantic', 'rousing', 'sensible', 'shimmering', 'shining', 'sincere', 'sleek', 'sparkling', 'spectacular', 'spellbinding', 'splendid', 'stellar', 'stunning', 'stupendous', 'super', 'technological', 'thoughtful', 'twinkling', 'unique', 'upbeat', 'vibrant', 'vivacious', 'vivid', 'warmhearted', 'willing', 'wondrous', 'zestful'];
    const ANIMALS = ['aardvark', 'alligator', 'alpaca', 'anaconda', 'ant', 'anteater', 'antelope', 'aphid', 'armadillo', 'baboon', 'badger', 'barracuda', 'bat', 'beaver', 'bedbug', 'bee', 'bird', 'bison', 'bobcat', 'buffalo', 'butterfly', 'buzzard', 'camel', 'carp', 'cat', 'caterpillar', 'catfish', 'cheetah', 'chicken', 'chimpanzee', 'chipmunk', 'cobra', 'cod', 'condor', 'cougar', 'cow', 'coyote', 'crab', 'cricket', 'crocodile', 'crow', 'cuckoo', 'deer', 'dinosaur', 'dog', 'dolphin', 'donkey', 'dove', 'dragonfly', 'duck', 'eagle', 'eel', 'elephant', 'emu', 'falcon', 'ferret', 'finch', 'fish', 'flamingo', 'flea', 'fly', 'fox', 'frog', 'goat', 'goose', 'gopher', 'gorilla', 'hamster', 'hare', 'hawk', 'hippopotamus', 'horse', 'hummingbird', 'husky', 'iguana', 'impala', 'kangaroo', 'lemur', 'leopard', 'lion', 'lizard', 'llama', 'lobster', 'margay', 'monkey', 'moose', 'mosquito', 'moth', 'mouse', 'mule', 'octopus', 'orca', 'ostrich', 'otter', 'owl', 'ox', 'oyster', 'panda', 'parrot', 'peacock', 'pelican', 'penguin', 'perch', 'pheasant', 'pig', 'pigeon', 'porcupine', 'quagga', 'rabbit', 'raccoon', 'rat', 'rattlesnake', 'rooster', 'seal', 'sheep', 'skunk', 'sloth', 'snail', 'snake', 'spider', 'tiger', 'whale', 'wolf', 'wombat', 'zebra'];
    const ADJECTIVE_INDEX = Math.floor(Math.random() * ADJECTIVES.length);
    const ANIMAL_INDEX = Math.floor(Math.random() * ANIMALS.length);
    return `${ADJECTIVES[ADJECTIVE_INDEX]}-${ANIMALS[ANIMAL_INDEX]}`;
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
    let celerity = 1 - characterCount / tossup.question.length;

    socket.send(JSON.stringify({
        type: 'give-answer',
        userId: USER_ID,
        username: username,
        givenAnswer: answer,
        celerity: celerity,
    }));
});


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    socket.send(JSON.stringify({ type: 'buzz', userId: USER_ID, username: username }));
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    if (changedCategories) {
        socket.send(JSON.stringify({ type: 'update-categories', username: username, categories: validCategories, subcategories: validSubcategories }));
    }
    changedCategories = false;
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
    } else if (document.getElementById('next').innerHTML === 'Next') {
        socket.send(JSON.stringify({ type: 'next', userId: USER_ID, username: username }));
    } else if (document.getElementById('next').innerHTML === 'Skip') {
        socket.send(JSON.stringify({ type: 'skip', userId: USER_ID, username: username }));
    }

    document.getElementById('options').classList.add('d-none');
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').innerHTML = 'Skip';
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
    socket.send(JSON.stringify({ type: 'toggle-visibility', userId: USER_ID, username: username, public: this.checked }));
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
        changedCategories = true;
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
        changedCategories = true;
    });
});


document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
        // press escape to close chat
        document.getElementById('chat-input-group').classList.add('d-none');
    }

    if (document.activeElement.tagName === 'INPUT') return;

    switch (event.key) {
        case ' ':
            // Prevent spacebar from scrolling the page
            document.getElementById('buzz').click();
            if (event.target == document.body) event.preventDefault();
            break;
        case 'n':
        case 's':
            document.getElementById('next').click();
            break;
        case 'p':
            document.getElementById('pause').click();
            break;
    }
});


document.addEventListener('keypress', function (event) {
    // needs to be keypress
    // keydown immediately hides the input group
    // keyup shows the input group again after submission
    if (event.key === 'Enter' && event.target == document.body) {
        document.getElementById('chat').click();
    }
});


window.onload = () => {
    username = localStorage.getItem('username') || randomUsername();
    document.getElementById('username').value = username;
    connectToWebSocket();
    fetch(`/api/multiplayer/room?roomName=${encodeURIComponent(ROOM_NAME)}`)
        .then(response => response.json())
        .then(room => {
            tossup = room.tossup;
            difficulties = room.difficulties || [];
            validCategories = room.validCategories || [];
            validSubcategories = room.validSubcategories || [];

            document.getElementById('difficulties').value = arrayToRange(difficulties);
            document.getElementById('set-name').value = room.setName || '';
            document.getElementById('packet-number').value = arrayToRange(room.packetNumbers) || '';

            document.getElementById('set-name-info').innerHTML = room.setName || '';
            document.getElementById('packet-number-info').innerHTML = room.packetNumber || '-';
            document.getElementById('question-number-info').innerHTML = room.questionNumber || '-';

            document.getElementById('reading-speed').value = room.readingSpeed;
            document.getElementById('reading-speed-display').innerHTML = room.readingSpeed;
            document.getElementById('toggle-visibility').checked = room.public;
            document.getElementById('chat').disabled = room.public;
            document.getElementById('toggle-multiple-buzzes').checked = room.allowMultipleBuzzes;
            loadCategoryModal(validCategories, validSubcategories);

            if (room.questionProgress === 0) {
                document.getElementById('next').innerHTML = 'Start';
                document.getElementById('next').classList.remove('btn-primary');
                document.getElementById('next').classList.add('btn-success');
            } else if (room.questionProgress === 1) {
                document.getElementById('next').innerHTML = 'Skip';
                document.getElementById('options').classList.add('d-none');
            } else {
                document.getElementById('next').innerHTML = 'Next';
                document.getElementById('options').classList.add('d-none');
            }

            Object.keys(room.players).forEach(player => {
                if (room.players[player].userId === USER_ID) return;
                room.players[player].celerity = room.players[player].celerity.correct.average;
                createPlayerAccordionItem(room.players[player]);
            });
        });
}