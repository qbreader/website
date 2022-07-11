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

function updateSubcategory(subcat) {
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    if (validSubcategories.includes(subcat)) {
        // remove subcat:
        validSubcategories = validSubcategories.filter(a => a !== subcat);
    } else {
        validSubcategories.push(subcat);
    }

    localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
}

function loadCategories(validCategories, validSubcategories) {
    if (validCategories.length === 0) {
        validSubcategories.forEach(subcat => document.querySelector(`[for="${subcat}"]`).checked = true);
        return;
    }

    CATEGORIES.forEach((cat, index) => {
        if (validCategories.includes(cat)) {
            document.getElementById(cat).checked = true;
            if (index in SUBCATEGORIES) {
                let total = 0;
                SUBCATEGORIES[index].forEach(subcat => {
                    if (validSubcategories && validSubcategories.includes(subcat)) {
                        total++;
                        document.querySelector(`[for="${subcat}"]`).checked = true;
                    } else {
                        document.querySelector(`[for="${subcat}"]`).classList.add('d-none');
                    }
                });

                if (total === 0) {
                    for (let j = 0; j < SUBCATEGORIES[index].length; j++) {
                        document.querySelector(`[for="${SUBCATEGORIES[index][j]}"]`).classList.remove('d-none');
                    }
                }
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

function parseSetName(setName) {
    let year = parseInt(setName.substring(0, 4));
    let name = setName.substring(5);

    return [year, name];
}

function parsePacketNumbers(packetNumberString, maxPacketNumber = maxPacketNumber) {
    if (packetNumberString.length == 0 || packetNumberString.toLowerCase() == 'all') {
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
 * @param {String} setName - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getQuestions(setName, packet_number, mode = 'all') {
    let [year, name] = parseSetName(setName);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    return await fetch(`/api/get-packet?year=${encodeURI(year)}&setName=${encodeURI(name)}&packet_number=${encodeURI(packet_number)}`)
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
 */
async function start(mode) {
    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;

    setName = document.getElementById('set-name').value.trim();
    if (setName.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }

    packetNumbers = document.getElementById('packet-number').value.trim();
    packetNumbers = parsePacketNumbers(packetNumbers, maxPacketNumber);
    packetNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    questions = await getQuestions(setName, packetNumber, mode = mode);
    document.getElementById('next').removeAttribute('disabled');
    document.getElementById('next').innerHTML = 'Skip';

    readQuestion();
}


if (document.URL.substring(0, 30) === 'https://qbreader.herokuapp.com') {
    window.location.href = 'http://www.qbreader.org' + document.URL.substring(30);
}

if (localStorage.getItem('validSubcategories') === null)
    localStorage.setItem('validSubcategories', '[]');
if (localStorage.getItem('validCategories') === null)
    localStorage.setItem('validCategories', '[]');

//load the selected categories and subcategories
loadCategories(JSON.parse(localStorage.getItem('validCategories')), JSON.parse(localStorage.getItem('validSubcategories')));

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        let validCategories = JSON.parse(localStorage.getItem('validCategories'));
        let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        localStorage.setItem('validCategories', JSON.stringify(validCategories));
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});

document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        updateSubcategory(input.id);
    });
});

document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});

document.getElementById('toggle-options').addEventListener('click', function () {
    this.blur();
    document.getElementById('options').classList.toggle('d-none');
});

const setNameField = document.getElementById('set-name');
setNameField.addEventListener('change', async (event) => {
    let [year, name] = parseSetName(setNameField.value);
    maxPacketNumber = await getNumPackets(year, name);
    if (maxPacketNumber > 0) {
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    }
});