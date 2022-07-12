var timeoutID = -1;

var setName = '';
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
            questions = await getQuestions(setName, packetNumber, mode = 'tossups');
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

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

    document.getElementById('question-info').innerHTML = `${setName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

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
