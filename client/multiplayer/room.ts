/* eslint-disable no-undef */
let changedCategories = false;
let validCategories = [];
let validSubcategories = [];

let maxPacketNumber = 24;
let powermarkPosition = 0;

// Do not escape room name, as most browsers automatically do this
const ROOM_NAME = location.pathname.substring(13);
let tossup = {};
let USER_ID = localStorage.getItem('USER_ID') || 'unknown';
let username = localStorage.getItem('multiplayer-username') || randomUsername();

function showNextButton() {
    document.getElementById('next').classList.remove('d-none');
    document.getElementById('next').disabled = false;
    document.getElementById('skip').classList.add('d-none');
    document.getElementById('skip').disabled = true;
}


function showSkipButton() {
    document.getElementById('skip').classList.remove('d-none');
    document.getElementById('skip').disabled = !document.getElementById('toggle-skip').checked;
    document.getElementById('next').classList.add('d-none');
    document.getElementById('next').disabled = true;
}


const socket = new WebSocket(location.href.replace('http', 'ws'), `${ROOM_NAME}%%%${encodeURIComponent(USER_ID)}%%%${encodeURIComponent(username)}`);

socket.onmessage = function (event) {
    const data = JSON.parse(event.data);
    switch (data.type) {
    case 'buzz':
        socketOnBuzz(data);
        break;

    case 'change-username':
        socketOnChangeUsername(data);
        break;

    case 'chat':
        logChat(data.username, data.message, false, data.userId);
        break;

    case 'chat-live-update':
        logChat(data.username, data.message, true, data.userId);
        break;

    case 'clear-stats':
        socketOnClearStats(data);
        break;

    case 'connection-acknowledged':
        socketOnConnectionAcknowledged(data);
        break;

    case 'end-of-set':
        socketOnEndOfSet(data);
        break;

    case 'difficulties':
        if (data.value.length > 0) {
            logEvent(data.username, `changed the difficulties to ${data.value}`);
        } else {
            logEvent(data.username, 'cleared the difficulties');
        }
        updateDifficulties(data.value);
        break;
    case 'packet-number':
        data.value = arrayToRange(data.value);
    // eslint-disable-next-line no-fallthrough
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

    case 'give-answer-live-update':
        logGiveAnswer(data.username, data.message, true);
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
        document.getElementById('reading-speed-display').textContent = data.value;
        break;

    case 'reveal-answer': {
        document.getElementById('answer').innerHTML = 'ANSWER: ' + data.answer;
        document.getElementById('pause').disabled = true;
        showNextButton();

        question = document.getElementById('question').innerHTML;
        if (powermarkPosition) {
            question = question.slice(0, powermarkPosition) + '(*) ' + question.slice(powermarkPosition);
        }
        const powerParts = question.split('(*)');
        if (powerParts.length > 1) {
            document.getElementById('question').innerHTML = `<b>${powerParts[0]}(*)</b>${powerParts[1]}`;
        } else {
            document.getElementById('question').textContent = question;
        }
        break;
    }

    case 'start':
        socketOnStart(data);
        break;

    case 'toggle-powermark-only':
        logEvent(data.username, `${data.powermarkOnly ? 'enabled' : 'disabled'} powermark only`);
        document.getElementById('toggle-powermark-only').checked = data.powermarkOnly;
        break;

    case 'toggle-rebuzz':
        logEvent(data.username, `${data.rebuzz ? 'enabled' : 'disabled'} multiple buzzes (effective next question)`);
        document.getElementById('toggle-rebuzz').checked = data.rebuzz;
        break;

    case 'toggle-skip':
        logEvent(data.username, `${data.skip ? 'enabled' : 'disabled'} skipping`);
        document.getElementById('toggle-skip').checked = data.skip;
        document.getElementById('skip').disabled = !data.skip || document.getElementById('skip').classList.contains('d-none');
        break;

    case 'toggle-select-by-set-name':
        if (data.selectBySetName) {
            logEvent(data.username, 'enabled select by set name');
            document.getElementById('toggle-select-by-set-name').checked = true;
            document.getElementById('difficulty-settings').classList.add('d-none');
            document.getElementById('set-settings').classList.remove('d-none');
            document.getElementById('set-name').textContent = data.setName;
        } else {
            logEvent(data.username, 'enabled select by difficulty');
            document.getElementById('toggle-select-by-set-name').checked = false;
            document.getElementById('difficulty-settings').classList.remove('d-none');
            document.getElementById('set-settings').classList.add('d-none');
        }
        document.getElementById('toggle-powermark-only').disabled = data.selectBySetName;
        break;

    case 'toggle-visibility':
        logEvent(data.username, `made the room ${data.public ? 'public' : 'private'}`);
        document.getElementById('toggle-visibility').checked = data.public;
        document.getElementById('chat').disabled = data.public;
        break;

    case 'update-categories':
        logEvent(data.username, 'updated the categories');
        validCategories = data.categories;
        validSubcategories = data.subcategories;
        loadCategoryModal(validCategories, validSubcategories);
        break;

    case 'update-question':
        if (data.word === '(*)') {
            powermarkPosition = document.getElementById('question').innerHTML.length;
        } else {
            document.getElementById('question').innerHTML += data.word + ' ';
        }
        break;

    case 'year-range':
        $('#slider').slider('values', 0, data.minYear);
        $('#slider').slider('values', 1, data.maxYear);
        document.getElementById('year-range-a').textContent = data.minYear;
        document.getElementById('year-range-b').textContent = data.maxYear;
        break;
    }
};

socket.onclose = function () {
    clearInterval(PING_INTERVAL_ID);
    window.alert('Disconnected from server');
};

const socketOnBuzz = (message) => {
    logEvent(message.username, 'buzzed');

    document.getElementById('buzz').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('skip').disabled = true;

    if (message.userId === USER_ID) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
    }
};

const socketOnChangeUsername = (message) => {
    logEvent(message.oldUsername, `changed their username to ${message.newUsername}`);
    document.getElementById('accordion-button-username-' + message.userId).textContent = message.newUsername;
    sortPlayerAccordion();
};


const socketOnClearStats = (message) => {
    Array.from(document.getElementsByClassName('stats-' + message.userId)).forEach(element => {
        element.textContent = '0';
    });

    sortPlayerAccordion();
};

const socketOnConnectionAcknowledged = async (message) => {
    USER_ID = message.userId;
    localStorage.setItem('USER_ID', USER_ID);

    validCategories = message.validCategories || [];
    validSubcategories = message.validSubcategories || [];
    loadCategoryModal(validCategories, validSubcategories);

    updateDifficulties(message.difficulties || []);
    document.getElementById('set-name').value = message.setName || '';
    document.getElementById('packet-number').value = arrayToRange(message.packetNumbers) || '';

    maxPacketNumber = await getNumPackets(document.getElementById('set-name').value);
    if (document.getElementById('set-name').value !== '' && maxPacketNumber === 0) {
        document.getElementById('set-name').classList.add('is-invalid');
    }

    tossup = message.tossup;
    document.getElementById('set-name-info').textContent = message.tossup?.set.name ?? '';
    document.getElementById('packet-number-info').textContent = message.tossup?.packet.number ?? '-';
    document.getElementById('question-number-info').textContent = message.tossup?.questionNumber ?? '-';

    document.getElementById('chat').disabled = message.public;
    document.getElementById('toggle-rebuzz').checked = message.rebuzz;
    document.getElementById('toggle-skip').checked = message.skip;
    document.getElementById('toggle-visibility').checked = message.public;
    document.getElementById('reading-speed').value = message.readingSpeed;
    document.getElementById('reading-speed-display').textContent = message.readingSpeed;

    if (message.selectBySetName) {
        document.getElementById('toggle-select-by-set-name').checked = true;
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
    } else {
        document.getElementById('toggle-select-by-set-name').checked = false;
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
    }

    switch (message.questionProgress) {
    case 0:
        document.getElementById('next').textContent = 'Start';
        document.getElementById('next').classList.remove('btn-primary');
        document.getElementById('next').classList.add('btn-success');
        break;
    case 1:
        showSkipButton();
        document.getElementById('options').classList.add('d-none');
        if (message.buzzedIn) {
            document.getElementById('buzz').disabled = true;
            document.getElementById('next').disabled = true;
            document.getElementById('pause').disabled = true;
        } else {
            document.getElementById('buzz').disabled = false;
            document.getElementById('pause').disabled = false;
        }
        break;
    case 2:
        showNextButton();
        document.getElementById('options').classList.add('d-none');
        break;
    }

    if (message.isPermanent) {
        document.getElementById('toggle-visibility').disabled = true;
        document.getElementById('private-chat-warning').classList.add('d-none');
    }

    $('#slider').slider('values', 0, message.minYear);
    $('#slider').slider('values', 1, message.maxYear);
    document.getElementById('year-range-a').textContent = message.minYear;
    document.getElementById('year-range-b').textContent = message.maxYear;

    Object.keys(message.players).forEach(userId => {
        message.players[userId].celerity = message.players[userId].celerity.correct.average;
        createPlayerAccordionItem(message.players[userId]);
    });

    if (!message.canBuzz) {
        document.getElementById('buzz').disabled = true;
    }

    sortPlayerAccordion();
};

const socketOnEndOfSet = () => {
    window.alert('You have reached the end of the set');
};

const socketOnGiveAnswer = async (message) => {
    const { userId, username, givenAnswer, directive, directedPrompt, score, celerity } = message;

    logGiveAnswer(username, givenAnswer, false, directive);

    if (directive === 'prompt' && directedPrompt) {
        logEvent(username, `was prompted with "${directedPrompt}"`);
    } else if (directive === 'prompt') {
        logEvent(username, 'was prompted');
    } else {
        logEvent(username, `${score > 0 ? '' : 'in'}correctly answered for ${score} points`);
    }

    if (directive === 'prompt' && userId === USER_ID) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    } else if (directive !== 'prompt') {
        document.getElementById('answer-input').placeholder = 'Enter answer';
        document.getElementById('next').disabled = false;

        if (directive === 'accept') {
            document.getElementById('buzz').disabled = true;
            Array.from(document.getElementsByClassName('tuh')).forEach(element => {
                element.textContent = parseInt(element.innerHTML) + 1;
            });
        }

        if (directive === 'reject') {
            document.getElementById('buzz').disabled = !document.getElementById('toggle-rebuzz').checked && userId === USER_ID;
        }

        if (score > 10) {
            document.getElementById('powers-' + userId).textContent = parseInt(document.getElementById('powers-' + userId).innerHTML) + 1;
        } else if (score === 10) {
            document.getElementById('tens-' + userId).textContent = parseInt(document.getElementById('tens-' + userId).innerHTML) + 1;
        } else if (score < 0) {
            document.getElementById('negs-' + userId).textContent = parseInt(document.getElementById('negs-' + userId).innerHTML) + 1;
        }

        document.getElementById('points-' + userId).textContent = parseInt(document.getElementById('points-' + userId).innerHTML) + score;
        document.getElementById('celerity-' + userId).textContent = Math.round(1000 * celerity) / 1000;
        document.getElementById('accordion-button-points-' + userId).textContent = parseInt(document.getElementById('accordion-button-points-' + userId).innerHTML) + score;

        sortPlayerAccordion();
    }

    if (directive !== 'prompt' && userId === USER_ID && await getAccountUsername()) {
        fetch('/auth/record-tossup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tossup: message.tossup,
                isCorrect: score > 0,
                pointValue: score,
                celerity: message.perQuestionCelerity,
                multiplayer: true,
            }),
        }).then(response => {
            if (response.status === 401) {
                deleteAccountUsername();
                throw new Error('Unauthenticated');
            }
        });
    }
};

const socketOnJoin = (message) => {
    const { userId, username } = message;
    logEvent(username, 'joined the game');
    if (userId === USER_ID) {
        return;
    }

    if (message.isNew) {
        createPlayerAccordionItem(message);
        sortPlayerAccordion();
    } else {
        document.getElementById('accordion-button-username-' + userId).textContent = username;
    }
};

const socketOnLeave = (message) => {
    logEvent(message.username, 'left the game');
    // document.getElementById('accordion-' + message.userId).remove();
};

const socketOnLostBuzzerRace = (message) => {
    logEvent(message.username, 'lost the buzzer race');
    if (message.userId === USER_ID) {
        document.getElementById('answer-input-group').classList.add('d-none');
    }
};

const socketOnNext = (message) => {
    if (message.type === 'skip') {
        logEvent(message.username, 'skipped the question');
    } else {
        logEvent(message.username, 'went to the next question');
    }

    tossup.question = document.getElementById('question').innerHTML;
    tossup.answer = document.getElementById('answer').innerHTML.replace('ANSWER: ', '');

    createTossupCard(tossup);

    tossup = message.tossup;

    document.getElementById('set-name-info').textContent = tossup?.set.name ?? '';
    document.getElementById('question-number-info').textContent = tossup?.questionNumber ?? '-';
    document.getElementById('packet-number-info').textContent = tossup?.packet.number ?? '-';

    document.getElementById('options').classList.add('d-none');
    showSkipButton();
    document.getElementById('question').textContent = '';
    powermarkPosition = 0;
    document.getElementById('answer').textContent = '';
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').textContent = 'Pause';
    document.getElementById('pause').disabled = false;
};

const socketOnNoQuestionsFound = () => {
    window.alert('No questions found');
};

const socketOnPause = (message) => {
    logEvent(message.username, `${message.paused ? '' : 'un'}paused the game`);
};

const socketOnStart = (message) => {
    logEvent(message.username, 'started the game');

    document.getElementById('question').textContent = '';
    powermarkPosition = 0;
    document.getElementById('answer').textContent = '';
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('pause').textContent = 'Pause';
    document.getElementById('pause').disabled = false;
    document.getElementById('next').classList.add('btn-primary');
    document.getElementById('next').classList.remove('btn-success');
    document.getElementById('next').textContent = 'Next';
    showSkipButton();

    tossup = message.tossup;

    document.getElementById('set-name-info').textContent = tossup?.set.name ?? '';
    document.getElementById('question-number-info').textContent = tossup?.questionNumber ?? '-';
    document.getElementById('packet-number-info').textContent = tossup?.packet.number ?? '-';
};

// Ping server every 45 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(() => {
    socket.send(JSON.stringify({ type: 'ping' }));
}, 45000);


function createPlayerAccordionItem(player) {
    const { userId, username, powers = 0, tens = 0, negs = 0, tuh = 0, points = 0, celerity = 0 } = player;

    // 0/0/0 with 0 tossups seen (0 pts, celerity: 0)

    const powerSpan = `<span id="powers-${userId}" class="stats stats-${userId}">${powers}</span>`;
    const tenSpan = `<span id="tens-${userId}" class="stats stats-${userId}">${tens}</span>`;
    const negSpan = `<span id="negs-${userId}" class="stats stats-${userId}">${negs}</span>`;

    const accordionItem = document.createElement('div');
    accordionItem.className = 'accordion-item';
    accordionItem.id = `accordion-${userId}`;
    accordionItem.innerHTML = `
        <h2 class="accordion-header" id="heading-${userId}">
            <button class="accordion-button collapsed" type="button" data-bs-target="#accordion-body-${userId}" data-bs-toggle="collapse">
                <span id="accordion-button-username-${userId}">
                    ${escapeHTML(username)}
                </span>&nbsp;(<span class="stats-${userId}" id="accordion-button-points-${userId}">
                    ${points}
                </span>&nbsp;pts)
            </button>
        </h2>
        <div class="accordion-collapse collapse" id="accordion-body-${userId}">
            <div class="accordion-body">
                ${powerSpan}/${tenSpan}/${negSpan},
                <span id="tuh-${userId}" class="tuh stats stats-${userId}">
                    ${tuh}
                </span> tossups seen (<span id="points-${userId}" class="points stats-${userId}">${points}</span>
                pts, celerity:
                <span id="celerity-${userId}" class="stats stats-${userId}">
                    ${Math.round(1000 * celerity) / 1000}
                </span>)
        </div>
    `;

    document.getElementById('player-accordion').appendChild(accordionItem);
}


function logChat(username, message, isLive = false, userId = null) {
    if (!isLive && message === '') {
        document.getElementById('live-chat-' + userId).parentElement.remove();
        return;
    }

    if (!isLive && message) {
        document.getElementById('live-chat-' + userId).className = '';
        document.getElementById('live-chat-' + userId).id = '';
        return;
    }

    if (document.getElementById('live-chat-' + userId)) {
        document.getElementById('live-chat-' + userId).textContent = message;
        return;
    }

    const b = document.createElement('b');
    b.textContent = username;

    const span = document.createElement('span');
    span.classList.add('text-muted');
    span.id = 'live-chat-' + userId;
    span.textContent = message;

    const li = document.createElement('li');
    li.appendChild(b);
    li.appendChild(document.createTextNode(' '));
    li.appendChild(span);
    document.getElementById('room-history').prepend(li);
}


function logEvent(username, message) {
    const span1 = document.createElement('span');
    span1.textContent = username;

    const span2 = document.createElement('span');
    span2.textContent = message;

    const i = document.createElement('i');
    i.appendChild(span1);
    i.appendChild(document.createTextNode(' '));
    i.appendChild(span2);

    const li = document.createElement('li');
    li.appendChild(i);

    document.getElementById('room-history').prepend(li);
}


function logGiveAnswer(username, message, isLive = false, directive = null) {
    const badge = document.createElement('span');
    badge.textContent = 'Buzz';
    switch (directive) {
    case 'accept':
        badge.className = 'badge text-dark bg-success';
        break;
    case 'reject':
        badge.className = 'badge text-light bg-danger';
        break;
    case 'prompt':
        badge.className = 'badge text-dark bg-warning';
        break;
    default:
        badge.className = 'badge text-light bg-primary';
        break;
    }

    const b = document.createElement('b');
    b.textContent = username;

    const span = document.createElement('span');
    span.textContent = message;

    if (document.getElementById('live-buzz')) {
        const li = document.getElementById('live-buzz');
        li.textContent = '';
        li.appendChild(badge);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(b);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(span);
    } else {
        const li = document.createElement('li');
        li.id = 'live-buzz';
        li.appendChild(badge);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(b);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(span);
        document.getElementById('room-history').prepend(li);
    }

    if (!isLive) {
        document.getElementById('live-buzz').id = '';
    }
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
    const accordion = document.getElementById('player-accordion');
    const items = Array.from(accordion.children);
    items.sort((a, b) => {
        const aPoints = parseInt(document.getElementById('points-' + a.id.substring(10)).innerHTML);
        const bPoints = parseInt(document.getElementById('points-' + b.id.substring(10)).innerHTML);
        // if points are equal, sort alphabetically by username
        if (aPoints === bPoints) {
            const aUsername = document.getElementById('accordion-button-username-' + a.id.substring(10)).innerHTML;
            const bUsername = document.getElementById('accordion-button-username-' + b.id.substring(10)).innerHTML;
            return descending ? aUsername.localeCompare(bUsername) : bUsername.localeCompare(aUsername);
        }
        return descending ? bPoints - aPoints : aPoints - bPoints;
    }).forEach(item => {
        accordion.appendChild(item);
    });
}


function updateDifficulties(difficulties) {
    Array.from(document.getElementById('difficulties').children).forEach(li => {
        const input = li.querySelector('input');

        if (difficulties.includes(parseInt(input.value))) {
            input.checked = true;
            li.classList.add('active');
        } else {
            input.checked = false;
            li.classList.remove('active');
        }
    });
}


document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const answer = document.getElementById('answer-input').value;
    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input-group').classList.add('d-none');
    document.getElementById('answer-input').blur();

    socket.send(JSON.stringify({
        type: 'give-answer',
        givenAnswer: answer,
    }));
});


document.getElementById('answer-input').addEventListener('input', function () {
    socket.send(JSON.stringify({ type: 'give-answer-live-update', message: this.value }));
});


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'buzz' }));
    socket.send(JSON.stringify({ type: 'give-answer-live-update', message: '' }));
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    if (changedCategories) {
        socket.send(JSON.stringify({ type: 'update-categories', categories: validCategories, subcategories: validSubcategories }));
    }
    changedCategories = false;
});


document.getElementById('chat').addEventListener('click', function () {
    this.blur();
    document.getElementById('chat-input-group').classList.remove('d-none');
    document.getElementById('chat-input').focus();
    socket.send(JSON.stringify({ type: 'chat-live-update', message: '' }));
});


document.getElementById('chat-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const message = document.getElementById('chat-input').value;
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');
    document.getElementById('chat-input').blur();

    socket.send(JSON.stringify({ type: 'chat', message: message }));
});


document.getElementById('chat-input').addEventListener('input', function () {
    socket.send(JSON.stringify({ type: 'chat-live-update', message: this.value }));
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'clear-stats' }));
});


document.getElementById('difficulties').addEventListener('change', function () {
    socket.send(JSON.stringify({
        type: 'difficulties',
        value: getDropdownValues('difficulties'),
    }));
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    switch (this.innerHTML) {
    case 'Start':
        socket.send(JSON.stringify({ type: 'start' }));
        break;
    case 'Next':
        socket.send(JSON.stringify({ type: 'next' }));
        break;
    }
});


document.getElementById('skip').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'skip' }));
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
    document.getElementById('reading-speed-display').textContent = this.value;
});


document.getElementById('set-name').addEventListener('change', async function () {
    if (SET_LIST.includes(this.value) || this.value.length === 0) {
        this.classList.remove('is-invalid');
    } else {
        this.classList.add('is-invalid');
    }
    maxPacketNumber = await getNumPackets(this.value);
    if (this.value === '' || maxPacketNumber === 0) {
        document.getElementById('packet-number').value = '';
    } else {
        document.getElementById('packet-number').value = `1-${maxPacketNumber}`;
    }

    socket.send(JSON.stringify({ type: 'set-name', value: this.value, packetNumbers: rangeToArray(document.getElementById('packet-number').value) }));
});


document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-rebuzz', rebuzz: this.checked }));
});


document.getElementById('toggle-skip').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-skip', skip: this.checked }));
});


document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({
        type: 'toggle-select-by-set-name',
        setName: document.getElementById('set-name').value,
        selectBySetName: this.checked,
    }));
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-powermark-only', powermarkOnly: this.checked }));
});


document.getElementById('toggle-visibility').addEventListener('click', function () {
    this.blur();
    socket.send(JSON.stringify({ type: 'toggle-visibility', public: this.checked }));
});


document.getElementById('username').addEventListener('change', function () {
    socket.send(JSON.stringify({ type: 'change-username', userId: USER_ID, oldUsername: username, username: this.value }));
    username = this.value;
    localStorage.setItem('multiplayer-username', username);
});


document.getElementById('year-range-a').onchange = function () {
    const [minYear, maxYear] = $('#slider').slider('values');
    socket.send(JSON.stringify({ type: 'year-range', minYear, maxYear }));
};


document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function () {
        this.blur();
        ({ categories: validCategories, subcategories: validSubcategories } = updateCategory(input.id, validCategories, validSubcategories));
        loadCategoryModal(validCategories, validSubcategories);
        changedCategories = true;
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function () {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
        changedCategories = true;
    });
});


document.addEventListener('keydown', function (event) {
    // press escape to close chat
    if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
        document.getElementById('chat-input').value = '';
        document.getElementById('chat-input-group').classList.add('d-none');
        document.getElementById('chat-input').blur();
        socket.send(JSON.stringify({ type: 'chat', message: '' }));
    }

    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (event.key) {
    case ' ':
        // Prevent spacebar from scrolling the page
        document.getElementById('buzz').click();
        if (event.target == document.body) event.preventDefault();
        break;

    case 'k':
        document.getElementsByClassName('card-header')[0].click();
        break;

    case 'n':
    case 's':
        document.getElementById('next').click();
        document.getElementById('skip').click();
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
