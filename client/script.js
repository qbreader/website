if (location.pathname.endsWith('/') && location.pathname.length > 1) {
    location.pathname = location.pathname.substring(0, location.pathname.length - 1);
}

if (['http://www.qbreader.org', 'http://qbreader.herokuapp.com', 'https://qbreader.herokuapp.com'].includes(location.origin)) {
    location.href = 'https://www.qbreader.org' + location.pathname;
}

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


function createTossupCard(question, packetNumber, questionNumber) {
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
    cardFooterText.innerHTML = `${document.getElementById('set-name').value} / ${question.category} / ${question.subcategory}`;
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


function isTouchDevice(){
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