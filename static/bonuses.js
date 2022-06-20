var packetName = '';
var packetNumbers = [];
var packetNumber = -1;

var questions = [{}];
var currentQuestionNumber = 0;

var currentBonusPart = -1;

/**
 * Called when the users wants to reveal the next bonus part.
 */
 function reveal() {
    if (currentBonusPart > 2) {
        return;
    } else {
        paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode('ANSWER: ' + questions[currentQuestionNumber]['answers'][currentBonusPart]));
        document.getElementById('question').appendChild(paragraph);
        currentBonusPart++;
        if (currentBonusPart <= 2) {
            paragraph1 = document.createElement('p');
            paragraph1.appendChild(document.createTextNode('[10] ' + questions[currentQuestionNumber]['parts'][currentBonusPart]));
            document.getElementById('question').appendChild(paragraph1);
        } else {
            document.getElementById('reveal').disabled = true;
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
 * Loads and reads the next question.
 */
async function readQuestion() {
    document.getElementById('reveal').disabled = false;

    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                return;  // alert the user if there are no more packets
            }
            packetNumber = packetNumbers.shift();
            questions = await getQuestions(packetName, packetNumber, mode='bonuses');
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber]));

    currentBonusPart = 0;

    // Update the question text:
    document.getElementById('question').innerHTML = '';
    document.getElementById('question-info').innerHTML = `${packetName} Packet ${packetNumber} Question ${currentQuestionNumber + 1}`

    let paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode(questions[currentQuestionNumber]['leadin']));
    document.getElementById('question').appendChild(paragraph);

    let paragraph1 = document.createElement('p');
    paragraph1.appendChild(document.createTextNode('[10] ' + questions[currentQuestionNumber]['parts'][0]));
    document.getElementById('question').appendChild(paragraph1);
}

document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    start(mode='bonuses')
});

document.getElementById('30').addEventListener('click', function () {
    this.blur();
    let newStats = sessionStorage.stats.split(',');
    newStats[0]=(parseInt(newStats[0])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('20').addEventListener('click', function () {
    this.blur();
    let newStats = sessionStorage.stats.split(',');
    newStats[1]=(parseInt(newStats[1])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('10').addEventListener('click', function () {
    this.blur();
    let newStats = sessionStorage.stats.split(',');
    newStats[2]=(parseInt(newStats[2])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('0').addEventListener('click', function () {
    this.blur();
    let newStats = sessionStorage.stats.split(',');
    newStats[3]=(parseInt(newStats[3])+1).toString();
    sessionStorage.setItem('stats',newStats);
    updateStatDisplay();
});

document.getElementById('reveal').addEventListener('click', function () {
    this.blur();
    reveal();
});

document.addEventListener('keyup', () => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.which == 32) {  // spacebar
        document.getElementById('reveal').click();
    } else if (event.which == 78) {  // pressing 'N'
        document.getElementById('next').click();
    } else if (event.which == 83) { // pressing 'S'
        document.getElementById('start').click();
    } else if (event.which == 48) { // pressing '0'
        document.getElementById('0').click();
    } else if (event.which == 49) { // pressing '1'
        document.getElementById('10').click();
    } else if (event.which == 50) { // pressing '2'
        document.getElementById('20').click();
    } else if (event.which == 51) { // pressing '3'
        document.getElementById('30').click();
    }
});

/**
 * On window load, run these functions.
 */

//keep text fields in localStorage
var packetNameField = document.getElementById('name-select');
if (localStorage.getItem('packetNameBonusSave')) {
    packetNameField.value = localStorage.getItem('packetNameBonusSave');
    let [year, name] = parseSetName(name_select.value);
    (async () => {
        max_packet_number = await getNumPackets(year, name);
        document.getElementById('packet-select').placeholder = `Packet #s (1-${max_packet_number})`;
    })();
}
packetNameField.addEventListener('change', function() {
    localStorage.setItem('packetNameBonusSave', packetNameField.value);
});

var packetNumberField = document.getElementById('packet-select');
if (localStorage.getItem('packetNumberBonusSave'))
    packetNumberField.value = localStorage.getItem('packetNumberBonusSave');
packetNumberField.addEventListener('change', function() {
    localStorage.setItem('packetNumberBonusSave', packetNumberField.value);
});

var questionNumberField = document.getElementById('question-select');
if (localStorage.getItem('questionNumberBonusSave'))
    questionNumberField.value = localStorage.getItem('questionNumberBonusSave');
questionNumberField.addEventListener('change', function() {
    localStorage.setItem('questionNumberBonusSave', questionNumberField.value);
});

/**
 * An array that represents
 * [# of 30's, # of 20's, # of 10's, # of 0's].
 */
if (sessionStorage.getItem('stats')===null)
    sessionStorage.setItem('stats',[0,0,0,0]);

updateStatDisplay(); //update stats upon loading site