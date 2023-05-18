// Functions and variables specific to the tossups page.

// Room settings
let difficulties = [];
let packetNumbers = [];
let setName = '';
let validCategories;
let validSubcategories;

// Status variables
let currentlyBuzzing = false;
let packetNumber = -1;
let paused = false;
let powermarkPosition = 0;

// WARNING: 0-indexed (instead of 1-indexed, like in multiplayer)
let questionNumber = 0;
let timeoutID = -1;

const previous = {
    isCorrect: true,
    inPower: false,
    negValue: -5,
    powerValue: 15,
    endOfQuestion: false,
    celerity: 0,
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
    document.getElementById('question').innerHTML = '';
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
            questions = await getRandomTossup(difficulties, validCategories, validSubcategories);
            questions = [questions];
        } finally {
            queryUnlock();
        }

        if (!questions[0]) {
            alert('No questions found');
            return false;
        }

        ({ setName, packetNumber, questionNumber } = questions[0]);

        questionText = questions[0].question;
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
    document.getElementById('next').disabled = true;
    document.getElementById('start').disabled = true;
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


/**
 * @param {String} setName - The name of the set (e.g. "2021 ACF Fall").
 * @param {String} packetNumber - The packet number of the set.
 * @return {Promise<Array<JSON>>} An array containing the tossups.
 */
async function getTossups(setName, packetNumber) {
    if (setName === '') {
        return [];
    }
    return await fetch(`/api/packet-tossups?&setName=${encodeURIComponent(setName)}&packetNumber=${encodeURIComponent(packetNumber)}`)
        .then(response => response.json())
        .then(data => data.tossups);
}


async function giveAnswer(givenAnswer) {
    currentlyBuzzing = false;

    const [directive, directedPrompt] = await checkAnswer(questions[questionNumber].answer, givenAnswer);

    switch (directive) {
    case 'accept':
        updateScore(true);
        revealQuestion();
        break;
    case 'reject':
        updateScore(false);
        if (document.getElementById('toggle-rebuzz').checked) {
            document.getElementById('buzz').disabled = false;
            document.getElementById('buzz').innerHTML = 'Buzz';
            document.getElementById('next').disabled = false;
            document.getElementById('pause').disabled = false;
            document.getElementById('start').disabled = false;
            readQuestion(new Date().getTime());
        } else {
            revealQuestion();
        }
        break;
    case 'prompt':
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
        break;
    }
}


function isPace(setName) {
    if (!setName)
        return false;

    return setName.includes('PACE');
}

async function loadRandomTossups(difficulties = [], categories = [], subcategories = [], number = 1) {
    const minYear = parseInt(document.getElementsByClassName('sliderValue0')[0].innerHTML);
    const maxYear = parseInt(document.getElementsByClassName('sliderValue1')[0].innerHTML);

    const uri = `/api/random-tossup?
            difficulties=${encodeURIComponent(difficulties)}&
            categories=${encodeURIComponent(categories)}&
            subcategories=${encodeURIComponent(subcategories)}&
            number=${encodeURIComponent(number)}&
            minYear=${encodeURIComponent(minYear)}&
            maxYear=${encodeURIComponent(maxYear)}&
        `.replace(/\s/g, '');

    randomQuestions = await fetch(uri)
        .then(response => response.json())
        .then(response => response.tossups)
        .then(questions => {
            for (let i = 0; i < questions.length; i++) {
                if (Object.prototype.hasOwnProperty.call(questions[i], 'formatted_answer'))
                    questions[i].answer = questions[i].formatted_answer;
            }

            return questions;
        });
}


async function getRandomTossup(difficulties = [], categories = [], subcategories = []) {
    if (randomQuestions.length === 0)
        await loadRandomTossups(difficulties, categories, subcategories, 20);

    const randomQuestion = randomQuestions.pop();

    // Begin loading the next batch of questions (asynchronously)
    if (randomQuestions.length === 0)
        loadRandomTossups(difficulties, categories, subcategories, 20);

    return randomQuestion;
}


async function next() {
    // Stop reading the current question:
    clearTimeout(timeoutID);
    currentlyBuzzing = false;

    if (await getAccountUsername() && document.getElementById('answer').innerHTML) {
        const pointValue = previous.isCorrect ? (previous.inPower ? previous.powerValue : 10) : (previous.endOfQuestion ? 0 : previous.negValue);
        fetch('/auth/record-tossup', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tossup: questions[questionNumber],
                isCorrect: previous.isCorrect,
                pointValue: pointValue,
                celerity: previous.celerity,
                multiplayer: false,
            })
        });
    }

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
    powermarkPosition = 0;
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
    } else {
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
        if (word === '(*)')
            powermarkPosition = document.getElementById('question').innerHTML.length;
        else
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


function revealQuestion() {
    document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[questionNumber].answer;
    let question = (document.getElementById('question').innerHTML);
    if (powermarkPosition)
        question = question.slice(0, powermarkPosition) + '(*) ' + question.slice(powermarkPosition);

    const powerParts = (question + questionTextSplit.join(' ')).split('(*)');
    document.getElementById('question').innerHTML = `${powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : powerParts[0]}`;

    document.getElementById('buzz').disabled = true;
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('next').disabled = false;
    document.getElementById('next').innerHTML = 'Next';
    document.getElementById('start').disabled = false;

    document.getElementById('toggle-correct').classList.remove('d-none');
    document.getElementById('toggle-correct').innerHTML = previous.isCorrect ? 'I was wrong' : 'I was right';
}


function toggleCorrect() {
    const multiplier = previous.isCorrect ? -1 : 1;

    if (previous.inPower) {
        shift('powers', multiplier * 1);
        shift('points', multiplier * previous.powerValue);
    } else {
        shift('tens', multiplier * 1);
        shift('points', multiplier * 10);
    }

    if (previous.endOfQuestion) {
        shift('dead', multiplier * -1);
    } else {
        shift('negs', multiplier * -1);
        shift('points', multiplier * -previous.negValue);
    }

    shift('totalCelerity', multiplier * previous.celerity);

    previous.isCorrect = !previous.isCorrect;
    document.getElementById('toggle-correct').innerHTML = (previous.isCorrect ? 'I was wrong' : 'I was right');
    updateStatDisplay();
}


function updateScore(isCorrect) {
    const endOfQuestion = (questionTextSplit.length === 0);
    const inPower = questionTextSplit.includes('(*)') && questionText.includes('(*)');
    const powerValue = isPace(setName) ? 20 : 15;
    const negValue = isPace(setName) ? 0 : -5;
    const points = isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);

    const characterCount = questionTextSplit.join(' ').length;
    const celerity = characterCount / questionText.length;

    let result;

    if (isCorrect) {
        result = inPower ? 'powers' : 'tens';
        shift('totalCelerity', celerity);
    } else {
        result = endOfQuestion ? 'dead' : 'negs';
    }

    shift(result, 1);
    shift('points', points);

    updateStatDisplay();

    previous.celerity = celerity;
    previous.endOfQuestion = endOfQuestion;
    previous.inPower = inPower;
    previous.negValue = negValue;
    previous.powerValue = powerValue;
    previous.isCorrect = isCorrect;
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

    // reveal answer on second click
    // when NOT using type to answer
    if (currentlyBuzzing) {
        currentlyBuzzing = false;
        updateScore(true);
        revealQuestion();
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
    loadRandomTossups(difficulties, validCategories, validSubcategories);
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', function () {
    randomQuestions = [];
    difficulties = getDropdownValues('difficulties');
    loadRandomTossups(difficulties, validCategories, validSubcategories);
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


document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
    if (this.checked) {
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        localStorage.setItem('selectBySetName', 'true');
    } else {
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        localStorage.setItem('selectBySetName', 'false');
    }
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
    if (this.checked) {
        localStorage.setItem('typeToAnswer', 'true');
        document.getElementById('toggle-rebuzz').disabled = false;
    } else {
        localStorage.setItem('typeToAnswer', 'false');
        document.getElementById('toggle-rebuzz').disabled = true;
    }
});


document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    localStorage.setItem('toggleRebuzz', this.checked ? 'true' : 'false');
});


document.getElementById('year-range-a').onchange = function () {
    randomQuestions = [];
    loadRandomTossups(difficulties, validCategories, validSubcategories);

    localStorage.setItem('minYear', $('#slider').slider('values', 0));
    localStorage.setItem('maxYear', $('#slider').slider('values', 1));
};


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
    for (const parameter of ['powers', 'tens', 'negs', 'dead', 'points', 'totalCelerity']) {
        if (!sessionStorage.getItem(parameter))
            sessionStorage.setItem(parameter, 0);
    }
    updateStatDisplay();


    if (localStorage.getItem('packetNumberTossupSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberTossupSave');
    }

    if (localStorage.getItem('questionNumberTossupSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberTossupSave');
    }

    if (localStorage.getItem('showTossupHistory') === 'false') {
        document.getElementById('toggle-show-history').checked = false;
        document.getElementById('room-history').classList.add('d-none');
    }

    if (localStorage.getItem('speed')) {
        document.getElementById('reading-speed-display').innerHTML = localStorage.speed;
        document.getElementById('reading-speed').value = localStorage.speed;
    } else {
        localStorage.setItem('speed', 50);
    }

    if (localStorage.getItem('toggleRebuzz') === 'true') {
        document.getElementById('toggle-rebuzz').checked = true;
    }

    if (localStorage.getItem('typeToAnswer') === 'false') {
        document.getElementById('type-to-answer').checked = false;
        document.getElementById('toggle-rebuzz').disabled = true;
    }


    if (localStorage.getItem('validCategories')) {
        validCategories = JSON.parse(localStorage.getItem('validCategories'));
    } else {
        localStorage.setItem('validCategories', '[]');
        validCategories = [];
    }

    if (localStorage.getItem('validSubcategories')) {
        validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    } else {
        localStorage.setItem('validSubcategories', '[]');
        validSubcategories = [];
    }

    if (validCategories.length > 0 && validSubcategories.length === 0) {
        validCategories.forEach(category => {
            SUBCATEGORIES[category].forEach(subcategory => {
                validSubcategories.push(subcategory);
            });
        });
    }

    loadCategoryModal(validCategories, validSubcategories);


    if (localStorage.getItem('selectBySetName') === 'false') {
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
        document.getElementById('toggle-select-by-set-name').checked = false;
    }

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
};
