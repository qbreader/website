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
if (sessionStorage.getItem('stats')===null)
    sessionStorage.setItem('stats',[0,0,0,0]);

updateStatDisplay(); //update stats upon loading site

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
    let statsArray = sessionStorage.stats.split(',');
    let numBonuses = parseInt(statsArray[0]) + parseInt(statsArray[1]) + parseInt(statsArray[2]) + parseInt(statsArray[3]);
    let ppb = 0;
    let points = 0;
    if (numBonuses != 0) {
        points = 30 * parseInt(statsArray[0]) + 20 * parseInt(statsArray[1]) + 10 * parseInt(statsArray[2]);
        ppb = Math.round(100 * points / numBonuses) / 100;
    }
    let includePlural = (numBonuses == 1) ? '' : 'es';
    document.getElementById('statline').innerHTML
        = `${ppb} points per bonus with ${numBonuses} bonus${includePlural} seen (${statsArray[0]}/${statsArray[1]}/${statsArray[2]}/${statsArray[3]}, ${points} pts)`;
}

/**
 * Clears user stats.
 */
function clearStats() {
    sessionStorage.setItem('stats', [0, 0, 0, 0]);
    updateStatDisplay();
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
    packetName = document.getElementById('name-select').value.trim();
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
    let newStats = sessionStorage.stats.split(',');
    newStats[0]=(parseInt(newStats[0])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('20').addEventListener('click', () => {
    let newStats = sessionStorage.stats.split(',');
    newStats[1]=(parseInt(newStats[1])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('10').addEventListener('click', () => {
    let newStats = sessionStorage.stats.split(',');
    newStats[2]=(parseInt(newStats[2])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('0').addEventListener('click', () => {
    let newStats = sessionStorage.stats.split(',');
    newStats[3]=(parseInt(newStats[3])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});