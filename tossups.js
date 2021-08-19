var intervalId = -1;

var packetName = '';
var packetNumbers = [];
var packetNumber = -1;

var questions = [{}];
var questionText = '';
var currentQuestionNumber = 0;

var currentlyBuzzing = false;

var validCategories = [];

var inPower = false;
var powers = 0;
var tens = 0;
var negs = 0;

var toggleCorrectClicked = false;


/**
 * Called when the users buzzes.
 * The first "buzz" pauses the question, and the second "buzz" reveals the rest of the question
 * and updates the score.
 */
function buzz() {
    if (currentlyBuzzing) {
        // Update scoring:
        inPower = !document.getElementById('question').innerHTML.includes('(*)') && questionText.includes('(*)');
        if (inPower) powers++; else tens++;
        document.getElementById('statline').innerHTML = `${powers}/${tens}/${negs} with ${powers + tens + negs} TUH (${15*powers+10*tens-5*negs} pts)`

        // Update question text and show answer:
        document.getElementById('question').innerHTML = questionText;
        document.getElementById('answer').innerHTML = 'ANSWER: ' + questions[currentQuestionNumber]['answer_sanitized'];
        document.getElementById('buzz').innerHTML = 'Buzz';
    } else {
        currentlyBuzzing = true;
        document.getElementById('buzz').innerHTML = 'Reveal';
    }
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
    // Stop reading the current question:
    clearInterval(intervalId);
    currentlyBuzzing = false;

    // Update the toggle-correct button:
    toggleCorrectClicked = false;
    document.getElementById('toggle-correct').innerHTML = 'I was wrong'

    // Update the question text:
    document.getElementById('question').innerHTML = '';
    document.getElementById('answer').innerHTML = '';
    document.getElementById('buzz').innerHTML = 'Buzz';
    document.getElementById('info-text').innerHTML = 'Press space to buzz';

    do {  // Get the next packet number
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) return;  // do nothing if there are no more packets
            packetNumber = packetNumbers.shift();
            questions = await getQuestions(packetName, packetNumber);
            currentQuestionNumber = 0;
        }

        // Check that the question is in the right category
    } while (validCategories.length != 0 && !validCategories.includes(questions[currentQuestionNumber]['category']));

    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    questionText = questions[currentQuestionNumber]['question_sanitized'];
    questionTextSplit = questionText.split(' ');

    // Read the question:
    intervalId = window.setInterval(() => {
        document.getElementById('question').innerHTML += questionTextSplit.shift() + ' ';

        // If the user buzzes, stop reading:
        if (currentlyBuzzing || questionTextSplit.length == 0) {
            clearInterval(intervalId);
            document.getElementById('info-text').innerHTML = 'Press space to reveal';
        }
    }, document.getElementById('reading-speed').value);
}


document.getElementById('start').addEventListener('click', async () => {
    document.getElementById('statline').innerHTML = '0/0/0 with 0 TUH (0 pts)';
    powers = 0; tens = 0; negs = 0;

    let packetYear = document.getElementById('year-select').value.trim();
    if (packetYear.length == 0) {
        window.alert('Enter a packet year.');
        return;
    }

    let packetAbbreviation = document.getElementById('name-select').value.trim();
    if (packetAbbreviation.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }

    packetAbbreviation = packetAbbreviation.replaceAll(' ', '_');
    packetName = packetYear + '-' + packetAbbreviation;
    packetName = packetName.toLowerCase();

    packetNumbers = document.getElementById('packet-select').value.trim();
    if (packetNumbers.length == 0 || packetNumbers.toLowerCase() == 'all') {
        packetNumbers = '1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24';
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

    validCategories = [];
    if (document.getElementById('literature').checked) validCategories.push('Literature');
    if (document.getElementById('history').checked) validCategories.push('History');
    if (document.getElementById('science').checked) validCategories.push('Science');
    if (document.getElementById('arts').checked) validCategories.push('Fine Arts');
    if (document.getElementById('religion').checked) validCategories.push('Religion');
    if (document.getElementById('mythology').checked) validCategories.push('Mythology');
    if (document.getElementById('philosophy').checked) validCategories.push('Philosophy');
    if (document.getElementById('ss').checked) validCategories.push('Social Science');
    if (document.getElementById('ce').checked) validCategories.push('Current Events');
    if (document.getElementById('geography').checked) validCategories.push('Geography');
    if (document.getElementById('other-ac').checked) validCategories.push('Other Academic');
    if (document.getElementById('trash').checked) validCategories.push('Trash');

    questions = await getQuestions(packetName, packetNumber);
    readQuestion();
});

document.getElementById('toggle-correct').addEventListener('click', () => {
    if (toggleCorrectClicked) {
        if (inPower) powers++; else tens++;
        if (questionTextSplit.length != 0) negs--; // Check if there is more question to be read
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    } else {
        if (inPower) powers--; else tens--;
        if (questionTextSplit.length != 0) negs++;
        document.getElementById('toggle-correct').innerHTML = 'I was right';
    }

    document.getElementById('statline').innerHTML = `${powers}/${tens}/${negs} with ${powers + tens + negs} TUH (${15*powers+10*tens-5*negs} pts)`;
    toggleCorrectClicked = !toggleCorrectClicked;
});

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName != 'BODY') return;
    if (packetNumbers != -1) {
        if (event.which == 32) {  // spacebar
            buzz();
        } else if (event.which == 78) {  // pressing 'N'
            readQuestion();
        }
    }
});

document.getElementById('reading-speed').oninput = function () {
    document.getElementById('reading-speed-display').innerHTML = 'Reading speed [ms between words]: ' + this.value;
}

document.getElementById('buzz').addEventListener('click', buzz);
document.getElementById('next').addEventListener('click', readQuestion);