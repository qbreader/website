// Functions and variables specific to the tossups page.

const query = localStorage.getItem('singleplayer-tossup-query')
    ? JSON.parse(localStorage.getItem('singleplayer-tossup-query'))
    : {
        categories: [],
        difficulties: [],
        minYear: 2010,
        maxYear: 2023,
        packetNumbers: [],
        powermarkOnly: false,
        setName: '',
        subcategories: [],
    };

const settings = localStorage.getItem('singleplayer-tossup-settings')
    ? JSON.parse(localStorage.getItem('singleplayer-tossup-settings'))
    : {
        readingSpeed: 50,
        rebuzz: false,
        selectBySetName: false,
        showHistory: true,
        typeToAnswer: true,
    };

// Status variables
let currentlyBuzzing = false;
let maxPacketNumber = 24;
let paused = false;
let powermarkPosition = 0;
let questionNumber = 0; // WARNING: 1-indexed
let timeoutID = -1;

const previous = {
    isCorrect: true,
    inPower: false,
    negValue: -5,
    powerValue: 15,
    endOfQuestion: false,
    celerity: 0,
};

const stats = sessionStorage.getItem('tossup-stats') ?
    JSON.parse(sessionStorage.getItem('tossup-stats')) : {
        powers: 0,
        tens: 0,
        negs: 0,
        dead: 0,
        points: 0,
        totalCorrectCelerity: 0,
    };

updateStatDisplay();

let questions = [{}];
let questionText = '';
let questionTextSplit = [];

/**
 * An array of random questions.
 * We get 20 random questions at a time so we don't have to make an HTTP request between every question.
 */
let randomQuestions = [];


function queryLock() {
    document.getElementById('question').textContent = 'Fetching questions...';
    document.getElementById('start').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('pause').disabled = true;
    document.getElementById('buzz').disabled = true;
}


function queryUnlock() {
    document.getElementById('question').textContent = '';
    document.getElementById('start').disabled = false;
    document.getElementById('next').disabled = false;
    document.getElementById('pause').disabled = false;
    document.getElementById('buzz').disabled = false;
}


/**
 * @returns {Promise<boolean>} Whether or not there is a next question
 */
async function advanceQuestion() {
    if (settings.selectBySetName) {
        // Get the next question if the current one is in the wrong category and subcategory
        do {
            questionNumber++;

            // Go to the next packet if you reach the end of this packet
            if (questionNumber > questions.length) {
                query.packetNumbers.shift();
                if (query.packetNumbers.length === 0) {
                    window.alert('No more questions left');
                    document.getElementById('buzz').disabled = true;
                    document.getElementById('pause').disabled = true;
                    document.getElementById('next').disabled = true;
                    return false;  // alert the user if there are no more packets
                }

                queryLock();
                try {
                    questions = await getTossups(query.setName, query.packetNumbers[0]);
                } finally {
                    queryUnlock();
                }

                questionNumber = 1;
            }
        } while (!isValidCategory(questions[questionNumber - 1], query.categories, query.subcategories));

        if (Object.keys(questions[0]).length > 0) {
            questionText = questions[questionNumber - 1].question;
            questionTextSplit = questionText.split(' ').filter(word => word !== '');
            document.getElementById('question-number-info').textContent = questionNumber;
        }
    } else {
        queryLock();
        try {
            questions = await getRandomTossup(query);
            questions = [questions];
        } finally {
            queryUnlock();
        }

        if (!questions[0]) {
            alert('No questions found');
            return false;
        }

        query.setName = questions[0].set.name;
        query.packetNumbers = [questions[0].packet.number];

        questionText = questions[0].question;
        questionTextSplit = questionText.split(' ').filter(word => word !== '');
        document.getElementById('question-number-info').textContent = questions[0].questionNumber;
        questionNumber = 1;
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
    document.getElementById('question').textContent += '(#) ';

    document.getElementById('buzz').textContent = 'Reveal';
    document.getElementById('next').disabled = true;
    document.getElementById('start').disabled = true;
    document.getElementById('pause').disabled = true;
}


/**
 * @param {String} answerline
 * @param {String} givenAnswer
 * @returns {Promise<{
    * directive: "accept" | "prompt" | "reject",
    * directedPrompt: String | null
 * }>}
 */
async function checkAnswer(answerline, givenAnswer) {
    if (givenAnswer === '') {
        return { directive: 'reject', directedPrompt: null };
    }

    return await fetch('/api/check-answer?' + new URLSearchParams({ answerline, givenAnswer }))
        .then(response => response.json());
}


/**
 * Clears user stats.
 */
function clearStats() {
    stats.powers = 0;
    stats.tens = 0;
    stats.negs = 0;
    stats.dead = 0;
    stats.points = 0;
    stats.totalCorrectCelerity = 0;

    updateStatDisplay();
    sessionStorage.removeItem('tossup-stats');
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

    return await fetch('/api/packet-tossups?' + new URLSearchParams({ setName, packetNumber }))
        .then(response => response.json())
        .then(data => data.tossups);
}


async function giveAnswer(givenAnswer) {
    currentlyBuzzing = false;

    const { directive, directedPrompt } = await checkAnswer(questions[questionNumber - 1].answer, givenAnswer);

    switch (directive) {
    case 'accept':
        updateScore(true);
        revealQuestion();
        break;
    case 'reject':
        updateScore(false);
        if (settings.rebuzz) {
            document.getElementById('buzz').disabled = false;
            document.getElementById('buzz').textContent = 'Buzz';
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

async function loadRandomTossups({ categories, difficulties, minYear, maxYear, number = 1, powermarkOnly, subcategories }) {
    randomQuestions = [];
    await fetch('/api/random-tossup?' + new URLSearchParams({ categories, difficulties, maxYear, minYear, number, powermarkOnly, subcategories }))
        .then(response => response.json())
        .then(response => response.tossups)
        .then(questions => {
            for (let i = 0; i < questions.length; i++) {
                if (Object.prototype.hasOwnProperty.call(questions[i], 'formatted_answer'))
                    questions[i].answer = questions[i].formatted_answer;
            }

            randomQuestions = questions;
        });
}


/**
 * Get a random tossup.
 * @returns
 */
async function getRandomTossup({ categories, difficulties, minYear, maxYear, powermarkOnly, subcategories }) {
    if (randomQuestions.length === 0) {
        await loadRandomTossups({ categories, difficulties, maxYear, minYear, number: 20, powermarkOnly, subcategories });
    }

    const randomQuestion = randomQuestions.pop();

    // Begin loading the next batch of questions (asynchronously)
    if (randomQuestions.length === 0) {
        loadRandomTossups({ categories, difficulties, maxYear, minYear, number: 20, powermarkOnly, subcategories });
    }

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tossup: questions[questionNumber - 1],
                isCorrect: previous.isCorrect,
                pointValue: pointValue,
                celerity: previous.celerity,
                multiplayer: false,
            }),
        }).then(response => {
            if (response.status === 401) {
                deleteAccountUsername();
                throw new Error('Unauthenticated');
            }
        });
    }

    document.getElementById('answer').textContent = '';
    document.getElementById('question').textContent = '';
    document.getElementById('toggle-correct').textContent = 'I was wrong';
    document.getElementById('toggle-correct').classList.add('d-none');

    const hasNextQuestion = await advanceQuestion();

    if (!hasNextQuestion)
        return;

    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('buzz').disabled = false;
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('packet-number-info').textContent = query.packetNumbers[0];
    document.getElementById('pause').textContent = 'Pause';
    document.getElementById('pause').disabled = false;
    document.getElementById('question').textContent = '';
    document.getElementById('set-name-info').textContent = query.setName;

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
        document.getElementById('pause').textContent = 'Pause';
        readQuestion(new Date().getTime());
    } else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').textContent = 'Resume';
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
            document.getElementById('question').textContent += word + ' ';

        // calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === '(*)')
            time = 0;

        time = time * 0.9 * (125 - settings.readingSpeed);
        const delay = time - new Date().getTime() + expectedReadTime;

        timeoutID = window.setTimeout(() => {
            readQuestion(time + expectedReadTime);
        }, delay);
    } else {
        document.getElementById('pause').disabled = true;
    }
}


function revealQuestion() {
    document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[questionNumber - 1].answer;
    let question = (document.getElementById('question').innerHTML);
    if (powermarkPosition)
        question = question.slice(0, powermarkPosition) + '(*) ' + question.slice(powermarkPosition);

    const powerParts = (question + questionTextSplit.join(' ')).split('(*)');
    document.getElementById('question').innerHTML = `${powerParts.length > 1 ? '<b>' + powerParts[0] + '(*)</b>' + powerParts[1] : powerParts[0]}`;

    document.getElementById('buzz').disabled = true;
    document.getElementById('buzz').textContent = 'Buzz';
    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Next';
    document.getElementById('start').disabled = false;

    document.getElementById('toggle-correct').classList.remove('d-none');
    document.getElementById('toggle-correct').textContent = previous.isCorrect ? 'I was wrong' : 'I was right';
}


function toggleCorrect() {
    const multiplier = previous.isCorrect ? -1 : 1;

    if (previous.inPower) {
        stats.powers += multiplier * 1;
        stats.points += multiplier * previous.powerValue;
    } else {
        stats.tens += multiplier * 1;
        stats.points += multiplier * 10;
    }

    if (previous.endOfQuestion) {
        stats.dead += multiplier * -1;
    } else {
        stats.negs += multiplier * -1;
        stats.points += multiplier * -previous.negValue;
    }

    stats.totalCorrectCelerity += multiplier * previous.celerity;

    previous.isCorrect = !previous.isCorrect;
    document.getElementById('toggle-correct').textContent = previous.isCorrect ? 'I was wrong' : 'I was right';

    updateStatDisplay();
    sessionStorage.setItem('tossup-stats', JSON.stringify(stats));
}


function updateScore(isCorrect) {
    const endOfQuestion = (questionTextSplit.length === 0);
    const inPower = questionTextSplit.includes('(*)') && questionText.includes('(*)');
    const powerValue = isPace(query.setName) ? 20 : 15;
    const negValue = isPace(query.setName) ? 0 : -5;
    const points = isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);

    const characterCount = questionTextSplit.join(' ').length;
    const celerity = characterCount / questionText.length;

    let result;

    if (isCorrect) {
        result = inPower ? 'powers' : 'tens';
        stats.totalCorrectCelerity += celerity;
    } else {
        result = endOfQuestion ? 'dead' : 'negs';
    }

    stats[result] += 1;
    stats.points += points;

    previous.celerity = celerity;
    previous.endOfQuestion = endOfQuestion;
    previous.inPower = inPower;
    previous.negValue = negValue;
    previous.powerValue = powerValue;
    previous.isCorrect = isCorrect;

    updateStatDisplay();
    sessionStorage.setItem('tossup-stats', JSON.stringify(stats));
}


/**
 * Updates the displayed stat line.
 */
function updateStatDisplay() {
    const { powers, tens, negs, dead, points, totalCorrectCelerity } = stats;
    const numTossups = powers + tens + negs + dead;
    const numCorrectTossups = powers + tens;
    let celerity = numCorrectTossups != 0 ? parseFloat(totalCorrectCelerity) / numCorrectTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    const includePlural = (numTossups === 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${powers}/${tens}/${negs} with ${numTossups} tossup${includePlural} seen (${points} pts, celerity: ${celerity})`;

    // disable clear stats button if no stats
    document.getElementById('clear-stats').disabled = (numTossups === 0);
}


document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        ({ categories: query.categories, subcategories: query.subcategories } = updateCategory(input.id, query.categories, query.subcategories));
        loadCategoryModal(query.categories, query.subcategories);
        localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        query.subcategories = updateSubcategory(input.id, query.subcategories);
        loadCategoryModal(query.categories, query.subcategories);
        localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    });
});


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

    if (settings.typeToAnswer) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        this.disabled = true;
    }
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    loadRandomTossups(query);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', function () {
    query.difficulties = getDropdownValues('difficulties');
    loadRandomTossups(query);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createTossupCard(questions[questionNumber - 1]);
    next();
});


document.getElementById('packet-number').addEventListener('change', function () {
    // if field is blank, store blank result in `query`
    query.packetNumbers = rangeToArray(this.value.trim(), 0);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    query.packetNumbers = rangeToArray(this.value.trim(), maxPacketNumber);
});


document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
});


document.getElementById('question-number').addEventListener('change', function () {
    questionNumber = document.getElementById('question-number').value;
    if (questionNumber === '') {
        questionNumber = '1';
    }
    questionNumber = parseInt(questionNumber) - 1;
    localStorage.setItem('questionNumberTossupSave', document.getElementById('question-number').value);
});


document.getElementById('reading-speed').addEventListener('input', function () {
    settings.readingSpeed = this.value;
    document.getElementById('reading-speed-display').textContent = this.value;
    localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});


document.getElementById('set-name').addEventListener('change', async function () {
    query.setName = this.value.trim();

    // make border red if set name is not in set list
    if (SET_LIST.includes(this.value) || this.value.length === 0) {
        this.classList.remove('is-invalid');
    } else {
        this.classList.add('is-invalid');
    }

    maxPacketNumber = await getNumPackets(this.value);

    if (this.value === '' || maxPacketNumber === 0) {
        document.getElementById('packet-number').placeholder = 'Packet Numbers';
    } else {
        document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
    }

    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});


document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    if (query.setName.length === 0 && settings.selectBySetName) {
        alert('Please enter a set name.');
        return false;
    }

    if (query.packetNumbers.length === 0 && settings.selectBySetName) {
        query.packetNumbers = rangeToArray(document.getElementById('packet-number').value.trim(), maxPacketNumber);
    }

    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;

    if (settings.selectBySetName) {
        queryLock();
        try {
            questions = await getTossups(query.setName, query.packetNumbers[0]);
        } finally {
            queryUnlock();
        }
    }

    next();
});


document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
    this.blur();
    query.powermarkOnly = this.checked;
    loadRandomTossups(query);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});


document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
    this.blur();
    settings.selectBySetName = this.checked;
    document.getElementById('toggle-powermark-only').disabled = this.checked;

    if (this.checked) {
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
    } else {
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
    }

    localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});



document.getElementById('toggle-show-history').addEventListener('click', function () {
    this.blur();
    settings.showHistory = this.checked;

    if (this.checked) {
        document.getElementById('room-history').classList.remove('d-none');
    } else {
        document.getElementById('room-history').classList.add('d-none');
    }

    localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});


document.getElementById('type-to-answer').addEventListener('click', function () {
    this.blur();
    settings.typeToAnswer = this.checked;
    document.getElementById('toggle-rebuzz').disabled = !this.checked;
    localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});


document.getElementById('toggle-rebuzz').addEventListener('click', function () {
    this.blur();
    settings.rebuzz = this.checked;
    localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});


document.getElementById('year-range-a').onchange = function () {
    query.minYear = $('#slider').slider('values', 0);
    query.maxYear = $('#slider').slider('values', 1);
    loadRandomTossups(query);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
};

document.getElementById('year-range-b').onchange = function () {
    query.minYear = $('#slider').slider('values', 0);
    query.maxYear = $('#slider').slider('values', 1);
    loadRandomTossups(query);
    localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
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


window.onload = async () => {
    if (localStorage.getItem('questionNumberTossupSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberTossupSave');
        questionNumber = parseInt(localStorage.getItem('questionNumberTossupSave')) - 1;
    }

    if (settings.readingSpeed) {
        document.getElementById('reading-speed-display').textContent = localStorage.speed;
        document.getElementById('reading-speed').value = localStorage.speed;
    }

    if (settings.rebuzz) {
        document.getElementById('toggle-rebuzz').checked = true;
    }

    if (settings.selectBySetName) {
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        document.getElementById('toggle-select-by-set-name').checked = true;
        document.getElementById('toggle-powermark-only').disabled = true;
    }

    if (!settings.showHistory) {
        document.getElementById('toggle-show-history').checked = false;
        document.getElementById('room-history').classList.add('d-none');
    }

    if (!settings.typeToAnswer) {
        document.getElementById('type-to-answer').checked = false;
        document.getElementById('toggle-rebuzz').disabled = true;
    }

    if (query.categories.length > 0 && query.subcategories.length === 0) {
        query.categories.forEach(category => {
            SUBCATEGORIES[category].forEach(subcategory => {
                query.subcategories.push(subcategory);
            });
        });
    }

    loadCategoryModal(query.categories, query.subcategories);

    if (query.difficulties) {
        for (let element of document.getElementById('difficulties').children) {
            const input = element.querySelector('input');
            const difficulty = parseInt(input.value);
            if (query.difficulties.includes(difficulty)) {
                element.classList.add('active');
                input.checked = true;
            }
        }
    }

    $('#slider').slider('values', 0, query.minYear);
    $('#slider').slider('values', 1, query.maxYear);
    document.getElementById('year-range-a').textContent = query.minYear;
    document.getElementById('year-range-b').textContent = query.maxYear;

    if (query.packetNumbers) {
        document.getElementById('packet-number').value = arrayToRange(query.packetNumbers);
    }

    if (query.powermarkOnly) {
        document.getElementById('toggle-powermark-only').checked = true;
    }

    if (query.setName) {
        document.getElementById('set-name').value = query.setName;
        maxPacketNumber = await getNumPackets(query.setName);

        if (maxPacketNumber === 0) {
            document.getElementById('set-name').classList.add('is-invalid');
        } else {
            document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
        }
    }
};
