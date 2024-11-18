import api from '../../scripts/api/index.js';
import questionStats from '../../scripts/auth/question-stats.js';
import audio from '../../audio/index.js';
import Player from '../../../quizbowl/Player.js';
import ClientTossupRoom from '../ClientTossupRoom.js';
import { arrayToRange, createTossupCard, rangeToArray } from '../../scripts/utilities/index.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.min.js';
import upsertPlayerItem from '../../scripts/upsertPlayerItem.js';
import aiBots from '../ai-mode/ai-bots.js';
import AIBot from '../ai-mode/AIBot.js';

let maxPacketNumber = 24;

const queryVersion = '2024-10-11';
const settingsVersion = '2024-10-16';
const USER_ID = 'user';

const room = new ClientTossupRoom();
room.players[USER_ID] = new Player(USER_ID);
const aiBot = new AIBot(room);
aiBot.setAIBot(aiBots['right-after-power'][0]);
aiBot.active = false;

const socket = {
  send: onmessage,
  sendToServer: (message) => room.message(USER_ID, message)
};
room.sockets[USER_ID] = socket;

function onmessage (message) {
  const data = JSON.parse(message);
  switch (data.type) {
    case 'buzz': return buzz(data);
    case 'clear-stats': return clearStats(data);
    case 'end-of-set': return endOfSet(data);
    case 'give-answer': return giveAnswer(data);
    case 'next': return next(data);
    case 'no-questions-found': return noQuestionsFound(data);
    case 'pause': return pause(data);
    case 'reveal-answer': return revealAnswer(data);
    case 'set-categories': return setCategories(data);
    case 'set-difficulties': return setDifficulties(data);
    case 'set-strictness': return setStrictness(data);
    case 'set-reading-speed': return setReadingSpeed(data);
    case 'set-packet-numbers': return setPacketNumbers(data);
    case 'set-set-name': return setSetName(data);
    case 'set-year-range': return setYearRange(data);
    case 'skip': return next(data);
    case 'start': return next(data);
    case 'timer-update': return updateTimerDisplay(data.timeRemaining);
    case 'toggle-ai-mode': return toggleAiMode(data);
    case 'toggle-correct': return toggleCorrect(data);
    case 'toggle-powermark-only': return togglePowermarkOnly(data);
    case 'toggle-rebuzz': return toggleRebuzz(data);
    case 'toggle-select-by-set-name': return toggleSelectBySetName(data);
    case 'toggle-show-history': return toggleShowHistory(data);
    case 'toggle-standard-only': return toggleStandardOnly(data);
    case 'toggle-timer': return toggleTimer(data);
    case 'toggle-type-to-answer': return toggleTypeToAnswer(data);
    case 'update-question': return updateQuestion(data);
  }
}

function buzz ({ timer, userId, username }) {
  if (audio.soundEffects) { audio.buzz.play(); }
  if (userId !== USER_ID) { return; }

  const typeToAnswer = document.getElementById('type-to-answer').checked;
  if (typeToAnswer) {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('buzz').disabled = true;
  }
}

function clearStats ({ userId }) {
  updateStatDisplay(room.players[userId]);
}

function endOfSet () {
  window.alert('No more questions left');
  document.getElementById('buzz').disabled = true;
  document.getElementById('pause').disabled = true;
  document.getElementById('next').disabled = true;
}

async function giveAnswer ({ directive, directedPrompt, perQuestionCelerity, score, tossup, userId }) {
  if (directive === 'prompt') {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    return;
  }

  if (userId === USER_ID) {
    updateStatDisplay(room.players[USER_ID]);
  } else if (aiBot.active) {
    upsertPlayerItem(aiBot.player);
  }

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');
  document.getElementById('next').disabled = false;
  document.getElementById('pause').disabled = false;
  if (room.settings.rebuzz) {
    document.getElementById('buzz').disabled = false;
    document.getElementById('buzz').textContent = 'Buzz';
  }

  if (audio.soundEffects && userId === USER_ID) {
    if (directive === 'accept' && score > 10) {
      audio.power.play();
    } else if (directive === 'accept' && score === 10) {
      audio.correct.play();
    } else if (directive === 'reject') {
      audio.incorrect.play();
    }
  }
}

async function next ({ packetLength, oldTossup, tossup: nextTossup, type }) {
  if (type === 'start') {
    document.getElementById('next').disabled = false;
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('settings').classList.add('d-none');
  }

  if (type === 'next' || type === 'skip') {
    createTossupCard(oldTossup);
  }

  document.getElementById('answer').textContent = '';
  document.getElementById('question').textContent = '';
  document.getElementById('toggle-correct').textContent = 'I was wrong';
  document.getElementById('toggle-correct').classList.add('d-none');

  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('buzz').disabled = false;
  document.getElementById('next').textContent = 'Skip';
  document.getElementById('packet-number-info').textContent = nextTossup.packet.number;
  document.getElementById('packet-length-info').textContent = room.query.selectBySetName ? packetLength : '-';
  document.getElementById('pause').textContent = 'Pause';
  document.getElementById('pause').disabled = false;
  document.getElementById('question-number-info').textContent = nextTossup.number;
  document.getElementById('set-name-info').textContent = nextTossup.set.name;

  if (type === 'next' && room.previous.userId === USER_ID) {
    const pointValue = room.previous.isCorrect ? (room.previous.inPower ? room.previous.powerValue : 10) : (room.previous.endOfQuestion ? 0 : room.previous.negValue);
    questionStats.recordTossup(room.previous.tossup, room.previous.isCorrect, pointValue, room.previous.celerity, false);
  }
}

function noQuestionsFound () {
  window.alert('No questions found');
}

function pause ({ paused }) {
  document.getElementById('buzz').disabled = paused;
  document.getElementById('pause').textContent = paused ? 'Resume' : 'Pause';
}

function revealAnswer ({ answer, question }) {
  document.getElementById('question').innerHTML = question;
  document.getElementById('answer').innerHTML = 'ANSWER: ' + answer;
  document.getElementById('pause').disabled = true;

  document.getElementById('buzz').disabled = true;
  document.getElementById('buzz').textContent = 'Buzz';
  document.getElementById('next').disabled = false;
  document.getElementById('next').textContent = 'Next';
  document.getElementById('start').disabled = false;

  document.getElementById('toggle-correct').classList.remove('d-none');
  document.getElementById('toggle-correct').textContent = room.previous.isCorrect ? 'I was wrong' : 'I was right';
}

function setCategories ({ alternateSubcategories, categories, subcategories, percentView, categoryPercents }) {
  room.categoryManager.loadCategoryModal();
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setDifficulties ({ difficulties }) {
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setStrictness ({ strictness }) {
  document.getElementById('strictness').value = strictness;
  document.getElementById('strictness-display').textContent = strictness;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function setPacketNumbers ({ packetNumbers }) {
  document.getElementById('packet-number').value = arrayToRange(packetNumbers);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setReadingSpeed ({ readingSpeed }) {
  document.getElementById('reading-speed').value = readingSpeed;
  document.getElementById('reading-speed-display').textContent = readingSpeed;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

async function setSetName ({ setName, setLength }) {
  document.getElementById('set-name').value = setName;
  // make border red if set name is not in set list
  const valid = !setName || api.getSetList().includes(setName);
  document.getElementById('set-name').classList.toggle('is-invalid', !valid);
  maxPacketNumber = setLength;
  document.getElementById('packet-number').placeholder = 'Packet Numbers' + (maxPacketNumber ? ` (1-${maxPacketNumber})` : '');
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setYearRange ({ minYear, maxYear }) {
  $('#slider').slider('values', [minYear, maxYear]);
  document.getElementById('year-range-a').textContent = minYear;
  document.getElementById('year-range-b').textContent = maxYear;
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function toggleAiMode ({ aiMode }) {
  if (aiMode) { upsertPlayerItem(aiBot.player); }

  aiBot.active = aiMode;
  document.getElementById('ai-settings').disabled = !aiMode;
  document.getElementById('toggle-ai-mode').checked = aiMode;
  document.getElementById('player-list-group').classList.toggle('d-none', !aiMode);
  document.getElementById('player-list-group-hr').classList.toggle('d-none', !aiMode);
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleCorrect ({ correct, userId }) {
  updateStatDisplay(room.players[USER_ID]);
  document.getElementById('toggle-correct').textContent = correct ? 'I was wrong' : 'I was right';
}

function togglePowermarkOnly ({ powermarkOnly }) {
  document.getElementById('toggle-powermark-only').checked = powermarkOnly;
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function toggleRebuzz ({ rebuzz }) {
  document.getElementById('toggle-rebuzz').checked = rebuzz;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleSelectBySetName ({ selectBySetName }) {
  document.getElementById('difficulty-settings').classList.toggle('d-none', selectBySetName);
  document.getElementById('toggle-powermark-only').disabled = selectBySetName;
  document.getElementById('toggle-select-by-set-name').checked = selectBySetName;
  document.getElementById('toggle-standard-only').disabled = selectBySetName;
  document.getElementById('set-settings').classList.toggle('d-none', !selectBySetName);
  window.localStorage.setItem('singleplayer-tossup-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function toggleShowHistory ({ showHistory }) {
  document.getElementById('room-history').classList.toggle('d-none', !showHistory);
  document.getElementById('toggle-show-history').checked = showHistory;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleStandardOnly ({ standardOnly }) {
  document.getElementById('toggle-standard-only').checked = standardOnly;
}

function toggleTimer ({ timer }) {
  document.getElementById('timer').classList.toggle('d-none', !timer);
  document.getElementById('toggle-timer').checked = timer;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleTypeToAnswer ({ typeToAnswer }) {
  document.getElementById('type-to-answer').checked = typeToAnswer;
  window.localStorage.setItem('singleplayer-tossup-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function updateQuestion ({ word }) {
  if (word === '(*)') { return; }
  document.getElementById('question').innerHTML += word + ' ';
}

/**
 * Updates the displayed stat line.
 */
function updateStatDisplay ({ powers, tens, negs, tuh, points, celerity }) {
  const averageCelerity = celerity.correct.average.toFixed(3);
  const plural = (tuh === 1) ? '' : 's';
  document.getElementById('statline').innerHTML = `${powers}/${tens}/${negs} with ${tuh} tossup${plural} seen (${points} pts, celerity: ${averageCelerity})`;

  // disable clear stats button if no stats
  document.getElementById('clear-stats').disabled = (tuh === 0);
}

function updateTimerDisplay (time) {
  const seconds = Math.floor(time / 10);
  const tenths = time % 10;
  document.querySelector('.timer .face').innerText = seconds;
  document.querySelector('.timer .fraction').innerText = '.' + tenths;
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();
  const answer = document.getElementById('answer-input').value;
  socket.sendToServer({ type: 'give-answer', givenAnswer: answer });
});

document.getElementById('buzz').addEventListener('click', function () {
  this.blur();
  if (audio.soundEffects) audio.buzz.play();
  socket.sendToServer({ type: 'buzz' });
});

document.getElementById('choose-ai').addEventListener('change', function () {
  const prefix = 'ai-choice-';
  const choice = this.querySelector('input:checked').id.slice(prefix.length);
  aiBot.setAIBot(aiBots[choice][0]);
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'clear-stats' });
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  if (this.innerHTML === 'Skip') {
    socket.sendToServer({ type: 'skip' });
  } else {
    socket.sendToServer({ type: 'next' });
  }
});

document.getElementById('packet-number').addEventListener('change', function () {
  const range = rangeToArray(this.value.trim(), maxPacketNumber);
  const invalid = range.some(num => num < 1 || num > maxPacketNumber);
  if (invalid) {
    document.getElementById('packet-number').classList.add('is-invalid');
    return;
  }

  document.getElementById('packet-number').classList.remove('is-invalid');
  socket.sendToServer({ type: 'set-packet-numbers', packetNumbers: range });
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  const seconds = parseFloat(document.querySelector('.timer .face').innerText);
  const tenths = parseFloat(document.querySelector('.timer .fraction').innerText);
  const pausedTime = (seconds + tenths) * 10;
  socket.sendToServer({ type: 'pause', pausedTime });
});

document.getElementById('reading-speed').addEventListener('change', function () {
  socket.sendToServer({ type: 'set-reading-speed', readingSpeed: this.value });
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('set-name').addEventListener('change', async function () {
  socket.sendToServer({ type: 'set-set-name', setName: this.value.trim() });
});

document.getElementById('start').addEventListener('click', function () {
  socket.sendToServer({ type: 'start' });
});

document.getElementById('strictness').addEventListener('change', function () {
  this.blur();
  socket.sendToServer({ type: 'set-strictness', strictness: this.value });
});

document.getElementById('strictness').addEventListener('input', function () {
  document.getElementById('strictness-display').textContent = this.value;
});

document.getElementById('toggle-ai-mode').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-ai-mode', aiMode: this.checked });
});

document.getElementById('toggle-correct').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-correct', correct: this.textContent === 'I was right' });
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-powermark-only', powermarkOnly: this.checked });
});

document.getElementById('toggle-rebuzz').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-rebuzz', rebuzz: this.checked });
});

document.getElementById('toggle-select-by-set-name').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({
    type: 'toggle-select-by-set-name',
    selectBySetName: this.checked
  });
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

document.getElementById('toggle-show-history').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-show-history', showHistory: this.checked });
});

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-standard-only', standardOnly: this.checked });
});

document.getElementById('toggle-timer').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-timer', timer: this.checked });
});

document.getElementById('type-to-answer').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-type-to-answer', typeToAnswer: this.checked });
});

document.getElementById('year-range-a').onchange = function () {
  const minYear = $('#slider').slider('values', 0);
  const maxYear = $('#slider').slider('values', 1);
  socket.sendToServer({ type: 'set-year-range', minYear, maxYear });
};

document.getElementById('year-range-b').onchange = function () {
  const minYear = $('#slider').slider('values', 0);
  const maxYear = $('#slider').slider('values', 1);
  socket.sendToServer({ type: 'set-year-range', minYear, maxYear });
};

document.addEventListener('keydown', (event) => {
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key?.toLowerCase()) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'e': return document.getElementById('toggle-settings').click();
    case 'k': return document.getElementsByClassName('card-header-clickable')[0].click();
    case 'n': return document.getElementById('next').click();
    case 'p': return document.getElementById('pause').click();
    case 's': return document.getElementById('start').click();
    case 't': return document.getElementsByClassName('star-tossup')[0].click();
    case 'y': return navigator.clipboard.writeText(room.tossup._id ?? '');
  }
});

let startingDifficulties = [];
if (window.localStorage.getItem('singleplayer-tossup-query')) {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-tossup-query'));
    // if (savedQuery.version !== queryVersion) { throw new Error(); }
    room.categoryManager.import(savedQuery);
    room.query = savedQuery;
    socket.sendToServer({ type: 'set-packet-numbers', ...savedQuery });
    socket.sendToServer({ type: 'set-set-name', ...savedQuery });
    socket.sendToServer({ type: 'set-year-range', ...savedQuery });
    socket.sendToServer({ type: 'toggle-powermark-only', ...savedQuery });
    socket.sendToServer({ type: 'toggle-select-by-set-name', ...savedQuery });
    socket.sendToServer({ type: 'toggle-standard-only', ...savedQuery });
    startingDifficulties = savedQuery.difficulties;
  } catch {
    window.localStorage.removeItem('singleplayer-tossup-query');
  }
}

if (window.localStorage.getItem('singleplayer-tossup-settings')) {
  const savedSettings = JSON.parse(window.localStorage.getItem('singleplayer-tossup-settings'));
  if (savedSettings.version !== settingsVersion) { throw new Error(); }
  socket.sendToServer({ type: 'set-strictness', ...savedSettings });
  socket.sendToServer({ type: 'set-reading-speed', ...savedSettings });
  socket.sendToServer({ type: 'toggle-ai-mode', ...savedSettings });
  socket.sendToServer({ type: 'toggle-rebuzz', ...savedSettings });
  socket.sendToServer({ type: 'toggle-show-history', ...savedSettings });
  socket.sendToServer({ type: 'toggle-timer', ...savedSettings });
  socket.sendToServer({ type: 'toggle-type-to-answer', ...savedSettings });
}

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={room.categoryManager}
    onClose={() => socket.sendToServer({ type: 'set-categories', ...room.categoryManager.export() })}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={startingDifficulties ?? []}
    onChange={() => socket.sendToServer({ type: 'set-difficulties', difficulties: getDropdownValues('difficulties') })}
  />
);
