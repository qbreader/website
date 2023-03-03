// Functions and variables specific to the tossups page.

// Room settings
let packetNumbers = [];
let setName = '';
let validCategories;
let validSubcategories;

// Status variables
let currentlyBuzzing = false;
let packetNumber = -1;
let paused = false;

// WARNING: 0-indexed (instead of 1-indexed, like in multiplayer)
let questionNumber = 0;
let timeoutID = -1;

// Whether or not the user clicked that they got the question wrong. `-1` means the button currently says "I was wrong".
let toggleCorrectClicked = -1;
let previous = {
    points: 0,
    celerity: 0,
    endOfQuestion: false,
};

let questions = [{}];
let questionText = '';
let questionTextSplit = [];


function queryLock() {
    document.getElementById('question').innerHTML = 'Fetching questions...';
    document.getElementById('start').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('buzz').disabled = true;
}


function queryUnlock() {
    document.getElementById('start').disabled = false;
    document.getElementById('next').disabled = false;
    document.getElementById('pause').disabled = false;
    document.getElementById('buzz').disabled = false;
}


/**
 * @returns {Promise<boolean>} Whether or not there is a next question
 */
async function advanceQuestion() {
    if (document.getElementById('toggle-select-by-set-name').checked) {
        packetNumber = packetNumbers[0];

        do {  // Get the next question
            questionNumber++;

            // Go to the next packet if you reach the end of this packet
            if (questionNumber >= questions.length) {
                packetNumbers.shift();
                if (packetNumbers.length === 0) {
                    window.alert('No more questions left');
                    document.getElementById('buzz').disabled = true;
                    document.getElementById('pause').disabled = true;
                    document.getElementById('next').disabled = true;
                    return false;  // alert the user if there are no more packets
                }

                packetNumber = packetNumbers[0];

                queryLock();
                try {
                    questions = await getTossups(setName, packetNumber);
                } finally {
                    queryUnlock();
                }

                questionNumber = 0;
            }

            // Get the next question if the current one is in the wrong category and subcategory
        } while (!isValidCategory(questions[questionNumber], validCategories, validSubcategories));

        if (Object.keys(questions[0]).length > 0) {
            questionText = questions[questionNumber].question;
            questionTextSplit = questionText.split(' ').filter(word => word !== '');
            document.getElementById('question-number-info').innerHTML = questionNumber + 1;
        }
    } else {
        queryLock();
        try {
            questions = await getRandomQuestion(
                'tossup',
                rangeToArray(document.getElementById('difficulties').value),
                validCategories,
                validSubcategories,
            );
            questions = [questions];
        } finally {
            queryUnlock();
        }

        ({ setName, packetNumber, questionNumber } = questions[0]);

        if (Object.keys(questions[0]).length === 0) return false;

        questionText = questions[0]['question'];
        questionTextSplit = questionText.split(' ').filter(word => word !== '');
        document.getElementById('question-number-info').innerHTML = questionNumber;
        questionNumber = 0;
    }

    return true;
}


/**
 * Called when the users buzzes.
 * The first "buzz" pauses the question, and the second "buzz" reveals the rest of the question
 * and updates the score.
 */
function buzz() {
    // Stop the question reading
    clearTimeout(timeoutID);
    currentlyBuzzing = true;

    // Include buzzpoint
    document.getElementById('question').innerHTML += '(#) ';

    document.getElementById('buzz').innerHTML = 'Reveal';
    document.getElementById('pause').disabled = true;
}


/**
 * Clears user stats.
 */
function clearStats() {
    sessionStorage.setItem('powers', 0);
    sessionStorage.setItem('tens', 0);
    sessionStorage.setItem('negs', 0);
    sessionStorage.setItem('dead', 0);
    sessionStorage.setItem('points', 0);
    sessionStorage.setItem('totalCelerity', 0);
    updateStatDisplay();
}


async function giveAnswer(givenAnswer) {
    currentlyBuzzing = false;

    const [directive, directedPrompt] = await checkAnswer(questions[questionNumber].answer, givenAnswer);

    if (directive === 'accept') {
        updateScore(true);
        revealQuestion();
    } else if (directive === 'reject') {
        updateScore(false);
        document.getElementById('buzz').disabled = false;
        document.getElementById('buzz').innerHTML = 'Buzz';
        document.getElementById('pause').disabled = false;
        readQuestion(new Date().getTime());
    } else if (directive === 'prompt') {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    }
}


async function next() {
    // Stop reading the current question:
    clearTimeout(timeoutID);
    currentlyBuzzing = false;

    // Update the toggle-correct button:
    toggleCorrectClicked = -1;

    document.getElementById('answer').innerHTML = '';
    document.getElementById('question').innerHTML = '';
    document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    document.getElementById('toggle-correct').classList.add('d-none');

    const hasNextQuestion = await advanceQuestion();

    if (!hasNextQuestion)
        return;

    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';
    document.getElementById('packet-number-info').innerHTML = packetNumber;
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').disabled = false;
    document.getElementById('question').innerHTML = '';
    document.getElementById('set-name-info').innerHTML = setName;

    paused = false;
    readQuestion(new Date().getTime());
}


/**
 * Toggles pausing or resuming the tossup.
 */
function pause() {
    if (paused) {
        document.getElementById('buzz').removeAttribute('disabled');
        document.getElementById('pause').innerHTML = 'Pause';
        readQuestion(new Date().getTime());
    }
    else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').innerHTML = 'Resume';
        clearTimeout(timeoutID);
    }
    paused = !paused;
}


/**
 * Recursively reads the question based on the reading speed.
 */
function readQuestion(expectedReadTime) {
    if (!currentlyBuzzing && questionTextSplit.length > 0) {
        const word = questionTextSplit.shift();
        document.getElementById('question').innerHTML += word + ' ';

        // calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === '(*)')
            time = 0;

        time = time * 0.9 * (125 - document.getElementById('reading-speed').value);
        const delay = time - new Date().getTime() + expectedReadTime;

        timeoutID = window.setTimeout(() => {
            readQuestion(time + expectedReadTime);
        }, delay);
    } else {
        document.getElementById('pause').disabled = true;
    }
}


function reveal() {
    currentlyBuzzing = false;
    updateScore(true);
    revealQuestion();
}


function revealQuestion() {
    document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[questionNumber].answer;
    document.getElementById('question').innerHTML += questionTextSplit.join(' ');

    document.getElementById('buzz').disabled = true;
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('next').innerHTML = 'Next';

    document.getElementById('toggle-correct').classList.remove('d-none');
    document.getElementById('toggle-correct').innerHTML = 'I was wrong';
}


function toggleCorrect() {
    let result;

    if (previous.points > 10) result = 'powers';

    if (previous.points === 10) result = 'tens';

    if (previous.points === 0) result = 'zeroes';

    if (previous.points < 0) result = 'negs';

    shift(result, toggleCorrectClicked);
    shift('points', toggleCorrectClicked * previous.points);

    // Check if there is more question to be read
    if (questionTextSplit.length === 0) {
        shift('dead', -toggleCorrectClicked);
    } else if (setName.toLowerCase().includes('pace')) {
        shift('negs', -toggleCorrectClicked);
    } else {
        shift('negs', -toggleCorrectClicked);
        shift('points', 5 * toggleCorrectClicked);
    }

    document.getElementById('toggle-correct').innerHTML = (toggleCorrectClicked === 1 ? 'I was wrong' : 'I was right');
    toggleCorrectClicked = -1 * toggleCorrectClicked;
    updateStatDisplay();
}


function updateScore(isCorrect) {
    let points = 0;
    let celerity = 0;
    const endOfQuestion = (questionTextSplit.length === 0);
    const inPower = !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)');

    if (isCorrect) {
        if (inPower) {
            shift('powers', 1);
            if (setName.toLowerCase().includes('pace')) {
                points = 20;
            } else {
                points = 15;
            }
        } else {
            shift('tens', 1);
            points = 10;
        }

        const characterCount = document.getElementById('question').innerHTML.length;
        celerity = 1 - characterCount / questionText.length;
        shift('totalCelerity', celerity);
    } else {
        if (endOfQuestion) {
            shift('dead', 1);
        } else if (setName.toLowerCase().includes('pace')) {
            shift('negs', 1);
        } else {
            shift('negs', 1);
            points = -5;
        }
    }

    shift('points', points);

    updateStatDisplay();

    previous.points = points;
    previous.celerity = celerity;
}


/**
 * Updates the displayed stat line.
 */
function updateStatDisplay() {
    const numTossups = parseInt(sessionStorage.powers) + parseInt(sessionStorage.tens) + parseInt(sessionStorage.negs) + parseInt(sessionStorage.dead);
    const numCorrectTossups = parseInt(sessionStorage.powers) + parseInt(sessionStorage.tens);
    let celerity = numCorrectTossups != 0 ? parseFloat(sessionStorage.totalCelerity) / numCorrectTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    const includePlural = (numTossups === 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${sessionStorage.powers}/${sessionStorage.tens}/${sessionStorage.negs} with ${numTossups} tossup${includePlural} seen (${sessionStorage.points} pts, celerity: ${celerity})`;

    // disable clear stats button if no stats
    document.getElementById('clear-stats').disabled = (numTossups === 0);
}


document.getElementById('answer-form').addEventListener('submit', function (event) {
    event.preventDefault();
    event.stopPropagation();

    const answer = document.getElementById('answer-input').value;

    document.getElementById('answer-input').value = '';
    document.getElementById('answer-input').blur();
    document.getElementById('answer-input').placeholder = 'Enter answer';
    document.getElementById('answer-input-group').classList.add('d-none');

    giveAnswer(answer);
});


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();

    if (currentlyBuzzing) {
        reveal();
        return;
    }

    buzz();

    if (document.getElementById('type-to-answer').checked) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        this.disabled = true;
    }
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    randomQuestions = [];
    loadRandomQuestions('tossup', rangeToArray(document.getElementById('difficulties').value), validCategories, validSubcategories);
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', async function () {
    randomQuestions = [];
    loadRandomQuestions('tossup', rangeToArray(this.value), validCategories, validSubcategories);
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createTossupCard(questions[questionNumber], setName);
    next();
});


document.getElementById('packet-number').addEventListener('change', function () {
    localStorage.setItem('packetNumberTossupSave', this.value);
});


document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
});


document.getElementById('question-number').addEventListener('change', function () {
    localStorage.setItem('questionNumberTossupSave', document.getElementById('question-number').value);
});


document.getElementById('reading-speed').addEventListener('input', function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
});


document.getElementById('set-name').addEventListener('change', function () {
    localStorage.setItem('setNameTossupSave', this.value);
});


document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    start(document.getElementById('toggle-select-by-set-name').checked);

    queryLock();
    try {
        questions = await getTossups(setName, packetNumber);
    } finally {
        queryUnlock();
    }

    next();
});


document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
});


document.getElementById('toggle-show-history').addEventListener('click', function () {
    this.blur();
    localStorage.setItem('showTossupHistory', this.checked ? 'true' : 'false');

    if (this.checked) {
        document.getElementById('room-history').classList.remove('d-none');
    } else {
        document.getElementById('room-history').classList.add('d-none');
    }
});


document.getElementById('type-to-answer').addEventListener('click', function () {
    this.blur();
    localStorage.setItem('typeToAnswer', this.checked ? 'true' : 'false');
});


document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (event.key) {
    case ' ':
        document.getElementById('buzz').click();
        // Prevent spacebar from scrolling the page:
        if (event.target == document.body) event.preventDefault();
        break;
    case 'k':
        document.getElementsByClassName('card-header')[0].click();
        break;
    case 'n':
        document.getElementById('next').click();
        break;
    case 'p':
        document.getElementById('pause').click();
        break;
    case 's':
        document.getElementById('start').click();
        break;
    }
});


window.onload = () => {
    if (localStorage.getItem('setNameTossupSave')) {
        setName = localStorage.getItem('setNameTossupSave');
        document.getElementById('set-name').value = setName;
        (async () => {
            maxPacketNumber = await getNumPackets(setName);
            document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
            if (maxPacketNumber === 0) {
                document.getElementById('set-name').classList.add('is-invalid');
            }
        })();
    }

    if (localStorage.getItem('packetNumberTossupSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberTossupSave');
    }

    if (localStorage.getItem('questionNumberTossupSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberTossupSave');
    }

    if (localStorage.getItem('validCategories') === null) {
        localStorage.setItem('validCategories', '[]');
        validCategories = [];
    } else {
        validCategories = JSON.parse(localStorage.getItem('validCategories'));
    }

    if (localStorage.getItem('validSubcategories') === null) {
        localStorage.setItem('validSubcategories', '[]');
        validSubcategories = [];
    } else {
        validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    }

    if (validCategories.length > 0 && validSubcategories.length === 0) {
        validCategories.forEach(category => {
            SUBCATEGORIES[category].forEach(subcategory => {
                validSubcategories.push(subcategory);
            });
        });
    }

    if (sessionStorage.getItem('powers') === null)
        sessionStorage.setItem('powers', 0);
    if (sessionStorage.getItem('tens') === null)
        sessionStorage.setItem('tens', 0);
    if (sessionStorage.getItem('negs') === null)
        sessionStorage.setItem('negs', 0);
    if (sessionStorage.getItem('dead') === null)
        sessionStorage.setItem('dead', 0);
    if (sessionStorage.getItem('points') === null)
        sessionStorage.setItem('points', 0);
    if (sessionStorage.getItem('totalCelerity') === null)
        sessionStorage.setItem('totalCelerity', 0);

    if (localStorage.getItem('speed') === null) {
        localStorage.setItem('speed', 50);
    }

    document.getElementById('reading-speed-display').innerHTML = localStorage.speed;
    document.getElementById('reading-speed').value = localStorage.speed;

    loadCategoryModal(validCategories, validSubcategories);
    updateStatDisplay();
};

if (localStorage.getItem('showTossupHistory') === 'false') {
    document.getElementById('toggle-show-history').checked = false;
    document.getElementById('room-history').classList.add('d-none');
}

if (localStorage.getItem('typeToAnswer') === 'false') {
    document.getElementById('type-to-answer').checked = false;
}
