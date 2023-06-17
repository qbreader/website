// Functions and variables used in both the tossup and bonus pages.

/**
 * An array of random questions.
 * We get 20 random questions at a time so we don't have to make an HTTP request between every question.
 */
let randomQuestions = [];
let maxPacketNumber = 24;

/**
 * @param {String} answerline
 * @param {String} givenAnswer
 * @returns {Promise<{
    * directive: "accept" | "prompt" | "reject",
    * directedPrompt: String | null
 * }>}
 */
async function checkAnswer(answerline, givenAnswer) {
    if (givenAnswer === '') {
        return { directive: 'reject', directedPrompt: null };
    }

    return await fetch(`/api/check-answer?answerline=${encodeURIComponent(answerline)}&givenAnswer=${encodeURIComponent(givenAnswer)}`)
        .then(response => response.json());
}


/**
 * Increases or decreases a session storage item by a certain amount.
 * @param {String} item - The name of the sessionStorage item.
 * @param {Number} x - The amount to increase/decrease the sessionStorage item.
 */
function shift(item, x) {
    sessionStorage.setItem(item, parseFloat(sessionStorage.getItem(item)) + x);
}


/**
 * Initizalizes all variables (called when the user presses the start button).
 * @param {Boolean} selectBySetName - Whether or not the user is selecting by set name.
 * @returns {Promsie<Boolean>} Whether or not the function was successful.
 */
function start(selectBySetName) {
    setName = document.getElementById('set-name').value.trim();
    if (setName.length === 0 && selectBySetName) {
        alert('Please enter a set name.');
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
    document.getElementById('next').textContent = 'Skip';

    return true;
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


document.getElementById('set-name').addEventListener('change', async function (event) {
    // make border red if set name is not in set list
    if (SET_LIST.includes(this.value) || this.value.length === 0) {
        this.classList.remove('is-invalid');
    } else {
        this.classList.add('is-invalid');
    }
    maxPacketNumber = await getNumPackets(this.value);
    if (this.value === '' || maxPacketNumber === 0) {
        document.getElementById('packet-number').placeholder = 'Packet Numbers';
    } else {
        document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
    }
});
