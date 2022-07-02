/**
 * Variables and functions common to both tossups and bonuses
 */

var max_packet_number = 24;

/**
 * Array of categories.
 */
const all_categories = ["Literature", "History", "Science", "Fine Arts", "Religion", "Mythology", "Philosophy", "Social Science", "Current Events", "Geography", "Other Academic", "Trash"]

/**
 * Array of all subcategories.
 * Indexed by their index in the all_categories array.
 * Categories that do not have any subcategories are not listed.
 */
const all_subcategories = [
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

function updateCategory(cat) {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
    if (validCategories.length === 0) { // selecting a category when no categories are currently selected
        validCategories.push(cat);

        let index = all_categories.indexOf(cat);
        document.querySelectorAll('#subcategories label').forEach(label => {
            if (!(index in all_subcategories) || !all_subcategories[index].includes(label.getAttribute('for'))) {
                label.classList.add('d-none');
                document.getElementById(label.getAttribute('for')).checked = false;
                validSubcategories = validSubcategories.filter(a => a !== label.getAttribute('for'));
            }
        });
    } else if (validCategories.includes(cat)) { // remove category
        validCategories = validCategories.filter(a => a !== cat);

        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) { // remove all subcats associated with the category
            all_subcategories[index].forEach(subcat => {
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

        let index = all_categories.indexOf(cat);
        if (index in all_subcategories) {
            all_subcategories[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.remove('d-none'));
        }
    }

    localStorage.setItem('validCategories', JSON.stringify(validCategories));
    localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
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

function loadCategories() {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

    if (validCategories.length === 0) {
        validSubcategories.forEach(subcat => document.querySelector(`[for="${subcat}"]`).checked = true);
        return;
    }

    all_categories.forEach((cat, index) => {
        if (validCategories.includes(cat)) {
            document.getElementById(cat).checked = true;
            if (index in all_subcategories) {
                let total = 0;
                all_subcategories[index].forEach(subcat => {
                    if (validSubcategories && validSubcategories.includes(subcat)) {
                        total++;
                        document.querySelector(`[for="${subcat}"]`).checked = true;
                    } else {
                        document.querySelector(`[for="${subcat}"]`).classList.add('d-none');
                    }
                });

                if (total === 0) {
                    for (let j = 0; j < all_subcategories[index].length; j++) {
                        document.querySelector(`[for="${all_subcategories[index][j]}"]`).classList.remove('d-none');
                    }
                }
            }
        } else if (index in all_subcategories) {
            all_subcategories[index].forEach(subcat => document.querySelector(`[for="${subcat}"]`).classList.add('d-none'));
        }
    });
}

/**
 * 
 * @param {JSON} question 
 * @returns {boolean} Whether or not the question is part of the valid category and subcategory combination.
 */
function isValidCategory(question) {
    let validCategories = JSON.parse(localStorage.getItem('validCategories'));
    let validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

    if (validCategories.length === 0) return true;
    if (!validCategories.includes(question['category'])) return false;

    if ('subcategory' in question === false) return true;
    if (validSubcategories.includes(question['subcategory'])) return true;

    // check to see if none of the subcategories of the question are selected
    let index = all_categories.indexOf(question['category']);
    if (!(index in all_subcategories)) return true;

    for (let i = 0; i < all_subcategories[index].length; i++) {
        if (validSubcategories.includes(all_subcategories[index][i])) return false;
    }

    // if there are no subcategories selected in the field, then it is valid
    return true;
}

function parseSetName(set_string) {
    let year = parseInt(set_string.substring(0, 4));
    let name = set_string.substring(5);

    return [year, name];
}

function parsePacketNumbers(packetNumberString, maxPacketNumber = max_packet_number) {
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

async function getNumPackets(year, set_name) {
    return await fetch(`/get-num-packets?year=${encodeURI(year)}&set_name=${encodeURI(set_name)}`)
        .then(response => response.json())
        .then(data => {
            return parseInt(data['num_packets']);
        });
}

/**
 * 
 * @param {String} name - The name of the set, in the format "[year]-[name]".
 * @param {Number} number - The packet number of the set.
 * 
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getQuestions(packetName, packet_number, mode = 'all') {
    let [year, set_name] = parseSetName(packetName);
    document.getElementById('question').innerHTML = 'Fetching questions...';
    return await fetch(`/get-packet?year=${encodeURI(year)}&set_name=${encodeURI(set_name)}&packet_number=${encodeURI(packet_number)}`)
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

    packetName = document.getElementById('name-select').value.trim();
    if (packetName.length == 0) {
        window.alert('Enter a packet name.');
        return;
    }

    packetNumbers = document.getElementById('packet-select').value.trim();
    packetNumbers = parsePacketNumbers(packetNumbers, max_packet_number);
    packetNumber = packetNumbers.shift();

    currentQuestionNumber = document.getElementById('question-select').value;
    if (currentQuestionNumber == '') currentQuestionNumber = '1';  // default = 1
    currentQuestionNumber = parseInt(currentQuestionNumber) - 2;

    questions = await getQuestions(packetName, packetNumber, mode = mode);
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
loadCategories();

document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        updateCategory(input.id);
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

const name_select = document.getElementById('name-select');
name_select.addEventListener('change', async (event) => {
    let [year, name] = parseSetName(name_select.value);
    max_packet_number = await getNumPackets(year, name);
    document.getElementById('packet-select').placeholder = `Packet #s (1-${max_packet_number})`;
});