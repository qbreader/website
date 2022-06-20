var timeoutID = -1;

var packetName = '';
var packetNumbers = [];
var packetNumber = -1;

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
 * Increases or decreases a session storage item by a certain amount.
 * @param {String} item - The name of the sessionStorage item.
 * @param {Number} x - The amount to increase/decrease the sessionStorage item.
 */
function shift(item, x) {
    sessionStorage.setItem(item, parseFloat(sessionStorage.getItem(item)) + x);
}

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
            if (packetName.includes('pace')) {
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
 * 
 * @param {String} name - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getQuestions(name, number) {
    clearTimeout(timeoutID);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    return await fetch(`/getpacket?directory=${encodeURI(name)}&packetNumber=${encodeURI(number)}`)
        .then(response => response.json())
        .then(data => {
            return data['tossups'];
        });
}


/**
 * Loads and reads the next question.
 */
async function readQuestion() {
    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                return;  // alert the user if there are no more packets
            }
            packetNumber = packetNumbers.shift();
            questions = await getQuestions(packetName, packetNumber);
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber]));

    // Stop reading the current question:
    clearTimeout(timeoutID);
    currentlyBuzzing = false;

    // Update the toggle-correct button:
    toggleCorrectClicked = false;
    document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    document.getElementById('toggle-correct').disabled = true;
    // document.getElementById('div-toggle-correct').style.display = 'none';

    // Update the question text:
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';

    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    questionText = questions[currentQuestionNumber]['question'];
    questionTextSplit = questionText.split(' ');

    document.getElementById('buzz').removeAttribute('disabled');
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').removeAttribute('disabled');
    paused = false;
    // Read the question:
    printWord();
}


/**
 * Recursively reads the question based on the reading speed.
 */
function printWord() {
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
            printWord();
        }, time * 0.75 * (150 - document.getElementById('reading-speed').value));
    }
    else {
        document.getElementById('pause').setAttribute('disabled', 'disabled');
    }
}

/**
 * Toggles pausing or resuming the tossup.
 */
function pause() {
    if (paused) {
        document.getElementById('buzz').removeAttribute('disabled');
        document.getElementById('pause').innerHTML = 'Pause';
        printWord();
    }
    else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').innerHTML = 'Resume';
        clearTimeout(timeoutID);
    }
    paused = !paused;
}

/**
 * Starts reading questions.
 */
async function start() {
    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;

    packetName = document.getElementById('name-select').value.trim();
    if (packetName.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }

    packetName = packetName.replace(' ', '-');
    packetName = packetName.replaceAll(' ', '_');
    packetName = packetName.toLowerCase();

    packetNumbers = document.getElementById('packet-select').value.trim();
    packetNumbers = parsePacketNumbers(packetNumbers, max_packet_number);
    packetNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    questions = await getQuestions(packetName, packetNumber);
    document.getElementById('next').removeAttribute('disabled'); //remove disabled from next button
    readQuestion();
}

function toggleCorrect() {
    if (toggleCorrectClicked) {
        if (inPower) {
            shift('powers', 1);
            if (packetName.includes('pace')) {
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
        if (questionTextSplit.length != 0) { // Check if there is more question to be read 
            shift('negs', -1);
            shift('points', 5);
        }
        else {
            shift('dead', -1);
        }
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    }
    else {
        if (inPower) {
            shift('powers', -1);
            if (packetName.includes('pace')) {
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
        if (questionTextSplit.length != 0) {
            shift('negs', 1);
            shift('points', -5);
        }
        else {
            shift('dead', 1);
        }
        document.getElementById('toggle-correct').innerHTML = 'I was right';
    }
    updateStatDisplay();
    toggleCorrectClicked = !toggleCorrectClicked;
}

// Event listeners
document.getElementById('reading-speed').oninput = function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
}

document.getElementById('start').addEventListener('click', function () {
    this.blur();
    start();
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    buzz();
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
});

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    readQuestion();
});

document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
});

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.which == 32) {  // spacebar
        document.getElementById('buzz').click();
    } else if (event.which == 78) {  // pressing 'N'
        document.getElementById('next').click();
    } else if (event.which == 80) {  // pressing 'P'
        document.getElementById('pause').click();
    } else if (event.which == 83) { // pressing 'S'
        document.getElementById('start').click();
    }
});


/**
 * On window load, run these functions.
 */

// Keep text fields in localStorage
var packetNameField = document.getElementById('name-select');
if (localStorage.getItem('packetNameTossupSave')) {
    packetNameField.value = localStorage.getItem('packetNameTossupSave');
    let year = name_select.value.split(' ')[0];
    let name = name_select.value.split(' ')[1];
    (async () => {
        max_packet_number = await getNumPackets(year, name);
        document.getElementById('packet-select').placeholder = `Packet #s (1-${max_packet_number})`;
    })();
}
packetNameField.addEventListener('change', function () {
    localStorage.setItem('packetNameTossupSave', packetNameField.value);
});

var packetNumberField = document.getElementById('packet-select');
if (localStorage.getItem('packetNumberTossupSave'))
    packetNumberField.value = localStorage.getItem('packetNumberTossupSave');
packetNumberField.addEventListener('change', function () {
    localStorage.setItem('packetNumberTossupSave', packetNumberField.value);
});

var questionNumberField = document.getElementById('question-select');
if (localStorage.getItem('questionNumberTossupSave'))
    questionNumberField.value = localStorage.getItem('questionNumberTossupSave');
questionNumberField.addEventListener('change', function () {
    localStorage.setItem('questionNumberTossupSave', questionNumberField.value);
});

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

if (localStorage.getItem('speed') === null)
    localStorage.setItem('speed', 50);

document.getElementById('reading-speed-display').innerHTML = localStorage.speed;
document.getElementById('reading-speed').value = localStorage.speed;

updateStatDisplay(); //update stats upon loading site