import questionStats from '../../scripts/auth/question-stats.js';
import api from '../../scripts/api/index.js';
import audio from '../../audio/index.js';
import { arrayToRange, rangeToArray } from '../../scripts/utilities/ranges.js';
import createBonusGameCard from '../../scripts/utilities/bonus-game-card.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.min.js';
import ClientBonusRoom from '../ClientBonusRoom.js';
import Player from '../../../quizbowl/Player.js';
import Team from '../../../quizbowl/Team.js';
import { MODE_ENUM } from '../../../quizbowl/constants.js';

let maxPacketNumber = 24;

const modeVersion = '2025-01-14';
const queryVersion = '2024-11-01';
const settingsVersion = '2024-11-02';

const USER_ID = 'user';
const TEAM_ID = 'team';
const room = new ClientBonusRoom();
room.players[USER_ID] = new Player(USER_ID);
room.players[USER_ID].teamId = TEAM_ID;
room.teams[TEAM_ID] = new Team(TEAM_ID);

const socket = {
  send: onmessage,
  sendToServer: (message) => room.message(USER_ID, message)
};
room.sockets[TEAM_ID] = socket;

function onmessage (message) {
  const data = JSON.parse(message);
  switch (data.type) {
    case 'alert': return window.alert(data.message);
    case 'clear-stats': return clearStats(data);
    case 'end': return next(data);
    case 'end-of-set': return endOfSet(data);
    case 'give-answer': return giveAnswer(data);
    case 'next': return next(data);
    case 'no-questions-found': return noQuestionsFound(data);
    case 'reveal-leadin': return revealLeadin(data);
    case 'reveal-next-answer': return revealNextAnswer(data);
    case 'reveal-next-part': return revealNextPart(data);
    case 'set-categories': return setCategories(data);
    case 'set-difficulties': return setDifficulties(data);
    case 'set-mode': return setMode(data);
    case 'set-packet-numbers': return setPacketNumbers(data);
    case 'set-set-name': return setSetName(data);
    case 'set-strictness': return setStrictness(data);
    case 'set-year-range': return setYearRange(data);
    case 'skip': return next(data);
    case 'start': return next(data);
    case 'start-answer': return startAnswer(data);
    case 'timer-update': return updateTimerDisplay(data.timeRemaining);
    case 'toggle-correct': return toggleCorrect(data);
    case 'toggle-show-history': return toggleShowHistory(data);
    case 'toggle-standard-only': return toggleStandardOnly(data);
    case 'toggle-three-part-bonuses': return toggleThreePartBonuses(data);
    case 'toggle-timer': return toggleTimer(data);
    case 'toggle-type-to-answer': return toggleTypeToAnswer(data);
  }
}

function clearStats ({ teamId }) {
  updateStatDisplay({ 0: 0, 10: 0, 20: 0, 30: 0 });
}

function endOfSet () {
  window.alert('You have reached the end of the set');
}

async function giveAnswer ({ currentPartNumber, directive, directedPrompt }) {
  if (directive === 'prompt') {
    document.getElementById('answer-input-group').classList.remove('d-none');
    document.getElementById('answer-input').focus();
    document.getElementById('answer-input').placeholder = directedPrompt ? `Prompt: "${directedPrompt}"` : 'Prompt';
    return;
  }

  document.getElementById('answer-input').value = '';
  document.getElementById('answer-input').blur();
  document.getElementById('answer-input').placeholder = 'Enter answer';
  document.getElementById('answer-input-group').classList.add('d-none');

  switch (directive) {
    case 'accept':
      document.getElementById(`checkbox-${currentPartNumber + 1}`).checked = true;
      document.getElementById('reveal').disabled = false;
      if (audio.soundEffects) {
        audio.correct.play();
      }
      break;
    case 'reject':
      document.getElementById('reveal').disabled = false;
      if (audio.soundEffects) {
        audio.incorrect.play();
      }
      break;
  }
}

function noQuestionsFound () {
  window.alert('No questions found');
}

async function next ({ type, bonus, lastPartRevealed, oldBonus, packetLength, pointsPerPart, stats, teamId }) {
  if (type === 'start') {
    document.getElementById('next').disabled = false;
    document.getElementById('settings').classList.add('d-none');
  }

  if (type !== 'start') {
    createBonusGameCard({
      bonus: oldBonus,
      starred: room.mode === MODE_ENUM.STARRED ? true : (room.mode === MODE_ENUM.LOCAL ? false : null)
    });
  }

  document.getElementById('question').textContent = '';

  if (type === 'end') {
    document.getElementById('next').disabled = true;
    document.getElementById('reveal').disabled = true;
  } else {
    document.getElementById('next').textContent = 'Skip';
    document.getElementById('packet-length-info').textContent = room.mode === MODE_ENUM.SET_NAME ? packetLength : '-';
    document.getElementById('packet-number-info').textContent = bonus.packet.number;
    document.getElementById('reveal').disabled = false;
    document.getElementById('set-name-info').textContent = bonus.set.name;
    document.getElementById('question-number-info').textContent = bonus.number;
  }

  if (lastPartRevealed && (room.mode !== MODE_ENUM.LOCAL)) {
    questionStats.recordBonus(oldBonus, pointsPerPart);
    updateStatDisplay(stats);
  }
}

/**
 * Called when the users wants to reveal the next bonus part.
 */
function revealNextAnswer ({ answer, currentPartNumber, lastPartRevealed }) {
  const paragraph = document.createElement('p');
  paragraph.innerHTML = 'ANSWER: ' + answer;
  document.getElementById(`bonus-part-${currentPartNumber + 1}`).appendChild(paragraph);

  if (lastPartRevealed) {
    document.getElementById('reveal').disabled = true;
    document.getElementById('next').textContent = 'Next';
  }
}

function revealLeadin ({ leadin }) {
  const paragraph = document.createElement('p');
  paragraph.id = 'leadin';
  paragraph.innerHTML = leadin;
  document.getElementById('question').appendChild(paragraph);
}

function revealNextPart ({ currentPartNumber, part, value }) {
  const input = document.createElement('input');
  input.id = `checkbox-${currentPartNumber + 1}`;
  input.className = 'checkbox form-check-input rounded-0 me-1';
  input.type = 'checkbox';
  input.style = 'width: 20px; height: 20px; cursor: pointer';
  input.addEventListener('click', function () {
    socket.sendToServer({ type: 'toggle-correct', partNumber: currentPartNumber, correct: this.checked });
  });

  const inputWrapper = document.createElement('label');
  inputWrapper.style = 'cursor: pointer';
  inputWrapper.appendChild(input);

  const p = document.createElement('p');
  p.innerHTML = `[${value}] ${part}`;

  const bonusPart = document.createElement('div');
  bonusPart.id = `bonus-part-${currentPartNumber + 1}`;
  bonusPart.appendChild(p);

  const row = document.createElement('div');
  row.className = 'd-flex';
  row.appendChild(inputWrapper);
  row.appendChild(bonusPart);

  document.getElementById('question').appendChild(row);
}

function setCategories ({ alternateSubcategories, categories, subcategories, percentView, categoryPercents }) {
  room.categoryManager.loadCategoryModal();
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setDifficulties ({ difficulties }) {
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setPacketNumbers ({ packetNumbers }) {
  document.getElementById('packet-number').value = arrayToRange(packetNumbers);
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

async function setSetName ({ setName, setLength }) {
  document.getElementById('set-name').value = setName;
  // make border red if set name is not in set list
  const valid = !setName || api.getSetList().includes(setName);
  document.getElementById('set-name').classList.toggle('is-invalid', !valid);
  maxPacketNumber = setLength;
  document.getElementById('packet-number').placeholder = 'Packet Numbers' + (maxPacketNumber ? ` (1-${maxPacketNumber})` : '');
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function setStrictness ({ strictness }) {
  document.getElementById('set-strictness').value = strictness;
  document.getElementById('strictness-display').textContent = strictness;
  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function setYearRange ({ minYear, maxYear }) {
  $('#slider').slider('values', [minYear, maxYear]);
  document.getElementById('year-range-a').textContent = minYear;
  document.getElementById('year-range-b').textContent = maxYear;
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function startAnswer () {
  document.getElementById('answer-input-group').classList.remove('d-none');
  document.getElementById('answer-input').focus();
  document.getElementById('reveal').disabled = true;
}

function toggleCorrect ({ partNumber, correct }) {
  document.getElementById(`checkbox-${partNumber + 1}`).checked = correct;
}

function setMode ({ mode }) {
  switch (mode) {
    case MODE_ENUM.SET_NAME:
      document.getElementById('difficulty-settings').classList.add('d-none');
      document.getElementById('local-packet-settings').classList.add('d-none');
      document.getElementById('set-settings').classList.remove('d-none');
      document.getElementById('toggle-standard-only').disabled = true;
      document.getElementById('toggle-three-part-bonuses').disabled = true;
      break;
    case MODE_ENUM.RANDOM:
      document.getElementById('difficulty-settings').classList.remove('d-none');
      document.getElementById('local-packet-settings').classList.add('d-none');
      document.getElementById('set-settings').classList.add('d-none');
      document.getElementById('toggle-standard-only').disabled = false;
      document.getElementById('toggle-three-part-bonuses').disabled = false;
      break;
    case MODE_ENUM.STARRED:
      document.getElementById('difficulty-settings').classList.add('d-none');
      document.getElementById('local-packet-settings').classList.add('d-none');
      document.getElementById('set-settings').classList.add('d-none');
      document.getElementById('toggle-standard-only').disabled = true;
      document.getElementById('toggle-three-part-bonuses').disabled = true;
      break;
    case MODE_ENUM.LOCAL:
      document.getElementById('difficulty-settings').classList.add('d-none');
      document.getElementById('local-packet-settings').classList.remove('d-none');
      document.getElementById('set-settings').classList.add('d-none');
      document.getElementById('toggle-standard-only').disabled = true;
      document.getElementById('toggle-three-part-bonuses').disabled = true;
      break;
  }
  document.getElementById('set-mode').value = mode;
  window.localStorage.setItem('singleplayer-bonus-mode', JSON.stringify({ mode, version: modeVersion }));
}

function toggleShowHistory ({ showHistory }) {
  document.getElementById('room-history').classList.toggle('d-none', !showHistory);
  document.getElementById('toggle-show-history').checked = showHistory;
  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleStandardOnly ({ standardOnly }) {
  document.getElementById('toggle-standard-only').checked = standardOnly;
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function toggleThreePartBonuses ({ threePartBonuses }) {
  document.getElementById('toggle-three-part-bonuses').checked = threePartBonuses;
  window.localStorage.setItem('singleplayer-bonus-query', JSON.stringify({ ...room.query, version: queryVersion }));
}

function toggleTimer ({ timer }) {
  document.getElementById('timer').classList.toggle('d-none', !timer);
  document.getElementById('toggle-timer').checked = timer;
  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

function toggleTypeToAnswer ({ typeToAnswer }) {
  document.getElementById('type-to-answer').checked = typeToAnswer;
  window.localStorage.setItem('singleplayer-bonus-settings', JSON.stringify({ ...room.settings, version: settingsVersion }));
}

/**
 * Calculates the points per bonus and updates the display.
 */
function updateStatDisplay (stats) {
  const numBonuses = stats[0] + stats[10] + stats[20] + stats[30];
  const points = 30 * stats[30] + 20 * stats[20] + 10 * stats[10];
  const ppb = Math.round(100 * points / numBonuses) / 100 || 0;
  const includePlural = (numBonuses === 1) ? '' : 'es';
  document.getElementById('statline').textContent = `${ppb} PPB with ${numBonuses} bonus${includePlural} seen (${stats[30]}/${stats[20]}/${stats[10]}/${stats[0]}, ${points} pts)`;
}

function updateTimerDisplay (time) {
  const seconds = Math.floor(time / 10);
  const tenths = time % 10;
  document.querySelector('.timer .face').textContent = seconds;
  document.querySelector('.timer .fraction').textContent = '.' + tenths;
}

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();
  const answer = document.getElementById('answer-input').value;
  socket.sendToServer({ type: 'give-answer', givenAnswer: answer });
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  room.sendToServer({ type: 'clear-stats' });
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  if (this.innerHTML === 'Skip') {
    socket.sendToServer({ type: 'skip' });
  } else {
    socket.sendToServer({ type: 'next' });
  }
});

document.getElementById('local-packet-input').addEventListener('change', function (event) {
  const file = this.files[0];
  if (!file) { return; }
  const reader = new window.FileReader();
  reader.onload = function (e) {
    try {
      const packet = JSON.parse(e.target.result);
      socket.sendToServer({ type: 'upload-local-packet', packet, filename: file.name });
    } catch (error) {
      window.alert('Invalid packet format');
    }
  };
  reader.readAsText(file);
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

document.getElementById('report-question-submit').addEventListener('click', function () {
  api.reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('reveal').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'start-answer' });
});

document.getElementById('set-mode').addEventListener('change', function () {
  this.blur();
  socket.sendToServer({ type: 'set-mode', mode: this.value });
});

document.getElementById('set-name').addEventListener('change', function () {
  socket.sendToServer({ type: 'set-set-name', setName: this.value.trim() });
});

document.getElementById('set-strictness').addEventListener('change', function () {
  this.blur();
  socket.sendToServer({ type: 'set-strictness', strictness: this.value });
});

document.getElementById('set-strictness').addEventListener('input', function () {
  document.getElementById('strictness-display').textContent = this.value;
});

document.getElementById('start').addEventListener('click', async function () {
  this.blur();
  socket.sendToServer({ type: 'start' });
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

document.getElementById('toggle-three-part-bonuses').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-three-part-bonuses', threePartBonuses: this.checked });
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
    case 'y': return navigator.clipboard.writeText(room.bonus._id ?? '');
    case '0': return document.getQuerySelector('input.checkbox[type="checkbox"]').click();
    case '1': return document.getElementById('checkbox-1').click();
    case '2': return document.getElementById('checkbox-2').click();
    case '3': return document.getElementById('checkbox-3').click();
    case '4': return document.getElementById('checkbox-4').click();
  }
});

if (window.localStorage.getItem('singleplayer-bonus-mode')) {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-bonus-mode'));
    if (savedQuery.version !== modeVersion) { throw new Error(); }
    socket.sendToServer({ type: 'set-mode', ...savedQuery });
  } catch {
    window.localStorage.removeItem('singleplayer-bonus-mode');
  }
}

let startingDifficulties = [];
if (window.localStorage.getItem('singleplayer-bonus-query')) {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-bonus-query'));
    if (savedQuery.version !== queryVersion) { throw new Error(); }
    room.categoryManager.import(savedQuery);
    room.query = savedQuery;
    socket.sendToServer({ type: 'set-packet-numbers', ...savedQuery });
    socket.sendToServer({ type: 'set-set-name', ...savedQuery });
    socket.sendToServer({ type: 'toggle-standard-only', ...savedQuery });
    socket.sendToServer({ type: 'toggle-three-part-bonuses', ...savedQuery });
    startingDifficulties = savedQuery.difficulties;
  } catch {
    window.localStorage.removeItem('singleplayer-bonus-query');
  }
}

$(document).ready(function () {
  try {
    const savedQuery = JSON.parse(window.localStorage.getItem('singleplayer-bonus-query'));
    socket.sendToServer({ type: 'set-year-range', ...savedQuery });
  } catch {}
});

if (window.localStorage.getItem('singleplayer-bonus-settings')) {
  try {
    const savedSettings = JSON.parse(window.localStorage.getItem('singleplayer-bonus-settings'));
    if (savedSettings.version !== settingsVersion) { throw new Error(); }
    socket.sendToServer({ type: 'set-strictness', ...savedSettings });
    socket.sendToServer({ type: 'toggle-show-history', ...savedSettings });
    socket.sendToServer({ type: 'toggle-timer', ...savedSettings });
    socket.sendToServer({ type: 'toggle-type-to-answer', ...savedSettings });
  } catch {
    window.localStorage.removeItem('singleplayer-bonus-settings');
  }
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
