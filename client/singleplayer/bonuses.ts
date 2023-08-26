// Functions and variables specific to the bonuses page.

// Room settings
const query = localStorage.getItem('singleplayer-bonus-query')
    ? JSON.parse(localStorage.getItem('singleplayer-bonus-query'))
    : {
        categories: [],
        difficulties: [],
        minYear: 2010,
        maxYear: 2023,
        packetNumbers: [],
        setName: '',
        subcategories: [],
        threePartBonuses: true,
    };

const settings = localStorage.getItem('singleplayer-bonus-settings')
    ? JSON.parse(localStorage.getItem('singleplayer-bonus-settings'))
    : {
        selectBySetName: false,
        showHistory: true,
        typeToAnswer: false,
    };

// Status variables
let currentBonusPart = -1;
let maxPacketNumber = 24;
let questionNumber = 0; // WARNING: 1-indexed
let questions = [{}];

const stats = sessionStorage.getItem('bonus-stats')
    ? JSON.parse(sessionStorage.getItem('bonus-stats'))
    : {
        0: 0,
        10: 0,
        20: 0,
        30: 0,
    };

updateStatDisplay();

/**
 * An array of random questions.
 * We get 20 random questions at a time so we don't have to make an HTTP request between every question.
 */
let randomQuestions = [];


function queryLock() {
    document.getElementById('question').textContent = 'Fetching questions...';
    document.getElementById('start').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('reveal').disabled = true;
}


function queryUnlock() {
    document.getElementById('question').textContent = '';
    document.getElementById('start').disabled = false;
    document.getElementById('next').disabled = false;
    document.getElementById('reveal').disabled = false;
}


async function advanceQuestion() {
    if (settings.selectBySetName) {
        do {  // Get the next question
            questionNumber++;

            // Go to the next packet if you reach the end of this packet
            if (questionNumber > questions.length) {
                query.packetNumbers.shift();
                if (query.packetNumbers.length == 0) {
                    window.alert('No more questions left');
                    document.getElementById('reveal').disabled = true;
                    document.getElementById('next').disabled = true;
                    return false;
                }

                queryLock();
                try {
                    questions = await getBonuses(query.setName, query.packetNumbers[0]);
                } finally {
                    queryUnlock();
                }

                questionNumber = 1;
            }

            // Get the next question if the current one is in the wrong category and subcategory
        } while (!isValidCategory(questions[questionNumber - 1], query.categories, query.subcategories));

        if (Object.keys(questions[0]).length > 0) {
            document.getElementById('question-number-info').textContent = questionNumber;
        }
    } else {
        queryLock();
        try {
            questions = await getRandomBonus(query);
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
        document.getElementById('question-number-info').textContent = questions[0].questionNumber;
        questionNumber = 1;
    }

    return true;
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
    stats[0] = 0;
    stats[10] = 0;
    stats[20] = 0;
    stats[30] = 0;

    updateStatDisplay();
    sessionStorage.removeItem('bonus-stats');
}


function createBonusPart(bonusPartNumber, bonusText) {
    const input = document.createElement('input');
    input.id = `checkbox-${bonusPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.style = 'width: 20px; height: 20px; cursor: pointer';
    input.addEventListener('click', function () {
        this.blur();
    });

    const inputWrapper = document.createElement('label');
    inputWrapper.style = 'cursor: pointer';
    inputWrapper.appendChild(input);

    const p = document.createElement('p');
    p.appendChild(document.createTextNode('[10] ' + bonusText));

    const bonusPart = document.createElement('div');
    bonusPart.id = `bonus-part-${bonusPartNumber + 1}`;
    bonusPart.appendChild(p);

    const row = document.createElement('div');
    row.className = 'd-flex';
    row.appendChild(inputWrapper);
    row.appendChild(bonusPart);

    document.getElementById('question').appendChild(row);
}


/**
 * @param {String} setName - The name of the set (e.g. "2021 ACF Fall").
 * @param {String} packetNumber - The packet number of the set.
 * @return {Promise<Array<JSON>>} An array containing the bonuses.
 */
async function getBonuses(setName, packetNumber) {
    if (setName === '') {
        return [];
    }

    return await fetch('/api/packet-bonuses?' + new URLSearchParams({ setName, packetNumber }))
        .then(response => response.json())
        .then(data => data.bonuses);
}


function updateStatsForCurrentBonus() {
    let pointsOnBonus = 0;

    Array.from(document.getElementsByClassName('checkbox')).forEach(checkbox => {
        if (checkbox.checked) {
            pointsOnBonus += 10;
        }
    });

    stats[pointsOnBonus] = isNaN(stats[pointsOnBonus]) ? 1 : stats[pointsOnBonus] + 1;
    sessionStorage.setItem('bonus-stats', JSON.stringify(stats));
}


async function getRandomBonus({ categories, difficulties, minYear, maxYear, subcategories, threePartBonuses }) {
    if (randomQuestions.length === 0) {
        await loadRandomBonuses({ categories, difficulties, minYear, maxYear, number: 20, subcategories, threePartBonuses });
    }

    const randomQuestion = randomQuestions.pop();

    // Begin loading the next batch of questions (asynchronously)
    if (randomQuestions.length === 0) {
        loadRandomBonuses({ categories, difficulties, minYear, maxYear, number: 20, subcategories, threePartBonuses });
    }

    return randomQuestion;
}


async function giveAnswer(givenAnswer) {
    const { directive, directedPrompt } = await checkAnswer(questions[questionNumber - 1].answers[currentBonusPart], givenAnswer);

    switch (directive) {
    case 'accept':
        document.getElementById(`checkbox-${currentBonusPart + 1}`).checked = true;
    // eslint-disable-next-line no-fallthrough
    case 'reject':
        document.getElementById('reveal').disabled = false;
        revealBonusPart();
        break;
    case 'prompt':
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    }
}


async function loadRandomBonuses({ categories, difficulties, minYear, maxYear, number = 1, subcategories, threePartBonuses }) {
    randomQuestions = [];
    await fetch('/api/random-bonus?' + new URLSearchParams({ categories, difficulties, maxYear, minYear, number, subcategories, threePartBonuses }))
        .then(response => response.json())
        .then(response => response.bonuses)
        .then(questions => {
            for (let i = 0; i < questions.length; i++) {
                if (Object.prototype.hasOwnProperty.call(questions[i], 'formatted_answers'))
                    questions[i].answers = questions[i].formatted_answers;
            }

            randomQuestions = questions;
        });
}


/**
 * Loads and reads the next question.
 */
async function next() {
    if (questions[questionNumber - 1] && currentBonusPart >= questions[questionNumber - 1].parts.length) {
        const pointsPerPart = Array.from(document.getElementsByClassName('checkbox')).map((checkbox, index) => {
            if (!checkbox.checked) {
                return 0;
            }

            if (questions[questionNumber - 1].values === undefined || questions[questionNumber - 1].values === null) {
                return 10;
            }

            if (questions[questionNumber - 1].values[index] === undefined || questions[questionNumber - 1].values[index] === null) {
                return 10;
            }

            return questions[questionNumber - 1].values[index];
        });

        if (await getAccountUsername()) {
            fetch('/auth/record-bonus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bonus: questions[questionNumber - 1],
                    pointsPerPart: pointsPerPart,
                }),
            }).then(response => {
                if (response.status === 401) {
                    deleteAccountUsername();
                    throw new Error('Unauthenticated');
                }
            });
        }
    }

    document.getElementById('question').textContent = '';
    document.getElementById('reveal').disabled = false;
    document.getElementById('next').textContent = 'Skip';

    const hasNextQuestion = await advanceQuestion();

    if (!hasNextQuestion)
        return;

    document.getElementById('set-name-info').textContent = query.setName;
    document.getElementById('packet-number-info').textContent = query.packetNumbers[0];

    // Update the question text:
    const paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode(questions[questionNumber - 1].leadin));
    document.getElementById('question').textContent = '';
    document.getElementById('question').appendChild(paragraph);

    currentBonusPart = 0;
    createBonusPart(currentBonusPart, questions[questionNumber - 1].parts[currentBonusPart]);
}


/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart() {
    if (currentBonusPart >= questions[questionNumber - 1].parts.length)
        return;

    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'ANSWER: ' + questions[questionNumber - 1].answers[currentBonusPart];
    document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
    currentBonusPart++;

    if (currentBonusPart >= questions[questionNumber - 1].parts.length) {
        document.getElementById('reveal').disabled = true;
        document.getElementById('next').textContent = 'Next';
    } else {
        createBonusPart(currentBonusPart, questions[questionNumber - 1].parts[currentBonusPart]);
    }
}


/**
 * Calculates the points per bonus and updates the display.
 */
function updateStatDisplay() {
    const numBonuses = stats[0] + stats[10] + stats[20] + stats[30];
    const points = 30 * stats[30] + 20 * stats[20] + 10 * stats[10];
    const ppb = Math.round(100 * points / numBonuses) / 100 || 0;

    const includePlural = (numBonuses == 1) ? '' : 'es';
    document.getElementById('statline').textContent
        = `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${stats[30]}/${stats[20]}/${stats[10]}/${stats[0]}, ${points} pts)`;
}


document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        ({ categories: query.categories, subcategories: query.subcategories } = updateCategory(input.id, query.categories, query.subcategories));
        loadCategoryModal(query.categories, query.subcategories);
        localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        query.subcategories = updateSubcategory(input.id, query.subcategories);
        loadCategoryModal(query.categories, query.subcategories);
        localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
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


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    loadRandomBonuses(query);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', function () {
    query.difficulties = getDropdownValues('difficulties');
    loadRandomBonuses(query);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createBonusCard(questions[questionNumber - 1]);

    if (this.innerHTML === 'Next') {
        updateStatsForCurrentBonus();
        updateStatDisplay();
    }

    next();
});


document.getElementById('packet-number').addEventListener('change', function () {
    // if field is blank, store blank result in `query`
    query.packetNumbers = rangeToArray(this.value.trim(), 0);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
    query.packetNumbers = rangeToArray(this.value.trim(), maxPacketNumber);
});


document.getElementById('question-number').addEventListener('change', function () {
    questionNumber = document.getElementById('question-number').value;
    if (questionNumber === '') {
        questionNumber = '1';
    }
    questionNumber = parseInt(questionNumber) - 1;
    localStorage.setItem('questionNumberBonusSave', document.getElementById('question-number').value);
});


document.getElementById('reveal').addEventListener('click', function () {
    this.blur();
    if (document.getElementById('type-to-answer').checked) {
        document.getElementById('answer-input-group').classList.remove('d-none');
        document.getElementById('answer-input').focus();
        this.disabled = true;
    } else {
        revealBonusPart();
    }
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

    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
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
            questions = await getBonuses(query.setName, query.packetNumbers[0]);
        } finally {
            queryUnlock();
        }
    }

    next();
});


document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
    this.blur();
    settings.selectBySetName = this.checked;
    document.getElementById('toggle-three-part-bonuses').disabled = this.checked;

    if (this.checked) {
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
    } else {
        document.getElementById('difficulty-settings').classList.remove('d-none');
        document.getElementById('set-settings').classList.add('d-none');
    }

    localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});

document.getElementById('toggle-three-part-bonuses').addEventListener('click', function () {
    this.blur();
    query.threePartBonuses = this.checked;
    loadRandomBonuses(query);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});

document.getElementById('toggle-show-history').addEventListener('click', function () {
    this.blur();
    settings.showHistory = this.checked;

    if (this.checked) {
        document.getElementById('room-history').classList.remove('d-none');
    } else {
        document.getElementById('room-history').classList.add('d-none');
    }

    localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});


document.getElementById('type-to-answer').addEventListener('click', function () {
    this.blur();
    settings.typeToAnswer = this.checked;
    localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});


document.getElementById('year-range-a').onchange = function () {
    query.minYear = $('#slider').slider('values', 0);
    query.maxYear = $('#slider').slider('values', 1);
    loadRandomBonuses(query);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
};

document.getElementById('year-range-b').onchange = function () {
    query.minYear = $('#slider').slider('values', 0);
    query.maxYear = $('#slider').slider('values', 1);
    loadRandomBonuses(query);
    localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
};


document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName))
        return;

    switch (event.key) {
    case ' ':
        document.getElementById('reveal').click();

        // Prevent spacebar from scrolling the page
        if (event.target == document.body)
            event.preventDefault();

        break;
    case 'k':
        document.getElementsByClassName('card-header')[0].click();
        break;
    case 'n':
        document.getElementById('next').click();
        break;
    case 's':
        document.getElementById('start').click();
        break;
    case '0':
        document.getElementById(`checkbox-${currentBonusPart}`).click();
        break;
    case '1':
        document.getElementById('checkbox-1').click();
        break;
    case '2':
        document.getElementById('checkbox-2').click();
        break;
    case '3':
        document.getElementById('checkbox-3').click();
        break;
    case '4':
        document.getElementById('checkbox-4').click();
        break;
    }
});


window.onload = async () => {
    if (localStorage.getItem('questionNumberTossupSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberTossupSave');
        questionNumber = parseInt(localStorage.getItem('questionNumberTossupSave')) - 1;
    }

    if (settings.selectBySetName) {
        document.getElementById('difficulty-settings').classList.add('d-none');
        document.getElementById('set-settings').classList.remove('d-none');
        document.getElementById('toggle-select-by-set-name').checked = true;
        document.getElementById('toggle-three-part-bonuses').disabled = true;
    }

    if (!settings.showHistory) {
        document.getElementById('toggle-show-history').checked = false;
        document.getElementById('room-history').classList.add('d-none');
    }

    if (settings.typeToAnswer) {
        document.getElementById('type-to-answer').checked = true;
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

    if (query.setName) {
        document.getElementById('set-name').value = query.setName;
        maxPacketNumber = await getNumPackets(query.setName);

        if (maxPacketNumber === 0) {
            document.getElementById('set-name').classList.add('is-invalid');
        } else {
            document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
        }
    }

    if (!query.threePartBonuses) {
        document.getElementById('toggle-three-part-bonuses').checked = false;
    }
};
