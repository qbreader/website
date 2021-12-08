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
if (sessionStorage.getItem('powers')===null)
    sessionStorage.setItem('powers',0);
if (sessionStorage.getItem('tens')===null)
    sessionStorage.setItem('tens',0);
if (sessionStorage.getItem('negs')===null)
    sessionStorage.setItem('negs',0);
if (sessionStorage.getItem('dead')===null)
    sessionStorage.setItem('dead',0);
if (sessionStorage.getItem('points')===null)
    sessionStorage.setItem('points',0);
if (sessionStorage.getItem('totalCelerity')===null)
    sessionStorage.setItem('totalCelerity',0);

if (localStorage.getItem('speed')===null)
    localStorage.setItem('speed',220);

document.getElementById('reading-speed-display').innerHTML = 'Reading speed [ms between words]: ' + localStorage.speed;
document.getElementById('reading-speed').value = localStorage.speed;

var toggleCorrectClicked = false;


updateStatDisplay(); //update stats upon loading site

/**
 * Increases or decreases a session storage item by a certain amount.
 * @param {String} item - The name of the sessionStorage item.
 * @param {Number} x - The amount to increase/decrease the sessionStorage item.
 */
function shift(item, x) {
    sessionStorage.setItem(item, parseFloat(sessionStorage.getItem(item))+x);
}

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
        if (inPower) {
            shift('powers',1);
            if (packetName.includes('pace')) {
                shift('points',20);
            }
            else {
                shift('points',15);
            }
        }
        else {
            shift('tens',1);
            shift('points',10);
        }

        // Update question text and show answer:
        let characterCount = document.getElementById('question').innerHTML.length;
        document.getElementById('question').innerHTML += questionTextSplit.join(' ');
        shift('totalCelerity',1 - characterCount / document.getElementById('question').innerHTML.length);
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
    let numTossups = parseInt(sessionStorage.powers) + parseInt(sessionStorage.tens) + parseInt(sessionStorage.negs) + parseInt(sessionStorage.dead);
    let celerity = numTossups != 0 ? parseFloat(sessionStorage.totalCelerity) / numTossups : 0;
    celerity = Math.round(1000 * celerity) / 1000;
    let includePlural = (numTossups == 1) ? '' : 's';
    document.getElementById('statline').innerHTML
        = `${sessionStorage.powers}/${sessionStorage.tens}/${sessionStorage.negs} with ${numTossups} tossup${includePlural} seen (${sessionStorage.points} pts, celerity: ${celerity})`;
}


/**
 * Clears user stats.
 */
function clearStats() {
    sessionStorage.setItem('powers',0);
    sessionStorage.setItem('tens',0);
    sessionStorage.setItem('negs',0);
    sessionStorage.setItem('dead',0);
    sessionStorage.setItem('points',0);
    sessionStorage.setItem('totalCelerity',0);
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

document.getElementById('toggle-correct').addEventListener('click', () => {
    if (toggleCorrectClicked) {
        if (inPower) {
            shift('powers',1);
            if (packetName.includes('pace')) {
                shift('points',20);
            }
            else {
                shift('points',15);
            }
        }
        else {
            shift('tens',1);
            shift('points',10);
        }
        if (questionTextSplit.length != 0) { // Check if there is more question to be read 
            shift('negs',-1);
            shift('points',5);
        }
        else {
            shift('dead',-1);
        }
        document.getElementById('toggle-correct').innerHTML = 'I was wrong';
    }
    else {
        if (inPower) {
            shift('powers',-1);
            if (packetName.includes('pace')) {
                shift('points',-20);
            }
            else {
                shift('points',-15);
            }
        }
        else {
            shift('tens',-1);
            shift('points',-10);
        }
        if (questionTextSplit.length != 0) {
            shift('negs',1);
            shift('points',-5);
        }
        else {
            shift('dead',1);
        }
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
    localStorage.setItem('speed',this.value);
    document.getElementById('reading-speed-display').innerHTML = 'Reading speed [ms between words]: ' + this.value;
}