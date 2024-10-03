import account from '../scripts/accounts.js';
import questionStats from '../scripts/auth/question-stats.js';
import api from '../scripts/api/index.js';
import audio from '../audio/index.js';
import Timer from '../scripts/Timer.js';
import { arrayToRange, createTossupCard, rangeToArray } from '../scripts/utilities/index.js';
import CategoryManager from '../scripts/utilities/category-manager.js';
import { getDropdownValues } from '../scripts/utilities/dropdown-checklist.js';
import { insertTokensIntoHTML } from '../scripts/utilities/insert-tokens-into-html.js';
import CategoryModal from '../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../scripts/components/DifficultyDropdown.min.js';

// Functions and variables specific to the tossups page.

const ANSWER_TIME_LIMIT = 10;
const DEAD_TIME_LIMIT = 5;

// Status variables
let buzzpointIndex = -1;
let currentlyBuzzing = false;
let maxPacketNumber = 24;
let paused = false;
let questionNumber = 0; // WARNING: 1-indexed
const timer = new Timer();

/**
 * An array of random questions.
 * We get 20 random questions at a time so we don't have to make an HTTP request between every question.
 */
let randomTossups = [];
let timeoutID = -1;

let tossups = [{}];
let tossupText = '';
let tossupTextSplit = [];

const previous = {
  isCorrect: true,
  inPower: false,
  negValue: -5,
  powerValue: 15,
  endOfQuestion: false,
  celerity: 0
};

const stats = window.sessionStorage.getItem('tossup-stats')
  ? JSON.parse(window.sessionStorage.getItem('tossup-stats'))
  : {
      powers: 0,
      tens: 0,
      negs: 0,
      dead: 0,
      points: 0,
      totalCorrectCelerity: 0
    };

const defaults = {
  alternateSubcategories: [],
  categories: [],
  difficulties: [],
  minYear: 2010,
  maxYear: 2024,
  packetNumbers: [],
  powermarkOnly: false,
  setName: '',
  standardOnly: false,
  subcategories: [],
  version: '01-06-2024'
};

let query;
if (!window.localStorage.getItem('singleplayer-tossup-query')) {
  query = defaults;
} else {
  query = JSON.parse(window.localStorage.getItem('singleplayer-tossup-query'));
  if (query.version !== defaults.version) {
    query = defaults;
    window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
  }
}

const categoryManager = new CategoryManager(query.categories, query.subcategories, query.alternateSubcategories);

const settings = window.localStorage.getItem('singleplayer-tossup-settings')
  ? JSON.parse(window.localStorage.getItem('singleplayer-tossup-settings'))
  : {
      leniency: 7,
      readingSpeed: 50,
      rebuzz: false,
      selectBySetName: false,
      showHistory: true,
      timer: true,
      typeToAnswer: true
    };

// Load query and settings first so user doesn't see the default settings
if (settings.leniency) {
  document.getElementById('leniency-display').textContent = settings.leniency;
  document.getElementById('leniency').value = settings.leniency;
}
if (settings.readingSpeed) {
  document.getElementById('reading-speed-display').textContent = settings.readingSpeed;
  document.getElementById('reading-speed').value = settings.readingSpeed;
}

if (settings.rebuzz) {
  document.getElementById('toggle-rebuzz').checked = true;
}

if (settings.selectBySetName) {
  document.getElementById('difficulty-settings').classList.add('d-none');
  document.getElementById('set-settings').classList.remove('d-none');
  document.getElementById('toggle-select-by-set-name').checked = true;
  document.getElementById('toggle-powermark-only').disabled = true;
  document.getElementById('toggle-standard-only').disabled = true;
}

if (!settings.showHistory) {
  document.getElementById('toggle-show-history').checked = false;
  document.getElementById('room-history').classList.add('d-none');
}

if (!settings.timer) {
  document.getElementById('toggle-timer').checked = false;
  document.getElementById('timer').classList.add('d-none');
}

if (!settings.typeToAnswer) {
  document.getElementById('type-to-answer').checked = false;
  document.getElementById('toggle-rebuzz').disabled = true;
}

if (query.packetNumbers) {
  document.getElementById('packet-number').value = arrayToRange(query.packetNumbers);
}

if (query.powermarkOnly) {
  document.getElementById('toggle-powermark-only').checked = true;
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

updateStatDisplay();

function queryLock () {
  document.getElementById('question').textContent = 'Fetching questions...';
  document.getElementById('start').disabled = true;
  document.getElementById('next').disabled = true;
  document.getElementById('pause').disabled = true;
  document.getElementById('buzz').disabled = true;
}

function queryUnlock () {
  document.getElementById('question').textContent = '';
  document.getElementById('start').disabled = false;
  document.getElementById('next').disabled = false;
  document.getElementById('pause').disabled = false;
  document.getElementById('buzz').disabled = false;
}

/**
 * @returns {Promise<boolean>} Whether or not there is a next question
 */
async function advanceQuestion () {
  if (settings.selectBySetName) {
    // Get the next question if the current one is in the wrong category and subcategory
    do {
      questionNumber++;

      // Go to the next packet if you reach the end of this packet
      if (questionNumber > tossups.length) {
        query.packetNumbers.shift();
        if (query.packetNumbers.length === 0) {
          window.alert('No more questions left');
          document.getElementById('buzz').disabled = true;
          document.getElementById('pause').disabled = true;
          document.getElementById('next').disabled = true;
          return false; // alert the user if there are no more packets
        }

        queryLock();
        try {
          tossups = await api.getPacketTossups(query.setName, query.packetNumbers[0]);
        } finally {
          queryUnlock();
        }

        questionNumber = 1;
      }
    } while (!categoryManager.isValidCategory(tossups[questionNumber - 1]));

    if (Object.keys(tossups[0]).length > 0) {
      tossupText = tossups[questionNumber - 1].question_sanitized;
      tossupTextSplit = tossupText.split(' ').filter(word => word !== '');
      document.getElementById('question-number-info').textContent = questionNumber;
    }
  } else {
    queryLock();
    try {
      tossups = await getRandomTossup(query, categoryManager);
      tossups = [tossups];
    } finally {
      queryUnlock();
    }

    if (!tossups[0]) {
      window.alert('No questions found');
      return false;
    }

    query.setName = tossups[0].set.name;
    query.packetNumbers = [tossups[0].packet.number];

    tossupText = tossups[0].question_sanitized;
    tossupTextSplit = tossupText.split(' ').filter(word => word !== '');
    document.getElementById('question-number-info').textContent = tossups[0].number;
    questionNumber = 1;
  }

  return true;
}

/**
 * Called when the users buzzes.
 * The first "buzz" pauses the question, and the second "buzz" reveals the rest of the question
 * and updates the score.
 */
function buzz () {
  // Stop the question reading
  clearTimeout(timeoutID);
  currentlyBuzzing = true;
  if (audio.soundEffects) audio.buzz.play();

  buzzpointIndex = document.getElementById('question').textContent.length;
  if (!tossupTextSplit.includes('(*)') && tossupText.includes('(*)')) {
    buzzpointIndex += 3;
  }

  // Include buzzpoint
  document.getElementById('question').textContent += '(#) ';

  document.getElementById('buzz').textContent = 'Reveal';
  document.getElementById('next').disabled = true;
  document.getElementById('start').disabled = true;
  document.getElementById('pause').disabled = true;

  if (settings.timer) {
    timer.stopTimer();
    timer.startTimer(ANSWER_TIME_LIMIT, () => document.getElementById('answer-submit').click());
  }
}

/**
 * Clears user stats.
 */
function clearStats () {
  stats.powers = 0;
  stats.tens = 0;
  stats.negs = 0;
  stats.dead = 0;
  stats.points = 0;
  stats.totalCorrectCelerity = 0;

  updateStatDisplay();
  window.sessionStorage.removeItem('tossup-stats');
}

async function giveAnswer (givenAnswer) {
  currentlyBuzzing = false;

  const { directive, directedPrompt } = await api.checkAnswer(tossups[questionNumber - 1].answer, givenAnswer, settings.leniency);

  switch (directive) {
    case 'accept': {
      const points = updateScore(true);
      if (audio.soundEffects) {
        if (points > 10) {
          audio.power.play();
        } else {
          audio.correct.play();
        }
      }
      revealQuestion();
      break;
    }
    case 'reject':
      updateScore(false);
      if (audio.soundEffects) audio.incorrect.play();
      if (settings.rebuzz) {
        document.getElementById('buzz').disabled = false;
        document.getElementById('buzz').textContent = 'Buzz';
        document.getElementById('next').disabled = false;
        document.getElementById('pause').disabled = false;
        document.getElementById('start').disabled = false;
        readQuestion(Date.now());
      } else {
        revealQuestion();
      }
      break;
    case 'prompt':
      document.getElementById('answer-input-group').classList.remove('d-none');
      document.getElementById('answer-input').focus();
      document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
      break;
  }
}

function isPace (setName) {
  if (!setName) { return false; }

  return setName.includes('PACE');
}

async function loadRandomTossups ({ alternateSubcategories, categories, difficulties, maxYear, minYear, number = 1, powermarkOnly, standardOnly, subcategories } = {}) {
  randomTossups = [];
  randomTossups = await api.getRandomTossup({ alternateSubcategories, categories, difficulties, maxYear, minYear, number, powermarkOnly, standardOnly, subcategories });
}

/**
 * Get a random tossup.
 * @returns
 */
async function getRandomTossup ({ alternateSubcategories, categories, difficulties, minYear, maxYear, powermarkOnly, subcategories, standardOnly } = {}, categoryManager = null) {
  if (categoryManager?.percentView) {
    categories = [categoryManager.getRandomCategory()];
    subcategories = [];
    alternateSubcategories = [];
    await loadRandomTossups({ alternateSubcategories, categories, difficulties, maxYear, minYear, powermarkOnly, subcategories, standardOnly });
    return randomTossups.pop();
  }

  if (randomTossups.length === 0) {
    await loadRandomTossups({ alternateSubcategories, categories, difficulties, maxYear, minYear, number: 20, powermarkOnly, subcategories, standardOnly });
  }

  const randomQuestion = randomTossups.pop();

  // Begin loading the next batch of questions (asynchronously)
  if (randomTossups.length === 0) {
    loadRandomTossups({ alternateSubcategories, categories, difficulties, maxYear, minYear, number: 20, powermarkOnly, subcategories, standardOnly });
  }

  return randomQuestion;
}

async function next () {
  // Stop reading the current question:
  clearTimeout(timeoutID);
  currentlyBuzzing = false;
  if (settings.timer) {
    timer.stopTimer();
    timer.tenthsRemaining = 0;
    timer.updateDisplay();
  }

  if (await account.getUsername() && document.getElementById('answer').innerHTML) {
    const pointValue = previous.isCorrect ? (previous.inPower ? previous.powerValue : 10) : (previous.endOfQuestion ? 0 : previous.negValue);
    questionStats.recordTossup(tossups[questionNumber - 1], previous.isCorrect, pointValue, previous.celerity, false);
  }

  document.getElementById('answer').textContent = '';
  document.getElementById('question').textContent = '';
  document.getElementById('toggle-correct').textContent = 'I was wrong';
  document.getElementById('toggle-correct').classList.add('d-none');

  const hasNextQuestion = await advanceQuestion();

  if (!hasNextQuestion) {
    return;
  }

  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('next').textContent = 'Skip';
  document.getElementById('packet-number-info').textContent = query.packetNumbers[0];
  document.getElementById('packet-length-info').textContent = settings.selectBySetName ? tossups.length : '-';
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;
  document.getElementById('question').textContent = '';
  document.getElementById('set-name-info').textContent = query.setName;

  paused = false;
  readQuestion(Date.now());
}

/**
 * Toggles pausing or resuming the tossup.
 */
function pause () {
  if (paused) {
    document.getElementById('buzz').removeAttribute('disabled');
    document.getElementById('pause').textContent = 'Pause';
    readQuestion(Date.now());
  } else {
    document.getElementById('buzz').setAttribute('disabled', 'disabled');
    document.getElementById('pause').textContent = 'Resume';
    clearTimeout(timeoutID);
  }
  paused = !paused;
}

/**
 * Recursively reads the question based on the reading speed.
 */
function readQuestion (expectedReadTime) {
  if (!currentlyBuzzing && tossupTextSplit.length > 0) {
    const word = tossupTextSplit.shift();
    if (word !== '(*)') {
      document.getElementById('question').textContent += word + ' ';
    }

    // calculate time needed before reading next word
    let time = Math.log(word.length || 1) + 1;
    if ((word.endsWith('.') && word.charCodeAt(word.length - 2) > 96 && word.charCodeAt(word.length - 2) < 123) ||
            word.slice(-2) === '.\u201d' || word.slice(-2) === '!\u201d' || word.slice(-2) === '?\u201d') { time += 2; } else if (word.endsWith(',') || word.slice(-2) === ',\u201d') { time += 0.75; } else if (word === '(*)') { time = 0; }

    time = time * 0.9 * (125 - settings.readingSpeed);
    const delay = time - Date.now() + expectedReadTime;

    timeoutID = window.setTimeout(() => {
      readQuestion(time + expectedReadTime);
    }, delay);
  } else {
    document.getElementById('pause').disabled = true;
    if (settings.timer) {
      timer.startTimer(DEAD_TIME_LIMIT, revealQuestion);
    }
  }
}

function revealQuestion () {
  document.getElementById('question').innerHTML = insertTokensIntoHTML(tossups[questionNumber - 1].question, tossups[questionNumber - 1].question_sanitized, [[buzzpointIndex]], [' (#) ']);
  document.getElementById('answer').innerHTML = 'ANSWER: ' + tossups[questionNumber - 1].answer;

  document.getElementById('buzz').disabled = true;
  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('next').disabled = false;
  document.getElementById('next').textContent = 'Next';
  document.getElementById('start').disabled = false;

  document.getElementById('toggle-correct').classList.remove('d-none');
  document.getElementById('toggle-correct').textContent = previous.isCorrect ? 'I was wrong' : 'I was right';
}

function toggleCorrect () {
  const multiplier = previous.isCorrect ? -1 : 1;

  if (previous.inPower) {
    stats.powers += multiplier * 1;
    stats.points += multiplier * previous.powerValue;
  } else {
    stats.tens += multiplier * 1;
    stats.points += multiplier * 10;
  }

  if (previous.endOfQuestion) {
    stats.dead += multiplier * -1;
  } else {
    stats.negs += multiplier * -1;
    stats.points += multiplier * -previous.negValue;
  }

  stats.totalCorrectCelerity += multiplier * previous.celerity;

  previous.isCorrect = !previous.isCorrect;
  document.getElementById('toggle-correct').textContent = previous.isCorrect ? 'I was wrong' : 'I was right';

  updateStatDisplay();
  window.sessionStorage.setItem('tossup-stats', JSON.stringify(stats));
}

function updateScore (isCorrect) {
  const endOfQuestion = (tossupTextSplit.length === 0);
  const inPower = tossupTextSplit.includes('(*)') && tossupText.includes('(*)');
  const powerValue = isPace(query.setName) ? 20 : 15;
  const negValue = isPace(query.setName) ? 0 : -5;
  const points = isCorrect ? (inPower ? powerValue : 10) : (endOfQuestion ? 0 : negValue);

  const characterCount = tossupTextSplit.join(' ').length;
  const celerity = characterCount / tossupText.length;

  let result;

  if (isCorrect) {
    result = inPower ? 'powers' : 'tens';
    stats.totalCorrectCelerity += celerity;
  } else {
    result = endOfQuestion ? 'dead' : 'negs';
  }

  stats[result] += 1;
  stats.points += points;

  previous.celerity = celerity;
  previous.endOfQuestion = endOfQuestion;
  previous.inPower = inPower;
  previous.negValue = negValue;
  previous.powerValue = powerValue;
  previous.isCorrect = isCorrect;

  updateStatDisplay();
  window.sessionStorage.setItem('tossup-stats', JSON.stringify(stats));

  return points;
}

/**
 * Updates the displayed stat line.
 */
function updateStatDisplay () {
  const { powers, tens, negs, dead, points, totalCorrectCelerity } = stats;
  const numTossups = powers + tens + negs + dead;
  const numCorrectTossups = powers + tens;
  let celerity = numCorrectTossups === 0 ? 0 : parseFloat(totalCorrectCelerity) / numCorrectTossups;
  celerity = Math.round(1000 * celerity) / 1000;
  const includePlural = (numTossups === 1) ? '' : 's';
  document.getElementById('statline').innerHTML =
        `${powers}/${tens}/${negs} with ${numTossups} tossup${includePlural} seen (${points} pts, celerity: ${celerity})`;

  // disable clear stats button if no stats
  document.getElementById('clear-stats').disabled = (numTossups === 0);
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  if (settings.timer) {
    timer.stopTimer();
    timer.tenthsRemaining = 0;
    timer.updateDisplay();
  }

  const answer = document.getElementById('answer-input').value;

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');

  giveAnswer(answer);
});

document.getElementById('buzz').addEventListener('click', function () {
  this.blur();

  // reveal answer on second click
  // when NOT using type to answer
  if (currentlyBuzzing) {
    currentlyBuzzing = false;
    updateScore(true);
    revealQuestion();
    return;
  }

  buzz();

  if (settings.typeToAnswer) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    this.disabled = true;
  }
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  clearStats();
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  createTossupCard(tossups[questionNumber - 1]);
  next();
});

document.getElementById('packet-number').addEventListener('change', function () {
  // if field is blank, store blank result in `query`
  query.packetNumbers = rangeToArray(this.value.trim(), 0);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
  query.packetNumbers = rangeToArray(this.value.trim(), maxPacketNumber);
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  pause();
});

document.getElementById('reading-speed').addEventListener('input', function () {
  settings.readingSpeed = this.value;
  document.getElementById('reading-speed-display').textContent = this.value;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('leniency').addEventListener('input', function () {
  settings.leniency = this.value;
  document.getElementById('leniency-display').textContent = this.value;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
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

  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
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
      tossups = await api.getPacketTossups(query.setName, query.packetNumbers[0]);
    } finally {
      queryUnlock();
    }
  }

  next();
});

document.getElementById('toggle-correct').addEventListener('click', function () {
  this.blur();
  toggleCorrect();
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
  this.blur();
  query.powermarkOnly = this.checked;
  loadRandomTossups(query);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});

document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
  this.blur();
  settings.selectBySetName = this.checked;
  document.getElementById('toggle-powermark-only').disabled = this.checked;
  document.getElementById('toggle-standard-only').disabled = this.checked;

  if (this.checked) {
    document.getElementById('difficulty-settings').classList.add('d-none');
    document.getElementById('set-settings').classList.remove('d-none');
  } else {
    document.getElementById('difficulty-settings').classList.remove('d-none');
    document.getElementById('set-settings').classList.add('d-none');
  }

  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('toggle-show-history').addEventListener('click', function () {
  this.blur();
  settings.showHistory = this.checked;

  if (this.checked) {
    document.getElementById('room-history').classList.remove('d-none');
  } else {
    document.getElementById('room-history').classList.add('d-none');
  }

  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  query.standardOnly = this.checked;
  loadRandomTossups(query);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
});

document.getElementById('toggle-timer').addEventListener('click', function () {
  this.blur();
  settings.timer = this.checked;
  document.getElementById('timer').classList.toggle('d-none');
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('type-to-answer').addEventListener('click', function () {
  this.blur();
  settings.typeToAnswer = this.checked;
  document.getElementById('leniency').disabled = !this.checked;
  document.getElementById('leniency-display').disabled = !this.checked;
  document.getElementById('toggle-rebuzz').disabled = !this.checked;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
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

document.getElementById('toggle-rebuzz').addEventListener('click', function () {
  this.blur();
  settings.rebuzz = this.checked;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify(settings));
});

document.getElementById('year-range-a').onchange = function () {
  query.minYear = $('#slider').slider('values', 0);
  query.maxYear = $('#slider').slider('values', 1);
  loadRandomTossups(query);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
};

document.getElementById('year-range-b').onchange = function () {
  query.minYear = $('#slider').slider('values', 0);
  query.maxYear = $('#slider').slider('values', 1);
  loadRandomTossups(query);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
};

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page:
      if (event.target === document.body) event.preventDefault();
      break;
    case 'e':
      document.getElementById('toggle-settings').click();
      break;
    case 'k':
      document.getElementsByClassName('card-header-clickable')[0].click();
      break;
    case 't':
      document.getElementsByClassName('star-tossup')[0].click();
      break;
    case 'y':
      navigator.clipboard.writeText(tossups[0]?._id ?? '');
      break;
    case 'n':
      document.getElementById('next').click();
      break;
    case 'p':
      document.getElementById('pause').click();
      break;
    case 's':
      document.getElementById('start').click();
      break;
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
      loadRandomTossups(query);
      window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={query.difficulties}
    onChange={() => {
      query.difficulties = getDropdownValues('difficulties');
      loadRandomTossups(query);
      window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify(query));
    }}
  />
);
