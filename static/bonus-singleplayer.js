var validCategories = JSON.parse(localStorage.getItem('validCategories'));
var validSubcategories = JSON.parse(localStorage.getItem('validSubcategories'));

/**
 * On window load, run these functions.
 */

// Keep text fields in localStorage
var packetNameField = document.getElementById('set-title');
if (localStorage.getItem('setTitleBonusSave')) {
    packetNameField.value = localStorage.getItem('setTitleBonusSave');
    let [year, name] = parseSetTitle(setNameField.value);
    (async () => {
        maxPacketNumber = await getNumPackets(year, name);
        document.getElementById('packet-number').placeholder = `Packet #s (1-${maxPacketNumber})`;
    })();
}

packetNameField.addEventListener('change', function () {
    localStorage.setItem('setTitleBonusSave', packetNameField.value);
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
document.getElementById('start').addEventListener('click', async function () {
    this.blur();
    onQuestion = true;
    start('bonuses')
});

document.getElementById('next').addEventListener('click', async function () {
    this.blur();

    if (this.innerHTML === 'Next') {
        updateStats();
        updateStatDisplay();
    }

    onQuestion = true;
    await loadAndReadQuestion();
});

document.getElementById('reveal').addEventListener('click', function () {
    this.blur();
    revealBonusPart();
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

if (localStorage.getItem('validSubcategories') === null)
    localStorage.setItem('validSubcategories', '[]');
if (localStorage.getItem('validCategories') === null)
    localStorage.setItem('validCategories', '[]');

//load the selected categories and subcategories
loadCategoryModal(validCategories, validSubcategories);

/**
 * An array that represents
 * [# of 30's, # of 20's, # of 10's, # of 0's].
 */
 if (sessionStorage.getItem('stats') === null)
 sessionStorage.setItem('stats', [0, 0, 0, 0]);

updateStatDisplay(); //update stats upon loading site