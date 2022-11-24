// Functions and variables specific to the tossups page.

// Room settings
const packetNumbers = [];
let setName = '';
let validCategories;
let validSubcategories;

// Status variables
let currentlyBuzzing = false;
let inPower = false;
let packetNumber = -1;
let paused = false;
// WARNING: 0-indexed (instead of 1-indexed, like in multiplayer)
let questionNumber = 0;
let timeoutId = -1;
// Whether or not the user clicked that they got the question wrong. `true` means the button currently says "I was right".
let toggleCorrectClicked = false;
let questions = [{}];
let questionText = '';
let questionTextSplit = [];


/**
 * Called when the users buzzes.
 * The first "buzz" pauses the question, and the second "buzz" reveals the rest of the question
 * and updates the score.
 */
function buzz() {
    if (currentlyBuzzing) {
        // Update scoring:
        inPower = !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)');
        if (inPower) {
            shift('powers', 1);
            if (setName.toLowerCase().includes('pace')) {
                shift('points', 20);
            }
            else {
                shift('points', 15);
            }
        }
        else {
            shift('tens', 1);
            shift('points', 10);
        }

        // Update question text and show answer:
        const characterCount = document.getElementById('question').innerHTML.length;
        document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        shift('totalCelerity', 1 - characterCount / document.getElementById('question').innerHTML.length);
        document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[questionNumber]['answer'];
        document.getElementById('buzz').innerHTML = 'Buzz';
        document.getElementById('next').innerHTML = 'Next';

        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('toggle-correct').classList.remove('d-none');
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
        updateStatDisplay();
    } else {
        // Stop the question reading
        clearTimeout(timeoutId);
        currentlyBuzzing = true;

        // Include buzzpoint
        document.getElementById('question').innerHTML += '(#) ';

        document.getElementById('buzz').innerHTML = 'Reveal';
        document.getElementById('pause').setAttribute('disabled', 'disabled');
    }
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


async function loadAndReadTossup() {
    // Update the toggle-correct button:
    toggleCorrectClicked = false;
    document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    document.getElementById('toggle-correct').classList.add('d-none');

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    // Stop reading the current question:
    clearTimeout(timeoutId);
    currentlyBuzzing = false;

    if (document.getElementById('toggle-select-by-set-name').checked) {
        packetNumber = packetNumbers[0];

        do {  // Get the next question
            questionNumber++;

            // Go to the next packet if you reach the end of this packet
            if (questionNumber >= questions.length) {
                packetNumbers.shift();
                if (packetNumbers.length == 0) {
                    window.alert('No more questions left');
                    document.getElementById('buzz').disabled = true;
                    document.getElementById('pause').disabled = true;
                    document.getElementById('next').disabled = true;
                    return;  // alert the user if there are no more packets
                }
                packetNumber = packetNumbers[0];
                clearTimeout(timeoutId); // stop reading the current question
                document.getElementById('question').innerHTML = 'Fetching questions...';
                questions = await getTossups(setName, packetNumber);
                questionNumber = 0;
            }

            // Get the next question if the current one is in the wrong category and subcategory
        } while (!isValidCategory(questions[questionNumber], validCategories, validSubcategories));

        if (questions.length > 0) {
            questionText = questions[questionNumber]['question'];
            questionTextSplit = questionText.split(' ');
            document.getElementById('question-number-info').innerHTML = questionNumber + 1;
        }
    } else {
        document.getElementById('question').innerHTML = 'Fetching questions...';
        questions = [await getRandomQuestion(
            'tossup',
            rangeToArray(document.getElementById('difficulties').value),
            validCategories,
            validSubcategories
        )];

        ({ setName, packetNumber, questionNumber } = questions[0]);

        if (questions.length > 0) {
            questionText = questions[0]['question'];
            questionTextSplit = questionText.split(' ');
            document.getElementById('question-number-info').innerHTML = questionNumber;
            questionNumber = 0;
        }
    }

    if (questions.length > 0) {
        document.getElementById('set-name-info').innerHTML = setName;
        document.getElementById('packet-number-info').innerHTML = packetNumber;
        document.getElementById('question').innerHTML = '';

        document.getElementById('next').innerHTML = 'Skip';
        document.getElementById('buzz').innerHTML = 'Buzz';
        document.getElementById('buzz').disabled = false;
        document.getElementById('pause').innerHTML = 'Pause';
        document.getElementById('pause').disabled = false;
        paused = false;
        // Read the question:
        recursivelyPrintTossup();
    }
}


/**
 * Toggles pausing or resuming the tossup.
 */
function pause() {
    if (paused) {
        document.getElementById('buzz').removeAttribute('disabled');
        document.getElementById('pause').innerHTML = 'Pause';
        recursivelyPrintTossup();
    }
    else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').innerHTML = 'Resume';
        clearTimeout(timeoutId);
    }
    paused = !paused;
}


/**
 * Recursively reads the question based on the reading speed.
 */
function recursivelyPrintTossup() {
    clearTimeout(timeoutId);
    if (!currentlyBuzzing && questionTextSplit.length > 0) {
        const word = questionTextSplit.shift();
        document.getElementById('question').innerHTML += word + ' ';

        //calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === '(*)')
            time = 0;

        timeoutId = window.setTimeout(() => {
            recursivelyPrintTossup();
        }, time * 0.9 * (125 - document.getElementById('reading-speed').value));
    } else {
        document.getElementById('pause').disabled = true;
    }
}


function toggleCorrect() {
    if (toggleCorrectClicked) {
        if (inPower) {
            shift('powers', 1);
            if (setName.toLowerCase().includes('pace')) {
                shift('points', 20);
            }
            else {
                shift('points', 15);
            }
        } else {
            shift('tens', 1);
            shift('points', 10);
        }
        // Check if there is more question to be read
        if (questionTextSplit.length == 0) {
            shift('dead', -1);
        } else if (setName.toLowerCase().includes('pace')) {
            shift('negs', -1);
        } else {
            shift('negs', -1);
            shift('points', 5);
        }
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    }
    else {
        if (inPower) {
            shift('powers', -1);
            if (setName.toLowerCase().includes('pace')) {
                shift('points', -20);
            }
            else {
                shift('points', -15);
            }
        }
        else {
            shift('tens', -1);
            shift('points', -10);
        }

        if (questionTextSplit.length == 0) {
            shift('dead', 1);
        } else if (setName.toLowerCase().includes('pace')) {
            shift('negs', 1);
        } else {
            shift('negs', 1);
            shift('points', -5);
        }
        document.getElementById('toggle-correct').innerHTML = 'I was right';
    }
    updateStatDisplay();
    toggleCorrectClicked = !toggleCorrectClicked;
}


/**
 * Updates the displayed stat line.
 */
function updateStatDisplay() {
    const numTossups = parseInt(sessionStorage.powers) + parseInt(sessionStorage.tens) + parseInt(sessionStorage.negs) + parseInt(sessionStorage.dead);
    let celerity = numTossups != 0 ? parseFloat(sessionStorage.totalCelerity) / numTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    const includePlural = (numTossups == 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${sessionStorage.powers}/${sessionStorage.tens}/${sessionStorage.negs} with ${numTossups} tossup${includePlural} seen (${sessionStorage.points} pts, celerity: ${celerity})`;
    if (numTossups === 0) //disable clear stats button if no stats
        document.getElementById('clear-stats').setAttribute('disabled', 'disabled');
    else
        document.getElementById('clear-stats').removeAttribute('disabled');
}


document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    buzz();
});


document.getElementById('category-modal').addEventListener('hidden.bs.modal', function () {
    randomQuestions = [];
    getRandomQuestion('tossup', rangeToArray(document.getElementById('difficulties').value), validCategories, validSubcategories);
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});


document.getElementById('difficulties').addEventListener('change', async function () {
    randomQuestions = [];
    getRandomQuestion('tossup', rangeToArray(this.value), validCategories, validSubcategories);
});


document.getElementById('next').addEventListener('click', function () {
    this.blur();
    createTossupCard(questions[questionNumber], setName);
    loadAndReadTossup();
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
    initialize(document.getElementById('toggle-select-by-set-name').checked);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    questions = await getTossups(setName, packetNumber);
    loadAndReadTossup();
});


document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
});


document.addEventListener('keydown', (event) => {
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

    switch (event.key) {
    case ' ':
        document.getElementById('buzz').click();
        // Prevent spacebar from scrolling the page:
        if (event.target == document.body) event.preventDefault();
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
