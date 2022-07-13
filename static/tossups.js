var timeoutID = -1;

var setTitle = '';
var packetNumbers = [];
var currentPacketNumber = -1;

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
 * Reads the next question.
 */
async function readTossup() {
    document.getElementById('next').innerHTML = 'Skip';

    // Stop reading the current question:
    clearTimeout(timeoutID);
    currentlyBuzzing = false;

    // Update the toggle-correct button:
    toggleCorrectClicked = false;
    document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    document.getElementById('toggle-correct').disabled = true;

    // Update the question text:
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';

    document.getElementById('buzz').removeAttribute('disabled');
    document.getElementById('pause').innerHTML = 'Pause';
    document.getElementById('pause').removeAttribute('disabled');
    paused = false;
    // Read the question:
    recursivelyPrintTossup();
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
        }, time * 0.75 * (150 - document.getElementById('reading-speed').value));
    }
    else {
        document.getElementById('pause').disabled = true;
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

// Prevent spacebar from scrolling the page:
window.addEventListener('keydown', function (event) {
    if (event.key === ' ' && event.target == document.body) {
        event.preventDefault();
    }
});

document.addEventListener('keyup', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.key == ' ') {  // spacebar
        document.getElementById('buzz').click();
    } else if (event.key == 'n' || event.key == 'N') {
        document.getElementById('next').click();
    } else if (event.key == 'p' || event.key == 'P') {
        document.getElementById('pause').click();
    } else if (event.key == 's' || event.key == 'S') { // pressing 'S'
        document.getElementById('start').click();
    }
});
