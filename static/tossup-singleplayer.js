var validCategories = JSON.parse(localStorage.getItem('validCategories'));
var validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

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
            if (setName.toLowerCase().includes('pace')) {
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
 * On window load, run these functions.
 */

// Keep text fields in localStorage
var packetNameField = document.getElementById('set-name');
if (localStorage.getItem('packetNameTossupSave')) {
    packetNameField.value = localStorage.getItem('packetNameTossupSave');
    let [year, name] = parseSetName(setNameField.value);
    (async () => {
        maxPacketNumber = await getNumPackets(year, name);
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    })();
}

packetNameField.addEventListener('change', function () {
    localStorage.setItem('packetNameTossupSave', packetNameField.value);
});

var packetNumberField = document.getElementById('packet-number');
if (localStorage.getItem('packetNumberTossupSave')) {
    packetNumberField.value = localStorage.getItem('packetNumberTossupSave');
}

packetNumberField.addEventListener('change', function () {
    localStorage.setItem('packetNumberTossupSave', packetNumberField.value);
});

var questionNumberField = document.getElementById('question-select');
if (localStorage.getItem('questionNumberTossupSave'))
    questionNumberField.value = localStorage.getItem('questionNumberTossupSave');
questionNumberField.addEventListener('change', function () {
    localStorage.setItem('questionNumberTossupSave', questionNumberField.value);
});

// Event listeners

document.getElementById('next').addEventListener('click', function () {
    this.blur();
    readQuestion();
});

document.getElementById('reading-speed').addEventListener('change', function () {
    localStorage.setItem('speed', this.value);
    document.getElementById('reading-speed-display').innerHTML = this.value;
});

document.getElementById('start').addEventListener('click', function () {
    this.blur();
    start('tossups');
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

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validCategories = JSON.parse(localStorage.getItem('validCategories'));
        validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        localStorage.setItem('validCategories', JSON.stringify(validCategories));
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});

if (localStorage.getItem('speed') === null)
    localStorage.setItem('speed', 50);

document.getElementById('reading-speed-display').innerHTML = localStorage.speed;
document.getElementById('reading-speed').value = localStorage.speed;

if (localStorage.getItem('validSubcategories') === null)
    localStorage.setItem('validSubcategories', '[]');
if (localStorage.getItem('validCategories') === null)
    localStorage.setItem('validCategories', '[]');
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

//load the selected categories and subcategories
loadCategories(validCategories, validSubcategories);

updateStatDisplay(); //update stats upon loading site