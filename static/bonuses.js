var setTitle = '';
var packetNumbers = [];
var currentPacketNumber = -1;

var questions = [{}];
var currentQuestionNumber = 0;

var onQuestion = true;
var currentBonusPart = -1;

function createBonusPart(bonusPartNumber, bonusText) {
    let input = document.createElement('input');
    input.id = `checkbox-${bonusPartNumber + 1}`;
    input.className = 'checkbox form-check-input rounded-0 me-1';
    input.type = 'checkbox';
    input.style = 'width: 20px; height: 20px; cursor: pointer';
    input.addEventListener('click', function () {
        this.blur();
    });

    let inputWrapper = document.createElement('label');
    inputWrapper.style = "cursor: pointer";
    inputWrapper.className = 'ps-5 ms-n5';
    inputWrapper.appendChild(input);

    let p = document.createElement('p');
    p.appendChild(document.createTextNode('[10] ' + bonusText));

    let bonusPart = document.createElement('div');
    bonusPart.id = `bonus-part-${bonusPartNumber + 1}`;    
    bonusPart.appendChild(p);

    let row = document.createElement('div');
    row.className = 'd-flex';
    row.appendChild(inputWrapper);
    row.appendChild(bonusPart);    

    document.getElementById('question').appendChild(row);
}

/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart() {
    if (currentBonusPart > 2) return;

    if (onQuestion) {
        createBonusPart(currentBonusPart, questions[currentQuestionNumber]['parts'][currentBonusPart]);
    } else {
        let paragraph = document.createElement('p');
        paragraph.appendChild(document.createTextNode('ANSWER: ' + questions[currentQuestionNumber]['answers'][currentBonusPart]));
        document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
        currentBonusPart++;
    }

    onQuestion = !onQuestion;

    if (currentBonusPart > 2) {
        document.getElementById('reveal').disabled = true;
        document.getElementById('next').innerHTML = 'Next';
    }
}

function updateStats() {
    let statsArray = sessionStorage.stats.split(',');

    var pointsOnBonus = 0;
    Array.from(document.getElementsByClassName('checkbox')).forEach((checkbox) => {
        if (checkbox.checked) pointsOnBonus += 10;
    });

    statsArray[3 - Math.round(pointsOnBonus / 10)]++;
    sessionStorage.setItem('stats', statsArray);
}

/**
 * Calculates that points per bonus and updates the display.
 */
function updateStatDisplay() {
    let statsArray = sessionStorage.stats.split(',');

    let numBonuses = parseInt(statsArray[0]) + parseInt(statsArray[1]) + parseInt(statsArray[2]) + parseInt(statsArray[3]);
    let points = 30 * parseInt(statsArray[0]) + 20 * parseInt(statsArray[1]) + 10 * parseInt(statsArray[2]) || 0;
    let ppb = Math.round(100 * points / numBonuses) / 100 || 0;

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
async function loadAndReadQuestion() {
    document.getElementById('reveal').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    do {  // Get the next question
        currentQuestionNumber++;

        // Go to the next packet if you reach the end of this packet
        if (currentQuestionNumber >= questions.length) {
            if (packetNumbers.length == 0) {
                window.alert("No more questions left");
                return;  // alert the user if there are no more packets
            }
            currentPacketNumber = packetNumbers.shift();
            questions = await getPacket(setTitle, currentPacketNumber, mode = 'bonuses');
            console.log(questions);
            console.log(setTitle);
            currentQuestionNumber = 0;
        }

        // Get the next question if the current one is in the wrong category and subcategory
    } while (!isValidCategory(questions[currentQuestionNumber], validCategories, validSubcategories));

    currentBonusPart = 0;

    // Update the question text:
    document.getElementById('question').innerHTML = '';

    document.getElementById('set-title-info').innerHTML = setTitle;
    document.getElementById('packet-number-info').innerHTML = currentPacketNumber;
    document.getElementById('question-number-info').innerHTML = currentQuestionNumber + 1;

    let paragraph = document.createElement('p');
    paragraph.appendChild(document.createTextNode(questions[currentQuestionNumber]['leadin']));
    document.getElementById('question').appendChild(paragraph);

    revealBonusPart();
}

document.addEventListener('keyup', (event) => {
    if (document.activeElement.tagName === 'INPUT') return;

    if (event.which == 32) {  // spacebar
        document.getElementById('reveal').click();
    } else if (event.which == 78) {  // pressing 'N'
        document.getElementById('next').click();
    } else if (event.which == 83) { // pressing 'S'
        document.getElementById('start').click();
    } else if (event.key == 'k') { // pressing '0'
        document.getElementById(`checkbox-${currentBonusPart}`).click();
    } else if (event.which == 49) { // pressing '1'
        document.getElementById('checkbox-1').click();
    } else if (event.which == 50) { // pressing '2'
        document.getElementById('checkbox-2').click();
    } else if (event.which == 51) { // pressing '3'
        document.getElementById('checkbox-3').click();
    }
});
