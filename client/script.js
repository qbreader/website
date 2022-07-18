/*
 * Variables and functions common to both tossups and bonuses
 */

var questionCounter = 1;
var maxPacketNumber = 24;

const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]

/**
 * Indexed by their index in the `CATEGORIES` array.
 * Categories that do not have any subcategories are not listed.
 */
const SUBCATEGORIES = [
    ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    ["American History", "Ancient History", "European History", "World History", "Other History"],
    ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"]
]

/**
 * Increases or decreases a session storage item by a certain amount.
 * @param {String} item - The name of the sessionStorage item.
 * @param {Number} x - The amount to increase/decrease the sessionStorage item.
 */
function shift(item, x) {
    sessionStorage.setItem(item, parseFloat(sessionStorage.getItem(item)) + x);
}

/**
 * Adds the given category if it is not in the list of valid categories.
 * Otherwise, the category is removed.
 * @param {String} category 
 * @param {Array<String>} validCategories 
 * @param {Array<String>} validSubcategories 
 * @returns `[validCategories, validSubcategories]`
 */
function updateCategory(category, validCategories, validSubcategories) {
    if (validCategories.length === 0) { // selecting a category when no categories are currently selected
        validCategories.push(category);

        let index = CATEGORIES.indexOf(category);
        document.querySelectorAll('#subcategories label').forEach(label => {
            if (!(index in SUBCATEGORIES) || !SUBCATEGORIES[index].includes(label.getAttribute('for'))) {
                label.classList.add('d-none');
                document.getElementById(label.getAttribute('for')).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== label.getAttribute('for'));
            }
        });
    } else if (validCategories.includes(category)) { // remove category
        validCategories = validCategories.filter(a => a !== category);

        let index = CATEGORIES.indexOf(category);
        if (index in SUBCATEGORIES) { // remove all subcats associated with the category
            SUBCATEGORIES[index].forEach(subcat => {
                document.querySelector(`[for="${subcat}"]`).classList.add('d-none');
                document.getElementById(subcat).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== subcat);
            });
        }

        if (validCategories.length === 0) {
            document.querySelectorAll('#subcategories label').forEach(label => {
                label.classList.remove('d-none');
            });
        }
    } else {
        validCategories.push(category);

        let index = CATEGORIES.indexOf(category);
        if (index in SUBCATEGORIES) {
            SUBCATEGORIES[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.remove('d-none'));
        }
    }

    return [validCategories, validSubcategories];
}

/**
 * Adds the given subcategory if it is not in the list of valid subcategories.
 * Otherwise, the subcategory is removed.
 * @param {String} subcategory 
 * @param {Array<String>} validSubcategories 
 * @returns `validSubcategories`
 */
function updateSubcategory(subcategory, validSubcategories) {
    if (validSubcategories.includes(subcategory)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcategory);
    } else {
        validSubcategories.push(subcategory);
    }

    return validSubcategories;
}

/**
 * Updates the category modal to show the given categories and subcategories.
 * @param {Array<String>} validCategories 
 * @param {Array<String>} validSubcategories 
 * @returns {void}
 */
function loadCategoryModal(validCategories, validSubcategories) {
    document.querySelectorAll('#categories input').forEach(element => element.checked = false);
    document.querySelectorAll('#subcategories input').forEach(element => element.checked = false);
    document.querySelectorAll('#subcategories label').forEach(element => element.classList.remove('d-none'));

    if (validCategories.length === 0) {
        validSubcategories.forEach(subcat => {
            document.getElementById(subcat).checked = true;
        });
        return;
    }

    CATEGORIES.forEach((cat, index) => {
        document.getElementById(cat).checked = validCategories.includes(cat);
        if (validCategories.includes(cat)) {
            if (index in SUBCATEGORIES) {
                SUBCATEGORIES[index].forEach(subcat => {
                    document.getElementById(subcat).checked = validSubcategories && validSubcategories.includes(subcat);
                });
            }
        } else if (index in SUBCATEGORIES) {
            SUBCATEGORIES[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.add('d-none'));
        }
    });
}

/**
 * 
 * @param {JSON} question 
 * @param {Array<String>} validCategories
 * @param {Array<String>} validSubcategories
 * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
 */
 function isValidCategory(question, validCategories, validSubcategories) {
    if (validCategories.length === 0 && validSubcategories.length === 0) return true;

    // check if the subcategory is explicitly included (overrides missing category)
    if (question.subcategory && validSubcategories.includes(question.subcategory)) return true;

    // check if category is excluded (and subcategory is excluded)
    if (!validCategories.includes(question['category'])) return false;

    // at this point, the question category is included in the list of valid categories 
    // check for the case where none of the subcategories are selected but the category is;
    // in which case, the question is valid
    if (!question.subcategory) return true;

    // check to see if the category has no corresponding subcategories
    let index = CATEGORIES.indexOf(question['category']);
    if (!(index in SUBCATEGORIES)) return true;

    // check to see if none of the subcategories of the question are selected
    for (let i = 0; i < SUBCATEGORIES[index].length; i++) {
        if (validSubcategories.includes(SUBCATEGORIES[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}

/**
 * Converts a setTitle string into a setYear and a setName.
 * @param {String} setTitle - The title of the set in the format "setYear-setName".
 * @returns {[Number, String]} `[setYear, setName]`
 */
function parseSetTitle(setTitle) {
    let setYear = parseInt(setTitle.substring(0, 4));
    let setName = setTitle.substring(5);

    return [setYear, setName];
}

/**
 * 
 * @param {String} packetNumberString 
 * @param {Number} maxPacketNumber 
 * @returns {Array<Number>} An array of selected packet numbers.
 */
function packetNumberStringToArray(packetNumberString, maxPacketNumber = 24) {
    if (packetNumberString.length === 0 || packetNumberString.toLowerCase() === 'all') {
        packetNumberString = `1-${maxPacketNumber}`;
    }
    var packetNumbers = packetNumberString.split(',');
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

    return packetNumbers;
}

/**
 * 
 * @param {Number} setYear 
 * @param {String} setName 
 * @returns
 */
async function getNumPackets(setYear, setName) {
    if (setYear === undefined || setName === undefined) return 0;
    return await fetch(`/api/get-num-packets?setYear=${encodeURIComponent(setYear)}&setName=${encodeURIComponent(setName)}`)
        .then(response => response.json())
        .then(data => {
            return parseInt(data.numPackets);
        });
}

/**
 * 
 * @param {Number} setYear - The year of the set.
 * @param {String} setName - The name of the set.
 * @param {Number} packetNumber - The packet number of the set.
 * @param {'tossups' | 'bonuses'} mode - Whether to get the tossups or bonuses.
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getPacket(setYear, setName, packetNumber, mode) {
    document.getElementById('question').innerHTML = 'Fetching questions...';
    return await fetch(`/api/get-packet?setYear=${encodeURIComponent(setYear)}&setName=${encodeURIComponent(setName)}&packetNumber=${encodeURIComponent(packetNumber)}`)
        .then(response => response.json())
        .then(data => {
            return data[mode];
        });
}

/**
 * Initizalizes all variables (called when the user presses the start button).
 * @returns {Promsie<Boolean>} Whether or not the function was successful.
 */
function initialize(alertOnFailure = true) {
    setTitle = document.getElementById('set-title').value.trim();
    if (setTitle.length == 0) {
        if (alertOnFailure) alert('Please enter a set name.');
        return false;
    }

    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;

    packetNumbers = packetNumberStringToArray(document.getElementById('packet-number').value.trim(), maxPacketNumber);
    currentPacketNumber = packetNumbers[0];

    currentQuestionNumber = document.getElementById('question-number').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    document.getElementById('next').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    return true;
}

function createQuestionCard(question) {
    if (!question || Object.keys(question).length === 0) return;

    // append a card containing the question to the history element
    let card = document.createElement('div');
    card.className = 'card my-2';

    let cardHeader = document.createElement('div');
    cardHeader.className = 'card-header';
    cardHeader.setAttribute('data-bs-toggle', 'collapse');
    cardHeader.setAttribute('data-bs-target', '#question-' + questionCounter);
    cardHeader.innerHTML = question.answer;
    card.appendChild(cardHeader);

    let cardContainer = document.createElement('div');
    cardContainer.id = 'question-' + questionCounter;
    cardContainer.className = 'card-container collapse';

    let cardBody = document.createElement('div');
    cardBody.className = 'card-body';

    let cardText = document.createElement('p');
    cardText.className = 'card-text';
    cardText.innerHTML = question.question;
    cardBody.appendChild(cardText);

    let cardFooter = document.createElement('div');
    cardFooter.className = 'card-footer';

    let cardFooterText = document.createElement('small');
    cardFooterText.className = 'text-muted';
    cardFooterText.innerHTML = `${document.getElementById('set-title').value} / ${question.category} / ${question.subcategory}`;
    cardFooter.appendChild(cardFooterText);

    cardContainer.appendChild(cardBody);
    cardContainer.appendChild(cardFooter);
    card.appendChild(cardContainer);

    document.getElementById('room-history').prepend(card);

    questionCounter++;
}

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

document.getElementById('set-title').addEventListener('change', async function (event) {
    let [setYear, setName] = parseSetTitle(this.value);
    maxPacketNumber = await getNumPackets(setYear, setName);
    if (maxPacketNumber > 0) {
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    }
});

var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});