var changedCategories = false;
var validCategories = [];
var validSubcategories = [];

// Do not escape room name as that is how it is stored on the server.
const ROOM_NAME = location.pathname.substring(13);
var tossup = {};
var USER_ID = localStorage.getItem('USER_ID') || 'unknown';
var username = localStorage.getItem('username') || randomUsername();

const socket = new WebSocket(location.href.replace('http', 'ws'), `${ROOM_NAME}%%%${encodeURIComponent(USER_ID)}%%%${encodeURIComponent(username)}`);
socket.onopen = function () {
    console.log('Connected to websocket');
}

socket.onmessage = function (event) {
    let data = JSON.parse(event.data);
    // console.log(data);
    switch (data.type) {
        case 'connection-acknowledged':
            socketOnConnectionAcknowledged(data);
            break;
        case 'buzz':
            socketOnBuzz(data);
            break;
        case 'change-username':
            socketOnChangeUsername(data);
            break;
        case 'chat':
            socketOnChat(data);
            break;
        case 'clear-stats':
            socketOnClearStats(data);
            break;
        case 'end-of-set':
            socketOnEndOfSet(data);
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
            socketOnGiveAnswer(data);
            break;
        case 'join':
            socketOnJoin(data);
            break;
        case 'leave':
            socketOnLeave(data);
            break;
        case 'lost-buzzer-race':
            socketOnLostBuzzerRace(data);
            break;
        case 'next':
        case 'skip':
            socketOnNext(data);
            break;
        case 'no-questions-found':
            socketOnNoQuestionsFound(data);
            break;
        case 'pause':
            socketOnPause(data);
            break;
        case 'reading-speed':
            logEvent(data.username, `changed the reading speed to ${data.value}`);
            document.getElementById('reading-speed').value = data.value;
            document.getElementById('reading-speed-display').innerHTML = data.value;
            break;
        case 'start':
            socketOnStart(data);
            break;
        case 'toggle-rebuzz':
            logEvent(data.username, `${data.rebuzz ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
            document.getElementById('toggle-rebuzz').checked = data.rebuzz;
            break;
        case 'toggle-select-by-set-name':
            if (data.selectBySetName) {
                logEvent(data.username, `enabled select by set name`);
                document.getElementById('toggle-select-by-set-name').checked = true;
                document.getElementById('difficulty-settings').classList.add('d-none');
                document.getElementById('set-settings').classList.remove('d-none');
                document.getElementById('set-name').innerHTML = data.setName;
            } else {
                logEvent(data.username, `enabled select by difficulty`);
                document.getElementById('toggle-select-by-set-name').checked = false;
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

socket.onclose = function () {
    console.log('Disconnected from websocket');
    clearInterval(PING_INTERVAL_ID);
    window.alert('Disconnected from server');
}

const socketOnBuzz = (message) => {
    logEvent(message.username, `buzzed`);

    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('next').disabled = true;
}

const socketOnChangeUsername = (message) => {
    logEvent(message.oldUsername, 'changed their username to ' + message.newUsername);
    document.getElementById('accordion-button-username-' + message.userId).innerHTML = message.newUsername;
    sortPlayerAccordion();
}

const socketOnChat = (message) => {
    logEvent(message.username, `says "${message.message}"`);
}

const socketOnClearStats = (message) => {
    Array.from(document.getElementsByClassName('stats-' + message.userId)).forEach(element => {
        element.innerHTML = '0';
    });

    sortPlayerAccordion();
}

const socketOnConnectionAcknowledged = (message) => {
    console.log(message);
    USER_ID = message.userId;
    localStorage.setItem('USER_ID', USER_ID);

    validCategories = message.validCategories || [];
    validSubcategories = message.validSubcategories || [];
    loadCategoryModal(validCategories, validSubcategories);

    document.getElementById('difficulties').value = arrayToRange(message.difficulties || []);
    document.getElementById('set-name').value = message.setName || '';
    document.getElementById('packet-number').value = arrayToRange(message.packetNumbers) || '';

    tossup = message.tossup;
    document.getElementById('set-name-info').innerHTML = message.tossup?.setName ?? '';
    document.getElementById('packet-number-info').innerHTML = message.tossup?.packetNumber ?? '-';
    document.getElementById('question-number-info').innerHTML = message.tossup?.questionNumber ?? '-';

    document.getElementById('toggle-rebuzz').checked = message.rebuzz;
    document.getElementById('chat').disabled = message.public;
    document.getElementById('toggle-visibility').checked = message.public;
    document.getElementById('reading-speed').value = message.readingSpeed;
    document.getElementById('reading-speed-display').innerHTML = message.readingSpeed;

    if (message.selectBySetName) {
        document.getElementById('toggle-select-by-set-name').checked = true;
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
    } else {
        document.getElementById('toggle-select-by-set-name').checked = false;
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
    }

    if (message.questionProgress === 0) {
        document.getElementById('next').innerHTML = 'Start';
        document.getElementById('next').classList.remove('btn-primary');
        document.getElementById('next').classList.add('btn-success');
    } else if (message.questionProgress === 1) {
        document.getElementById('next').innerHTML = 'Skip';
        document.getElementById('options').classList.add('d-none');
        if (message.buzzedIn) {
            document.getElementById('buzz').disabled = true;
            document.getElementById('next').disabled = true;
            document.getElementById('pause').disabled = true;
        } else {
            document.getElementById('buzz').disabled = false;
            document.getElementById('pause').disabled = false;
        }
    } else {
        document.getElementById('next').innerHTML = 'Next';
        document.getElementById('options').classList.add('d-none');
    }

    Object.keys(message.players).forEach(userId => {
        message.players[userId].celerity = message.players[userId].celerity.correct.average;
        createPlayerAccordionItem(message.players[userId]);
    });

    sortPlayerAccordion();
}

const socketOnEndOfSet = (message) => {
    window.alert('You have reached the end of the set');
}

const socketOnGiveAnswer = (message) => {
    let { userId, username, givenAnswer, directive, score, celerity } = message;
    if (directive === 'prompt') {
        logEvent(username, `answered with "${givenAnswer}" and was prompted`);
    } else {
        logEvent(username, `${score > 0 ? '' : 'in'}correctly answered with "${givenAnswer}" for ${score} points`);
    }

    if (directive === 'prompt' && userId === USER_ID) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = 'Prompt';
    } else {
        document.getElementById('answer-input').placeholder = 'Enter answer';
        document.getElementById('next').disabled = false;

        // Update question text and show answer:
        if (directive === 'accept') {
            document.getElementById('next').innerHTML = 'Next';
            document.getElementById('buzz').disabled = true;
            Array.from(document.getElementsByClassName('tuh')).forEach(element => {
                element.innerHTML = parseInt(element.innerHTML) + 1;
            });
        }

        if (directive === 'reject') {
            if (document.getElementById('toggle-rebuzz').checked || userId !== USER_ID) {
                document.getElementById('buzz').disabled = false;
            } else {
                document.getElementById('buzz').disabled = true;
            }
            document.getElementById('pause').disabled = false;
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
}

const socketOnJoin = (message) => {
    logEvent(message.username, `joined the game`);
    if (message.isNew && message.userId !== USER_ID) {
        createPlayerAccordionItem(message);
        sortPlayerAccordion();
    }
}

const socketOnLeave = (message) => {
    logEvent(message.username, `left the game`);
    // document.getElementById('accordion-' + message.userId).remove();
}

const socketOnLostBuzzerRace = (message) => {
    logEvent(message.username, `lost the buzzer race`);
    if (message.userId === USER_ID) {
        document.getElementById('answer-input-group').classList.add('d-none');
    }
}

const socketOnNext = (message) => {
    if (message.type === 'skip') {
        logEvent(message.username, `skipped the question`);
    } else {
        logEvent(message.username, `went to the next question`);
    }

    tossup.question = document.getElementById('question').innerHTML;
    tossup.answer = document.getElementById('answer').innerHTML;

    createTossupCard(tossup, document.getElementById('set-name-info').innerHTML);

    tossup = message.tossup;

    document.getElementById('set-name-info').innerHTML = tossup?.setName ?? '';
    document.getElementById('question-number-info').innerHTML = tossup?.questionNumber ?? '-';
    document.getElementById('packet-number-info').innerHTML = tossup?.packetNumber ?? '-';

    document.getElementById('options').classList.add('d-none');
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').innerHTML = 'Skip';
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').disabled = false;
}

const socketOnNoQuestionsFound = (message) => {
    window.alert('No questions found');
}

const socketOnPause = (message) => {
    logEvent(message.username, `${message.paused ? '' : 'un'}paused the game`);
}

const socketOnStart = (message) => {
    logEvent(message.username, `started the game`);

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').disabled = false;
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').innerHTML = 'Skip';

    tossup = message.tossup;

    document.getElementById('set-name-info').innerHTML = tossup?.setName ?? '';
    document.getElementById('question-number-info').innerHTML = tossup?.questionNumber ?? '-';
    document.getElementById('packet-number-info').innerHTML = tossup?.packetNumber ?? '-';
}

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
    socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);


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
        givenAnswer: answer,
        celerity: celerity,
    }));
});


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    socket.send(JSON.stringify({ type: 'buzz' }));
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    if (changedCategories) {
        socket.send(JSON.stringify({ type: 'update-categories', categories: validCategories, subcategories: validSubcategories }));
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

    socket.send(JSON.stringify({ type: 'chat', message: message }));
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'clear-stats' }));
});


document.getElementById('difficulties').addEventListener('change', function () {
    socket.send(JSON.stringify({
        type: 'difficulties',
        value: rangeToArray(this.value)
    }));
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();

    if (document.getElementById('next').innerHTML === 'Start') {
        socket.send(JSON.stringify({ type: 'start' }));
    } else if (document.getElementById('next').innerHTML === 'Next') {
        socket.send(JSON.stringify({ type: 'next' }));
    } else if (document.getElementById('next').innerHTML === 'Skip') {
        socket.send(JSON.stringify({ type: 'skip' }));
    }
});


document.getElementById('packet-number').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'packet-number', value: rangeToArray(this.value, maxPacketNumber) }));
});


document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'pause' }));
});


document.getElementById('reading-speed').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'reading-speed', value: this.value }));
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

    socket.send(JSON.stringify({ type: 'set-name', value: this.value }));
});


document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-rebuzz', rebuzz: this.checked }));
});


document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({
        type: 'toggle-select-by-set-name',
        setName: document.getElementById('set-name').value,
        selectBySetName: this.checked
    }));
});


document.getElementById('toggle-visibility').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-visibility', public: this.checked }));
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
    // press escape to close chat
    if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
        document.getElementById('chat-input-group').classList.add('d-none');
    }

    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

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

document.getElementById('username').value = username;
