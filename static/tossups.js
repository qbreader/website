var intervalId = -1;

var packetName = '';
var packetNumbers = [];
var packetNumber = -1;

var questions = [{}];
var questionText = '';
var questionTextSplit = [];
var currentQuestionNumber = 0;

var currentlyBuzzing = false;
var shownAnswer = false;

var validCategories = [];

var inPower = false;
var powers = 0;
var tens = 0;
var negs = 0;
var dead = 0;
var totalCelerity = 0;

var toggleCorrectClicked = false;


/**
 * Called when the users buzzes.
 * The first "buzz" pauses the question, and the second "buzz" reveals the rest of the question
 * and updates the score.
 */
function buzz() {
    if (shownAnswer) return;
    if (currentlyBuzzing) {
        // Update scoring:
        inPower = !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)');
        if (inPower) powers++; else tens++;

        // Update question text and show answer:
        let characterCount = document.getElementById('question').innerHTML.length;
        document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        totalCelerity += 1 - characterCount / document.getElementById('question').innerHTML.length;
        document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[currentQuestionNumber]['answer_sanitized'];
        document.getElementById('buzz').innerHTML = 'Buzz';

        updateStatDisplay();
        shownAnswer = true;
    } else {
        // Stop the question reading
        clearInterval(intervalId);
        currentlyBuzzing = true;

        // Include buzzpoint
        document.getElementById('question').innerHTML += '(#) ';

        document.getElementById('buzz').innerHTML = 'Reveal';
        document.getElementById('info-text').innerHTML = 'Press space to reveal';
    }
}


/**
 * Updates the displayed stat line.
 */
function updateStatDisplay() {
    let numTossups = powers + tens + negs + dead;
    let points = 0;
    if (packetName.includes('pace')) {  // Use pace scoring: powers = 20, negs = 0
        points = 20 * powers + 10 * tens;
    } else {
        points = 15 * powers + 10 * tens - 5 * negs;
    }
    let celerity = numTossups != 0 ? totalCelerity / numTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    let includePlural = (numTossups == 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${powers}/${tens}/${negs} with ${numTossups} tossup${includePlural} seen (${points} pts, celerity: ${celerity})`;
}


/**
 * 
 * @param {String} name - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getQuestions(name, number) {
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
    } while (false === (
        (validCategories.length == 0 || validCategories.includes(questions[currentQuestionNumber]['category']))
        && (
            !('subcategory' in questions[currentQuestionNumber]) 
            || validSubcategories.length === 0
            || validSubcategories.includes(questions[currentQuestionNumber]['subcategory'])
        )
    ));

    // Stop reading the current question:
    clearInterval(intervalId);
    currentlyBuzzing = false;
    shownAnswer = false;

    // Update the toggle-correct button:
    toggleCorrectClicked = false;
    document.getElementById('toggle-correct').innerHTML = 'I was wrong'

    // Update the question text:
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('info-text').innerHTML = 'Press space to buzz';

    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    questionText = questions[currentQuestionNumber]['question_sanitized'];
    questionTextSplit = questionText.split(' ');

    // Read the question:
    intervalId = window.setInterval(() => {
        document.getElementById('question').innerHTML += questionTextSplit.shift() + ' ';

        // If the question runs out of text, stop reading:
        if (questionTextSplit.length == 0) {
            clearInterval(intervalId);
        }
    }, document.getElementById('reading-speed').value);
}


document.getElementById('start').addEventListener('click', async () => {
    powers = 0; tens = 0; negs = 0; totalCelerity = 0;
    updateStatDisplay();

    let packetName = document.getElementById('name-select').value.trim();
    if (packetName.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }

    packetName = packetName.replace(' ', '-');
    packetName = packetName.replaceAll(' ', '_');
    packetName = packetName.toLowerCase();

    packetNumbers = document.getElementById('packet-select').value.trim();
    if (packetNumbers.length == 0 || packetNumbers.toLowerCase() == 'all') {
        packetNumbers = '1-24';
    }
    packetNumbers = packetNumbers.split(',');
    for (let i = 0; i < packetNumbers.length; i++) {
        packetNumbers[i] = packetNumbers[i].trim();
    }
    for (let i = 0; i < packetNumbers.length; i++) {
        if (packetNumbers[i].toString().includes('-')) {
            let bounds = packetNumbers[i].split('-');
            for (let j = parseInt(bounds[0]); j <= parseInt(bounds[1]); j++) {
                packetNumbers.push(j);
            }
            packetNumbers.splice(i, 1);
            i--;
        }
    }
    packetNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    questions = await getQuestions(packetName, packetNumber);
    readQuestion();
});

document.getElementById('toggle-correct').addEventListener('click', () => {
    if (toggleCorrectClicked) {
        if (inPower) powers++; else tens++;
        if (questionTextSplit.length != 0) negs--; else dead--;  // Check if there is more question to be read 
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    } else {
        if (inPower) powers--; else tens--;
        if (questionTextSplit.length != 0) negs++; else dead++;
        document.getElementById('toggle-correct').innerHTML = 'I was right';
    }
    updateStatDisplay();
    toggleCorrectClicked = !toggleCorrectClicked;
});

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName === 'INPUT') return;
    if (packetNumbers != -1) {
        if (event.which == 32) {  // spacebar
            buzz();
        } else if (event.which == 78) {  // pressing 'N'
            readQuestion();
        } else if (event.which == 27) {  // escape key
            modal.style.display = "none";
        }
    }
});

document.getElementById('reading-speed').oninput = function () {
    document.getElementById('reading-speed-display').innerHTML = 'Reading speed [ms between words]: ' + this.value;
}