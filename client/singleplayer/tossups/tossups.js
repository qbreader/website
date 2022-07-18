var timeoutID = -1;

var setTitle = '';
var packetNumbers = [];
var currentPacketNumber = -1;
var validCategories;
var validSubcategories;

var questions = [{}];
var questionText = '';
var questionTextSplit = [];
var currentQuestionNumber = 0;

var currentlyBuzzing = false;
var paused = false;
/**
 * Whether or not the user clicked that they got the question wrong.
 * `true` means the button currently says "I was right".
 */
var toggleCorrectClicked = false;
var inPower = false;


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
            if (setTitle.toLowerCase().includes('pace')) {
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
        let characterCount = document.getElementById('question').innerHTML.length;
        document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        shift('totalCelerity', 1 - characterCount / document.getElementById('question').innerHTML.length);
        document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[currentQuestionNumber]['answer'];
        document.getElementById('buzz').innerHTML = 'Buzz';
        document.getElementById('next').innerHTML = 'Next';

        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('toggle-correct').removeAttribute('disabled');
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
        updateStatDisplay();
    } else {
        // Stop the question reading
        clearTimeout(timeoutID);
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
    document.getElementById('toggle-correct').disabled = true;

    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    // Stop reading the current question:
    clearTimeout(timeoutID);
    currentlyBuzzing = false;

    currentPacketNumber = packetNumbers[0];

    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            packetNumbers.shift();
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                document.getElementById('buzz').disabled = true;
                document.getElementById('pause').disabled = true;
                document.getElementById('next').disabled = true;
                return;  // alert the user if there are no more packets
            }
            currentPacketNumber = packetNumbers[0];
            clearTimeout(timeoutID); // stop reading the current question 
            let [setYear, setName] = parseSetTitle(setTitle);
            questions = await getPacket(setYear, setName, currentPacketNumber, 'tossups');
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

    if (questions.length > 0) {
        document.getElementById('set-title-info').innerHTML = setTitle;
        document.getElementById('packet-number-info').innerHTML = currentPacketNumber;
        document.getElementById('question-number-info').innerHTML = currentQuestionNumber + 1;

        questionText = questions[currentQuestionNumber]['question'];
        questionTextSplit = questionText.split(' ');

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
        clearTimeout(timeoutID);
    }
    paused = !paused;
}

/**
 * Recursively reads the question based on the reading speed.
 */
function recursivelyPrintTossup() {
    if (!currentlyBuzzing && questionTextSplit.length > 0) {
        let word = questionTextSplit.shift();
        document.getElementById('question').innerHTML += word + ' ';

        //calculate time needed before reading next word
        let time = Math.log(word.length) + 1;
        if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123)
            || word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d')
            time += 2;
        else if (word.endsWith(',') || word.slice(-2) === ',\u201d')
            time += 0.75;
        else if (word === "(*)")
            time = 0;

        timeoutID = window.setTimeout(() => {
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
            if (setTitle.toLowerCase().includes('pace')) {
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
        } else if (setTitle.toLowerCase().includes('pace')) {
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
            if (setTitle.toLowerCase().includes('pace')) {
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
        } else if (setTitle.toLowerCase().includes('pace')) {
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
    let numTossups = parseInt(sessionStorage.powers) + parseInt(sessionStorage.tens) + parseInt(sessionStorage.negs) + parseInt(sessionStorage.dead);
    let celerity = numTossups != 0 ? parseFloat(sessionStorage.totalCelerity) / numTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    let includePlural = (numTossups == 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${sessionStorage.powers}/${sessionStorage.tens}/${sessionStorage.negs} with ${numTossups} tossup${includePlural} seen (${sessionStorage.points} pts, celerity: ${celerity})`;
    if (numTossups === 0) //disable clear stats button if no stats
        document.getElementById('clear-stats').setAttribute("disabled", "disabled");
    else
        document.getElementById('clear-stats').removeAttribute("disabled");
}

document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    initialize();
    let [setYear, setName] = parseSetTitle(setTitle);
    await getPacket(setYear, setName, currentPacketNumber, 'tossups').then(async (data) => {
        questions = data;
        await loadAndReadTossup();
    });
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    buzz();
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
});

document.getElementById('next').addEventListener('click', async function () {
    this.blur();
    createQuestionCard(questions[currentQuestionNumber]);
    await loadAndReadTossup();
});

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});

document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
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
    localStorage.setItem('setTitleTossupSave', this.value);
});

document.getElementById('packet-number').addEventListener('change', function () {
    localStorage.setItem('packetNumberTossupSave', this.value);
});

document.getElementById('question-number').addEventListener('change', function () {
    localStorage.setItem('questionNumberTossupSave', document.getElementById('question-number').value);
});

document.getElementById('reading-speed').addEventListener('change', function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
});

window.onload = () => {
    if (localStorage.getItem('setTitleTossupSave')) {
        setTitle = localStorage.getItem('setTitleTossupSave');
        document.getElementById('set-title').value = setTitle;
        let [setYear, setName] = parseSetTitle(setTitle);
        (async () => {
            maxPacketNumber = await getNumPackets(setYear, setName);
            document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
        })();
    }

    if (localStorage.getItem('packetNumberTossupSave')) {
        document.getElementById('packet-number').value = localStorage.getItem('packetNumberTossupSave');
    }

    if (localStorage.getItem('questionNumberTossupSave')) {
        document.getElementById('question-number').value = localStorage.getItem('questionNumberTossupSave');
    }

    if (localStorage.getItem('speed') === null) {
        localStorage.setItem('speed', 50);
    }
    document.getElementById('reading-speed-display').innerHTML = localStorage.speed;
    document.getElementById('reading-speed').value = localStorage.speed;
    
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

    loadCategoryModal(validCategories, validSubcategories);
    updateStatDisplay();
}