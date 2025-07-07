import CategoryManager from '../../quizbowl/category-manager.js';
import { getDropdownValues } from '../scripts/utilities/dropdown-checklist.js';
import { rangeToArray } from '../scripts/utilities/ranges.js';
import CategoryModal from '../scripts/components/CategoryModal.min.js';
import DifficultyDropdown from '../scripts/components/DifficultyDropdown.min.js';
import { MODE_ENUM } from '../../quizbowl/constants.js';
import MultiplayerTossupClient from './MultiplayerTossupClient.js';
import getRandomName from '../../quizbowl/get-random-name.js';
import reportQuestion from '../scripts/api/report-question.js';

const room = {
  categoryManager: new CategoryManager(),
  difficulties: [],
  mode: MODE_ENUM.RANDOM,
  muteList: [],
  ownerId: '',
  /**
   * userId to player object
   */
  players: {},
  public: true,
  setLength: 24,
  showingOffline: false,
  tossup: {},
  username: window.localStorage.getItem('multiplayer-username') || getRandomName()
};

let oldCategories = JSON.stringify(room.categoryManager.export());

const ROOM_NAME = decodeURIComponent(window.location.pathname.substring(13));
const USER_ID = window.localStorage.getItem('USER_ID') || 'unknown';

const socket = new window.WebSocket(
  window.location.href.replace('http', 'ws').split('?')[0] + '?' +
    new URLSearchParams({
      ...Object.fromEntries(new URLSearchParams(window.location.search)),
      roomName: ROOM_NAME,
      userId: USER_ID,
      username: room.username
    }).toString()
);
window.history.pushState({}, '', '/multiplayer/' + encodeURIComponent(ROOM_NAME));

// Ping server every 30 seconds to prevent socket disconnection
const PING_INTERVAL_ID = setInterval(
  () => socket.send(JSON.stringify({ type: 'ping' })),
  30000
);

socket.onclose = function (event) {
  const { code } = event;
  if (code !== 3000) { window.alert('Disconnected from server'); }
  clearInterval(PING_INTERVAL_ID);
};

const client = new MultiplayerTossupClient(room, USER_ID, socket);

socket.onmessage = (message) => {
  client.onmessage(message);
};

document.getElementById('answer-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const answer = document.getElementById('answer-input').value;
  socket.send(JSON.stringify({ type: 'give-answer', givenAnswer: answer }));
});

document.getElementById('answer-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: 'give-answer-live-update', givenAnswer: this.value }));
});

document.getElementById('buzz').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'buzz' }));
  socket.send(JSON.stringify({ type: 'give-answer-live-update', givenAnswer: '' }));
});

document.getElementById('chat').addEventListener('click', function () {
  this.blur();
  document.getElementById('chat-input-group').classList.remove('d-none');
  document.getElementById('chat-input').focus();
  socket.send(JSON.stringify({ type: 'chat-live-update', message: '' }));
});

document.getElementById('chat-form').addEventListener('submit', function (event) {
  event.preventDefault();
  event.stopPropagation();

  const message = document.getElementById('chat-input').value;
  document.getElementById('chat-input').value = '';
  document.getElementById('chat-input-group').classList.add('d-none');
  document.getElementById('chat-input').blur();

  socket.send(JSON.stringify({ type: 'chat', message }));
});

document.getElementById('chat-input').addEventListener('input', function () {
  socket.send(JSON.stringify({ type: 'chat-live-update', message: this.value }));
});

document.getElementById('clear-stats').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'clear-stats' }));
});

document.getElementById('next').addEventListener('click', function () {
  this.blur();
  switch (this.innerHTML) {
    case 'Start':
      socket.send(JSON.stringify({ type: 'start' }));
      break;
    case 'Next':
      socket.send(JSON.stringify({ type: 'next' }));
      break;
  }
});

document.getElementById('skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'skip' }));
});

document.getElementById('packet-number').addEventListener('change', function () {
  const range = rangeToArray(this.value, room.setLength);
  if (range.some((num) => num < 1 || num > room.setLength)) {
    document.getElementById('packet-number').classList.add('is-invalid');
    return;
  }

  document.getElementById('packet-number').classList.remove('is-invalid');
  socket.send(JSON.stringify({ type: 'set-packet-numbers', packetNumbers: range }));
});

document.getElementById('pause').addEventListener('click', function () {
  this.blur();
  const seconds = parseFloat(document.querySelector('.timer .face').textContent);
  const tenths = parseFloat(document.querySelector('.timer .fraction').textContent);
  const pausedTime = (seconds + tenths) * 10;
  socket.send(JSON.stringify({ type: 'pause', pausedTime }));
});

document.getElementById('reading-speed').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'set-reading-speed', readingSpeed: this.value }));
});

document.getElementById('reading-speed').addEventListener('input', function () {
  document.getElementById('reading-speed-display').textContent = this.value;
});

document.getElementById('report-question-submit').addEventListener('click', function () {
  reportQuestion(
    document.getElementById('report-question-id').value,
    document.getElementById('report-question-reason').value,
    document.getElementById('report-question-description').value
  );
});

document.getElementById('set-name').addEventListener('change', async function () {
  socket.send(JSON.stringify({ type: 'set-set-name', setName: this.value }));
});

document.getElementById('set-strictness').addEventListener('change', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'set-strictness', strictness: this.value }));
});

document.getElementById('set-strictness').addEventListener('input', function () {
  document.getElementById('strictness-display').textContent = this.value;
});

const styleSheet = document.createElement('style');
styleSheet.textContent = room.showingOffline ? '' : '.offline { display: none; }';
document.head.appendChild(styleSheet);
document.getElementById('toggle-offline-players').addEventListener('click', function () {
  room.showingOffline = this.checked;
  this.blur();
  if (room.showingOffline) {
    styleSheet.textContent = '';
  } else {
    styleSheet.textContent = '.offline { display: none; }';
  }
});

document.getElementById('toggle-controlled').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-controlled', controlled: this.checked }));
});

document.getElementById('toggle-lock').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-lock', lock: this.checked }));
});

document.getElementById('toggle-login-required').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-login-required', loginRequired: this.checked }));
});

document.getElementById('toggle-powermark-only').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-powermark-only', powermarkOnly: this.checked }));
});

document.getElementById('toggle-rebuzz').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-rebuzz', rebuzz: this.checked }));
});

document.getElementById('toggle-skip').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-skip', skip: this.checked }));
});

document.getElementById('set-mode').addEventListener('change', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'set-mode', setName: document.getElementById('set-name').value, mode: this.value }));
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

document.getElementById('toggle-standard-only').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-standard-only', standardOnly: this.checked }));
});

document.getElementById('toggle-timer').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-timer', timer: this.checked }));
});

document.getElementById('toggle-public').addEventListener('click', function () {
  this.blur();
  socket.send(JSON.stringify({ type: 'toggle-public', public: this.checked }));
});

document.getElementById('username').addEventListener('change', function () {
  socket.send(JSON.stringify({ type: 'set-username', userId: USER_ID, username: this.value }));
  room.username = this.value;
  window.localStorage.setItem('multiplayer-username', room.username);
});

document.getElementById('year-range-a').onchange = function () {
  const [minYear, maxYear] = $('#slider').slider('values');
  if (maxYear < minYear) {
    document.querySelector('#yearRangeAlert').style.display = '';
    return;
  } else {
    document.querySelector('#yearRangeAlert').style.display = 'none';
  }
  socket.send(JSON.stringify({ type: 'set-year-range', minYear, maxYear }));
};

document.addEventListener('keydown', (event) => {
  // press escape to close chat
  if (event.key === 'Escape' && document.activeElement.id === 'chat-input') {
    document.getElementById('chat-input').value = '';
    document.getElementById('chat-input-group').classList.add('d-none');
    document.getElementById('chat-input').blur();
    socket.send(JSON.stringify({ type: 'chat', message: '' }));
  }

  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) return;

  switch (event.key?.toLowerCase()) {
    case ' ':
      document.getElementById('buzz').click();
      // Prevent spacebar from scrolling the page
      if (event.target === document.body) { event.preventDefault(); }
      break;

    case 'e': return document.getElementById('toggle-settings').click();
    case 'k': return document.getElementsByClassName('card-header-clickable')[0].click();
    case 'p': return document.getElementById('pause').click();
    case 't': return document.getElementsByClassName('star-tossup')[0].click();
    case 'y': return navigator.clipboard.writeText(room.tossup._id ?? '');

    case 'n':
    case 's':
      document.getElementById('next').click();
      document.getElementById('skip').click();
      break;
  }
});

document.addEventListener('keypress', function (event) {
  // needs to be keypress
  // keydown immediately hides the input group
  // keyup shows the input group again after submission
  if (event.key === 'Enter' && event.target === document.body) {
    document.getElementById('chat').click();
  }
});

document.getElementById('username').value = room.username;

ReactDOM.createRoot(document.getElementById('category-modal-root')).render(
  <CategoryModal
    categoryManager={room.categoryManager}
    onClose={() => {
      if (oldCategories !== JSON.stringify(room.categoryManager.export())) {
        socket.send(JSON.stringify({ type: 'set-categories', ...room.categoryManager.export() }));
      }
      oldCategories = JSON.stringify(room.categoryManager.export());
    }}
  />
);

ReactDOM.createRoot(document.getElementById('difficulty-dropdown-root')).render(
  <DifficultyDropdown
    startingDifficulties={room.difficulties}
    onChange={() => socket.send(JSON.stringify({ type: 'set-difficulties', difficulties: getDropdownValues('difficulties') }))}
  />
);
