// Constants and functions useful for quizbowl.

const SUBCATEGORIES = {
    'Literature': ['American Literature', 'British Literature', 'Classical Literature', 'European Literature', 'World Literature', 'Other Literature'],
    'History': ['American History', 'Ancient History', 'European History', 'World History', 'Other History'],
    'Science': ['Biology', 'Chemistry', 'Physics', 'Math', 'Other Science'],
    'Fine Arts': ['Visual Fine Arts', 'Auditory Fine Arts', 'Other Fine Arts'],
    'Religion': ['Religion'],
    'Mythology': ['Mythology'],
    'Philosophy': ['Philosophy'],
    'Social Science': ['Social Science'],
    'Current Events': ['Current Events'],
    'Geography': ['Geography'],
    'Other Academic': ['Other Academic'],
    'Trash': ['Trash'],
};


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


const createBonusCard = (function () {
    let questionCounter = 0;

    return function (bonus) {
        if (!bonus || Object.keys(bonus).length === 0)
            return;

        questionCounter++;

        const { leadin, parts, answers, category, subcategory, alternate_subcategory, setName, packetNumber, questionNumber, _id } = bonus;

        const bonusLength = bonus.parts.length;

        let cardHeader = '';
        for (let i = 0; i < bonusLength; i++) {
            cardHeader += removeParentheses(answers[i]);

            if (i !== bonusLength - 1)
                cardHeader += ' / ';
        }

        let cardBody = '';
        for (let i = 0; i < bonusLength; i++) {
            cardBody += `<hr></hr>
            <p>
                ${getBonusPartLabel(bonus, i)} ${escapeHTML(parts[i])}
                ${i + 1 === bonusLength ? `<a class="user-select-none" href="#" id="report-question-${_id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>` : ''}
            </p>
            <div>ANSWER: ${answers[i]}</div>`;
        }


        // append a card containing the question to the history element
        const card = document.createElement('div');
        card.className = 'card my-2';
        card.innerHTML = `
            <div class="card-header d-flex justify-content-between">
                <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#question-${questionCounter}" aria-expanded="true">
                    ${cardHeader}
                </span>
                <a href="#" id="star-bonus-${questionCounter}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>
                </a>
            </div>
            <div class="card-container collapse" id="question-${questionCounter}">
                <div class="card-body">
                    <p>${escapeHTML(leadin)}</p>
                    ${cardBody}
                </div>
                <div class="card-footer">
                    <small class="text-muted">${setName} / ${category} / ${subcategory} ${alternate_subcategory ? '(' + alternate_subcategory + ')' : ''}</small>
                    <small class="text-muted float-end">Packet ${packetNumber} / Question ${questionNumber}</small>
                </div>
            </div>
        `;

        document.getElementById('room-history').prepend(card);

        document.getElementById('report-question-' + _id).addEventListener('click', () => {
            document.getElementById('report-question-id').value = _id;
        });

        document.getElementById('star-bonus-' + questionCounter).addEventListener('click', async function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.classList.contains('selected')) {
                this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>`;
                unstarBonus(_id);
                this.classList.toggle('selected');
            } else if (await starBonus(_id)) {
                this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>`;
                this.classList.toggle('selected');
            }
        });
    };
})();


const createTossupCard = (function () {
    let questionCounter = 0;

    return function (tossup) {
        if (!tossup || Object.keys(tossup).length === 0) return;

        questionCounter++;

        const { question, answer, category, subcategory, alternate_subcategory, setName, packetNumber, questionNumber, _id } = tossup;
        const powerParts = question.replace(/<\/?b>/g, '').split('(*)');

        // append a card containing the question to the history element
        const card = document.createElement('div');
        card.className = 'card my-2';
        card.innerHTML = `
            <div class="card-header d-flex justify-content-between">
                <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#question-${questionCounter}" aria-expanded="true">
                    ${removeParentheses(answer)}
                </span>
                <a href="#" id="star-tossup-${questionCounter}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>
                </a>
            </div>
            <div class="card-container collapse" id="question-${questionCounter}">
                <div class="card-body">
                    ${powerParts.length > 1 ? '<b>' + escapeHTML(powerParts[0]) + '(*)</b>' + escapeHTML(powerParts[1]) : escapeHTML(question)}
                    <a class="user-select-none" href="#" id="report-question-${_id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
                    <hr></hr>
                    <div>ANSWER: ${answer}</div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">${setName} / ${category} / ${subcategory} ${alternate_subcategory ? '(' + alternate_subcategory + ')' : ''}</small>
                    <small class="text-muted float-end">Packet ${packetNumber} / Question ${questionNumber}</small>
                </div>
            </div>
        `;

        document.getElementById('room-history').prepend(card);

        document.getElementById('report-question-' + _id).addEventListener('click', function (e) {
            document.getElementById('report-question-id').value = _id;
        });

        document.getElementById('star-tossup-' + questionCounter).addEventListener('click', async function (event) {
            event.preventDefault();
            event.stopPropagation();

            if (this.classList.contains('selected')) {
                this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>`;
                unstarTossup(_id);
                this.classList.toggle('selected');
            } else if (await starTossup(_id)) {
                this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>`;
                this.classList.toggle('selected');
            }
        });
    };
})();


/**
 * Return a string that represents the bonus part label for the given bonus and index.
 * For example, '[10m]' or '[10]'.
 * @param {*} bonus
 * @param {*} index
 * @param {*} defaultValue
 * @param {*} defaultDifficulty
 * @returns {String}
 */
function getBonusPartLabel(bonus, index, defaultValue = 10, defaultDifficulty = '') {
    const value = bonus.values ? (bonus.values[index] ?? defaultValue) : defaultValue;
    const difficulty = bonus.difficulties ? (bonus.difficulties[index] ?? defaultDifficulty) : defaultDifficulty;
    return `[${value}${difficulty}]`;
}


/**
 * @param {String} setName
 * @returns {Promise<Number>} The number of packets in the set.
 */
async function getNumPackets(setName) {
    if (setName === undefined || setName === '') {
        return 0;
    }

    return fetch('/api/num-packets?' + new URLSearchParams({ setName }))
        .then(response => response.json())
        .then(data => data.numPackets);
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

    if (validSubcategories.length === 0) {
        const subcategoryInfoText = document.createElement('div');
        subcategoryInfoText.className = 'text-muted text-center';
        subcategoryInfoText.textContent = 'You must select categories before you can select subcategories.';
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


function rangeToArray(string, max = 0) {
    if (string.length === 0) {
        string = `1-${max}`;
    }

    if (string.endsWith('-')) {
        string = string + max;
    }

    const tokens = string.split(',');
    const ranges = [];
    for (let i = 0; i < tokens.length; i++) {
        const range = tokens[i].trim().split('-');
        if (range.length === 1) {
            ranges.push([parseInt(range[0]), parseInt(range[0])]);
        } else {
            ranges.push([parseInt(range[0]), parseInt(range[1])]);
        }
    }

    const array = [];
    for (let i = 0; i < ranges.length; i++) {
        for (let j = ranges[i][0]; j <= ranges[i][1]; j++) {
            array.push(j);
        }
    }

    return array;
}


function removeParentheses(string) {
    return string.replace(/[[].*/, '').replace(/\(.*\)/, '').trim();
}


function reportQuestion() {
    const _id = document.getElementById('report-question-id').value;
    const reason = document.getElementById('report-question-reason').value;
    const description = document.getElementById('report-question-description').value;

    document.getElementById('report-question-submit').disabled = true;
    fetch('/api/report-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id, reason, description }),
    }).then(response => {
        if (response.status === 200) {
            document.getElementById('report-question-reason').value = 'wrong-category';
            document.getElementById('report-question-description').value = '';
            alert('Question has been reported.');
        } else {
            alert('There was an error reporting the question.');
        }
    }).catch(_error => {
        alert('There was an error reporting the question.');
    }).finally(() => {
        document.getElementById('report-question-close').click();
        document.getElementById('report-question-submit').disabled = false;
    });
}


/**
 * Adds the given category if it is not in the list of valid categories.
 * Otherwise, the category is removed.
 * @param {String} category
 * @param {Array<String>} categories
 * @param {Array<String>} subcategories
 */
function updateCategory(category, categories, subcategories) {
    if (categories.includes(category)) {
        categories = categories.filter(a => a !== category);
        subcategories = subcategories.filter(a => !SUBCATEGORIES[category].includes(a));
    } else {
        categories.push(category);
        subcategories = subcategories.concat(SUBCATEGORIES[category]);
    }

    return { categories, subcategories };
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


document.getElementById('report-question-submit').addEventListener('click', function () {
    reportQuestion();
});
