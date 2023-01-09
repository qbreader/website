// Functions and variables specific to the bonuses page.

// Room settings
let packetNumbers = [];
let setName = '';
let validCategories;
let validSubcategories;

// Status variables
let currentBonusPart = -1;
let onQuestion = true;
let packetNumber = -1;
let questions = [{}];
let questionNumber = 0;


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
                    return;  // alert the user if there are no more packets
                }
                packetNumber = packetNumbers[0];
                document.getElementById('question').innerHTML = 'Fetching questions...';
                questions = await getBonuses(setName, packetNumber);
                questionNumber = 0;
            }

            // Get the next question if the current one is in the wrong category and subcategory
        } while (!isValidCategory(questions[questionNumber], validCategories, validSubcategories));

        if (questions.length > 0) {
            document.getElementById('question-number-info').innerHTML = questionNumber + 1;
        }
    } else {
        document.getElementById('question').innerHTML = 'Fetching questions...';
        questions = [await getRandomQuestion(
            'bonus',
            rangeToArray(document.getElementById('difficulties').value),
            validCategories,
            validSubcategories
        )];

        ({ setName, packetNumber, questionNumber } = questions[0]);

        if (questions.length > 0) {
            document.getElementById('question-number-info').innerHTML = questionNumber;
            questionNumber = 0;
        }
    }
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


/**
 * Loads and reads the next question.
 */
async function next() {
    document.getElementById('question').innerHTML = '';
    document.getElementById('reveal').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    await advanceQuestion();

    if (questions.length > 0) {
        document.getElementById('set-name-info').innerHTML = setName;
        document.getElementById('packet-number-info').innerHTML = packetNumber;

        currentBonusPart = 0;

        // Update the question text:
        const paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode(questions[questionNumber]['leadin']));
        document.getElementById('question').innerHTML = '';
        document.getElementById('question').appendChild(paragraph);

        revealBonusPart();
    }
}


/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart() {
    if (currentBonusPart >= questions[questionNumber]['parts'].length)
        return;

    if (onQuestion) {
        createBonusPart(currentBonusPart, questions[questionNumber]['parts'][currentBonusPart]);
    } else {
        const paragraph = document.createElement('p');
        paragraph.innerHTML = 'ANSWER: ' + questions[questionNumber]['answers'][currentBonusPart];
        document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
        currentBonusPart++;
    }

    onQuestion = !onQuestion;

    if (currentBonusPart >= questions[questionNumber]['parts'].length) {
        document.getElementById('reveal').disabled = true;
        document.getElementById('next').innerHTML = 'Next';
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


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    randomQuestions = [];
    getRandomQuestion('bonus', rangeToArray(document.getElementById('difficulties').value), validCategories, validSubcategories);
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', async function () {
    randomQuestions = [];
    getRandomQuestion('bonus', rangeToArray(this.value), validCategories, validSubcategories);
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createBonusCard(questions[questionNumber]);

    if (this.innerHTML === 'Next') {
        getPointsForCurrentBonus();
        updateStatDisplay();
    }

    onQuestion = true;
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
    revealBonusPart();
});


document.getElementById('set-name').addEventListener('change', function () {
    localStorage.setItem('setNameBonusSave', this.value);
});


document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    onQuestion = true;
    start(document.getElementById('toggle-select-by-set-name').checked);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    questions = await getBonuses(setName, packetNumber);
    next();
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


document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (event.key) {
    case ' ':
        document.getElementById('reveal').click();
        // Prevent spacebar from scrolling the page
        if (event.target == document.body) event.preventDefault();
        break;
    case 'k':
        document.getElementById(`checkbox-${currentBonusPart}`).click();
        break;
    case 'n':
        document.getElementById('next').click();
        break;
    case 's':
        document.getElementById('start').click();
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


window.onload = () => {
    if (localStorage.getItem('setNameBonusSave')) {
        setName = localStorage.getItem('setNameBonusSave');
        document.getElementById('set-name').value = setName;
        (async () => {
            maxPacketNumber = await getNumPackets(setName);
            document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
            if (maxPacketNumber === 0) {
                document.getElementById('set-name').classList.add('is-invalid');
            }
        })();
    }

    if (localStorage.getItem('packetNumberBonusSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberBonusSave');
    }

    if (localStorage.getItem('questionNumberBonusSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberBonusSave');
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

    if (sessionStorage.getItem('stats') === null) {
        sessionStorage.setItem('stats', [0, 0, 0, 0]);
    }

    loadCategoryModal(validCategories, validSubcategories);
    updateStatDisplay();
};

if (localStorage.getItem('showBonusHistory') === 'false') {
    document.getElementById('toggle-show-history').checked = false;
    document.getElementById('room-history').classList.add('d-none');
}
