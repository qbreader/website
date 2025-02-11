import star from '../auth/star.js';
import { removeParentheses } from './strings.js';

// Constants and functions useful for quizbowl.

function arrayToRange (array) {
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
    if (!bonus || Object.keys(bonus).length === 0) { return; }

    questionCounter++;

    const { leadin, parts, answers, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = bonus;

    const bonusLength = bonus.parts.length;

    let cardHeader = '';
    for (let i = 0; i < bonusLength; i++) {
      cardHeader += removeParentheses(answers[i]);

      if (i !== bonusLength - 1) { cardHeader += ' / '; }
    }

    let cardBody = '';
    for (let i = 0; i < bonusLength; i++) {
      cardBody += `<hr></hr>
            <p>
                ${getBonusPartLabel(bonus, i)} ${parts[i]}
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
                <a href="#" class="star-bonus" id="star-bonus-${questionCounter}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>
                </a>
            </div>
            <div class="card-container collapse" id="question-${questionCounter}">
                <div class="card-body">
                    <p>${leadin}</p>
                    ${cardBody}
                </div>
                <div class="card-footer">
                    <small class="text-muted">${set.name} / ${category} / ${subcategory}${alternateSubcategory ? ' / ' + alternateSubcategory : ''}</small>
                    <small class="text-muted float-end">Packet ${packet.number} / Question ${number}</small>
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
        star.unstarBonus(_id);
        this.classList.toggle('selected');
      } else if (await star.starBonus(_id)) {
        this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>`;
        this.classList.toggle('selected');
      }
    });

    star.isStarredBonus(_id).then(isStarred => {
      if (isStarred) {
        document.getElementById('star-bonus-' + questionCounter).click();
        document.getElementById('star-bonus-' + questionCounter).blur();
      }
    });
  };
})();

const createTossupCard = (function () {
  let questionCounter = 0;

  return function (tossup) {
    if (!tossup || Object.keys(tossup).length === 0) return;

    questionCounter++;

    const { markedQuestion, answer, category, subcategory, alternate_subcategory: alternateSubcategory, set, packet, number, _id } = tossup;

    // append a card containing the question to the history element
    const card = document.createElement('div');
    card.className = 'card my-2';
    card.innerHTML = `
            <div class="card-header d-flex justify-content-between">
                <span class="card-header-clickable clickable" data-bs-toggle="collapse" data-bs-target="#question-${questionCounter}" aria-expanded="true">
                    ${removeParentheses(answer)}
                </span>
                <a href="#" class="star-tossup" id="star-tossup-${questionCounter}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star" viewBox="0 0 16 16">
                    <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z"/>
                </svg>
                </a>
            </div>
            <div class="card-container collapse" id="question-${questionCounter}">
                <div class="card-body">
                    ${markedQuestion}
                    <a class="user-select-none" href="#" id="report-question-${_id}" data-bs-toggle="modal" data-bs-target="#report-question-modal">Report Question</a>
                    <hr></hr>
                    <div>ANSWER: ${answer}</div>
                </div>
                <div class="card-footer">
                    <small class="text-muted">${set.name} / ${category} / ${subcategory}${alternateSubcategory ? ' / ' + alternateSubcategory : ''}</small>
                    <small class="text-muted float-end">Packet ${packet.number} / Question ${number}</small>
                </div>
            </div>
        `;

    document.getElementById('room-history').prepend(card);

    document.getElementById('report-question-' + _id).addEventListener('click', function () {
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
        star.unstarTossup(_id);
        this.classList.toggle('selected');
      } else if (await star.starTossup(_id)) {
        this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-star-fill" viewBox="0 0 16 16">
                    <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z"/>
                </svg>`;
        this.classList.toggle('selected');
      }
    });

    star.isStarredTossup(_id).then(isStarred => {
      if (isStarred) {
        document.getElementById('star-tossup-' + questionCounter).click();
        document.getElementById('star-tossup-' + questionCounter).blur();
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
function getBonusPartLabel (bonus, index, defaultValue = 10, defaultDifficulty = '') {
  const value = bonus.values ? (bonus.values[index] ?? defaultValue) : defaultValue;
  const difficulty = bonus.difficultyModifiers ? (bonus.difficultyModifiers[index] ?? defaultDifficulty) : defaultDifficulty;
  return `[${value}${difficulty}]`;
}

function rangeToArray (string, max = 0) {
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

export {
  arrayToRange,
  createBonusCard,
  createTossupCard,
  getBonusPartLabel,
  rangeToArray
};
