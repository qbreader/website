/**
 * @param {String} setName - The name of the set (e.g. "2021 PACE").
 * @param {String} packetNumber - The packet number of the set.
 * @return {Array<JSON>} An array containing the bonuses.
 */
async function getBonuses(setName, packetNumber) {
    return await fetch(`/api/packet-bonuses?&setName=${encodeURIComponent(setName)}&packetNumber=${encodeURIComponent(packetNumber)}`)
        .then(response => response.json())
        .then(data => data.bonuses);
}


/**
 * @param {String} setName - The name of the set (e.g. "2021 PACE").
 * @param {String} packetNumber - The packet number of the set.
 * @return {{tossups: Array<JSON>, bonuses: Array<JSON>}} An array containing the questions.
 */
async function getPacket(setName, packetNumber) {
    return await fetch(`/api/packet?&setName=${encodeURIComponent(setName)}&packetNumber=${encodeURIComponent(packetNumber)}`).then(response => response.json());
}


/**
 * @param {String} setName - The name of the set (e.g. "2021 PACE").
 * @param {String} packetNumber - The packet number of the set.
 * @return {Array<JSON>} An array containing the tossups.
 */
async function getTossups(setName, packetNumber) {
    return await fetch(`/api/packet-tossups?&setName=${encodeURIComponent(setName)}&packetNumber=${encodeURIComponent(packetNumber)}`)
        .then(response => response.json())
        .then(data => data.tossups);
}


/**
 * Initizalizes all variables (called when the user presses the start button).
 * @returns {Promsie<Boolean>} Whether or not the function was successful.
 */
function initialize(alertOnFailure = true) {
    setName = document.getElementById('set-name').value.trim();
    if (setName.length == 0) {
        if (alertOnFailure) alert('Please enter a set name.');
        return false;
    }

    document.getElementById('options').classList.add('d-none');
    document.getElementById('toggle-options').disabled = false;

    packetNumbers = rangeToArray(document.getElementById('packet-number').value.trim(), maxPacketNumber);
    packetNumber = packetNumbers[0];

    questionNumber = document.getElementById('question-number').value;
    if (questionNumber == '') questionNumber = '1';  // default = 1
    questionNumber = parseInt(questionNumber) - 2;

    document.getElementById('next').disabled = false;
    document.getElementById('next').innerHTML = 'Skip';

    return true;
}


/**
 * Increases or decreases a session storage item by a certain amount.
 * @param {String} item - The name of the sessionStorage item.
 * @param {Number} x - The amount to increase/decrease the sessionStorage item.
 */
function shift(item, x) {
    sessionStorage.setItem(item, parseFloat(sessionStorage.getItem(item)) + x);
}


document.querySelectorAll('#categories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validCategories = JSON.parse(localStorage.getItem('validCategories'));
        validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));
        [validCategories, validSubcategories] = updateCategory(input.id, validCategories, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
        localStorage.setItem('validCategories', JSON.stringify(validCategories));
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});


document.querySelectorAll('#subcategories input').forEach(input => {
    input.addEventListener('click', function (event) {
        this.blur();
        validSubcategories = updateSubcategory(input.id, validSubcategories);
        loadCategoryModal(validCategories, validSubcategories);
        localStorage.setItem('validSubcategories', JSON.stringify(validSubcategories));
    });
});


document.getElementById('clear-stats').addEventListener('click', function () {
    this.blur();
    clearStats();
});