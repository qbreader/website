// Functions and variables specific to the bonuses page.

// Room settings
let difficulties = [];
let packetNumbers = [];
let setName = '';
let validCategories;
let validSubcategories;

// Status variables
let currentBonusPart = -1;
let packetNumber = -1;
let questions = [{}];
let questionNumber = 0;

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
    if (document.getElementById('toggle-select-by-set-name').checked) {
        do {  // Get the next question
            questionNumber++;

            // Go to the next packet if you reach the end of this packet
            if (questionNumber >= questions.length) {
                packetNumbers.shift();
                if (packetNumbers.length == 0) {
                    window.alert('No more questions left');
                    document.getElementById('reveal').disabled = true;
                    document.getElementById('next').disabled = true;
                    return false;
                }

                packetNumber = packetNumbers[0];

                queryLock();
                try {
                    questions = await getBonuses(setName, packetNumber);
                } finally {
                    queryUnlock();
                }

                questionNumber = 0;
            }

            // Get the next question if the current one is in the wrong category and subcategory
        } while (!isValidCategory(questions[questionNumber], validCategories, validSubcategories));

        if (questions.length > 0) {
            document.getElementById('question-number-info').textContent = questionNumber + 1;
        }
    } else {
        queryLock();
        try {
            questions = await getRandomBonus(difficulties, validCategories, validSubcategories);
            questions = [questions];
        } finally {
            queryUnlock();
        }

        if (!questions[0]) {
            alert('No questions found');
            return false;
        }

        ({ setName, packetNumber, questionNumber } = questions[0]);

        if (questions.length > 0) {
            document.getElementById('question-number-info').textContent = questionNumber;
            questionNumber = 0;
        }
    }

    return true;
}

/**
 * Clears user stats.
 */
function clearStats() {
    sessionStorage.setItem('stats', [0, 0, 0, 0]);
    updateStatDisplay();
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


function getPointsForCurrentBonus() {
    const statsArray = sessionStorage.stats.split(',');

    let pointsOnBonus = 0;
    Array.from(document.getElementsByClassName('checkbox')).forEach((checkbox) => {
        if (checkbox.checked) pointsOnBonus += 10;
    });

    const numberOfIncorrectParts = Math.max(3 - Math.round(pointsOnBonus / 10), 0);

    statsArray[numberOfIncorrectParts]++;
    sessionStorage.setItem('stats', statsArray);
    return pointsOnBonus;
}


async function getRandomBonus(difficulties = [], categories = [], subcategories = []) {
    if (randomQuestions.length === 0)
        await loadRandomBonuses(difficulties, categories, subcategories, 20);

    const randomQuestion = randomQuestions.pop();

    // Begin loading the next batch of questions (asynchronously)
    if (randomQuestions.length === 0)
        loadRandomBonuses(difficulties, categories, subcategories, 20);

    return randomQuestion;
}


async function giveAnswer(givenAnswer) {
    const { directive, directedPrompt } = await checkAnswer(questions[questionNumber].answers[currentBonusPart], givenAnswer);

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


async function loadRandomBonuses(difficulties = [], categories = [], subcategories = [], number = 1) {
    const minYear = parseInt(document.getElementsByClassName('sliderValue0')[0].innerHTML);
    const maxYear = parseInt(document.getElementsByClassName('sliderValue1')[0].innerHTML);

    fetch('/api/random-bonus?' + new URLSearchParams({ difficulties, categories, subcategories, number, minYear, maxYear }))
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
    if (questions[questionNumber] && currentBonusPart >= questions[questionNumber].parts.length) {
        const pointsPerPart = Array.from(document.getElementsByClassName('checkbox')).map((checkbox, index) => {
            if (!checkbox.checked) {
                return 0;
            }

            if (questions[questionNumber].values === undefined || questions[questionNumber].values === null) {
                return 10;
            }

            if (questions[questionNumber].values[index] === undefined || questions[questionNumber].values[index] === null) {
                return 10;
            }

            return questions[questionNumber].values[index];
        });

        fetch('/auth/record-bonus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                bonus: questions[questionNumber],
                pointsPerPart: pointsPerPart,
            }),
        }).then(response => {
            if (response.status === 401) {
                deleteAccountUsername();
                throw new Error('Unauthenticated');
            }
        });
    }

    document.getElementById('question').textContent = '';
    document.getElementById('reveal').disabled = false;
    document.getElementById('next').textContent = 'Skip';

    const hasNextQuestion = await advanceQuestion();

    if (!hasNextQuestion)
        return;

    document.getElementById('set-name-info').textContent = setName;
    document.getElementById('packet-number-info').textContent = packetNumber;

    // Update the question text:
    const paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode(questions[questionNumber].leadin));
    document.getElementById('question').textContent = '';
    document.getElementById('question').appendChild(paragraph);

    currentBonusPart = 0;
    createBonusPart(currentBonusPart, questions[questionNumber].parts[currentBonusPart]);
}


/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart() {
    if (currentBonusPart >= questions[questionNumber].parts.length)
        return;

    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'ANSWER: ' + questions[questionNumber].answers[currentBonusPart];
    document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
    currentBonusPart++;

    if (currentBonusPart >= questions[questionNumber].parts.length) {
        document.getElementById('reveal').disabled = true;
        document.getElementById('next').textContent = 'Next';
    } else {
        createBonusPart(currentBonusPart, questions[questionNumber].parts[currentBonusPart]);
    }
}


/**
 * Calculates that points per bonus and updates the display.
 */
function updateStatDisplay() {
    const statsArray = sessionStorage.stats.split(',');

    const numBonuses = parseInt(statsArray[0]) + parseInt(statsArray[1]) + parseInt(statsArray[2]) + parseInt(statsArray[3]);
    const points = 30 * parseInt(statsArray[0]) + 20 * parseInt(statsArray[1]) + 10 * parseInt(statsArray[2]) || 0;
    const ppb = Math.round(100 * points / numBonuses) / 100 || 0;

    const includePlural = (numBonuses == 1) ? '' : 'es';
    document.getElementById('statline').innerHTML
        = `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${statsArray[0]}/${statsArray[1]}/${statsArray[2]}/${statsArray[3]}, ${points} pts)`;
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


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    randomQuestions = [];
    loadRandomBonuses(difficulties, validCategories, validSubcategories);
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', function () {
    randomQuestions = [];
    difficulties = getDropdownValues('difficulties');
    loadRandomBonuses(difficulties, validCategories, validSubcategories);
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createBonusCard(questions[questionNumber]);

    if (this.innerHTML === 'Next') {
        getPointsForCurrentBonus();
        updateStatDisplay();
    }

    next();
});


document.getElementById('packet-number').addEventListener('change', function () {
    localStorage.setItem('packetNumberBonusSave', this.value);
});


document.getElementById('question-number').addEventListener('change', function () {
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


document.getElementById('set-name').addEventListener('change', function () {
    localStorage.setItem('setNameBonusSave', this.value);
});


document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    start(document.getElementById('toggle-select-by-set-name').checked);

    queryLock();
    try {
        questions = await getBonuses(setName, packetNumber);
    } finally {
        queryUnlock();
    }

    next();
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

    document.getElementById('toggle-three-part-bonuses').disabled = this.checked;
});



document.getElementById('toggle-show-history').addEventListener('click', function () {
    if (this.checked) {
        document.getElementById('room-history').classList.remove('d-none');
        localStorage.setItem('showBonusHistory', 'true');
    } else {
        document.getElementById('room-history').classList.add('d-none');
        localStorage.setItem('showBonusHistory', 'false');
    }
});


document.getElementById('type-to-answer').addEventListener('click', function () {
    this.blur();
    localStorage.setItem('typeToAnswer', this.checked ? 'true' : 'false');
});


document.getElementById('year-range-a').onchange = function () {
    randomQuestions = [];
    loadRandomBonuses(difficulties, validCategories, validSubcategories);

    localStorage.setItem('minYear', $('#slider').slider('values', 0));
    localStorage.setItem('maxYear', $('#slider').slider('values', 1));
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
    if (!sessionStorage.getItem('stats')) {
        sessionStorage.setItem('stats', [0, 0, 0, 0]);
    }
    updateStatDisplay();


    if (localStorage.getItem('packetNumberBonusSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberBonusSave');
    }

    if (localStorage.getItem('questionNumberBonusSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberBonusSave');
    }

    if (localStorage.getItem('showBonusHistory') === 'false') {
        document.getElementById('toggle-show-history').checked = false;
        document.getElementById('room-history').classList.add('d-none');
    }

    if (localStorage.getItem('threePartBonuses') === 'false') {
        document.getElementById('toggle-three-part-bonuses').checked = false;
    }

    if (localStorage.getItem('typeToAnswer') === 'true') {
        document.getElementById('type-to-answer').checked = true;
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
    } else {
        document.getElementById('toggle-three-part-bonuses').disabled = true;
    }

    if (localStorage.getItem('setNameBonusSave')) {
        setName = localStorage.getItem('setNameBonusSave');
        document.getElementById('set-name').value = setName;
        maxPacketNumber = await getNumPackets(setName);

        if (setName === '') {
            return;
        }

        if (maxPacketNumber === 0) {
            document.getElementById('set-name').classList.add('is-invalid');
        } else {
            document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
        }
    }
};
