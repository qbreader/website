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

var socket;

function connectToWebSocket() {
    socket = new WebSocket(location.href.replace('http', 'ws'), location.pathname.substring(13));
    socket.onopen = function () {
        socket.send(JSON.stringify({type: 'join', name: 'thedoge'}));
        console.log('Connected to websocket');
    }
    socket.onmessage = function (event) {
        console.log(JSON.parse(event.data));
    }
    socket.onclose = function () {
        console.log('Disconnected from websocket');
    }
}

connectToWebSocket();

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
            if (packetName.toLowerCase().includes('pace')) {
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
 * Loads and reads the next question.
 */
async function readQuestion() {
    document.getElementById('next').innerHTML = 'Skip';
    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                return;  // alert the user if there are no more packets
            }
            packetNumber = packetNumbers.shift();
            clearTimeout(timeoutID); // stop reading the current question 
            questions = await getQuestions(packetName, packetNumber, mode = 'tossups');
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

function toggleCorrect() {
    if (toggleCorrectClicked) {
        if (inPower) {
            shift('powers', 1);
            if (packetName.toLowerCase().includes('pace')) {
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
        } else if (packetName.toLowerCase().includes('pace')) {
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
            if (packetName.toLowerCase().includes('pace')) {
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
        } else if (packetName.toLowerCase().includes('pace')) {
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

// Event listeners
document.getElementById('reading-speed').oninput = function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
}

document.getElementById('start').addEventListener('click', function () {
    this.blur();
    start(mode = 'tossups');
});

document.getElementById('buzz').addEventListener('click', function () {
    this.blur();
    buzz();
});

document.getElementById('pause').addEventListener('click', function () {
    this.blur();
    pause();
});

document.getElementById('toggle-correct').addEventListener('click', function () {
    this.blur();
    toggleCorrect();
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
    let [year, name] = parseSetName(name_select.value);
    (async () => {
        max_packet_number = await getNumPackets(year, name);
        document.getElementById('packet-select').placeholder = `Packet #s (1-${max_packet_number})`;
    })();
}

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    readQuestion();
});

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