var setTitle = '';
var packetNumbers = [];
var currentPacketNumber = -1;
var validCategories;
var validSubcategories;

var questions = [{}];
var currentQuestionNumber = 0;

var onQuestion = true;
var currentBonusPart = -1;

/**
 * Clears user stats.
 */
function clearStats() {
    sessionStorage.setItem('stats', [0, 0, 0, 0]);
    updateStatDisplay();
}

function createBonusPart(bonusPartNumber, bonusText) {
    let input = document.createElement('input');
    input.id = `checkbox-${bonusPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.style = 'width: 20px; height: 20px; cursor: pointer';
    input.addEventListener('click', function () {
        this.blur();
    });

    let inputWrapper = document.createElement('label');
    inputWrapper.style = "cursor: pointer";
    inputWrapper.className = 'ps-5 ms-n5';
    inputWrapper.appendChild(input);

    let p = document.createElement('p');
    p.appendChild(document.createTextNode('[10] ' + bonusText));

    let bonusPart = document.createElement('div');
    bonusPart.id = `bonus-part-${bonusPartNumber + 1}`;
    bonusPart.appendChild(p);

    let row = document.createElement('div');
    row.className = 'd-flex';
    row.appendChild(inputWrapper);
    row.appendChild(bonusPart);

    document.getElementById('question').appendChild(row);
}

function getPointsForCurrentBonus() {
    let statsArray = sessionStorage.stats.split(',');

    var pointsOnBonus = 0;
    Array.from(document.getElementsByClassName('checkbox')).forEach((checkbox) => {
        if (checkbox.checked) pointsOnBonus += 10;
    });

    statsArray[3 - Math.round(pointsOnBonus / 10)]++;
    sessionStorage.setItem('stats', statsArray);
    return pointsOnBonus;
}

/**
 * Loads and reads the next question.
 */
async function loadAndReadBonus() {
    document.getElementById('question').innerHTML = '';
    document.getElementById('reveal').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            packetNumbers.shift();
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                document.getElementById('reveal').disabled = true;
                document.getElementById('next').disabled = true;
                return;  // alert the user if there are no more packets
            }
            currentPacketNumber = packetNumbers[0];
            let [setYear, setName] = parseSetTitle(setTitle);
            questions = await getPacket(setYear, setName, currentPacketNumber, 'bonuses');
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

    if (questions.length > 0) {
        document.getElementById('set-title-info').innerHTML = setTitle;
        document.getElementById('packet-number-info').innerHTML = currentPacketNumber;
        document.getElementById('question-number-info').innerHTML = currentQuestionNumber + 1;

        currentBonusPart = 0;

        // Update the question text:

        let paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode(questions[currentQuestionNumber]['leadin']));
        document.getElementById('question').innerHTML = '';
        document.getElementById('question').appendChild(paragraph);

        revealBonusPart();
    }
}

/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart() {
    if (currentBonusPart > 2) return;

    if (onQuestion) {
        createBonusPart(currentBonusPart, questions[currentQuestionNumber]['parts'][currentBonusPart]);
    } else {
        let paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode('ANSWER: ' + questions[currentQuestionNumber]['answers'][currentBonusPart]));
        document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
        currentBonusPart++;
    }

    onQuestion = !onQuestion;

    if (currentBonusPart > 2) {
        document.getElementById('reveal').disabled = true;
        document.getElementById('next').innerHTML = 'Next';
    }
}

/**
 * Calculates that points per bonus and updates the display.
 */
function updateStatDisplay() {
    let statsArray = sessionStorage.stats.split(',');

    let numBonuses = parseInt(statsArray[0]) + parseInt(statsArray[1]) + parseInt(statsArray[2]) + parseInt(statsArray[3]);
    let points = 30 * parseInt(statsArray[0]) + 20 * parseInt(statsArray[1]) + 10 * parseInt(statsArray[2]) || 0;
    let ppb = Math.round(100 * points / numBonuses) / 100 || 0;

    let includePlural = (numBonuses == 1) ? '' : 'es';
    document.getElementById('statline').innerHTML
        = `${ppb} points per bonus with ${numBonuses} bonus${includePlural} seen (${statsArray[0]}/${statsArray[1]}/${statsArray[2]}/${statsArray[3]}, ${points} pts)`;
}

// Event listeners
document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    onQuestion = true;
    initialize();
    let [setYear, setName] = parseSetTitle(setTitle);
    await getPacket(setYear, setName, currentPacketNumber, 'bonuses').then(async (data) => {
        questions = data;
        await loadAndReadBonus();
    });
});

document.getElementById('reveal').addEventListener('click', function () {
    this.blur();
    revealBonusPart();
});

document.getElementById('next').addEventListener('click', async function () {
    this.blur();

    if (this.innerHTML === 'Next') {
        getPointsForCurrentBonus();
        updateStatDisplay();
    }

    onQuestion = true;
    await loadAndReadBonus();
});

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validCategories = JSON.parse(localStorage.getItem('validCategories'));
        validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        localStorage.setItem('validCategories', JSON.stringify(validCategories));
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});

document.getElementById('set-title').addEventListener('change', function () {
    localStorage.setItem('setTitleBonusSave', this.value);
});

document.getElementById('packet-number').addEventListener('change', function () {
    localStorage.setItem('packetNumberBonusSave', this.value);
});

document.getElementById('question-number').addEventListener('change', function () {
    localStorage.setItem('questionNumberBonusSave', document.getElementById('question-number').value);
});

window.onload = () => {
    if (sessionStorage.getItem('stats') === null) {
        sessionStorage.setItem('stats', [0, 0, 0, 0]);
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
    
    if (localStorage.getItem('setTitleBonusSave')) {
        setTitle = localStorage.getItem('setTitleBonusSave');
        document.getElementById('set-title').value = setTitle;
        let [setYear, setName] = parseSetTitle(setTitle);
        (async () => {
            maxPacketNumber = await getNumPackets(setYear, setName);
            document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
        })();
    }

    if (localStorage.getItem('packetNumberBonusSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberBonusSave');
    }

    if (localStorage.getItem('questionNumberBonusSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberBonusSave');
    }

    loadCategoryModal(validCategories, validSubcategories);

    updateStatDisplay();
}