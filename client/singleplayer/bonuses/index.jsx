import account from '../../scripts/accounts.js';
import questionStats from '../../scripts/auth/question-stats.js';
import api from '../../scripts/api/index.js';
import audio from '../../audio/index.js';
import { arrayToRange, createBonusCard, rangeToArray } from '../../scripts/utilities/index.js';
import CategoryManager from '../../../quizbowl/category-manager.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.min.js';

// Functions and variables specific to the bonuses page.

// Status variables
let currentBonusPart = -1;
let maxPacketNumber = 24;
let questionNumber = 0; // WARNING: 1-indexed
/**
 * An array of random questions.
 * We get 20 random questions at a time so we don't have to make an HTTP request between every question.
 */
let randomBonuses = [];

let bonuses = [{}];

const stats = window.sessionStorage.getItem('bonus-stats')
  ? JSON.parse(window.sessionStorage.getItem('bonus-stats'))
  : {
      0: 0,
      10: 0,
      20: 0,
      30: 0
    };

const defaults = {
  alternateSubcategories: [],
  categories: [],
  difficulties: [],
  minYear: 2010,
  maxYear: 2024,
  packetNumbers: [],
  setName: '',
  subcategories: [],
  threePartBonuses: true,
  version: '01-06-2024'
};

// Room settings
let query;
if (!window.localStorage.getItem('singleplayer-bonus-query')) {
  query = defaults;
} else {
  query = JSON.parse(window.localStorage.getItem('singleplayer-bonus-query'));
  if (query.version !== defaults.version) {
    query = defaults;
    window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
  }
}

const categoryManager = new CategoryManager(query.categories, query.subcategories, query.alternateSubcategories);

const settings = window.localStorage.getItem('singleplayer-bonus-settings')
  ? JSON.parse(window.localStorage.getItem('singleplayer-bonus-settings'))
  : {
      selectBySetName: false,
      showHistory: true,
      typeToAnswer: true
    };

// Load query and settings first so user doesn't see the default settings
if (settings.selectBySetName) {
  document.getElementById('difficulty-settings').classList.add('d-none');
  document.getElementById('set-settings').classList.remove('d-none');
  document.getElementById('toggle-select-by-set-name').checked = true;
  document.getElementById('toggle-standard-only').disabled = true;
  document.getElementById('toggle-three-part-bonuses').disabled = true;
}

if (!settings.showHistory) {
  document.getElementById('toggle-show-history').checked = false;
  document.getElementById('room-history').classList.add('d-none');
}

if (!settings.typeToAnswer) {
  document.getElementById('type-to-answer').checked = false;
}

if (query.packetNumbers) {
  document.getElementById('packet-number').value = arrayToRange(query.packetNumbers);
}

if (query.setName) {
  document.getElementById('set-name').value = query.setName;
  api.getNumPackets(query.setName).then(numPackets => {
    maxPacketNumber = numPackets;
    if (maxPacketNumber === 0) {
      document.getElementById('set-name').classList.add('is-invalid');
    } else {
      document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
    }
  });
}

if (!query.threePartBonuses) {
  document.getElementById('toggle-three-part-bonuses').checked = false;
}

updateStatDisplay();

function queryLock () {
  document.getElementById('question').textContent = 'Fetching questions...';
  document.getElementById('start').disabled = true;
  document.getElementById('next').disabled = true;
  document.getElementById('reveal').disabled = true;
}

function queryUnlock () {
  document.getElementById('question').textContent = '';
  document.getElementById('start').disabled = false;
  document.getElementById('next').disabled = false;
  document.getElementById('reveal').disabled = false;
}

async function advanceQuestion () {
  if (settings.selectBySetName) {
    do { // Get the next question
      questionNumber++;

      // Go to the next packet if you reach the end of this packet
      if (questionNumber > bonuses.length) {
        query.packetNumbers.shift();
        if (query.packetNumbers.length === 0) {
          window.alert('No more questions left');
          document.getElementById('reveal').disabled = true;
          document.getElementById('next').disabled = true;
          return false;
        }

        queryLock();
        try {
          bonuses = await api.getPacketBonuses(query.setName, query.packetNumbers[0]);
        } finally {
          queryUnlock();
        }

        questionNumber = 1;
      }

      // Get the next question if the current one is in the wrong category and subcategory
    } while (!categoryManager.isValidCategory(bonuses[questionNumber - 1]));

    if (Object.keys(bonuses[0]).length > 0) {
      document.getElementById('question-number-info').textContent = questionNumber;
    }
  } else {
    queryLock();
    try {
      bonuses = await getRandomBonus(query);
      bonuses = [bonuses];
    } finally {
      queryUnlock();
    }

    if (!bonuses[0]) {
      window.alert('No questions found');
      return false;
    }

    query.setName = bonuses[0].set.name;
    query.packetNumbers = [bonuses[0].packet.number];
    document.getElementById('question-number-info').textContent = bonuses[0].number;
    questionNumber = 1;
  }

  return true;
}

/**
 * Clears user stats.
 */
function clearStats () {
  stats[0] = 0;
  stats[10] = 0;
  stats[20] = 0;
  stats[30] = 0;

  updateStatDisplay();
  window.sessionStorage.removeItem('bonus-stats');
}

function createBonusPart (bonusPartNumber, bonusText, value = 10) {
  const input = document.createElement('input');
  input.id = `checkbox-${bonusPartNumber + 1}`;
  input.className = 'checkbox form-check-input rounded-0 me-1';
  input.type = 'checkbox';
  input.style = 'width: 20px; height: 20px; cursor: pointer';
  input.addEventListener('click', function () {
    this.blur();
  });

  const inputWrapper = document.createElement('label');
  inputWrapper.style = 'cursor: pointer';
  inputWrapper.appendChild(input);

  const p = document.createElement('p');
  p.innerHTML = `[${value}] ${bonusText}`;

  const bonusPart = document.createElement('div');
  bonusPart.id = `bonus-part-${bonusPartNumber + 1}`;
  bonusPart.appendChild(p);

  const row = document.createElement('div');
  row.className = 'd-flex';
  row.appendChild(inputWrapper);
  row.appendChild(bonusPart);

  document.getElementById('question').appendChild(row);
}

function createLeadin (leadinText) {
  const paragraph = document.createElement('p');
  paragraph.id = 'leadin';
  paragraph.innerHTML = leadinText;
  document.getElementById('question').appendChild(paragraph);
}

function getPointsPerPart (bonus) {
  return Array.from(document.getElementsByClassName('checkbox')).map((checkbox, index) => {
    if (!checkbox.checked) {
      return 0;
    }

    if (bonus?.values === undefined || bonus?.values === null || bonus?.values[index] === undefined || bonus?.values[index] === null) {
      return 10;
    }

    return bonus.values[index];
  });
}

async function getRandomBonus ({ alternateSubcategories, categories, difficulties, minYear, maxYear, subcategories, threePartBonuses }) {
  if (categoryManager?.percentView) {
    categories = [categoryManager.getRandomCategory()];
    subcategories = [];
    alternateSubcategories = [];
    await loadRandomBonuses({ alternateSubcategories, categories, difficulties, maxYear, minYear, subcategories, threePartBonuses });
    return randomBonuses.pop();
  }

  if (randomBonuses.length === 0) {
    await loadRandomBonuses({ alternateSubcategories, categories, difficulties, minYear, maxYear, number: 20, subcategories, threePartBonuses });
  }

  const randomQuestion = randomBonuses.pop();

  // Begin loading the next batch of questions (asynchronously)
  if (randomBonuses.length === 0) {
    loadRandomBonuses({ alternateSubcategories, categories, difficulties, minYear, maxYear, number: 20, subcategories, threePartBonuses });
  }

  return randomQuestion;
}

async function giveAnswer (givenAnswer) {
  const { directive, directedPrompt } = await api.checkAnswer(bonuses[questionNumber - 1].answers[currentBonusPart], givenAnswer);

  switch (directive) {
    case 'accept':
      document.getElementById(`checkbox-${currentBonusPart + 1}`).checked = true;
      document.getElementById('reveal').disabled = false;
      revealBonusPart();
      if (audio.soundEffects) {
        audio.correct.play();
      }
      break;
    case 'reject':
      document.getElementById('reveal').disabled = false;
      revealBonusPart();
      if (audio.soundEffects) {
        audio.incorrect.play();
      }
      break;
    case 'prompt':
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
      document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
  }
}

async function loadRandomBonuses ({ alternateSubcategories, categories, difficulties, maxYear, minYear, number = 1, subcategories, threePartBonuses }) {
  randomBonuses = [];
  randomBonuses = await api.getRandomBonus({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, subcategories, threePartBonuses });
}

/**
 * Loads and reads the next question.
 * @param {boolean} revealedAllParts - Whether all parts of the bonus have been revealed. if true, then question stats are uploaded to the server.
 */
async function next (revealedAllParts) {
  if (revealedAllParts && await account.getUsername()) {
    const pointsPerPart = getPointsPerPart(bonuses[questionNumber - 1]);
    questionStats.recordBonus(bonuses[questionNumber - 1], pointsPerPart);
  }

  document.getElementById('question').textContent = '';
  document.getElementById('reveal').disabled = false;
  document.getElementById('next').textContent = 'Skip';

  const hasNextQuestion = await advanceQuestion();

  if (!hasNextQuestion) {
    return;
  }

  document.getElementById('set-name-info').textContent = query.setName;
  document.getElementById('packet-number-info').textContent = query.packetNumbers[0];
  document.getElementById('packet-length-info').textContent = settings.selectBySetName ? bonuses.length : '-';

  currentBonusPart = 0;
  createLeadin(bonuses[questionNumber - 1].leadin);
  createBonusPart(currentBonusPart, bonuses[questionNumber - 1].parts[currentBonusPart], bonuses[questionNumber - 1].values?.at(currentBonusPart));
}

/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealBonusPart () {
  if (currentBonusPart >= bonuses[questionNumber - 1].parts.length) {
    return;
  }

  const paragraph = document.createElement('p');
  paragraph.innerHTML = 'ANSWER: ' + bonuses[questionNumber - 1].answers[currentBonusPart];
  document.getElementById(`bonus-part-${currentBonusPart + 1}`).appendChild(paragraph);
  currentBonusPart++;

  if (currentBonusPart >= bonuses[questionNumber - 1].parts.length) {
    document.getElementById('reveal').disabled = true;
    document.getElementById('next').textContent = 'Next';
    return;
  }

  createBonusPart(currentBonusPart, bonuses[questionNumber - 1].parts[currentBonusPart], bonuses[questionNumber - 1].values?.at(currentBonusPart));
}

/**
 * Calculates the points per bonus and updates the display.
 */
function updateStatDisplay () {
  const numBonuses = stats[0] + stats[10] + stats[20] + stats[30];
  const points = 30 * stats[30] + 20 * stats[20] + 10 * stats[10];
  const ppb = Math.round(100 * points / numBonuses) / 100 || 0;

  const includePlural = (numBonuses === 1) ? '' : 'es';
  document.getElementById('statline').textContent =
        `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${stats[30]}/${stats[20]}/${stats[10]}/${stats[0]}, ${points} pts)`;
}

function updateStatsForCurrentBonus () {
  const pointsOnBonus = getPointsPerPart(bonuses[questionNumber - 1]).reduce((a, b) => a + b, 0);
  stats[pointsOnBonus] = isNaN(stats[pointsOnBonus]) ? 1 : stats[pointsOnBonus] + 1;
  window.sessionStorage.setItem('bonus-stats', JSON.stringify(stats));
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const answer = document.getElementById('answer-input').value;

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');

  giveAnswer(answer);
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  clearStats();
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  createBonusCard(bonuses[questionNumber - 1]);

  const revealedAllParts = this.innerHTML === 'Next';

  if (revealedAllParts) {
    updateStatsForCurrentBonus();
    updateStatDisplay();
  }

  next(revealedAllParts);
});

document.getElementById('packet-number').addEventListener('change', function () {
  // if field is blank, store blank result in `query`
  query.packetNumbers = rangeToArray(this.value.trim(), 0);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
  query.packetNumbers = rangeToArray(this.value.trim(), maxPacketNumber);
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('reveal').addEventListener('click', function () {
  this.blur();
  if (document.getElementById('type-to-answer').checked) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    this.disabled = true;
  } else {
    revealBonusPart();
  }
});

document.getElementById('set-name').addEventListener('change', async function () {
  query.setName = this.value.trim();

  // make border red if set name is not in set list
  if (api.getSetList().includes(this.value) || this.value.length === 0) {
    this.classList.remove('is-invalid');
  } else {
    this.classList.add('is-invalid');
  }

  maxPacketNumber = await api.getNumPackets(this.value);

  if (this.value === '' || maxPacketNumber === 0) {
    document.getElementById('packet-number').placeholder = 'Packet Numbers';
  } else {
    document.getElementById('packet-number').placeholder = `Packet Numbers (1-${maxPacketNumber})`;
  }

  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});

document.getElementById('start').addEventListener('click', async function () {
  this.blur();
  if (query.setName.length === 0 && settings.selectBySetName) {
    window.alert('Please enter a set name.');
    return false;
  }

  if (query.packetNumbers.length === 0 && settings.selectBySetName) {
    query.packetNumbers = rangeToArray(document.getElementById('packet-number').value.trim(), maxPacketNumber);
  }

  document.getElementById('next').disabled = false;
  document.getElementById('next').textContent = 'Skip';
  document.getElementById('settings').classList.add('d-none');

  if (settings.selectBySetName) {
    queryLock();
    questionNumber = 0;
    try {
      bonuses = await api.getPacketBonuses(query.setName, query.packetNumbers[0]);
    } finally {
      queryUnlock();
    }
  }

  next(false);
});

document.getElementById('toggle-settings').addEventListener('click', function () {
  this.blur();
  document.getElementById('buttons').classList.toggle('col-lg-9');
  document.getElementById('buttons').classList.toggle('col-lg-12');
  document.getElementById('content').classList.toggle('col-lg-9');
  document.getElementById('content').classList.toggle('col-lg-12');
  document.getElementById('settings').classList.toggle('d-none');
  document.getElementById('settings').classList.toggle('d-lg-none');
});

document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
  this.blur();
  settings.selectBySetName = this.checked;
  document.getElementById('toggle-standard-only').disabled = this.checked;
  document.getElementById('toggle-three-part-bonuses').disabled = this.checked;

  if (this.checked) {
    document.getElementById('difficulty-settings').classList.add('d-none');
    document.getElementById('set-settings').classList.remove('d-none');
  } else {
    document.getElementById('difficulty-settings').classList.remove('d-none');
    document.getElementById('set-settings').classList.add('d-none');
  }

  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});

document.getElementById('toggle-show-history').addEventListener('click', function () {
  this.blur();
  settings.showHistory = this.checked;

  if (this.checked) {
    document.getElementById('room-history').classList.remove('d-none');
  } else {
    document.getElementById('room-history').classList.add('d-none');
  }

  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  query.standardOnly = this.checked;
  loadRandomBonuses(query);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});

document.getElementById('toggle-three-part-bonuses').addEventListener('click', function () {
  this.blur();
  query.threePartBonuses = this.checked;
  loadRandomBonuses(query);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
});

document.getElementById('type-to-answer').addEventListener('click', function () {
  this.blur();
  settings.typeToAnswer = this.checked;
  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify(settings));
});

document.getElementById('year-range-a').onchange = function () {
  query.minYear = $('#slider').slider('values', 0);
  query.maxYear = $('#slider').slider('values', 1);
  loadRandomBonuses(query);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
};

document.getElementById('year-range-b').onchange = function () {
  query.minYear = $('#slider').slider('values', 0);
  query.maxYear = $('#slider').slider('values', 1);
  loadRandomBonuses(query);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
};

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) { return; }

  switch (event.key?.toLowerCase()) {
    case ' ':
      document.getElementById('reveal').click();
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'e': return document.getElementById('toggle-settings').click();
    case 'k': return document.getElementsByClassName('card-header-clickable')[0].click();
    case 'n': return document.getElementById('next').click();
    case 's': return document.getElementById('start').click();
    case 't': return document.getElementsByClassName('star-bonus')[0].click();
    case 'y': return navigator.clipboard.writeText(bonuses[0]?._id ?? '');
    case '0': return document.getElementById(`checkbox-${currentBonusPart}`).click();
    case '1': return document.getElementById('checkbox-1').click();
    case '2': return document.getElementById('checkbox-2').click();
    case '3': return document.getElementById('checkbox-3').click();
    case '4': return document.getElementById('checkbox-4').click();
  }
});

$(document).ready(function () {
  $('#slider').slider('values', 0, query.minYear);
  $('#slider').slider('values', 1, query.maxYear);
});
document.getElementById('year-range-a').textContent = query.minYear;
document.getElementById('year-range-b').textContent = query.maxYear;

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={categoryManager}
    onClose={() => {
      ({ categories: query.categories, subcategories: query.subcategories, alternateSubcategories: query.alternateSubcategories } = categoryManager.export());
      loadRandomBonuses(query);
      window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify(query));
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={query.difficulties}
    onChange={() => {
      query.difficulties = getDropdownValues('difficulties');
      loadRandomBonuses(query);
      window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    }}
  />
);
