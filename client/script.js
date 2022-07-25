if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

if (['http://www.qbreader.org', 'http://qbreader.herokuapp.com', 'https://qbreader.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://www.qbreader.org' + location.pathname;
}

var questionCounter = 1;
var maxPacketNumber = 24;

const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]
const SUBCATEGORIES = {
    "Literature": ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature"],
    "History": ["American History", "Ancient History", "European History", "World History", "Other History"],
    "Science": ["Biology", "Chemistry", "Physics", "Math", "Other Science"],
    "Fine Arts": ["Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts"],
    "Religion": ["Religion"],
    "Mythology": ["Mythology"],
    "Philosophy": ["Philosophy"],
    "Social Science": ["Social Science"],
    "Current Events": ["Current Events"],
    "Geography": ["Geography"],
    "Other Academic": ["Other Academic"],
    "Trash": ["Trash"],
}
const SUBCATEGORIES_FLATTENED = ["American Literature", "British Literature", "Classical Literature", "European Literature", "World Literature", "Other Literature", "American History", "Ancient History", "European History", "World History", "Other History", "Biology", "Chemistry", "Physics", "Math", "Other Science", "Visual Fine Arts", "Auditory Fine Arts", "Other Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"];

/**
 * 
 * @param {String} setName 
 * @returns
 */
async function getNumPackets(setName) {
    if (setName === undefined) return 0;

    return fetch(`/api/num-packets?setName=${encodeURIComponent(setName)}`)
        .then(response => response.json())
        .then(data => {
            return parseInt(data);
        });
}


function arrayToRange(array) {
    if (array.length === 0) return '';

    array = [...new Set(array)];
    array = array.sort((a, b) => a - b);

    let string = '';
    let lastRangeStart = array[0];
    let lastRangeEnd = array[0];

    for (let i = 1; i < array.length; i++) {
        if (array[i] - lastRangeEnd === 1) {
            lastRangeEnd = array[i];
        } else {
            if (lastRangeStart === lastRangeEnd) {
                string = `${string}, ${lastRangeStart}`;
            } else {
                string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
            }
            lastRangeStart = array[i];
            lastRangeEnd = array[i];
        }
    }

    if (lastRangeStart === lastRangeEnd) {
        string = `${string}, ${lastRangeStart}`;
    } else {
        string = `${string}, ${lastRangeStart}-${lastRangeEnd}`;
    }

    return string.slice(2);
}


function createTossupCard(question, setName, packetNumber, questionNumber) {
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
    cardFooterText.innerHTML = `${setName} / ${question.category} / ${question.subcategory}`;
    cardFooter.appendChild(cardFooterText);

    let cardFooterText2 = document.createElement('small');
    cardFooterText2.className = 'text-muted float-end';
    cardFooterText2.innerHTML = `Packet ${packetNumber} / Question ${questionNumber}`;
    cardFooter.appendChild(cardFooterText2);

    cardContainer.appendChild(cardBody);
    cardContainer.appendChild(cardFooter);
    card.appendChild(cardContainer);

    document.getElementById('room-history').prepend(card);

    questionCounter++;
}


function isTouchDevice() {
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}


/**
 * @param {JSON} question 
 * @param {Array<String>} validCategories
 * @param {Array<String>} validSubcategories
 * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
 */
function isValidCategory(question, validCategories, validSubcategories) {
    if (validCategories.length === 0 && validSubcategories.length === 0) return true;

    return validCategories.includes(question.category) && validSubcategories.includes(question.subcategory);
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
    document.querySelectorAll('#subcategories label').forEach(element => element.classList.add('d-none'));

    if (validSubcategories.length === 0 ) {
        let subcategoryInfoText = document.createElement('div');
        subcategoryInfoText.className = 'text-muted text-center';
        subcategoryInfoText.innerHTML = 'You must select categories before you can select subcategories.';
        subcategoryInfoText.id = 'subcategory-info-text';
        document.getElementById('subcategories').appendChild(subcategoryInfoText);
    } else if (document.getElementById('subcategory-info-text')) {
        document.getElementById('subcategory-info-text').remove();
    }

    validCategories.forEach(category => {
        document.getElementById(category).checked = true;
        SUBCATEGORIES[category].forEach(subcategory => {
            document.querySelector(`[for="${subcategory}"]`).classList.remove('d-none');
        });
    });

    validSubcategories.forEach(subcategory => {
        document.getElementById(subcategory).checked = true;
    });
}


/**
 * Toggles pausing or resuming the tossup.
 */
function pause() {
    if (paused) {
        document.getElementById('buzz').removeAttribute('disabled');
        document.getElementById('pause').innerHTML = 'Pause';
        recursivelyPrintTossup();
    }
    else {
        document.getElementById('buzz').setAttribute('disabled', 'disabled');
        document.getElementById('pause').innerHTML = 'Resume';
        clearTimeout(timeoutID);
    }
    paused = !paused;
}


function rangeToArray(string, max = 0) {
    if (string.length === 0) {
        string = `1-${max}`;
    }

    if (string.endsWith('-')) {
        string = string + max;
    }

    let tokens = string.split(",");
    let ranges = [];
    for (let i = 0; i < tokens.length; i++) {
        let range = tokens[i].trim().split("-");
        if (range.length === 1) {
            ranges.push([parseInt(range[0]), parseInt(range[0])]);
        } else {
            ranges.push([parseInt(range[0]), parseInt(range[1])]);
        }
    }

    let array = [];
    for (let i = 0; i < ranges.length; i++) {
        for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
            array.push(j);
        }
    }

    return array;
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
    if (validCategories.includes(category)) {
        validCategories = validCategories.filter(a => a !== category);
        validSubcategories = validSubcategories.filter(a => !SUBCATEGORIES[category].includes(a));
    } else {
        validCategories.push(category);
        validSubcategories = validSubcategories.concat(SUBCATEGORIES[category]);
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
        validSubcategories = validSubcategories.filter(a => a !== subcategory);
    } else {
        validSubcategories.push(subcategory);
    }

    return validSubcategories;
}


document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});


document.getElementById('set-name').addEventListener('change', async function (event) {
    maxPacketNumber = await getNumPackets(this.value);
    if (maxPacketNumber > 0) {
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    } else {
        document.getElementById('packet-number').placeholder = 'Packet #s';
    }
});


var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    if (isTouchDevice()) return;

    return new bootstrap.Tooltip(tooltipTriggerEl);
});


fetch(`/api/set-list`).then(response => response.json()).then(data => {
    data.forEach(setName => {
        let option = document.createElement('option');
        option.innerHTML = setName;
        document.getElementById('set-list').appendChild(option);
    });
});