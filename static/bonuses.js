var packetName = '';
var packetNumbers = [];
var packetNumber = -1;

var questions = [{}];
var currentQuestionNumber = 0;

var currentBonusPart = -1;

var validCategories = [];

/**
 * An array that represents
 * [# of 30's, # of 20's, # of 10's, # of 0's].
 */
var stats = [0, 0, 0, 0];


/**
 * Called when the users wants to reveal the next bonus part.
 */
 function reveal() {
    if (currentBonusPart > 2) {
        return;
    } else {
        paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode('ANSWER: ' + questions[currentQuestionNumber]['answers_sanitized'][currentBonusPart]));
        document.getElementById('question').appendChild(paragraph);
        currentBonusPart++;
        if (currentBonusPart <= 2) {
            paragraph1 = document.createElement('p');
            paragraph1.appendChild(document.createTextNode('[10] ' + questions[currentQuestionNumber]['parts_sanitized'][currentBonusPart]));
            document.getElementById('question').appendChild(paragraph1);
        }
    }
}


/**
 * Calculates that points per bonus and updates the display.
 */
function updateStatDisplay() {
    let numBonuses = stats[0] + stats[1] + stats[2] + stats[3];
    let ppb = 0;
    let points = 0;
    if (numBonuses != 0) {
        points = 30 * stats[0] + 20 * stats[1] + 10 * stats[2] + 0 * stats[3];
        ppb = Math.round(100 * points / numBonuses) / 100;
    }
    let includePlural = (numBonuses == 1) ? '' : 'es';
    document.getElementById('statline').innerHTML
        = `${ppb} points per bonus with ${numBonuses} bonus${includePlural} seen (${stats[0]}/${stats[1]}/${stats[2]}/${stats[3]}, ${points} pts)`;
}


/**
 * 
 * @param {String} name - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the bonuses.
 */
async function getQuestions(name, number) {
    return await fetch(`/getpacket?directory=${encodeURI(name)}&packetNumber=${encodeURI(number)}`)
        .then(response => response.json())
        .then(data => {
            return data['bonuses'];
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

    currentBonusPart = 0;

    // Update the question text:
    document.getElementById('question').innerHTML = '';

    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    let paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode(questions[currentQuestionNumber]['leadin_sanitized']));
    document.getElementById('question').appendChild(paragraph);

    let paragraph1 = document.createElement('p');
    paragraph1.appendChild(document.createTextNode('[10] ' + questions[currentQuestionNumber]['parts_sanitized'][0]));
    document.getElementById('question').appendChild(paragraph1);
}


document.getElementById('start').addEventListener('click', async () => {
    stats = [0, 0, 0, 0];
    updateStatDisplay();

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

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName != 'BODY') return;
    if (packetNumbers != -1) {
        if (event.which == 32) {  // spacebar
            reveal();
        } else if (event.which == 78) {  // pressing 'N'
            readQuestion();
        } else if (event.which == 27) {  // escape key
            modal.style.display = "none";
        }
    }
});

document.getElementById('30').addEventListener('click', () => {
    stats[0]++;
    updateStatDisplay();
});

document.getElementById('20').addEventListener('click', () => {
    stats[1]++;
    updateStatDisplay();
});

document.getElementById('10').addEventListener('click', () => {
    stats[2]++;
    updateStatDisplay();
});

document.getElementById('0').addEventListener('click', () => {
    stats[3]++;
    updateStatDisplay();
});