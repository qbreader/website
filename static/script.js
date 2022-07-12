/**
 * Variables and functions common to both tossups and bonuses
 */

var maxPacketNumber = 24;

/**
 * Array of categories.
 */
const CATEGORIES = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]

/**
 * Array of all subcategories.
 * Indexed by their index in the all_categories array.
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

function updateCategory(cat, validCategories, validSubcategories) {
    if (validCategories.length === 0) { // selecting a category when no categories are currently selected
        validCategories.push(cat);

        let index = CATEGORIES.indexOf(cat);
        document.querySelectorAll('#subcategories label').forEach(label => {
            if (!(index in SUBCATEGORIES) || !SUBCATEGORIES[index].includes(label.getAttribute('for'))) {
                label.classList.add('d-none');
                document.getElementById(label.getAttribute('for')).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== label.getAttribute('for'));
            }
        });
    } else if (validCategories.includes(cat)) { // remove category
        validCategories = validCategories.filter(a => a !== cat);

        let index = CATEGORIES.indexOf(cat);
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
        validCategories.push(cat);

        let index = CATEGORIES.indexOf(cat);
        if (index in SUBCATEGORIES) {
            SUBCATEGORIES[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.remove('d-none'));
        }
    }

    return [validCategories, validSubcategories];
}

function updateSubcategory(subcat, validSubcategories) {
    if (validSubcategories.includes(subcat)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcat);
    } else {
        validSubcategories.push(subcat);
    }

    return validSubcategories;
}

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
 * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
 */
function isValidCategory(question, validCategories, validSubcategories) {
    if (validCategories.length === 0) return true;
    if (!validCategories.includes(question['category'])) return false;

    if ('subcategory' in question === false) return true;
    if (validSubcategories.includes(question['subcategory'])) return true;

    // check to see if none of the subcategories of the question are selected
    let index = CATEGORIES.indexOf(question['category']);
    if (!(index in SUBCATEGORIES)) return true;

    for (let i = 0; i < SUBCATEGORIES[index].length; i++) {
        if (validSubcategories.includes(SUBCATEGORIES[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}

function parseSetTitle(setTitle) {
    let year = parseInt(setTitle.substring(0, 4));
    let name = setTitle.substring(5);

    return [year, name];
}

function parsePacketNumbers(packetNumberString, maxPacketNumber = 24) {
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

async function getNumPackets(year, setName) {
    return await fetch(`/api/get-num-packets?year=${encodeURI(year)}&setName=${encodeURI(setName)}`)
        .then(response => response.json())
        .then(data => {
            return parseInt(data['num_packets']);
        });
}

/**
 * 
 * @param {String} setTitle - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getPacket(setTitle, packetNumber, mode = 'all') {
    let [year, name] = parseSetTitle(setTitle);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    return await fetch(`/api/get-packet?year=${encodeURI(year)}&setName=${encodeURI(name)}&packetNumber=${encodeURI(packetNumber)}`)
        .then(response => response.json())
        .then(data => {
            if (mode === 'all') {
                return data;
            } else if (mode === 'tossups') {
                return data['tossups'];
            } else if (mode === 'bonuses') {
                return data['bonuses'];
            }
        });
}

/**
 * Starts reading questions.
 * @returns {Promsie<Boolean>} Whether or not the function was successful.
 */
async function start(mode, alertOnFailure = true) {
    setTitle = document.getElementById('set-title').value.trim();
    if (setTitle.length == 0) {
        if (alertOnFailure) alert('Please enter a set name.');
        return false;
    }

    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;
    
    packetNumbers = parsePacketNumbers(document.getElementById('packet-number').value.trim(), maxPacketNumber);
    currentPacketNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    questions = await getPacket(setTitle, currentPacketNumber, mode);

    document.getElementById('next').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    await loadAndReadQuestion();

    return true;
}


if (document.URL.substring(0, 30) === 'https://qbreader.herokuapp.com') {
    window.location.href = 'http://www.qbreader.org' + document.URL.substring(30);
}

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

document.getElementById('set-title').addEventListener('change', async function (event) {
    let [year, name] = parseSetTitle(this.value);
    maxPacketNumber = await getNumPackets(year, name);
    if (maxPacketNumber > 0) {
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    }
});