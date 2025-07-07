import { rangeToArray } from '../../scripts/utilities/ranges.js';
import { getDropdownValues } from '../../scripts/utilities/dropdown-checklist.js';
import CategoryModal from '../../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../../scripts/components/DifficultyDropdown.min.js';
import Player from '../../../quizbowl/Player.js';
import Team from '../../../quizbowl/Team.js';
import reportQuestion from '../../scripts/api/report-question.js';
import ClientBonusRoom from './ClientBonusRoom.js';
import SingleplayerBonusClient from './SingleplayerBonusClient.js';

const modeVersion = '2025-01-14';
const queryVersion = '2025-05-07';
const settingsVersion = '2024-11-02';

const USER_ID = 'user';
const TEAM_ID = 'team';
const room = new ClientBonusRoom();
room.players[USER_ID] = new Player(USER_ID);
room.players[USER_ID].teamId = TEAM_ID;
room.teams[TEAM_ID] = new Team(TEAM_ID);

const client = new SingleplayerBonusClient(room, USER_ID);

const socket = {
  send: (message) => client.onmessage(message),
  sendToServer: (message) => room.message(USER_ID, message)
};
room.sockets[TEAM_ID] = socket;

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
  const range = rangeToArray(this.value.trim(), room.setLength);
  const invalid = range.some(num => num < 1 || num > room.setLength);
  if (invalid) {
    document.getElementById('packet-number').classList.add('is-invalid');
    return;
  }

  document.getElementById('packet-number').classList.remove('is-invalid');
  socket.sendToServer({ type: 'set-packet-numbers', packetNumbers: range });
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(
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

document.getElementById('toggle-randomize-order').addEventListener('click', function () {
  this.blur();
  socket.sendToServer({ type: 'toggle-randomize-order', randomizeOrder: this.checked });
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
    case '0': return document.getElementById(`checkbox-${room.pointsPerPart.length}`)?.click();
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
    socket.sendToServer({ type: 'set-packet-numbers', ...savedQuery, doNotFetch: true });
    socket.sendToServer({ type: 'set-set-name', ...savedQuery, doNotFetch: true });
    socket.sendToServer({ type: 'toggle-standard-only', ...savedQuery, doNotFetch: true });
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
